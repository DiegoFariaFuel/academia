import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { COOKIE_CONSENT_KEY } from '../config/brand';
import { useAuthStore } from '../stores/auth.store';
import { useSubscription } from '../hooks/useSubscription';
import { createBillingPortalSession, createCheckoutSession } from '../lib/billing';
import { hasAnalyticsConsent, loadGoogleTags, revokeAnalytics } from '../lib/analytics';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { getPricingPlans } from '../data/pricing';
import type { AppLocale } from '../i18n';

const CONSENT_KEY = COOKIE_CONSENT_KEY;

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language === 'en' || i18n.language === 'es' ? i18n.language : 'pt') as AppLocale;
  const { user, updatePassword } = useAuthStore();
  const { plano, status, trialEnd, activeStudents, studentLimit, reload } = useSubscription();
  const [searchParams] = useSearchParams();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdErr, setPwdErr] = useState('');
  const [billingLoading, setBillingLoading] = useState(false);
  const [cookieConsent, setCookieConsent] = useState<'accepted' | 'rejected' | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored === 'accepted' || stored === 'rejected') setCookieConsent(stored);
  }, []);

  const cookieStatusLabel =
    cookieConsent === 'accepted'
      ? t('cookies.statusAccepted')
      : cookieConsent === 'rejected'
        ? t('cookies.statusRejected')
        : t('cookies.statusUnset');

  const updateCookieConsent = (value: 'accepted' | 'rejected') => {
    localStorage.setItem(CONSENT_KEY, value);
    setCookieConsent(value);
    if (value === 'accepted') loadGoogleTags();
    else revokeAnalytics();
  };

  const checkoutStatus = searchParams.get('checkout');
  const plans = getPricingPlans(locale);

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdErr('');
    setPwdMsg('');
    if (password !== confirm) {
      setPwdErr(t('settings.passwordMismatch'));
      return;
    }
    if (password.length < 6) return;
    try {
      await updatePassword(password);
      setPwdMsg(t('settings.passwordUpdated'));
      setPassword('');
      setConfirm('');
    } catch (err: unknown) {
      setPwdErr(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleSubscribe = async (interval: 'month' | 'year' = 'month') => {
    setBillingLoading(true);
    try {
      const url = await createCheckoutSession(plano, interval);
      window.location.href = url;
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : t('settings.checkoutError'));
    } finally {
      setBillingLoading(false);
    }
  };

  const handlePortal = async () => {
    setBillingLoading(true);
    try {
      const url = await createBillingPortalSession();
      window.location.href = url;
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : t('settings.portalError'));
    } finally {
      setBillingLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-white">{t('settings.title')}</h1>
        <p className="text-gray-400 mt-1">Gerencie sua conta, plano e preferências do sistema.</p>
      </div>

      {checkoutStatus === 'success' && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm font-medium flex justify-between items-center">
          <span>{t('settings.checkoutSuccess')}</span>
          <button type="button" onClick={() => reload()} className="underline hover:text-green-300">
            {t('settings.refresh')}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-2">
            <span className="material-symbols-outlined text-purple-400">person</span>
            <h2 className="text-lg font-semibold text-white">{t('settings.user')}</h2>
          </div>
          <p className="text-white font-medium">{user?.name}</p>
          <p className="text-gray-400 text-sm">{user?.email}</p>
          <div className="flex items-center gap-3 pt-4 border-t border-white/5">
            <span className="text-sm text-gray-400">{t('settings.language')}</span>
            <LanguageSwitcher />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-2">
            <span className="material-symbols-outlined text-purple-400">credit_card</span>
            <h2 className="text-lg font-semibold text-white">{t('settings.subscription')}</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">{t('settings.plan')}</p>
              <p className="text-white font-medium capitalize">{plano}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t('settings.status')}</p>
              <p className="text-white font-medium capitalize">{status}</p>
            </div>
          </div>
          
          {trialEnd && status === 'trial' && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <p className="text-xs text-yellow-500/70">{t('settings.trialEnds')}</p>
              <p className="text-sm font-semibold text-yellow-400">{trialEnd.toLocaleDateString()}</p>
            </div>
          )}
          
          <div className="pt-2">
            <p className="text-xs text-gray-500 mb-1">{t('settings.studentsUsed')}</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-white">{activeStudents}</span>
              <span className="text-gray-400 pb-1">/ {studentLimit !== null ? studentLimit : '∞'}</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 pt-4 border-t border-white/5">
            <button
              type="button"
              disabled={billingLoading}
              onClick={() => handleSubscribe('month')}
              className="btn-primary w-full py-2.5 text-sm disabled:opacity-50"
            >
              {t('settings.subscribe')}
            </button>
            <button
              type="button"
              disabled={billingLoading}
              onClick={handlePortal}
              className="glass-panel hover:bg-white/5 w-full py-2.5 rounded-xl text-white text-sm font-medium transition-all disabled:opacity-50"
            >
              {t('settings.manageBilling')}
            </button>
          </div>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-2">
          <span className="material-symbols-outlined text-purple-400">cookie</span>
          <h2 className="text-lg font-semibold text-white">{t('settings.cookiesTitle')}</h2>
        </div>
        <p className="text-sm text-gray-400">{t('settings.cookiesDesc')}</p>
        <p className="text-sm font-medium text-gray-300">
          Status: <span className="text-white">{cookieStatusLabel}</span>
          {hasAnalyticsConsent() ? <span className="text-green-400 ml-2">(Google Analytics Ativo)</span> : ''}
        </p>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => updateCookieConsent('accepted')}
            className="btn-primary px-4 py-2 text-sm"
          >
            {t('settings.cookiesAccept')}
          </button>
          <button
            type="button"
            onClick={() => updateCookieConsent('rejected')}
            className="glass-panel hover:bg-white/5 px-4 py-2 rounded-xl text-white text-sm font-medium transition-all"
          >
            {t('settings.cookiesReject')}
          </button>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-6">
          <span className="material-symbols-outlined text-purple-400">lock_reset</span>
          <h2 className="text-lg font-semibold text-white">{t('settings.password')}</h2>
        </div>
        
        {pwdMsg && <p className="text-green-400 text-sm mb-4 bg-green-500/10 p-3 rounded-lg border border-green-500/20">{pwdMsg}</p>}
        {pwdErr && <p className="text-red-400 text-sm mb-4 bg-red-500/10 p-3 rounded-lg border border-red-500/20">{pwdErr}</p>}
        
        <form onSubmit={handlePassword} className="space-y-4 max-w-md">
          <input
            type="password"
            placeholder={t('settings.newPassword')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
          />
          <input
            type="password"
            placeholder={t('settings.confirmPassword')}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
          />
          <button type="submit" className="glass-panel hover:bg-white/5 px-6 py-3 rounded-xl text-white font-medium transition-all">
            {t('common.save')}
          </button>
        </form>
      </div>
    </div>
  );
}
