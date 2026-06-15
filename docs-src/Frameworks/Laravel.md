# Laravel

Glotfile exports to Laravel's PHP array files with the **`laravel-php`** adapter — one file per locale **per namespace**, consumed directly by `__()` / `trans()`.

## Configure the output

In Settings → Output Formats (or `glotfile.json`):

```json
{ "adapter": "laravel-php", "path": "lang/{locale}/{namespace}.php" }
```

Laravel 9 and earlier keep these under `resources/lang/{locale}/{namespace}.php` — use that path instead.

### How `{namespace}` works

The first dot-segment of a key becomes its file. `auth.signIn.button` is written as `signIn.button` inside `lang/fr/auth.php`; keys with no dot fall into `messages.php`. This mirrors how `__('auth.signIn.button')` resolves.

## Import existing strings

```bash
glotfile import
```

Detection finds `lang/` or `resources/lang/`. **PHP must be on your `PATH`** — the importer evaluates the array files to read them.

## Wire Laravel to the exports

Nothing to generate: Laravel reads the PHP arrays directly. Use `__('auth.signIn.button')`, `trans()`, the `@lang` Blade directive, or `trans_choice()` for plurals.

## Format notes

- **Placeholders** — `{name}` is rendered as Laravel's `:name`.
- **Plurals** — pipe-separated forms (`one|other`) consumed by `trans_choice()`.
- **Locale codes** — default to BCP-47 with underscores (`lang/pt_BR/…`, `lang/zh_HK/…`); bare codes like `fr` stay bare. This matches Laravel's loader, which keys off underscore + uppercase-region directory names. Override per output with `localeCase`. See Output Formats.

## Related

- Output Formats · Placeholders and ICU · Plurals · Quick Start · Translation Workflow
