const cheerio = require('cheerio');
const axios = require('axios');
const { URL } = require('url');

class SEOAnalyzer {
  constructor(url, html, headers, loadTime) {
    this.url = url;
    this.parsedUrl = new URL(url);
    this.html = html;
    this.$ = cheerio.load(html);
    this.headers = headers;
    this.loadTime = loadTime;
  }

  analyze() {
    return {
      url: this.url,
      score: 0, // calculated after
      loadTime: this.loadTime,
      categories: {
        meta: this.analyzeMeta(),
        headings: this.analyzeHeadings(),
        content: this.analyzeContent(),
        images: this.analyzeImages(),
        links: this.analyzeLinks(),
        technical: this.analyzeTechnical(),
        social: this.analyzeSocial(),
        performance: this.analyzePerformance(),
        security: this.analyzeSecurity(),
        mobile: this.analyzeMobile(),
      }
    };
  }

  // ─── META TAGS ─────────────────────────────────────────────
  analyzeMeta() {
    const $ = this.$;
    const title = $('title').text().trim();
    const metaDesc = $('meta[name="description"]').attr('content') || '';
    const metaKeywords = $('meta[name="keywords"]').attr('content') || '';
    const canonical = $('link[rel="canonical"]').attr('href') || '';
    const robots = $('meta[name="robots"]').attr('content') || '';
    const viewport = $('meta[name="viewport"]').attr('content') || '';
    const charset = $('meta[charset]').attr('charset') || $('meta[http-equiv="Content-Type"]').attr('content') || '';
    const lang = $('html').attr('lang') || '';

    const issues = [];
    let passed = 0;
    const total = 8;

    // Title
    if (!title) {
      issues.push({ severity: 'critical', message: 'Falta la etiqueta <title>', fix: 'Añade un <title> descriptivo de 50-60 caracteres.' });
    } else if (title.length < 30) {
      issues.push({ severity: 'warning', message: `El título es demasiado corto (${title.length} caracteres)`, fix: 'El título debería tener entre 50-60 caracteres para un mejor CTR.' });
    } else if (title.length > 60) {
      issues.push({ severity: 'warning', message: `El título es demasiado largo (${title.length} caracteres)`, fix: 'Acorta el título a 60 caracteres máximo para evitar truncamiento en Google.' });
    } else {
      passed++;
    }

    // Meta Description
    if (!metaDesc) {
      issues.push({ severity: 'critical', message: 'Falta la meta description', fix: 'Añade una meta description de 150-160 caracteres que incluya tu keyword principal.' });
    } else if (metaDesc.length < 120) {
      issues.push({ severity: 'warning', message: `Meta description demasiado corta (${metaDesc.length} caracteres)`, fix: 'La meta description debería tener entre 150-160 caracteres.' });
    } else if (metaDesc.length > 160) {
      issues.push({ severity: 'warning', message: `Meta description demasiado larga (${metaDesc.length} caracteres)`, fix: 'Reduce la meta description a 160 caracteres máximo.' });
    } else {
      passed++;
    }

    // Canonical
    if (!canonical) {
      issues.push({ severity: 'warning', message: 'No se encontró etiqueta canonical', fix: 'Añade <link rel="canonical"> para evitar contenido duplicado.' });
    } else {
      passed++;
    }

    // Viewport
    if (!viewport) {
      issues.push({ severity: 'critical', message: 'Falta la etiqueta viewport', fix: 'Añade <meta name="viewport" content="width=device-width, initial-scale=1"> para responsive design.' });
    } else {
      passed++;
    }

    // Charset
    if (!charset) {
      issues.push({ severity: 'warning', message: 'No se especifica charset', fix: 'Añade <meta charset="UTF-8"> al principio del <head>.' });
    } else {
      passed++;
    }

    // Language
    if (!lang) {
      issues.push({ severity: 'warning', message: 'Falta el atributo lang en <html>', fix: 'Añade lang="es" (o el idioma correspondiente) a la etiqueta <html>.' });
    } else {
      passed++;
    }

    // Robots
    if (robots && (robots.includes('noindex') || robots.includes('nofollow'))) {
      issues.push({ severity: 'info', message: `Robots meta: ${robots}`, fix: 'La página tiene restricciones de indexación. Asegúrate de que es intencional.' });
    } else {
      passed++;
    }

    // Keywords (informational)
    if (metaKeywords) {
      issues.push({ severity: 'info', message: 'Meta keywords detectadas (Google las ignora)', fix: 'Las meta keywords no afectan al ranking de Google, pero no perjudican.' });
    }
    passed++;

    return {
      name: 'Meta Tags',
      icon: 'tag',
      score: Math.round((passed / total) * 100),
      passed,
      total,
      issues,
      data: {
        title: title || '(vacío)',
        titleLength: title.length,
        description: metaDesc || '(vacío)',
        descriptionLength: metaDesc.length,
        canonical,
        robots: robots || '(no definido)',
        viewport: viewport || '(no definido)',
        charset: charset || '(no definido)',
        lang: lang || '(no definido)',
      }
    };
  }

