import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '../hooks/useSubscription';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export default function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const { t } = useTranslation();
  const { loading, canUseApp, trialExpired } = useSubscription();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        {t('common.loading')}
      </div>
    );
  }

  if (!canUseApp && trialExpired) {
    return (
      <div className="max-w-lg mx-auto mt-12 p-8 bg-gray-800 border border-yellow-600 rounded-xl text-center">
        <p className="text-xl font-semibold text-white">{t('subscription.trialExpired')}</p>
        <p className="text-gray-400 mt-2 text-sm">{t('subscription.subscribeToContinue')}</p>
        <Link
          to="/settings"
          className="inline-block mt-6 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
        >
          {t('settings.subscribe')}
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
