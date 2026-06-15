# Design: a generated `/docs` site for glotfile-website

**Date:** 2026-06-15
**Status:** Approved (design) — pending spec review

## Goal

Add a full documentation site under `/docs` to the existing `glotfile-website`
static landing page. All ~30 Markdown pages from the glotfile docs become
browsable, styled-to-match HTML pages with sidebar navigation, served as static
files. The docs are a living source of truth in a separate repo, so the design
includes a repeatable sync + build pipeline rather than a one-time copy.

## Decisions (from brainstorming)

- **Scope:** full docs site (all pages), not a curated subset or external links.
- **Mechanism:** build-time static generation (Approach A). A Node script
  converts Markdown to static HTML. No runtime JS dependency for docs; great
  SEO; the hand-built landing page is untouched.
- **Sync model:** vendor a snapshot in-repo. A sync script copies
  `../glotfile/docs` into `docs-src/`; the generator reads only from `docs-src/`.
  The site is self-contained and deployable anywhere (incl. isolated CI) without
  the sibling repo present.
- **Version control:** `git init` this site (it is not a repo yet) so the
  vendored snapshot can be committed. Thematically aligned with glotfile's own
  "commit the artifact, don't sync at runtime" philosophy.
- **Deployment:** GitHub Actions. The GHA runner has no access to the sibling
  `../glotfile` repo, so `docs:sync` is a **local-only** step (run by a human,
  result committed into `docs-src/`). CI runs `docs:build` from the committed
  snapshot and deploys the static output. Therefore generated `docs/` is build
  output and is **not committed** (gitignored).

## Data flow

```
../glotfile/docs/*.md  →  [docs:sync]  →  docs-src/**/*.md  →  [docs:build]  →  docs/**/index.html
   (source of truth)        copy snapshot   (vendored, committed)   generate       (CI build output)
   ─────────── local (human-run) ───────────┤├──────────── CI (GitHub Actions) ────────────
```

## Repository layout (after implementation)

```
glotfile-website/
  index.html                 # existing landing page (gets one new nav link)
  css/
    style.css                # existing — reused by docs pages
    docs.css                 # new — docs shell (sidebar, content column, TOC)
  js/
    main.js                  # existing — unchanged
  docs-src/                  # NEW: vendored snapshot of ../glotfile/docs (committed — CI input)
  docs/                      # NEW: generated static output (CI build output, gitignored)
    index.html               #   from Home.md
    getting-started/quick-start/index.html
    cli/translate/index.html
    ...
  scripts/
    sync-docs.mjs            # NEW: copy ../glotfile/docs → docs-src/ (local only)
    build-docs.mjs           # NEW: docs-src/ → docs/
  docs.nav.mjs               # NEW: hand-maintained section/page order manifest
  package.json               # NEW (site has none today)
  .gitignore                 # NEW (node_modules/, docs/)
  .github/workflows/
    deploy.yml               # NEW: build docs + deploy static site
  specs/                     # this design doc
```

## Toolchain & dependencies

- `package.json` with `"type": "module"`. Site currently has none.
- Dependencies: `markdown-it` (render), `markdown-it-anchor` (stable heading
  IDs for deep links and the on-page TOC).
- A small in-repo `slugify()` helper (shared by page slugs and heading anchors)
  — no extra dependency, and avoids slugger mismatches.
- npm scripts:
  - `docs:sync` → `node scripts/sync-docs.mjs`
  - `docs:build` → `node scripts/build-docs.mjs`
  - `build` → `npm run docs:sync && npm run docs:build`

## Sync script (`sync-docs.mjs`)

- Reads source path (default `../glotfile/docs`, overridable via arg/env).
- Clears and re-copies the Markdown tree into `docs-src/`, preserving folder
  structure. Also copies any image directories/files so embedded images travel
  with the docs.
- Warns (non-fatal) for any doc file present in `docs-src/` but absent from the
  nav manifest, and vice versa, so additions to the docs don't silently vanish.

## Build / generator (`build-docs.mjs`)

1. Read the nav manifest (`docs.nav.mjs`) — the ordered list of sections and the
   pages within each.
2. For each page: read the Markdown, render with markdown-it + anchor plugin,
   wrap in the page template, write to `docs/<section-slug>/<page-slug>/index.html`.
3. Build a `title → URL` map across all pages for index linkification (below).
4. Generate the docs index at `docs/index.html` from `Home.md`.
5. Copy images referenced by docs into the output and rewrite their paths.

### Slugging

`slugify()`: lowercase, trim, drop backticks/punctuation, collapse whitespace to
single hyphens. Examples:

| Source | Slug |
|---|---|
| `Getting Started` (folder) | `getting-started` |
| `Web UI` (folder) | `web-ui` |
| `AI Translation` (folder) | `ai-translation` |
| `CLI Overview.md` | `cli-overview` |
| `Lint and Check.md` | `lint-and-check` |
| `The State File.md` | `the-state-file` |
| `Vue I18n.md` | `vue-i18n` |
| `Troubleshooting and FAQ.md` | `troubleshooting-and-faq` |

URL pattern: `/docs/<section-slug>/<page-slug>/` (via `index.html`). Index lives
at `/docs/`.

### Heading anchors & on-page TOC

markdown-it-anchor adds `id`s to headings. The generator collects the page's
`<h2>`s (and `<h3>`s) into a right-rail "On this page" list, rendered only when a
page has 2+ `<h2>`s.

### Code blocks