  // ─── HEADINGS ──────────────────────────────────────────────
  analyzeHeadings() {
    const $ = this.$;
    const headings = {};
    const headingTexts = [];
    let totalHeadings = 0;

    for (let i = 1; i <= 6; i++) {
      const tags = $(`h${i}`);
      headings[`h${i}`] = tags.length;
      totalHeadings += tags.length;
      tags.each((_, el) => {
        headingTexts.push({ level: `H${i}`, text: $(el).text().trim().substring(0, 100) });
      });
    }

    const issues = [];
    let passed = 0;
    const total = 5;

    // H1
    if (headings.h1 === 0) {
      issues.push({ severity: 'critical', message: 'No se encontró ningún H1', fix: 'Cada página debe tener exactamente un H1 con la keyword principal.' });
    } else if (headings.h1 > 1) {
      issues.push({ severity: 'warning', message: `Se encontraron ${headings.h1} etiquetas H1`, fix: 'Usa solo un H1 por página para una estructura clara.' });
    } else {
      passed++;
    }

    // Hierarchy
    if (headings.h1 > 0 && headings.h2 === 0) {
      issues.push({ severity: 'warning', message: 'No hay etiquetas H2', fix: 'Usa H2 para estructurar sub-secciones del contenido.' });
    } else {
      passed++;
    }

    // H2 check
    if (headings.h2 > 0) passed++;
    else {
      issues.push({ severity: 'info', message: 'Considera añadir subtítulos H2', fix: 'Los H2 ayudan a Google a entender la estructura del contenido.' });
    }

    // Total headings
    if (totalHeadings === 0) {
      issues.push({ severity: 'critical', message: 'No se encontraron headings', fix: 'Usa headings (H1-H6) para estructurar tu contenido.' });
    } else {
      passed++;
    }

    // Skip levels check
    let hasSkip = false;
    for (let i = 1; i < 6; i++) {
      if (headings[`h${i}`] === 0 && headings[`h${i + 1}`] > 0) {
        hasSkip = true;
        break;
      }
    }
    if (hasSkip) {
      issues.push({ severity: 'warning', message: 'Se detectó un salto en la jerarquía de headings', fix: 'Mantén una jerarquía lógica (H1 → H2 → H3) sin saltar niveles.' });
    } else {
      passed++;
    }

    return {
      name: 'Encabezados',
      icon: 'heading',
      score: Math.round((passed / total) * 100),
      passed,
      total,
      issues,
      data: {
        structure: headings,
        headingTexts: headingTexts.slice(0, 20),
        totalHeadings
      }
    };
  }

