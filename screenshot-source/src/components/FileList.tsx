import { useTranslation } from 'react-i18next';

export function FileList({ files }: { files: File[] }) {
  const { t } = useTranslation();

  if (files.length === 0) {
    return <p className="empty">{t('files.empty')}</p>;
  }

  return (
    <section aria-label={t('nav.files')}>
      <header className="file-list__head">
        <span className="count">{t('files.count', { count: files.length })}</span>
        <button onClick={uploadFiles}>{t('files.upload')}</button>
      </header>
      <ul>
        {files.map((file) => (
          <li key={file.name}>
            <span>{file.name}</span>
            <button>{t('files.shareLink')}</button>
            <button className="danger">{t('common.delete')}</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
