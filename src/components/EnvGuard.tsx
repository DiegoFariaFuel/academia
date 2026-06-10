import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { APP_NAME } from '../config/brand';
import { getEnvConfigError } from '../lib/env';

interface EnvGuardProps {
  children: ReactNode;
}

export default function EnvGuard({ children }: EnvGuardProps) {
  const { t } = useTranslation();
  const configError = getEnvConfigError();

  if (configError) {
    const message =
      configError === 'secret_in_client'
        ? t('env.secretInClient')
        : configError === 'local_supabase'
          ? t('env.localSupabase')
          : configError === 'invalid_key'
            ? t('env.invalidKey')
            : configError === 'placeholder'
              ? t('env.placeholder')
              : t('env.missing');

    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-gray-900 border border-purple-500/40 rounded-xl p-8 shadow-xl">
          <p className="text-sm font-semibold text-purple-400 mb-1">{APP_NAME}</p>
          <h1 className="text-2xl font-bold text-white mb-3">{t('env.title')}</h1>
          <p className="text-gray-300 text-sm mb-4">{message}</p>
          <ol className="text-gray-400 text-sm space-y-2 mb-6 list-decimal list-inside">
            <li>{t('env.step1')}</li>
            <li>{t('env.step2')}</li>
            <li>{t('env.step3')}</li>
          </ol>
          <pre className="bg-gray-950 p-4 rounded-lg text-xs text-purple-300 overflow-x-auto border border-gray-800">
{`cp .env.example .env
# Edite .env com URL e anon key do Supabase → Settings → API`}
          </pre>
          <p className="text-gray-500 text-xs mt-4">{t('env.restart')}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
