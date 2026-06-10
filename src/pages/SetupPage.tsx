import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { runHealthChecks, getEdgeFunctionUrls, type HealthCheck } from '../lib/health';
import { env } from '../lib/env';

export default function SetupPage() {
  const { t } = useTranslation();
  const [checks, setChecks] = useState<HealthCheck[]>([]);
  const [loading, setLoading] = useState(true);

  const urls = getEdgeFunctionUrls(env.supabaseUrl);

  const verificar = async () => {
    setLoading(true);
    setChecks(await runHealthChecks());
    setLoading(false);
  };

  useEffect(() => {
    verificar();
  }, []);

  const allOk = checks.length > 0 && checks.every((c) => c.ok);

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">{t('setup.title')}</h1>
          <p className="text-gray-400 mt-1">Verificação de integridade do sistema e Edge Functions.</p>
        </div>
        <button
          type="button"
          onClick={verificar}
          disabled={loading}
          className="btn-primary px-4 py-2 text-sm flex items-center gap-2 disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[18px]">sync</span>
          {loading ? t('setup.checking') : t('setup.recheck')}
        </button>
      </div>

      <div
        className={`rounded-2xl p-6 border transition-all ${
          allOk ? 'bg-green-500/10 border-green-500/20' : 'bg-yellow-500/10 border-yellow-500/20'
        }`}
      >
        <p className="text-white font-semibold flex items-center gap-3 text-lg">
          {allOk ? (
            <><span className="material-symbols-outlined text-green-400 text-3xl">check_circle</span>{t('setup.ready')}</>
          ) : (
            <><span className="material-symbols-outlined text-yellow-400 text-3xl">warning</span>{t('setup.needsWork')}</>
          )}
        </p>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/5 border border-white/10">
        <div className="bg-black/20 px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Status dos Serviços</h2>
        </div>
        {checks.map((c) => (
          <div key={c.id} className="px-6 py-5 flex items-start gap-4 hover:bg-white/5 transition-colors">
            <span className={`material-symbols-outlined text-2xl ${c.ok ? 'text-green-400' : 'text-red-400'}`}>
              {c.ok ? 'check_circle' : 'cancel'}
            </span>
            <div>
              <p className="text-white font-medium text-base">{c.label}</p>
              <p className="text-gray-400 text-sm mt-1">{c.detail}</p>
            </div>
          </div>
        ))}
        {loading && checks.length === 0 && (
          <div className="px-6 py-12 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 font-medium">{t('setup.running')}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-2">
            <span className="material-symbols-outlined text-purple-400">link</span>
            <h2 className="text-lg font-semibold text-white">{t('setup.edgeUrls')}</h2>
          </div>
          <div className="space-y-4 text-sm">
            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
              <p className="text-gray-400 font-medium mb-1">{t('setup.stripeWebhook')}</p>
              <code className="text-purple-300 break-all select-all">{urls.stripeWebhook}</code>
            </div>
            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
              <p className="text-gray-400 font-medium mb-1">{t('setup.checkinApi')}</p>
              <code className="text-purple-300 break-all select-all">{urls.registrarCheckin}</code>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-2">
            <span className="material-symbols-outlined text-purple-400">database</span>
            <h2 className="text-lg font-semibold text-white">{t('setup.sqlTitle')}</h2>
          </div>
          <p className="text-gray-400 text-sm mb-4 leading-relaxed">{t('setup.sqlHint')}</p>
          <div className="relative group">
            <pre className="bg-black/40 p-4 rounded-xl text-xs text-purple-300 overflow-x-auto border border-white/5">
{`INSERT INTO staff (id, nome, email)
VALUES ('UUID_DO_AUTH', 'Admin', 'admin@email.com');`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
