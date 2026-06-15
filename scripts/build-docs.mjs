// Generate the static /docs site from the vendored docs-src/ Markdown.
// Runs in CI (no sibling repo needed). Output: docs/**/index.html — gitignored,
// reproduced on every deploy. Reuses the site's css/style.css plus css/docs.css.
import MarkdownIt from 'markdown-it';
import anchor from 'markdown-it-anchor';
import {
  readFileSync, writeFileSync, mkdirSync, rmSync, cpSync,
  existsSync, readdirSync, statSync,
} from 'node:fs';
import { join, dirname, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SECTIONS, INDEX_FILE } from '../docs.nav.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'docs-src');
const OUT = join(ROOT, 'docs');
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp']);

if (!existsSync(SRC)) {
  console.error('✖ docs-src/ not found — run `npm run docs:sync` first.');
  process.exit(1);
}

// ---- helpers ---------------------------------------------------------------
function slugify(s) {
  return String(s)
    .toLowerCase()
    .trim()
    .replace(/[`'"’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ESC[c]);
const encPath = (p) => p.split('/').map(encodeURIComponent).join('/');

// A lone top-level page (e.g. Troubleshooting) sits at the section root rather
// than a doubled /slug/slug/ path.
function pageUrl(s, p) {
  if (s.dir === '' && s.pages.length === 1) return `/docs/${s.slug}/`;
  return `/docs/${s.slug}/${slugify(p)}/`;
}

// ---- markdown --------------------------------------------------------------
let headings = [];
let pageTitle = null;
let currentSrcDir = '';

const md = new MarkdownIt({ html: true, linkify: true, typographer: true });
md.use(anchor, {
  slugify,
  level: [1, 2, 3, 4],
  callback: (token, info) => {
    const lvl = Number(token.tag.slice(1));
    if (lvl === 1 && pageTitle === null) pageTitle = info.title;
    if (lvl === 2 || lvl === 3) headings.push({ level: lvl, title: info.title, slug: info.slug });
  },
});

// Rewrite relative image srcs to /docs/media/<source-relative-path> and lazy-load.
const defaultImage = md.renderer.rules.image;
md.renderer.rules.image = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  const src = token.attrGet('src');
  if (src && !/^(https?:|\/|data:)/.test(src)) {
    const rel = currentSrcDir ? `${currentSrcDir}/${src}` : src;
    token.attrSet('src', `/docs/media/${encPath(rel)}`);
  }
  token.attrSet('loading', 'lazy');
  token.attrSet('decoding', 'async');
  return (defaultImage || self.renderToken).call(self, tokens, idx, options, env, self);
};

function render(markdown, srcDir) {
  headings = [];
  pageTitle = null;
  currentSrcDir = srcDir;
  const html = md.render(markdown);
  return { html, headings, title: pageTitle };
}

// ---- chrome ----------------------------------------------------------------
const NAV = `  <header class="site-header" id="site-header">
    <nav class="nav">
      <a class="wordmark" href="/">glotfile<span class="wordmark-cursor">_</span></a>
      <div class="nav-links">
        <a class="nav-link" href="/#how">How it works</a>
        <a class="nav-link" href="/#ui">The UI</a>
        <a class="nav-link" href="/#features">Features</a>
        <a class="nav-link" href="/docs/">Docs</a>
        <a class="nav-npm" href="https://www.npmjs.com/package/glotfile"><span class="nav-npm-tag">npm</span> glotfile</a>
      </div>
    </nav>
  </header>`;

const FOOTER = `  <footer>
    <div class="footer-meta">
      <span>glotfile · MIT licensed</span>
      <span><a class="footer-meta-link" href="/">← back to glotfile.dev</a></span>
    </div>
  </footer>`;

function sidebar(activeUrl) {
  const overview = `<div class="doc-nav-section"><ul><li><a class="doc-nav-link${
    activeUrl === '/docs/' ? ' active' : ''
  }" href="/docs/">Overview</a></li></ul></div>`;
  const sections = SECTIONS.map((s) => {
    const items = s.pages
      .map((p) => {
        const url = pageUrl(s, p);
        return `<li><a class="doc-nav-link${url === activeUrl ? ' active' : ''}" href="${url}">${esc(p)}</a></li>`;
      })
      .join('');
    return `<div class="doc-nav-section"><p class="doc-nav-title">${esc(s.title)}</p><ul>${items}</ul></div>`;
  }).join('\n      ');
  return overview + '\n      ' + sections;
}

function tocHtml(hs) {
  if (hs.filter((h) => h.level === 2).length < 2) return '';
  const items = hs
    .map((h) => `<li class="toc-l${h.level}"><a href="#${h.slug}">${esc(h.title)}</a></li>`)
    .join('');
  return `<nav class="doc-toc" aria-label="On this page"><p class="doc-toc-title">On this page</p><ul>${items}</ul></nav>`;
}

function shell({ title, activeUrl, content, toc }) {
  const hasToc = Boolean(toc);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)} — Glotfile docs</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/style.css">
  <link rel="stylesheet" href="/css/docs.css">