  // ─── CONTENT ───────────────────────────────────────────────
  analyzeContent() {
    const $ = this.$;
    // Remove script, style, nav, footer for content analysis
    const bodyClone = $('body').clone();
    bodyClone.find('script, style, nav, footer, header, noscript').remove();
    const text = bodyClone.text().replace(/\s+/g, ' ').trim();
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

    // Keyword density (top words)
    const stopWords = new Set(['de', 'la', 'el', 'en', 'y', 'a', 'los', 'del', 'las', 'un', 'por', 'con', 'no', 'una', 'su', 'para', 'es', 'al', 'lo', 'como', 'más', 'o', 'pero', 'sus', 'le', 'ya', 'que', 'se', 'the', 'and', 'to', 'of', 'a', 'in', 'is', 'it', 'that', 'for', 'was', 'on', 'are', 'with', 'as', 'this', 'be', 'at', 'have', 'from', 'or', 'an', 'by', 'not', 'but', 'has', 'his', 'her', 'its', 'they', 'we', 'you', 'all', 'if', 'do', 'my', 'our', 'your', 'me', 'us']);
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));
    const freq = {};
    words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
    const topKeywords = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({
        word,
        count,
        density: ((count / words.length) * 100).toFixed(1) + '%'
      }));

    // Paragraphs
    const paragraphs = $('p').length;
    const strongTags = $('strong, b').length;
    const emTags = $('em, i').length;

    const issues = [];
    let passed = 0;
    const total = 5;

    if (wordCount < 300) {
      issues.push({ severity: 'critical', message: `Contenido demasiado corto (${wordCount} palabras)`, fix: 'Google prefiere contenido extenso. Apunta a 800-2000+ palabras para artículos.' });
    } else if (wordCount < 600) {
      issues.push({ severity: 'warning', message: `Contenido algo corto (${wordCount} palabras)`, fix: 'Considera ampliar el contenido a al menos 800 palabras.' });
    } else {
      passed++;
    }

    if (paragraphs < 3) {
      issues.push({ severity: 'warning', message: `Solo ${paragraphs} párrafos detectados`, fix: 'Estructura el contenido en párrafos cortos para mejor legibilidad.' });
    } else {
      passed++;
    }

    if (strongTags === 0 && emTags === 0) {
      issues.push({ severity: 'info', message: 'No se usa negrita ni cursiva', fix: 'Usa <strong> para resaltar keywords importantes en el contenido.' });
    } else {
      passed++;
    }

    // Check for duplicate content signals
    const titleText = $('title').text().trim().toLowerCase();
    const h1Text = $('h1').first().text().trim().toLowerCase();
    if (titleText && h1Text && titleText !== h1Text) {
      issues.push({ severity: 'info', message: 'El título y el H1 son diferentes', fix: 'Considera alinear el <title> con el H1 para mayor coherencia SEO.' });
    } else if (titleText && h1Text) {
      passed++;
    } else {
      passed++;
    }

    // Content readability (simple check)
    const avgWordsPerSentence = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    if (wordCount > 0 && (wordCount / Math.max(avgWordsPerSentence, 1)) > 30) {
      issues.push({ severity: 'info', message: 'Las frases podrían ser demasiado largas', fix: 'Usa frases más cortas (15-20 palabras) para mejor legibilidad.' });
    } else {
      passed++;
    }

    return {
      name: 'Contenido',
      icon: 'file-text',
      score: Math.round((passed / total) * 100),
      passed,
      total,
      issues,
      data: {
        wordCount,
        paragraphs,
        strongTags,
        emTags,
        topKeywords
      }
    };
  }

  // ─── IMAGES ────────────────────────────────────────────────
  analyzeImages() {
    const $ = this.$;
    const images = $('img');
    const totalImages = images.length;
    let missingAlt = 0;
    let emptyAlt = 0;
    let missingDimensions = 0;
    let largeImages = 0;
    let missingLazy = 0;
    const imageDetails = [];

    images.each((_, img) => {
      const el = $(img);
      const src = el.attr('src') || el.attr('data-src') || '';
      const alt = el.attr('alt');
      const width = el.attr('width');
      const height = el.attr('height');
      const loading = el.attr('loading');

      if (alt === undefined) missingAlt++;
      else if (alt.trim() === '') emptyAlt++;
      if (!width || !height) missingDimensions++;
      if (loading !== 'lazy') missingLazy++;

      imageDetails.push({
        src: src.substring(0, 80),
        alt: alt !== undefined ? alt.substring(0, 60) : '(falta)',
        hasDimensions: !!(width && height),
        hasLazy: loading === 'lazy'
      });
    });

    const issues = [];
    let passed = 0;
    const total = 4;

    if (totalImages === 0) {
      issues.push({ severity: 'info', message: 'No se encontraron imágenes', fix: 'Las imágenes mejoran la experiencia del usuario y pueden posicionar en Google Images.' });
      passed += 4;
    } else {
      if (missingAlt > 0) {
        issues.push({ severity: 'critical', message: `${missingAlt} imagen(es) sin atributo alt`, fix: 'Todas las imágenes deben tener alt descriptivo para accesibilidad y SEO.' });
      } else {
        passed++;
      }

      if (emptyAlt > 0) {
        issues.push({ severity: 'warning', message: `${emptyAlt} imagen(es) con alt vacío`, fix: 'Añade texto descriptivo al alt de las imágenes (excepto decorativas).' });
      } else {
        passed++;
      }

      if (missingDimensions > 0) {
        issues.push({ severity: 'warning', message: `${missingDimensions} imagen(es) sin dimensiones`, fix: 'Especifica width y height para evitar layout shifts (CLS).' });
      } else {
        passed++;
      }

      if (missingLazy > 0 && totalImages > 3) {
        issues.push({ severity: 'info', message: `${missingLazy} imagen(es) sin lazy loading`, fix: 'Añade loading="lazy" a imágenes below-the-fold para mejor rendimiento.' });
      } else {
        passed++;
      }
    }

    return {
      name: 'Imágenes',
      icon: 'image',
      score: Math.round((passed / total) * 100),
      passed,
      total,
      issues,
      data: {
        totalImages,
        missingAlt,
        emptyAlt,
        missingDimensions,
        missingLazy,
        images: imageDetails.slice(0, 15)
      }
    };
  }

  // ─── LINKS ─────────────────────────────────────────────────
  analyzeLinks() {
    const $ = this.$;
    const links = $('a[href]');
    let internal = 0;
    let external = 0;
    let noFollow = 0;
    let emptyAnchors = 0;
    let hashLinks = 0;
    const linkDetails = [];

    links.each((_, a) => {
      const el = $(a);
      const href = el.attr('href') || '';
      const text = el.text().trim();
      const rel = el.attr('rel') || '';

      if (href.startsWith('#')) {
        hashLinks++;
      } else if (href.startsWith('http') && !href.includes(this.parsedUrl.hostname)) {
        external++;
        if (rel.includes('nofollow')) noFollow++;
      } else {
        internal++;
      }

      if (!text && !el.find('img').length) emptyAnchors++;

      linkDetails.push({
        href: href.substring(0, 80),
        text: text.substring(0, 50) || '(vacío)',
        isExternal: href.startsWith('http') && !href.includes(this.parsedUrl.hostname),
        noFollow: rel.includes('nofollow')
      });
    });

    const totalLinks = links.length;
    const issues = [];
    let passed = 0;
    const total = 5;

    if (totalLinks === 0) {
      issues.push({ severity: 'critical', message: 'No se encontraron enlaces', fix: 'Los enlaces internos y externos son fundamentales para el SEO.' });
    } else {
      passed++;
    }

    if (internal < 3) {
      issues.push({ severity: 'warning', message: `Solo ${internal} enlaces internos`, fix: 'Añade más enlaces internos para mejorar la estructura del sitio y distribuir autoridad.' });
    } else {
      passed++;
    }

    if (external === 0) {
      issues.push({ severity: 'info', message: 'No hay enlaces externos', fix: 'Enlazar a fuentes relevantes y de autoridad puede mejorar la credibilidad.' });
    } else {
      passed++;
    }

    if (emptyAnchors > 0) {
      issues.push({ severity: 'warning', message: `${emptyAnchors} enlace(s) sin texto anchor`, fix: 'Todos los enlaces deben tener texto descriptivo para accesibilidad y SEO.' });
    } else {
      passed++;
    }

    // Check for generic anchors
    const genericTexts = ['click here', 'click aquí', 'leer más', 'read more', 'aquí', 'here', 'más', 'more'];
    let genericCount = 0;
    links.each((_, a) => {
      const text = $(a).text().trim().toLowerCase();
      if (genericTexts.includes(text)) genericCount++;
    });
    if (genericCount > 0) {
      issues.push({ severity: 'warning', message: `${genericCount} enlace(s) con texto genérico`, fix: 'Usa texto anchor descriptivo en lugar de "click aquí" o "leer más".' });
    } else {
      passed++;
    }

    return {
      name: 'Enlaces',
      icon: 'link',
      score: Math.round((passed / total) * 100),
      passed,
      total,
      issues,
      data: {
        totalLinks,
        internal,
        external,
        noFollow,
        emptyAnchors,
        hashLinks,
        genericAnchors: genericCount,
        links: linkDetails.slice(0, 20)
      }
    };
  }

  // ─── TECHNICAL SEO ─────────────────────────────────────────
  analyzeTechnical() {
    const $ = this.$;
    const issues = [];
    let passed = 0;
    const total = 8;

    // DOCTYPE
    if (this.html.toLowerCase().includes('<!doctype html>')) {
      passed++;
    } else {
      issues.push({ severity: 'warning', message: 'Falta <!DOCTYPE html>', fix: 'Añade <!DOCTYPE html> al inicio del documento.' });
    }

    // Schema/Structured Data
    const jsonLd = $('script[type="application/ld+json"]');
    const microdata = $('[itemscope]');
    if (jsonLd.length > 0 || microdata.length > 0) {
      passed++;
    } else {
      issues.push({ severity: 'warning', message: 'No se detectaron datos estructurados', fix: 'Añade Schema.org (JSON-LD) para rich snippets en Google.' });
    }

    // Canonical
    const canonical = $('link[rel="canonical"]').attr('href');
    if (canonical) {
      passed++;
    } else {
      issues.push({ severity: 'warning', message: 'No hay URL canónica', fix: 'Añade <link rel="canonical"> para prevenir contenido duplicado.' });
    }

    // Hreflang
    const hreflang = $('link[rel="alternate"][hreflang]');
    if (hreflang.length > 0) {
      passed++;
    } else {
      issues.push({ severity: 'info', message: 'No se detectaron etiquetas hreflang', fix: 'Si tienes versiones en varios idiomas, añade hreflang.' });
      passed++;
    }

    // Favicon
    const favicon = $('link[rel="icon"], link[rel="shortcut icon"]');
    if (favicon.length > 0) {
      passed++;
    } else {
      issues.push({ severity: 'info', message: 'No se detectó favicon', fix: 'Añade un favicon para mejor branding y experiencia de usuario.' });
    }

    // Inline styles (excessive)
    const inlineStyles = $('[style]').length;
    if (inlineStyles > 20) {
      issues.push({ severity: 'info', message: `${inlineStyles} elementos con estilos inline`, fix: 'Mueve los estilos a un archivo CSS externo para mejor rendimiento.' });
    } else {
      passed++;
    }

    // iframes
    const iframes = $('iframe').length;
    if (iframes > 3) {
      issues.push({ severity: 'warning', message: `${iframes} iframes detectados`, fix: 'Demasiados iframes pueden afectar el rendimiento. Cárgalos de forma lazy.' });
    } else {
      passed++;
    }

    // Deprecated HTML
    const deprecated = $('font, center, marquee, blink, frame, frameset').length;
    if (deprecated > 0) {
      issues.push({ severity: 'warning', message: `${deprecated} elementos HTML obsoletos`, fix: 'Reemplaza etiquetas obsoletas (font, center, marquee) por CSS.' });
    } else {
      passed++;
    }

    // Schema details
    let schemaTypes = [];
    jsonLd.each((_, el) => {
      try {
        const data = JSON.parse($(el).html());
        if (data['@type']) schemaTypes.push(data['@type']);
      } catch (e) {}
    });

    return {
      name: 'SEO Técnico',
      icon: 'code',
      score: Math.round((passed / total) * 100),
      passed,
      total,
      issues,
      data: {
        hasDoctype: this.html.toLowerCase().includes('<!doctype html>'),
        hasSchema: jsonLd.length > 0 || microdata.length > 0,
        schemaTypes,
        hasCanonical: !!canonical,
        canonical: canonical || '',
        hasFavicon: favicon.length > 0,
        inlineStyles,
        iframes,
        deprecatedElements: deprecated
      }
    };
  }

  // ─── SOCIAL / OPEN GRAPH ───────────────────────────────────
  analyzeSocial() {
    const $ = this.$;
    const issues = [];
    let passed = 0;
    const total = 6;

    const ogTitle = $('meta[property="og:title"]').attr('content') || '';
    const ogDesc = $('meta[property="og:description"]').attr('content') || '';
    const ogImage = $('meta[property="og:image"]').attr('content') || '';
    const ogUrl = $('meta[property="og:url"]').attr('content') || '';
    const ogType = $('meta[property="og:type"]').attr('content') || '';
    const twitterCard = $('meta[name="twitter:card"]').attr('content') || '';

    if (!ogTitle) {
      issues.push({ severity: 'warning', message: 'Falta og:title', fix: 'Añade <meta property="og:title"> para controlar cómo se muestra al compartir.' });
    } else { passed++; }

    if (!ogDesc) {
      issues.push({ severity: 'warning', message: 'Falta og:description', fix: 'Añade <meta property="og:description"> para la descripción al compartir.' });
    } else { passed++; }

    if (!ogImage) {
      issues.push({ severity: 'warning', message: 'Falta og:image', fix: 'Añade una imagen OG (1200x630px recomendado) para mejor engagement social.' });
    } else { passed++; }

    if (!ogUrl) {
      issues.push({ severity: 'info', message: 'Falta og:url', fix: 'Añade <meta property="og:url"> con la URL canónica.' });
    } else { passed++; }

    if (!ogType) {
      issues.push({ severity: 'info', message: 'Falta og:type', fix: 'Añade <meta property="og:type" content="website"> o el tipo apropiado.' });
    } else { passed++; }

    if (!twitterCard) {
      issues.push({ severity: 'info', message: 'Falta twitter:card', fix: 'Añade <meta name="twitter:card" content="summary_large_image"> para Twitter.' });
    } else { passed++; }

    return {
      name: 'Redes Sociales',
      icon: 'share-2',
      score: Math.round((passed / total) * 100),
      passed,
      total,
      issues,
      data: {
        ogTitle: ogTitle || '(no definido)',
        ogDescription: ogDesc || '(no definido)',
        ogImage: ogImage || '(no definido)',
        ogUrl: ogUrl || '(no definido)',
        ogType: ogType || '(no definido)',
        twitterCard: twitterCard || '(no definido)',
      }
    };
  }

  // ─── PERFORMANCE ───────────────────────────────────────────
  analyzePerformance() {
    const $ = this.$;
    const issues = [];
    let passed = 0;
    const total = 6;

    // Page size
    const pageSize = Buffer.byteLength(this.html, 'utf8');
    const pageSizeKB = (pageSize / 1024).toFixed(0);
    if (pageSize > 500000) {
      issues.push({ severity: 'critical', message: `HTML muy pesado (${pageSizeKB}KB)`, fix: 'Reduce el HTML a menos de 500KB. Minifica y elimina código innecesario.' });
    } else if (pageSize > 200000) {
      issues.push({ severity: 'warning', message: `HTML algo pesado (${pageSizeKB}KB)`, fix: 'Considera reducir el tamaño del HTML para mejor rendimiento.' });
    } else {
      passed++;
    }

    // Inline scripts
    const inlineScripts = $('script:not([src])').length;
    if (inlineScripts > 10) {
      issues.push({ severity: 'warning', message: `${inlineScripts} scripts inline detectados`, fix: 'Consolida scripts inline en archivos externos para mejor caché.' });
    } else {
      passed++;
    }

    // External scripts
    const externalScripts = $('script[src]').length;
    if (externalScripts > 15) {
      issues.push({ severity: 'warning', message: `${externalScripts} scripts externos`, fix: 'Demasiados scripts bloquean el renderizado. Combina y usa defer/async.' });
    } else {
      passed++;
    }

    // CSS files
    const cssFiles = $('link[rel="stylesheet"]').length;
    if (cssFiles > 8) {
      issues.push({ severity: 'warning', message: `${cssFiles} archivos CSS externos`, fix: 'Combina archivos CSS para reducir peticiones HTTP.' });
    } else {
      passed++;
    }

    // Defer/Async scripts
    const deferAsync = $('script[defer], script[async]').length;
    if (externalScripts > 3 && deferAsync === 0) {
      issues.push({ severity: 'warning', message: 'Ningún script usa defer/async', fix: 'Usa defer o async en scripts para no bloquear el renderizado.' });
    } else {
      passed++;
    }

    // Load time
    if (this.loadTime > 3000) {
      issues.push({ severity: 'critical', message: `Tiempo de carga alto (${(this.loadTime / 1000).toFixed(1)}s)`, fix: 'Optimiza el servidor y los recursos para cargar en menos de 3 segundos.' });
    } else if (this.loadTime > 1500) {
      issues.push({ severity: 'warning', message: `Tiempo de carga moderado (${(this.loadTime / 1000).toFixed(1)}s)`, fix: 'Intenta reducir el tiempo de carga a menos de 1.5 segundos.' });
    } else {
      passed++;
    }

    return {
      name: 'Rendimiento',
      icon: 'zap',
      score: Math.round((passed / total) * 100),
      passed,
      total,
      issues,
      data: {
        pageSizeKB: parseInt(pageSizeKB),
        loadTimeMs: this.loadTime,
        inlineScripts,
        externalScripts,
        cssFiles,
        deferAsyncScripts: deferAsync
      }
    };
  }

  // ─── SECURITY ──────────────────────────────────────────────
  analyzeSecurity() {
    const $ = this.$;
    const issues = [];
    let passed = 0;
    const total = 5;

    // HTTPS
    if (this.parsedUrl.protocol === 'https:') {
      passed++;
    } else {
      issues.push({ severity: 'critical', message: 'El sitio no usa HTTPS', fix: 'Migra a HTTPS. Es un factor de ranking y genera confianza.' });
    }

    // Mixed content check (http resources on https)
    if (this.parsedUrl.protocol === 'https:') {
      let mixedContent = 0;
      $('img[src^="http:"], script[src^="http:"], link[href^="http:"]').each(() => mixedContent++);
      if (mixedContent > 0) {
        issues.push({ severity: 'warning', message: `${mixedContent} recursos con contenido mixto (HTTP en HTTPS)`, fix: 'Cambia todos los recursos a HTTPS para evitar advertencias del navegador.' });
      } else {
        passed++;
      }
    } else {
      passed++;
    }

    // Security headers (from response)
    const headers = this.headers || {};
    const headerKeys = Object.keys(headers).map(h => h.toLowerCase());

    if (headerKeys.includes('x-frame-options') || headerKeys.includes('content-security-policy')) {
      passed++;
    } else {
      issues.push({ severity: 'info', message: 'Falta X-Frame-Options / CSP', fix: 'Añade X-Frame-Options para prevenir clickjacking.' });
    }

    if (headerKeys.includes('x-content-type-options')) {
      passed++;
    } else {
      issues.push({ severity: 'info', message: 'Falta X-Content-Type-Options', fix: 'Añade el header X-Content-Type-Options: nosniff.' });
    }

    if (headerKeys.includes('strict-transport-security')) {
      passed++;
    } else {
      issues.push({ severity: 'info', message: 'Falta HSTS (Strict-Transport-Security)', fix: 'Activa HSTS para forzar conexiones HTTPS.' });
    }

    return {
      name: 'Seguridad',
      icon: 'shield',
      score: Math.round((passed / total) * 100),
      passed,
      total,
      issues,
      data: {
        isHttps: this.parsedUrl.protocol === 'https:',
        headers: headerKeys.filter(h => ['x-frame-options', 'content-security-policy', 'x-content-type-options', 'strict-transport-security', 'x-xss-protection', 'referrer-policy'].includes(h))
      }
    };
  }

  // ─── MOBILE ────────────────────────────────────────────────
  analyzeMobile() {
    const $ = this.$;
    const issues = [];
    let passed = 0;
    const total = 5;

    // Viewport
    const viewport = $('meta[name="viewport"]').attr('content') || '';
    if (viewport) {
      passed++;
      if (!viewport.includes('width=device-width')) {
        issues.push({ severity: 'warning', message: 'Viewport no incluye width=device-width', fix: 'Usa content="width=device-width, initial-scale=1".' });
      }
    } else {
      issues.push({ severity: 'critical', message: 'Falta meta viewport', fix: 'Esencial para responsive design. Añade la etiqueta viewport.' });
    }

    // Touch icons
    const touchIcon = $('link[rel="apple-touch-icon"], link[rel="apple-touch-icon-precomposed"]');
    if (touchIcon.length > 0) {
      passed++;
    } else {
      issues.push({ severity: 'info', message: 'Falta apple-touch-icon', fix: 'Añade un apple-touch-icon para dispositivos iOS.' });
    }

    // Font size (check for very small fonts in inline styles)
    let smallFonts = 0;
    $('[style*="font-size"]').each((_, el) => {
      const style = $(el).attr('style') || '';
      const match = style.match(/font-size:\s*(\d+)/);
      if (match && parseInt(match[1]) < 12) smallFonts++;
    });
    if (smallFonts > 0) {
      issues.push({ severity: 'warning', message: `${smallFonts} elementos con fuente < 12px`, fix: 'Usa mínimo 16px para texto base en móvil.' });
    } else {
      passed++;
    }

    // Tap targets (buttons/links too close - heuristic)
    passed++; // Basic check

    // Media queries (check if CSS has responsive design indication)
    const hasMediaQueries = this.html.includes('@media') || $('link[media]').length > 0;
    if (hasMediaQueries) {
      passed++;
    } else {
      issues.push({ severity: 'info', message: 'No se detectaron media queries', fix: 'Usa media queries CSS para adaptar el diseño a diferentes pantallas.' });
    }

    return {
      name: 'Móvil',
      icon: 'smartphone',
      score: Math.round((passed / total) * 100),
      passed,
      total,
      issues,
      data: {
        hasViewport: !!viewport,
        viewport: viewport || '(no definido)',
        hasTouchIcon: touchIcon.length > 0,
        hasMediaQueries,
        smallFontElements: smallFonts
      }
    };
  }
}

