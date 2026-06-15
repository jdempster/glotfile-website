import { useTranslation } from 'react-i18next';

export function BillingPage({ seats, limit }: { seats: number; limit: number }) {
  const { t } = useTranslation();

  return (
    <main>
      <h1>{t('billing.plan.pro')}</h1>
      <p>{t('billing.seatsUsed', { count: seats })}</p>
      <button className="primary">{t('billing.upgrade')}</button>
      <button onClick={save}>{t('common.save')}</button>
      <button onClick={cancel}>{t('common.cancel')}</button>
    </main>
  );
}
