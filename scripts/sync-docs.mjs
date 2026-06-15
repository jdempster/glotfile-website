// Vendor the glotfile docs into this repo. LOCAL-ONLY: reads the sibling
// ../glotfile/docs (overridable) and copies the Markdown + images into
// docs-src/, which is committed and consumed by build-docs.mjs in CI.
//
//   node scripts/sync-docs.mjs [sourceDir]
//   GLOTFILE_DOCS=/path/to/glotfile/docs node scripts/sync-docs.mjs
import { cpSync, rmSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SECTIONS, INDEX_FILE } from '../docs.nav.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DEST = join(ROOT, 'docs-src');
const SRC =
  process.argv[2] || process.env.GLOTFILE_DOCS || join(ROOT, '..', 'glotfile', 'docs');

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp']);
const COPY_EXT = new Set(['.md', ...IMAGE_EXT]);

if (!existsSync(SRC)) {
  console.error(`✖ docs source not found: ${SRC}`);
  console.error('  Pass a path or set GLOTFILE_DOCS to the glotfile docs directory.');
  process.exit(1);
}

rmSync(DEST, { recursive: true, force: true });
mkdirSync(DEST, { recursive: true });
cpSync(SRC, DEST, {
  recursive: true,
  filter: (path) => {
    const st = statSync(path);
    if (st.isDirectory()) return true;
    return COPY_EXT.has(extname(path).toLowerCase());
  },
});

// Cross-check the manifest against what actually landed, so docs added upstream
// (or renamed) don't silently vanish from the generated site.
function walkMd(dir, base = dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walkMd(full, base));
    else if (extname(name).toLowerCase() === '.md') out.push(relative(base, full));
  }
  return out;
}

const actual = new Set(walkMd(DEST));
const expected = new Set([`${INDEX_FILE}.md`]);
for (const s of SECTIONS) {
  for (const p of s.pages) expected.add(s.dir ? join(s.dir, `${p}.md`) : `${p}.md`);
}

const missing = [...expected].filter((f) => !actual.has(f));
const orphan = [...actual].filter((f) => !expected.has(f));
const fileCount = actual.size;

console.log(`✓ synced ${fileCount} Markdown file(s) → docs-src/`);
for (const f of missing) console.warn(`  ⚠ in manifest but missing from docs: ${f}`);
for (const f of orphan) console.warn(`  ⚠ present in docs but not in manifest (won't render): ${f}`);
if (missing.length || orphan.length) {
  console.warn('  → update docs.nav.mjs to match.');
}
