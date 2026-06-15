# Placeholders and ICU

Translations must keep the machinery the source string carries: **interpolation placeholders** and **ICU plural/select** structure. Glotfile protects both during translation, validation, and export.

## One canonical form, converted on export

Glotfile stores every placeholder in a single **canonical** form — `{name}` —
no matter what style the source file used. Import normalises to it; export
converts it to each adapter's native style. So you edit and validate against one
syntax, and each output file still gets the flavour its framework expects.

| Format | Native style | Example | On import → stored | On export ← stored |
|---|---|---|---|---|
| Flutter ARB | ICU named | `{name}` | `{name}` (already canonical) | `{name}` |
| Vue I18n | single braces | `{name}` | `{name}` (already canonical) | `{name}` |
| Laravel | colon | `:name` | `{name}` | `:name` |
| Rails YAML | percent-brace | `%{name}` | `{name}` | `%{name}` |
| i18next | double braces | `{{name}}` | `{name}` | `{{name}}` |
| Angular XLIFF | placeholder element | `<x id="INTERPOLATION" equiv-text="{{name}}"/>` | `{name}` | `<x id="INTERPOLATION" equiv-text="{{name}}"/>` |

A translation that **drops, renames, or adds** a placeholder relative to the
source is:

- **rejected** by AI translation (not written), and
- flagged by the `placeholder-mismatch` rule.

Because everything is canonical internally, the editor and the checks only ever
look for `{name}` — they never mistake an unrelated colon or percent sign (a
time like `(h:m)`, a ratio `a:b`) for a placeholder.

> **printf formats** (`%s`, `%d` in gettext and Apple `.stringsdict`) are
> **export-only and lossy** — they sit outside the canonical guarantee. See
> *Lossy conversions* below.

## Escaping a literal `{name}`

To write text that *looks* like a placeholder but should be left alone, use
**ICU apostrophe quoting**:

| You write | You get |
|---|---|
| `'{'` | a literal `{` |
| `'{name}'` | the literal text `{name}` (not a token) |
| `''` | a literal apostrophe `'` |

Quoted spans are treated as plain text, so `'{name}'` is never flagged by the
checks or altered by AI translation. ARB output (ICU) preserves the quoting on
round-trip.

## ICU plural and select

ICU constructs like:

```
{count, plural, one {# item} other {# items}}
{gender, select, male {he} female {she} other {they}}
```

are preserved structurally. The `icu-mismatch` rule flags a string where one side (source or translation) is an ICU plural/select and the other isn't. See also Plurals for the dedicated plural-key model.

## Lossy conversions

Not every format can represent every construct. When export hits one it can't faithfully convert, it **warns and writes safe output** rather than emitting something broken:

```
warning [icu-unsupported] cart.items @ de: not representable in target format; wrote fallback
```

Treat these warnings as a prompt to simplify the string or pick a different adapter for that output.

## Related

- Plurals · Output Formats · Checks and Validation · How Translation Works
