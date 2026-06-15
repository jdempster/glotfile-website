# CLI Overview

Run `glotfile <command>` (or `node bin/glotfile.js <command>` from a checkout — see Installation).

| Command | What it does |
|---|---|
| serve (default) | Start the local web UI and open the browser. |
| translate | AI-translate strings, writing results back to `glotfile.json`. |
| export | Write the locale files for every configured output. |
| lint | Report translation problems (states, placeholders, glossary, spelling…). |
| check | CI gate: lint **and** verify exported files are up to date. |
| import | Create `glotfile.json` from existing locale files. |
| build-context | AI-generate per-key context to improve translation (needs a prior scan). |
| scan | Index code references to keys (writes `.glotfile/usage.json`). |
| prune | Remove empty-source or unused keys (dry-run unless `--write`). |
| split | Convert `glotfile.json` into a reviewable `glotfile/` directory. |
| skill | Install the Claude Code skill for managing glotfile. |

Running `glotfile` with no command is the same as `glotfile serve`. Run `glotfile <command> --help` for a command's options.

## Global option

Every command accepts `--file` (`-f`) to target a state file other than `./glotfile.json`:

```bash
glotfile translate --file packages/app/glotfile.json
glotfile export -f ./i18n/glotfile.json
```

## Exit codes

- `serve`, `translate`, `export` exit `0` on success.
- `lint` exits `1` when there are errors (or warnings over `--max-warnings`).
- `check` exits `1` when there are any errors (including out-of-date exports).

This is what makes `lint` and `check` usable as CI gates — see Continuous Integration.

## Credentials

Only translate needs network access or credentials. Glotfile reads them from the environment, including a local `.env` file in the project directory. See AI Providers.

## Related

- Web UI Overview — the same operations in the browser
- Configuration Reference
