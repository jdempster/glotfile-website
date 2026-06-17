// Generates an enriched demo glotfile.json for marketing screenshots.
// A believable team file-storage SaaS: 7 locales incl. Arabic (RTL) + Polish,
// plural keys, and a deliberate spread of review states for a good Analytics view.
import { writeFileSync, mkdirSync } from 'node:fs';

const SRC = 'en';
const LOCALES = ['en', 'de', 'es', 'fr', 'ja', 'ar', 'pl'];

// Per-key spec. A locale value is either:
//   "string"                 -> reviewed
//   ["string", "machine"]    -> AI machine translation
//   ["string", "needs-review"]
//   (omitted)                -> missing (empty)
// `en` is always the source.
const KEYS = {
  'common.cancel': {
    tags: ['common', 'button'],
    en: 'Cancel',
    de: 'Abbrechen', es: 'Cancelar', fr: 'Annuler', ja: 'キャンセル', ar: 'إلغاء', pl: 'Anuluj',
  },
  'common.save': {
    tags: ['common', 'button'],
    en: 'Save',
    de: 'Speichern', es: 'Guardar', fr: 'Enregistrer', ja: '保存', ar: 'حفظ', pl: 'Zapisz',
  },
  'common.delete': {
    tags: ['common', 'button'],
    en: 'Delete',
    de: 'Löschen', es: ['Eliminar', 'machine'], fr: 'Supprimer', ja: ['削除', 'machine'], ar: 'حذف', pl: 'Usuń',
  },
  'common.confirm': {
    tags: ['common', 'button'],
    en: 'Confirm',
    de: 'Bestätigen', es: 'Confirmar', fr: 'Confirmer', ja: '確認', ar: ['تأكيد', 'machine'], pl: 'Potwierdź',
  },
  'nav.dashboard': {
    tags: ['nav'],
    en: 'Dashboard',
    de: 'Übersicht', es: 'Panel', fr: 'Tableau de bord', ja: 'ダッシュボード', ar: 'لوحة التحكم', pl: 'Pulpit',
  },
  'nav.files': {
    tags: ['nav'],
    en: 'Files',
    de: 'Dateien', es: 'Archivos', fr: 'Fichiers', ja: 'ファイル', ar: 'الملفات', pl: 'Pliki',
  },
  'nav.settings': {
    tags: ['nav'],
    en: 'Settings',
    de: 'Einstellungen', es: 'Ajustes', fr: 'Paramètres', ja: '設定', ar: 'الإعدادات', pl: 'Ustawienia',
  },
  'files.count': {
    context: 'Count shown above the file list. {count} is the number of files in the current folder.',
    tags: ['files', 'plural'],
    en: '{count, plural, one {# file} other {# files}}',
    de: '{count, plural, one {# Datei} other {# Dateien}}',
    es: ['{count, plural, one {# archivo} other {# archivos}}', 'machine'],
    fr: '{count, plural, one {# fichier} other {# fichiers}}',
  },
  'files.upload': {
    tags: ['files', 'button'],
    en: 'Upload files',
    de: 'Dateien hochladen', es: 'Subir archivos', fr: 'Téléverser des fichiers',
    ja: ['ファイルをアップロード', 'machine'], ar: 'رفع الملفات', pl: ['Prześlij pliki', 'machine'],
  },
  'files.uploadProgress': {
    context: 'Progress label during upload. {count} of {total} files completed.',
    tags: ['files', 'placeholder'],
    en: 'Uploading {count} of {total}…',
    de: 'Lade {count} von {total} hoch…', fr: 'Téléversement de {count} sur {total}…',
    es: ['Subiendo {count} de {total}…', 'needs-review'],
  },
  'files.empty': {
    context: 'Empty state shown when a folder has no files.',
    tags: ['files'],
    en: 'No files yet — drag and drop to upload.',
    de: 'Noch keine Dateien – zum Hochladen hierher ziehen.',
    fr: 'Aucun fichier pour le moment – glissez-déposez pour téléverser.',
    es: ['Aún no hay archivos: arrastra y suelta para subir.', 'machine'],
  },
  'files.shareLink': {
    tags: ['files', 'button'],
    en: 'Copy share link',
    de: 'Freigabelink kopieren', es: 'Copiar enlace para compartir',
    fr: 'Copier le lien de partage', ar: ['نسخ رابط المشاركة', 'machine'],
  },
  'account.email.change.confirmed.description': {
    context: 'Body text shown on the email-change confirmation page after the user clicks the link.',
    tags: ['account', 'email'],
    en: 'Your email address has been updated successfully. You can now sign in with your new address.',
    de: ['Ihre E-Mail-Adresse wurde erfolgreich aktualisiert. Sie können sich jetzt mit Ihrer neuen Adresse anmelden.', 'machine'],
    fr: 'Votre adresse e-mail a été mise à jour avec succès. Vous pouvez maintenant vous connecter avec votre nouvelle adresse.',
  },
  'account.signOut': {
    tags: ['account', 'button'],
    en: 'Sign out',
    de: 'Abmelden', es: 'Cerrar sesión', fr: 'Se déconnecter', ja: 'サインアウト', ar: 'تسجيل الخروج', pl: 'Wyloguj się',
  },
  'billing.plan.pro': {
    tags: ['billing'],
    en: 'Pro plan',
    de: 'Pro-Tarif', es: 'Plan Pro', fr: 'Forfait Pro', pl: ['Plan Pro', 'machine'],
  },
  'billing.upgrade': {
    tags: ['billing', 'button'],
    en: 'Upgrade plan',
    de: ['Tarif upgraden', 'needs-review'], es: 'Mejorar plan', fr: 'Améliorer le forfait', ar: ['ترقية الخطة', 'machine'],
  },
  'billing.seatsUsed': {
    context: 'Seat usage on the billing page. {count} is seats consumed of the plan limit.',
    tags: ['billing', 'plural'],
    en: '{count, plural, one {# seat used} other {# seats used}}',
    de: '{count, plural, one {# Platz belegt} other {# Plätze belegt}}',
    fr: ['{count, plural, one {# siège utilisé} other {# sièges utilisés}}', 'machine'],
  },
  'editor.title': {
    tags: ['editor', 'nav'],
    en: 'Editor',
    de: 'Editor', es: 'Editor', fr: 'Éditeur', ja: 'エディター', ar: 'المحرر', pl: 'Edytor',
  },
  'notifications.unread': {
    context: 'Badge on the bell icon. {count} unread notifications.',
    tags: ['notifications', 'plural'],
    en: '{count, plural, one {# unread notification} other {# unread notifications}}',
    de: '{count, plural, one {# ungelesene Benachrichtigung} other {# ungelesene Benachrichtigungen}}',
    es: ['{count, plural, one {# notificación sin leer} other {# notificaciones sin leer}}', 'machine'],
  },
  'errors.network': {
    context: 'Generic error toast when a request fails.',
    tags: ['errors'],
    en: 'Something went wrong. Check your connection and try again.',
    de: 'Etwas ist schiefgelaufen. Überprüfe deine Verbindung und versuche es erneut.',
    fr: 'Une erreur s’est produite. Vérifiez votre connexion et réessayez.',
    es: ['Algo salió mal. Comprueba tu conexión e inténtalo de nuevo.', 'machine'],
  },
  'errors.notFound': {
    tags: ['errors'],
    en: 'We couldn’t find that page.',
    de: 'Diese Seite wurde nicht gefunden.', fr: 'Page introuvable.', es: 'No encontramos esa página.',
  },
  'settings.language': {
    context: 'Label for the interface language selector in settings.',
    tags: ['settings'],
    en: 'Interface language',
    de: 'Sprache der Oberfläche', fr: 'Langue de l’interface', es: ['Idioma de la interfaz', 'machine'], ja: ['インターフェースの言語', 'needs-review'],
  },
};