// ─── MAIN ANALYSIS FUNCTION ──────────────────────────────────
async function analyzeSite(url) {
  // Validate and normalize URL
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  // Validate URL format
  try {
    new URL(url);
  } catch {
    throw new Error('URL inválida. Introduce una URL válida como https://ejemplo.com');
  }

  const startTime = Date.now();

  const response = await axios.get(url, {
    timeout: 15000,
    maxRedirects: 5,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; SEOAnalyzer/1.0)',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    },
    validateStatus: (status) => status < 400,
  });

  const loadTime = Date.now() - startTime;
  const html = response.data;
  const headers = response.headers;

  if (typeof html !== 'string') {
    throw new Error('La URL no devolvió HTML válido.');
  }

  const analyzer = new SEOAnalyzer(url, html, headers, loadTime);
  const results = analyzer.analyze();

  // Calculate overall score
  const categories = Object.values(results.categories);
  const totalScore = categories.reduce((sum, cat) => sum + cat.score, 0);
  results.score = Math.round(totalScore / categories.length);

  // Count issues by severity
  results.summary = {
    critical: 0,
    warning: 0,
    info: 0,
    passed: 0,
    total: 0,
  };

  categories.forEach(cat => {
    cat.issues.forEach(issue => {
      results.summary[issue.severity] = (results.summary[issue.severity] || 0) + 1;
    });
    results.summary.passed += cat.passed;
    results.summary.total += cat.total;
  });

  return results;
}

module.exports = { analyzeSite };
