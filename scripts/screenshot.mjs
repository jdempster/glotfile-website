// Screenshot the landing page for visual checks.
//
//   node scripts/screenshot.mjs                  # desktop + phone, full page
//   node scripts/screenshot.mjs 1280 390 768     # custom widths
//   node scripts/screenshot.mjs --section features  # one section, default widths
//
// Writes PNGs to .screenshots/ (gitignored). Needs Playwright + Chromium —
// preinstalled in the Claude Code web environment; locally run
// `npx playwright install chromium` first.
import { createRequire } from 'module';
import { execSync } from 'child_process';
import { mkdirSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';

const require = createRequire(import.meta.url);

function loadPlaywright() {
  // Prefer a local install; fall back to a global one (the Claude Code web
  // environment ships Playwright globally rather than per-project).
  try {
    return require('playwright');
  } catch {}
  try {
    const root = execSync('npm root -g', { encoding: 'utf8' }).trim();
    return createRequire(join(root, 'noop.js'))('playwright');
  } catch {}
  return null;
}

const playwright = loadPlaywright();
if (!playwright) {
  console.error('Playwright not found. Run: npx playwright install chromium');
  process.exit(1);
}
const { chromium } = playwright;

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outDir = join(root, '.screenshots');
const pageUrl = pathToFileURL(join(root, 'index.html')).href;

const args = process.argv.slice(2);
const sectionIdx = args.indexOf('--section');
const section = sectionIdx !== -1 ? args[sectionIdx + 1] : null;
const widths = args.filter((a, i) => /^\d+$/.test(a) && i !== sectionIdx + 1).map(Number);

const targets = widths.length
  ? widths.map((w) => [String(w), w])
  : [['desktop', 1280], ['phone', 390]];

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
for (const [name, width] of targets) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 2 });
  await page.goto(pageUrl, { waitUntil: 'networkidle' });
  // The page fades sections in on scroll; disable it so off-screen content
  // renders in a full-page capture.
  await page.evaluate(() => document.body.classList.remove('reveal-on'));
  await page.waitForTimeout(200);
  const suffix = section ? `-${section}` : '';
  const out = join(outDir, `${name}${suffix}.png`);
  if (section) {
    await page.locator(`#${section}`).screenshot({ path: out });
  } else {
    await page.screenshot({ path: out, fullPage: true });
  }
  console.log(`wrote ${out} (${width}px)`);
  await page.close();
}
await browser.close();
