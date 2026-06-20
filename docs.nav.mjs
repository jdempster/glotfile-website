// Documentation navigation manifest — the single source of truth for section
// order and per-page order in the generated /docs site. Mirrors the grouping in
// the docs' own Home.md rather than alphabetical folders.
//
// Each section: { title (sidebar label), dir (folder under docs-src/, "" for
// top-level files), slug (URL segment), pages (filenames without .md, in order) }.
// A page's display <h1>/<title> comes from the Markdown's own first heading;
// `pages` entries are the sidebar labels and map to "<dir>/<page>.md".

export const SECTIONS = [
  {
    title: 'Start here',
    dir: 'Getting Started',
    slug: 'getting-started',
    pages: ['Installation', 'Quick Start'],
  },
  {
    title: 'Frameworks',
    dir: 'Frameworks',
    slug: 'frameworks',
    pages: ['Flutter', 'Laravel', 'Vue I18n', 'Next.js (next-intl)', 'Angular', 'Rails', 'Apple'],
  },
  {
    title: 'Core concepts',
    dir: 'Concepts',
    slug: 'concepts',
    pages: [
      'The State File',
      'Keys and Locales',
      'Review States',
      'Plurals',
      'Glossary',
      'Key Context and Metadata',
    ],
  },
  {
    title: 'Web UI',
    dir: 'Web UI',
    slug: 'web-ui',
    pages: ['Web UI Overview', 'Lingo', 'Editor', 'Analytics', 'Screenshots', 'Settings', 'AI Log'],
  },
  {
    title: 'CLI',
    dir: 'CLI',
    slug: 'cli',
    pages: [
      'CLI Overview',
      'Serve',
      'Reading and Extraction',
      'Editing from the CLI',
      'Translate',
      'Export',
      'Lint and Check',
      'Import',
      'Build Context',
      'Prune',
      'Scan',
      'Skill',
      'Split',
    ],
  },
  {
    title: 'AI translation',
    dir: 'AI Translation',
    slug: 'ai-translation',
    pages: ['How Translation Works', 'AI Providers'],
  },
  {
    title: 'Reference',
    dir: 'Reference',
    slug: 'reference',
    pages: ['Output Formats', 'Checks and Validation', 'Configuration Reference', 'Placeholders and ICU'],
  },
  {
    title: 'Guides',
    dir: 'Guides',
    slug: 'guides',
    pages: ['Translation Workflow', 'Continuous Integration', 'Keeping Translations Fresh'],
  },
  {
    title: 'Troubleshooting & FAQ',
    dir: '',
    slug: 'troubleshooting-and-faq',
    pages: ['Troubleshooting and FAQ'],
  },
];

// The docs landing page is generated from this file.
export const INDEX_FILE = 'Home';
