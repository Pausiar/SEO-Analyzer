// ── SEO Analyzer Pro — Frontend ──────────────────────────────
(function () {
  'use strict';

  const form = document.getElementById('analyzeForm');
  const urlInput = document.getElementById('urlInput');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const loading = document.getElementById('loading');
  const loadingUrl = document.getElementById('loadingUrl');
  const progressFill = document.getElementById('progressFill');
  const errorBox = document.getElementById('errorBox');
  const errorMessage = document.getElementById('errorMessage');
  const results = document.getElementById('results');
  const scoreRing = document.getElementById('scoreRing');
  const scoreValue = document.getElementById('scoreValue');
  const scoreLabel = document.getElementById('scoreLabel');
  const analyzedUrl = document.getElementById('analyzedUrl');
  const scoreTime = document.getElementById('scoreTime');
  const summaryCards = document.getElementById('summaryCards');
  const categoriesContainer = document.getElementById('categoriesContainer');
  const serpPreview = document.getElementById('serpPreview');
  const exportBtn = document.getElementById('exportBtn');

  let lastResults = null; // store for export

  // Icons map (SVG inline)
  const icons = {
    tag: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
    heading: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M17 10l3-3 3 3"/><path d="M20 7v11"/></svg>',
    'file-text': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
    image: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    link: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    code: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
    'share-2': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>',
    zap: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    shield: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    smartphone: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
  };

  const chevronSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>';
  const checkSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';

  // ── FORM SUBMIT ──────────────────────────────────────────
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = urlInput.value.trim();
    if (!url) return;

    showLoading(url);
    hideError();
    hideResults();

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error desconocido');
      }

      hideLoading();
      lastResults = data;
      renderResults(data);
    } catch (err) {
      hideLoading();
      showError(err.message || 'No se pudo conectar al servidor.');
    }
  });

  // ── EXPORT ────────────────────────────────────────────────
  exportBtn.addEventListener('click', () => {
    if (!lastResults) return;
    const blob = new Blob([JSON.stringify(lastResults, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const domain = lastResults.url.replace(/https?:\/\//, '').replace(/[/\\?#]/g, '_');
    a.download = `seo-report-${domain}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // ── UI HELPERS ───────────────────────────────────────────
  function showLoading(url) {
    loading.classList.remove('hidden');
    loadingUrl.textContent = url;
    analyzeBtn.disabled = true;
    analyzeBtn.querySelector('.btn-text').textContent = 'Analizando...';

    // Animate progress bar
    progressFill.style.width = '0%';
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress > 90) progress = 90;
      progressFill.style.width = progress + '%';
      if (progress >= 90) clearInterval(interval);
    }, 400);
    form._progressInterval = interval;
  }

  function hideLoading() {
    clearInterval(form._progressInterval);
    progressFill.style.width = '100%';
    setTimeout(() => {
      loading.classList.add('hidden');
      analyzeBtn.disabled = false;
      analyzeBtn.querySelector('.btn-text').textContent = 'Analizar';
    }, 300);
  }

  function showError(msg) {
    errorBox.classList.remove('hidden');
    errorMessage.textContent = msg;
  }

  function hideError() {
    errorBox.classList.add('hidden');
  }

  function hideResults() {
    results.classList.add('hidden');
  }

  // ── RENDER RESULTS ───────────────────────────────────────
  function renderResults(data) {
    results.classList.remove('hidden');

    // Scroll to results
    setTimeout(() => {
      results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    // Score ring animation
    const score = data.score;
    const circumference = 2 * Math.PI * 52; // r = 52
    const offset = circumference - (score / 100) * circumference;

    scoreRing.style.strokeDasharray = circumference;
    scoreRing.style.strokeDashoffset = circumference;

    // Color based on score
    let color, label;
    if (score >= 80) {
      color = 'var(--green)';
      label = 'Excelente';
    } else if (score >= 60) {
      color = 'var(--yellow)';
      label = 'Necesita mejoras';
    } else if (score >= 40) {
      color = '#e17055';
      label = 'Problemas importantes';
    } else {
      color = 'var(--red)';
      label = 'Crítico';
    }

    requestAnimationFrame(() => {
      scoreRing.style.stroke = color;
      scoreRing.style.strokeDashoffset = offset;
    });

    // Animate score number
    animateNumber(scoreValue, 0, score, 1200);

    scoreLabel.textContent = label;
    scoreLabel.style.color = color;
    analyzedUrl.textContent = data.url;
    scoreTime.textContent = `Tiempo de carga: ${(data.loadTime / 1000).toFixed(2)}s`;

    // Summary cards
    renderSummaryCards(data.summary);

    // SERP Preview
    renderSerpPreview(data);

    // Category cards
    renderCategories(data.categories);
  }

  function animateNumber(el, from, to, duration) {
    const start = performance.now();
    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease out cubic
      el.textContent = Math.round(from + (to - from) * eased);
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  function renderSummaryCards(summary) {
    summaryCards.innerHTML = `
      <div class="summary-card animate-in">
        <div class="icon-box" style="background: var(--red-bg); color: var(--red);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <div>
          <div class="count">${summary.critical}</div>
          <div class="label">Críticos</div>
        </div>
      </div>
      <div class="summary-card animate-in">
        <div class="icon-box" style="background: var(--yellow-bg); color: var(--yellow);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <div>
          <div class="count">${summary.warning}</div>
          <div class="label">Advertencias</div>
        </div>
      </div>
      <div class="summary-card animate-in">
        <div class="icon-box" style="background: var(--blue-bg); color: var(--blue);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        </div>
        <div>
          <div class="count">${summary.info}</div>
          <div class="label">Info</div>
        </div>
      </div>
      <div class="summary-card animate-in">
        <div class="icon-box" style="background: var(--green-bg); color: var(--green);">
          ${checkSvg}
        </div>
        <div>
          <div class="count">${summary.passed}/${summary.total}</div>
          <div class="label">Superados</div>
        </div>
      </div>
    `;
  }

  function renderSerpPreview(data) {
    const meta = data.categories.meta.data;
    const title = meta.title || 'Sin título';
    const desc = meta.description || 'Sin meta description — Google generará una automáticamente a partir del contenido de la página.';
    const urlDisplay = data.url.replace(/https?:\/\//, '').replace(/\/$/, '');
    const domain = urlDisplay.split('/')[0];
    const titleTruncated = title.length > 60;
    const descTruncated = desc.length > 160;

    serpPreview.innerHTML = `
      <div class="serp-url">
        <span class="favicon">${domain.charAt(0).toUpperCase()}</span>
        <span>${escapeHtml(urlDisplay)}</span>
      </div>
      <a class="serp-title">${escapeHtml(titleTruncated ? title.substring(0, 57) + '...' : title)}</a>
      <div class="serp-description">${escapeHtml(descTruncated ? desc.substring(0, 157) + '...' : desc)}</div>
      ${titleTruncated ? '<div class="serp-truncated">⚠ El título se truncará en los resultados de Google</div>' : ''}
      ${descTruncated ? '<div class="serp-truncated">⚠ La descripción se truncará en los resultados de Google</div>' : ''}
    `;
  }

  function renderCategories(categories) {
    categoriesContainer.innerHTML = '';

    Object.values(categories).forEach((cat, index) => {
      const card = document.createElement('div');
      card.className = 'category-card animate-in';
      if (index === 0) card.classList.add('open'); // first one open

      let scoreColor;
      if (cat.score >= 80) scoreColor = 'var(--green)';
      else if (cat.score >= 60) scoreColor = 'var(--yellow)';
      else if (cat.score >= 40) scoreColor = '#e17055';
      else scoreColor = 'var(--red)';

      let scoreBg;
      if (cat.score >= 80) scoreBg = 'var(--green-bg)';
      else if (cat.score >= 60) scoreBg = 'var(--yellow-bg)';
      else if (cat.score >= 40) scoreBg = 'rgba(225, 112, 85, 0.1)';
      else scoreBg = 'var(--red-bg)';

      card.innerHTML = `
        <div class="category-header" onclick="this.parentElement.classList.toggle('open')">
          <div class="category-header-left">
            <div class="category-icon" style="background: ${scoreBg}; color: ${scoreColor};">
              ${icons[cat.icon] || icons.code}
            </div>
            <div>
              <div class="category-title">${escapeHtml(cat.name)}</div>
              <div class="category-subtitle">${cat.passed}/${cat.total} checks superados</div>
            </div>
          </div>
          <div class="category-header-right">
            <span class="category-score-badge" style="background: ${scoreBg}; color: ${scoreColor};">
              ${cat.score}%
            </span>
            <span class="chevron">${chevronSvg}</span>
          </div>
        </div>
        <div class="category-body">
          <div class="category-content">
            ${renderIssues(cat.issues)}
            ${renderCategoryData(cat)}
          </div>
        </div>
      `;

      categoriesContainer.appendChild(card);
    });
  }

  function renderIssues(issues) {
    if (!issues || issues.length === 0) {
      return `
        <div class="all-passed">
          ${checkSvg}
          <span>Todos los checks superados correctamente</span>
        </div>
      `;
    }

    // Sort: critical first, then warning, then info
    const sorted = [...issues].sort((a, b) => {
      const order = { critical: 0, warning: 1, info: 2 };
      return (order[a.severity] || 3) - (order[b.severity] || 3);
    });

    const severityLabel = { critical: 'Crítico', warning: 'Aviso', info: 'Info' };

    return `
      <div class="issues-list">
        ${sorted.map(issue => `
          <div class="issue-item ${issue.severity}">
            <span class="issue-badge ${issue.severity}">${severityLabel[issue.severity]}</span>
            <div class="issue-text">
              <div class="issue-message">${escapeHtml(issue.message)}</div>
              <div class="issue-fix">💡 ${escapeHtml(issue.fix)}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderCategoryData(cat) {
    if (!cat.data) return '';
    const d = cat.data;

    switch (cat.icon) {
      case 'tag': return renderMetaData(d);
      case 'heading': return renderHeadingsData(d);
      case 'file-text': return renderContentData(d);
      case 'image': return renderImagesData(d);
      case 'link': return renderLinksData(d);
      case 'code': return renderTechnicalData(d);
      case 'share-2': return renderSocialData(d);
      case 'zap': return renderPerformanceData(d);
      case 'shield': return renderSecurityData(d);
      case 'smartphone': return renderMobileData(d);
      default: return '';
    }
  }

  // ── DATA RENDERERS ───────────────────────────────────────
  function renderMetaData(d) {
    return `
      <div class="data-grid">
        <div class="label">Título</div>
        <div class="value">${escapeHtml(d.title)} <span style="color:var(--text-muted)">(${d.titleLength} chars)</span></div>
        <div class="label">Descripción</div>
        <div class="value">${escapeHtml(d.description)} <span style="color:var(--text-muted)">(${d.descriptionLength} chars)</span></div>
        <div class="label">Canonical</div>
        <div class="value">${escapeHtml(d.canonical || '—')}</div>
        <div class="label">Idioma</div>
        <div class="value">${escapeHtml(d.lang)}</div>
        <div class="label">Charset</div>
        <div class="value">${escapeHtml(d.charset)}</div>
        <div class="label">Robots</div>
        <div class="value">${escapeHtml(d.robots)}</div>
      </div>
    `;
  }

  function renderHeadingsData(d) {
    const bars = Object.entries(d.structure).map(([tag, count]) => {
      const max = Math.max(...Object.values(d.structure), 1);
      const pct = (count / max) * 100;
      return `
        <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.4rem">
          <span style="font-weight:600;width:30px;font-size:0.85rem">${tag.toUpperCase()}</span>
          <div style="flex:1;height:8px;background:var(--border);border-radius:4px;overflow:hidden">
            <div style="height:100%;width:${pct}%;background:var(--primary);border-radius:4px;transition:width 0.5s"></div>
          </div>
          <span style="font-size:0.85rem;color:var(--text-muted);width:30px;text-align:right">${count}</span>
        </div>
      `;
    }).join('');

    const headingList = d.headingTexts.map(h => `
      <div class="heading-item">
        <span class="heading-level">${h.level}</span>
        <span class="heading-text">${escapeHtml(h.text)}</span>
      </div>
    `).join('');

    return `
      <div style="margin-top:1.25rem">
        <h4 style="font-size:0.9rem;margin-bottom:0.75rem;color:var(--text-muted)">Distribución de encabezados</h4>
        ${bars}
      </div>
      ${headingList ? `
        <div style="margin-top:1.25rem">
          <h4 style="font-size:0.9rem;margin-bottom:0.75rem;color:var(--text-muted)">Estructura de encabezados</h4>
          ${headingList}
        </div>
      ` : ''}
    `;
  }

  function renderContentData(d) {
    let keywordsTable = '';
    if (d.topKeywords && d.topKeywords.length > 0) {
      keywordsTable = `
        <h4 style="font-size:0.9rem;margin-top:1.25rem;margin-bottom:0.5rem;color:var(--text-muted)">Top keywords detectadas</h4>
        <table class="keywords-table">
          <thead>
            <tr><th>Palabra</th><th>Apariciones</th><th>Densidad</th></tr>
          </thead>
          <tbody>
            ${d.topKeywords.map(k => `
              <tr>
                <td><strong>${escapeHtml(k.word)}</strong></td>
                <td>${k.count}</td>
                <td>${k.density}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    return `
      <div class="data-grid">
        <div class="label">Palabras</div>
        <div class="value">${d.wordCount.toLocaleString()}</div>
        <div class="label">Párrafos</div>
        <div class="value">${d.paragraphs}</div>
        <div class="label">Negritas (&lt;strong&gt;)</div>
        <div class="value">${d.strongTags}</div>
        <div class="label">Cursivas (&lt;em&gt;)</div>
        <div class="value">${d.emTags}</div>
      </div>
      ${keywordsTable}
    `;
  }

  function renderImagesData(d) {
    if (d.totalImages === 0) return '<p style="color:var(--text-muted);margin-top:1rem">No se encontraron imágenes en la página.</p>';

    return `
      <div class="data-grid">
        <div class="label">Total imágenes</div>
        <div class="value">${d.totalImages}</div>
        <div class="label">Sin atributo alt</div>
        <div class="value" style="color:${d.missingAlt > 0 ? 'var(--red)' : 'var(--green)'}">${d.missingAlt}</div>
        <div class="label">Alt vacío</div>
        <div class="value" style="color:${d.emptyAlt > 0 ? 'var(--yellow)' : 'var(--green)'}">${d.emptyAlt}</div>
        <div class="label">Sin dimensiones</div>
        <div class="value">${d.missingDimensions}</div>
        <div class="label">Sin lazy loading</div>
        <div class="value">${d.missingLazy}</div>
      </div>
    `;
  }

  function renderLinksData(d) {
    return `
      <div class="data-grid">
        <div class="label">Total enlaces</div>
        <div class="value">${d.totalLinks}</div>
        <div class="label">Internos</div>
        <div class="value">${d.internal}</div>
        <div class="label">Externos</div>
        <div class="value">${d.external}</div>
        <div class="label">Nofollow</div>
        <div class="value">${d.noFollow}</div>
        <div class="label">Sin texto anchor</div>
        <div class="value" style="color:${d.emptyAnchors > 0 ? 'var(--yellow)' : 'var(--green)'}">${d.emptyAnchors}</div>
        <div class="label">Anchors genéricos</div>
        <div class="value" style="color:${d.genericAnchors > 0 ? 'var(--yellow)' : 'var(--green)'}">${d.genericAnchors}</div>
      </div>
    `;
  }

  function renderTechnicalData(d) {
    const boolBadge = (val) => val
      ? `<span style="color:var(--green)">✓ Sí</span>`
      : `<span style="color:var(--red)">✗ No</span>`;

    return `
      <div class="data-grid">
        <div class="label">DOCTYPE</div>
        <div class="value">${boolBadge(d.hasDoctype)}</div>
        <div class="label">Datos estructurados</div>
        <div class="value">${boolBadge(d.hasSchema)} ${d.schemaTypes.length ? `(${d.schemaTypes.join(', ')})` : ''}</div>
        <div class="label">URL canónica</div>
        <div class="value">${boolBadge(d.hasCanonical)} ${d.canonical ? `<span style="color:var(--text-muted)">${escapeHtml(d.canonical)}</span>` : ''}</div>
        <div class="label">Favicon</div>
        <div class="value">${boolBadge(d.hasFavicon)}</div>
        <div class="label">Estilos inline</div>
        <div class="value">${d.inlineStyles}</div>
        <div class="label">Iframes</div>
        <div class="value">${d.iframes}</div>
      </div>
    `;
  }

  function renderSocialData(d) {
    return `
      <div class="data-grid">
        <div class="label">og:title</div>
        <div class="value">${escapeHtml(d.ogTitle)}</div>
        <div class="label">og:description</div>
        <div class="value">${escapeHtml(d.ogDescription)}</div>
        <div class="label">og:image</div>
        <div class="value">${escapeHtml(d.ogImage)}</div>
        <div class="label">og:url</div>
        <div class="value">${escapeHtml(d.ogUrl)}</div>
        <div class="label">og:type</div>
        <div class="value">${escapeHtml(d.ogType)}</div>
        <div class="label">twitter:card</div>
        <div class="value">${escapeHtml(d.twitterCard)}</div>
      </div>
    `;
  }

  function renderPerformanceData(d) {
    return `
      <div class="data-grid">
        <div class="label">Tamaño HTML</div>
        <div class="value">${d.pageSizeKB} KB</div>
        <div class="label">Tiempo de carga</div>
        <div class="value">${(d.loadTimeMs / 1000).toFixed(2)}s</div>
        <div class="label">Scripts inline</div>
        <div class="value">${d.inlineScripts}</div>
        <div class="label">Scripts externos</div>
        <div class="value">${d.externalScripts}</div>
        <div class="label">Archivos CSS</div>
        <div class="value">${d.cssFiles}</div>
        <div class="label">Scripts defer/async</div>
        <div class="value">${d.deferAsyncScripts}</div>
      </div>
    `;
  }

  function renderSecurityData(d) {
    const boolBadge = (val) => val
      ? `<span style="color:var(--green)">✓ Sí</span>`
      : `<span style="color:var(--red)">✗ No</span>`;

    return `
      <div class="data-grid">
        <div class="label">HTTPS</div>
        <div class="value">${boolBadge(d.isHttps)}</div>
        <div class="label">Security headers</div>
        <div class="value">${d.headers.length > 0 ? d.headers.join(', ') : '<span style="color:var(--red)">Ninguno detectado</span>'}</div>
      </div>
    `;
  }

  function renderMobileData(d) {
    const boolBadge = (val) => val
      ? `<span style="color:var(--green)">✓ Sí</span>`
      : `<span style="color:var(--red)">✗ No</span>`;

    return `
      <div class="data-grid">
        <div class="label">Viewport</div>
        <div class="value">${boolBadge(d.hasViewport)} ${d.viewport !== '(no definido)' ? `<span style="color:var(--text-muted)">${escapeHtml(d.viewport)}</span>` : ''}</div>
        <div class="label">Apple Touch Icon</div>
        <div class="value">${boolBadge(d.hasTouchIcon)}</div>
        <div class="label">Media queries</div>
        <div class="value">${boolBadge(d.hasMediaQueries)}</div>
        <div class="label">Fuentes < 12px</div>
        <div class="value">${d.smallFontElements}</div>
      </div>
    `;
  }

  // ── UTILS ────────────────────────────────────────────────
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

})();