</head>
<body class="docs">
${NAV}
  <div class="doc-shell${hasToc ? '' : ' no-toc'}">
    <aside class="doc-sidebar" aria-label="Documentation">
      ${sidebar(activeUrl)}
    </aside>
    <main class="doc-main">
${content}
    </main>
    ${hasToc ? `<aside class="doc-tocwrap">${toc}</aside>` : ''}
  </div>
${FOOTER}
  <script src="/js/main.js" defer></script>
</body>
</html>
`;
}

// ---- build -----------------------------------------------------------------
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

let pageCount = 0;

// Content pages
for (const s of SECTIONS) {
  for (const p of s.pages) {
    const srcPath = s.dir ? join(SRC, s.dir, `${p}.md`) : join(SRC, `${p}.md`);
    if (!existsSync(srcPath)) {
      console.warn(`  ⚠ skipping (missing): ${relative(ROOT, srcPath)}`);
      continue;
    }
    const { html, headings: hs, title } = render(readFileSync(srcPath, 'utf8'), s.dir);
    const url = pageUrl(s, p);
    const content =
      `      <p class="doc-eyebrow">${esc(s.title)}</p>\n` +
      `      <article class="doc-content">\n${html}      </article>`;
    const page = shell({ title: title || p, activeUrl: url, content, toc: tocHtml(hs) });
    const outPath = join(OUT, url.replace(/^\/docs\//, '').replace(/\/$/, ''), 'index.html');
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, page);
    pageCount++;
  }
}

// Index page: Home.md intro + manifest-driven section cards (robust links).
{
  const homePath = join(SRC, `${INDEX_FILE}.md`);
  let introHtml = '';
  if (existsSync(homePath)) {
    const raw = readFileSync(homePath, 'utf8');
    const intro = raw.split(/\n##\s/)[0]; // everything before the first "## " section
    introHtml = render(intro, '').html;
  }
  const cards = SECTIONS.map((s) => {
    const items = s.pages
      .map((p) => `<li><a href="${pageUrl(s, p)}">${esc(p)}</a></li>`)
      .join('');
    return `<div class="doc-card"><p class="doc-card-title">${esc(s.title)}</p><ul>${items}</ul></div>`;
  }).join('\n        ');
  const content =
    `      <article class="doc-content doc-index">\n` +
    `        <div class="doc-index-hero">${introHtml}</div>\n` +
    `        <div class="doc-cards">\n        ${cards}\n        </div>\n` +
    `      </article>`;
  writeFileSync(join(OUT, 'index.html'), shell({ title: 'Documentation', activeUrl: '/docs/', content, toc: '' }));
  pageCount++;
}

// Copy images (mirroring docs-src structure) so relative refs resolve.
function walkImages(dir, base = dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walkImages(full, base));
    else if (IMAGE_EXT.has(extname(name).toLowerCase())) out.push(relative(base, full));
  }
  return out;
}
let imageCount = 0;
for (const rel of walkImages(SRC)) {
  const dest = join(OUT, 'media', rel);
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(join(SRC, rel), dest);
  imageCount++;
}

console.log(`✓ built ${pageCount} page(s)${imageCount ? ` + ${imageCount} image(s)` : ''} → docs/`);
