# glotfile-website

The marketing site and documentation for **[Glotfile](https://github.com/jdempster/glotfile)** — the local-first, git-native translation manager. Lives at **[glotfile.dev](https://glotfile.dev)**.

A static site: a hand-built landing page plus a `/docs` site generated from Glotfile's user guide. No runtime framework — HTML, CSS, and a little vanilla JS.

## Layout

```
index.html              Landing page
css/                    style.css (design system) + docs.css (docs shell)
js/main.js              Copy buttons, hero terminal, sticky nav, scroll reveal
assets/screenshots/     Product screenshots used on the landing page
favicon.svg

docs.nav.mjs            Docs nav manifest — section + page order
docs-src/               Vendored snapshot of ../glotfile/docs (committed; CI input)
docs/                   Generated docs site (gitignored; built in CI)
scripts/
  sync-docs.mjs         Copy ../glotfile/docs → docs-src/ (local only)
  build-docs.mjs        Render docs-src/ → docs/**/index.html

screenshot-source/      Demo data + generator to reproduce the screenshots
.github/workflows/      GitHub Pages deploy
```

## Develop

```sh
npm install

npm run docs:sync     # vendor the latest docs from ../glotfile (local only)
npm run docs:build    # render docs-src/ → docs/
npm run build         # both of the above

npx serve .           # preview the whole site (http://localhost:3000)
```

The documentation's source of truth lives in the [Glotfile repo](https://github.com/jdempster/glotfile) under `docs/`. `docs:sync` copies a snapshot into `docs-src/` (committed, so CI doesn't need the sibling repo); `docs:build` renders it to static HTML. Override the source with `GLOTFILE_DOCS=/path/to/glotfile/docs npm run docs:sync`.

## Updating the docs

1. Edit the docs in the Glotfile repo.
2. Run `npm run docs:sync` here and commit the refreshed `docs-src/`.
3. Push — CI rebuilds and deploys.

`docs.nav.mjs` controls section/page order; the sync step warns if a doc file isn't listed there (or a listed page is missing).

## Deploy

GitHub Pages via Actions (`.github/workflows/deploy.yml`). On push to `main`/`master`, CI runs `npm run docs:build` from the committed `docs-src/`, assembles the static site (`index.html`, `css/`, `js/`, `assets/`, `docs/`), and publishes it. The custom domain `glotfile.dev` is configured once in **Settings → Pages** (no `CNAME` file needed with the Actions deployment method).

## License

MIT
