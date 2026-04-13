const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { analyzeSite } = require('./analyzer');
const { findBestRanking } = require('./rank-tracker');

const app = express();
const PORT = process.env.PORT || 3000;

// Security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
    }
  }
}));
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Demasiadas peticiones. Espera un momento.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Explicit routes for SEO-critical files (ensure correct Content-Type)
app.get('/sitemap.xml', (req, res) => {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.sendFile(path.join(__dirname, 'public', 'sitemap.xml'));
});

app.get('/robots.txt', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.sendFile(path.join(__dirname, 'public', 'robots.txt'));
});

// API endpoint
app.post('/api/analyze', async (req, res) => {
  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Se requiere una URL válida.' });
  }

  // Basic URL validation
  const urlPattern = /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/.*)?$/i;
  if (!urlPattern.test(url.trim())) {
    return res.status(400).json({ error: 'Formato de URL inválido.' });
  }

  try {
    const results = await analyzeSite(url.trim());
    res.json(results);
  } catch (error) {
    console.error('Analysis error:', error.message);
    if (error.httpStatus) {
      return res.status(400).json({ error: error.message });
    }
    if (error.code === 'ENOTFOUND') {
      return res.status(400).json({ error: 'No se pudo encontrar el dominio. Verifica la URL.' });
    }
    if (error.code === 'ECONNREFUSED') {
      return res.status(400).json({ error: 'El servidor rechazó la conexión.' });
    }
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      return res.status(400).json({ error: 'Tiempo de espera agotado. El sitio tarda demasiado en responder.' });
    }
    res.status(500).json({ error: error.message || 'Error al analizar la URL.' });
  }
});

async function handleRank(req, res) {
  const { url, queries } = req.body || {};

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Se requiere una URL válida.' });
  }

  if (queries && !Array.isArray(queries)) {
    return res.status(400).json({ error: 'queries debe ser un array de términos.' });
  }

  try {
    const rankData = await findBestRanking(url.trim(), queries || []);
    res.json(rankData);
  } catch (error) {
    console.error('Rank error:', error.message);
    res.status(500).json({ error: error.message || 'No se pudo calcular la posición SEO.' });
  }
}

app.post('/api/rank', handleRank);
app.post('/rank', handleRank);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n  🔍 SEO Analyzer corriendo en http://localhost:${PORT}\n`);
  });
}

module.exports = app;
