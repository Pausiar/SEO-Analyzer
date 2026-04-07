const axios = require('axios');
const cheerio = require('cheerio');
const { URL } = require('url');

function normalizeUrl(inputUrl) {
  let normalized = (inputUrl || '').trim();
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = `https://${normalized}`;
  }
  return normalized;
}

function normalizeDomain(hostname) {
  return (hostname || '').toLowerCase().replace(/^www\./, '');
}

function extractDomain(urlValue) {
  try {
    const parsed = new URL(normalizeUrl(urlValue));
    return normalizeDomain(parsed.hostname);
  } catch {
    return '';
  }
}

function unwrapDuckduckgoUrl(href) {
  if (!href) return '';

  if (href.startsWith('//')) {
    href = `https:${href}`;
  }

  if (href.startsWith('/l/?')) {
    try {
      const parsed = new URL(`https://duckduckgo.com${href}`);
      const wrapped = parsed.searchParams.get('uddg');
      if (wrapped) return decodeURIComponent(wrapped);
    } catch {
      return href;
    }
  }

  if (href.startsWith('https://duckduckgo.com/l/?') || href.startsWith('http://duckduckgo.com/l/?')) {
    try {
      const parsed = new URL(href);
      const wrapped = parsed.searchParams.get('uddg');
      if (wrapped) return decodeURIComponent(wrapped);
    } catch {
      return href;
    }
  }

  return href;
}

async function fetchQueryRanking(targetDomain, query) {
  const response = await axios.get('https://html.duckduckgo.com/html/', {
    params: {
      q: query,
      kl: 'es-es'
    },
    timeout: 12000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; SEOAnalyzerRank/1.0)',
      Accept: 'text/html'
    }
  });

  const $ = cheerio.load(response.data);
  const links = [];

  $('a.result__a').each((_, el) => {
    const href = $(el).attr('href');
    const finalUrl = unwrapDuckduckgoUrl(href);
    if (finalUrl) links.push(finalUrl);
  });

  const topLinks = links.slice(0, 30);
  let found = null;

  topLinks.some((link, idx) => {
    try {
      const domain = normalizeDomain(new URL(link).hostname);
      if (domain === targetDomain || domain.endsWith(`.${targetDomain}`) || targetDomain.endsWith(`.${domain}`)) {
        found = {
          query,
          position: idx + 1,
          url: link
        };
        return true;
      }
    } catch {
      return false;
    }
    return false;
  });

  return found || {
    query,
    position: null,
    url: ''
  };
}

function dedupeQueries(queries) {
  const seen = new Set();
  const clean = [];

  (queries || []).forEach((q) => {
    const normalized = String(q || '').trim().toLowerCase();
    if (!normalized || normalized.length < 3 || normalized.length > 90) return;
    if (seen.has(normalized)) return;
    seen.add(normalized);
    clean.push(normalized);
  });

  return clean.slice(0, 10);
}

function buildFallbackQueries(urlValue) {
  const domain = extractDomain(urlValue);
  if (!domain) return [];

  const parts = domain.split('.').filter(Boolean);
  const brand = parts[0] || domain;

  return dedupeQueries([
    brand,
    `${brand} web`,
    `${brand} oficial`,
    `${brand} tienda`,
    `${brand} opiniones`
  ]);
}

async function findBestRanking(urlValue, queries) {
  const targetDomain = extractDomain(urlValue);
  if (!targetDomain) {
    throw new Error('No se pudo determinar el dominio objetivo.');
  }

  const finalQueries = dedupeQueries(queries);
  const queryPool = finalQueries.length > 0 ? finalQueries : buildFallbackQueries(urlValue);

  if (queryPool.length === 0) {
    throw new Error('No hay consultas suficientes para estimar posición.');
  }

  const results = [];
  for (const query of queryPool) {
    try {
      const rank = await fetchQueryRanking(targetDomain, query);
      results.push(rank);
    } catch {
      results.push({ query, position: null, url: '' });
    }
  }

  const withPosition = results
    .filter((r) => r.position !== null)
    .sort((a, b) => a.position - b.position);

  return {
    engine: 'duckduckgo',
    targetDomain,
    checkedQueries: queryPool.length,
    bestMatch: withPosition[0] || null,
    results
  };
}

module.exports = {
  findBestRanking
};