function buildValues(spec) {
  const values = {};
  for (const loc of LOCALES) {
    if (loc === SRC) {
      values[loc] = { state: 'source', value: spec.en };
      continue;
    }
    const raw = spec[loc];
    if (raw === undefined) continue;
    const [value, state] = Array.isArray(raw) ? raw : [raw, 'reviewed'];
    if (state === 'machine') {
      values[loc] = {
        source: 'ai',
        state: 'machine',
        value,
      };
    } else {
      values[loc] = { state, value };
    }
  }
  return values;
}

const keys = {};
for (const [key, spec] of Object.entries(KEYS)) {
  const entry = { values: buildValues(spec) };
  if (spec.context) entry.context = spec.context;
  if (spec.tags) entry.tags = spec.tags;
  if (spec.maxLength) entry.maxLength = spec.maxLength;
  keys[key] = entry;
}

const state = {
  $schema: 'https://glotfile.dev/schema/v1.json',
  config: {
    autoExport: true,
    format: { finalNewline: true, indent: 2, sortKeys: true },
    locales: LOCALES,
    outputs: [
      { adapter: 'i18next-json', path: 'src/locales/{locale}.json' },
      { adapter: 'flutter-arb', path: 'lib/l10n/app_{locale}.arb' },
    ],
    sourceLocale: SRC,
    spelling: { customWords: ['Glotfile'] },
  },
  glossary: [
    { caseSensitive: true, doNotTranslate: true, notes: 'Product name — never translate or inflect.', term: 'Acme Drive' },
    { doNotTranslate: true, notes: 'Plan tier, keep in English.', term: 'Pro' },
  ],
  keys,
  version: 1,
};

mkdirSync('/tmp/gf-demo', { recursive: true });
writeFileSync('/tmp/gf-demo/glotfile.json', JSON.stringify(state, null, 2) + '\n');
console.log('keys:', Object.keys(keys).length, 'locales:', LOCALES.length);
