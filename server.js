const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { analyzeSite } = require('./analyzer');

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

app.listen(PORT, () => {
  console.log(`\n  🔍 SEO Analyzer corriendo en http://localhost:${PORT}\n`);
});
