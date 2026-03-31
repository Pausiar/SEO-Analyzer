# SEO Analyzer Pro 🔍

Herramienta web profesional de análisis SEO que inspecciona cualquier URL y genera un informe detallado con recomendaciones accionables para mejorar el posicionamiento en Google.

![Node.js](https://img.shields.io/badge/Node.js-18+-green) ![License](https://img.shields.io/badge/License-ISC-blue)

## Características

- **10 categorías de análisis**: Meta tags, encabezados, contenido, imágenes, enlaces, SEO técnico, redes sociales, rendimiento, seguridad y móvil
- **50+ checks automáticos** con clasificación por severidad (crítico, aviso, info)
- **Vista previa SERP**: Cómo se verá tu página en los resultados de Google
- **Top keywords**: Análisis de densidad de palabras clave
- **Exportar a JSON**: Descarga el informe completo
- **Interfaz profesional** con diseño dark mode y animaciones
- **Rate limiting** y headers de seguridad incluidos

## Instalación

```bash
git clone https://github.com/Pausiar/SEO-Analyzer.git
cd SEO-Analyzer
npm install
```

## Uso

```bash
node server.js
```

Abre el navegador en `http://localhost:3000`, introduce una URL y obtén el análisis completo.

## Stack técnico

- **Backend**: Node.js + Express
- **Parsing**: Cheerio (HTML) + Axios (HTTP)
- **Frontend**: HTML/CSS/JS vanilla (sin frameworks)
- **Seguridad**: Helmet, CORS, Rate Limiting

## Categorías de análisis

| Categoría | Qué analiza |
|-----------|-------------|
| Meta Tags | Title, description, canonical, viewport, charset, lang, robots |
| Encabezados | Jerarquía H1-H6, estructura, saltos de nivel |
| Contenido | Palabras, párrafos, keywords, legibilidad |
| Imágenes | Alt text, dimensiones, lazy loading |
| Enlaces | Internos/externos, anchors, nofollow |
| SEO Técnico | Schema, DOCTYPE, datos estructurados, favicon |
| Redes Sociales | Open Graph, Twitter Cards |
| Rendimiento | Tamaño HTML, scripts, CSS, tiempo de carga |
| Seguridad | HTTPS, headers de seguridad, contenido mixto |
| Móvil | Viewport, touch icons, media queries, fuentes |

## API

```
POST /api/analyze
Content-Type: application/json

{ "url": "https://ejemplo.com" }
```

Responde con un JSON con la puntuación global, categorías y recomendaciones.

## Licencia

ISC