Fenced code renders to `<pre><code class="language-…">`, styled by `docs.css` to
match the landing page's terminal/mono cards (dark surface, mono font, prompt
feel). **No syntax-highlighting engine in v1** — styled monospace is sufficient.

### Index page (`Home.md`) handling

`Home.md` is rendered as the docs landing page. Its bullet lists already name
every page (e.g. "Installation — requirements…", "serve · translate · export").
The generator linkifies occurrences of known page titles within those bullets
using the `title → URL` map:

- Longest-title-first matching (so "Web UI Overview" wins over "Web UI").
- Match the leading token before a ` —`, ` ·`, or ` (` separator
  (handles "Flutter (ARB)" → link text "Flutter", "Installation — …").
- **Fallback:** any reference that doesn't match a known title stays as plain
  text. Navigation never depends on this — the sidebar links every page
  unconditionally — so a missed linkification degrades gracefully.

### Body-prose cross-references

Body pages reference each other in plain prose ("you've done Installation"), not
as Markdown links. The generator does **not** auto-link prose (too error-prone).
Cross-page navigation is provided by the sidebar and the index. Deliberate.

## Navigation structure

Sidebar sections follow folders, ordered to mirror `Home.md`. Page order within
each section also follows `Home.md` where it lists them; pages present in the
folder but not named in `Home.md` are appended (alphabetical) and flagged by the
sync warning.

1. **Start here** (`getting-started/`): Installation, Quick Start
2. **Frameworks** (`frameworks/`): Flutter, Laravel, Vue I18n, Angular, Rails, Apple
3. **Core concepts** (`concepts/`): The State File, Keys and Locales, Review States, Plurals, Glossary, Key Context and Metadata
4. **Web UI** (`web-ui/`): Web UI Overview, Editor, Analytics, Screenshots, Settings, AI Log
5. **CLI** (`cli/`): CLI Overview, Serve, Translate, Export, Lint and Check, Import, then (appended) Build Context, Prune, Scan, Skill, Split
6. **AI translation** (`ai-translation/`): How Translation Works, AI Providers
7. **Reference** (`reference/`): Output Formats, Checks and Validation, Configuration Reference, Placeholders and ICU
8. **Guides** (`guides/`): Translation Workflow, Continuous Integration, Keeping Translations Fresh
9. **Troubleshooting & FAQ** (top-level `troubleshooting-and-faq/`)

The nav manifest is the single source for this ordering; changing order = edit
one file.

## Page layout

Reuses the landing page's `<nav>` and `<footer>` markup (carried in the page
template). A "Docs" link is added to the landing nav in `index.html`.

```
┌─────────────────────────────────────────────┐
│  glotfile_         How it works · Docs · npm  │
├───────────┬─────────────────────┬─────────────┤
│ Start here│  # Quick Start       │ On this page│
│  Install  │                      │  · Step 1   │
│ ▸Quick St.│  prose, code blocks… │  · Step 2   │
│ Frameworks│                      │             │
│ Concepts  │  [styled code card]  │             │
│ …         │                      │             │
└───────────┴─────────────────────┴─────────────┘
```

- Left: sidebar (sections + pages), current page highlighted.
- Center: rendered Markdown content.
- Right: "On this page" TOC (long pages only).
- Mobile: sidebar collapses to a top disclosure; TOC hidden.

## Styling

Reuse `css/style.css` (typography, color tokens, terminal cards) and add a
focused `css/docs.css` for the docs shell only. No design-system rewrite.

## Images / screenshots

The generator copies an images directory and handles `![]()` so that when
screenshots are added into the docs Markdown they render automatically. (The
docs have no image embeds today.)

> Note: the separate batch of "screenshots to use" for the **landing page**
> visuals is tracked as its own follow-up, out of scope for this spec.

## Deployment (GitHub Actions)

- **`docs:sync` is local-only.** It reads the sibling `../glotfile/docs`, which
  does not exist in a CI runner. A human runs it when docs change and commits the
  refreshed `docs-src/`.
- **CI runs `docs:build`.** The `.github/workflows/deploy.yml` job: checkout →
  `npm ci` → `npm run docs:build` (reads committed `docs-src/`, no sibling repo
  needed) → publish the static site (`index.html`, `css/`, `js/`, generated
  `docs/`). Deploy target TBD (likely GitHub Pages); does not affect the build.
- **Generated `docs/` is not committed** — it is reproduced by CI on every
  deploy. Listed in `.gitignore`.
- **Local preview:** `npm run build` then serve the directory statically (e.g.
  `npx serve .`) to view the generated docs before pushing.

## Out of scope (YAGNI)

- Client-side / full-text search.
- A syntax-highlighting engine.
- Adopting an SSG (VitePress/Astro/11ty).
- Landing-page screenshot integration (separate follow-up).

These are easy to layer on later without reworking this design.

## Edge cases

- **Filenames with spaces / punctuation** (`Lint and Check.md`,
  `Key Context and Metadata.md`): handled by `slugify()`.
- **Top-level files** (`Home.md`, `Troubleshooting and FAQ.md`): Home → `/docs/`
  index; Troubleshooting → its own single-page section.
- **Doc added upstream but missing from manifest:** sync warns; page still
  generates (appended to its folder section).
- **Manifest references a missing file:** build warns and skips it.
- **Re-running build:** output is overwritten deterministically; an unchanged
  source produces an unchanged diff.

## Open questions / follow-ups

- **Deploy target** for the GHA workflow (GitHub Pages vs. another static host).
  Doesn't affect the build; only the publish step of `deploy.yml`.
- Landing-page screenshots: where do they go (hero, feature cards), once provided?
