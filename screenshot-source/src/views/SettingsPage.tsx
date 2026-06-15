import { useTranslation } from 'react-i18next';

export function SettingsPage() {
  const { t } = useTranslation();

  return (
    <main>
      <h1>{t('nav.settings')}</h1>
      <label>{t('settings.language')}</label>
      <button onClick={signOut}>{t('account.signOut')}</button>
      <button className="primary" onClick={save}>{t('common.save')}</button>
      <button onClick={confirm}>{t('common.confirm')}</button>
    </main>
  );
}
