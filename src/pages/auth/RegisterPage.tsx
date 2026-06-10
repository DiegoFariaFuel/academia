import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PublicLayout from '../../components/public/PublicLayout';
import AuthCard from '../../components/auth/AuthCard';
import { useAuthStore } from '../../stores/auth.store';
import { formatAuthError } from '../../lib/authErrors';
import { getPricingPlans, formatMoney } from '../../data/pricing';
import type { AppLocale } from '../../i18n';

export default function RegisterPage() {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language === 'en' || i18n.language === 'es' ? i18n.language : 'pt') as AppLocale;
  const pricingPlans = getPricingPlans(locale);
  const [searchParams] = useSearchParams();
  const planoInicial = searchParams.get('plano') ?? 'profissional';

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [plano, setPlano] = useState(planoInicial);
  const [aceiteTermos, setAceiteTermos] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { signUp } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }
    if (password.length < 6) {
      setError(t('auth.passwordMin'));
      return;
    }
    if (!aceiteTermos) {
      setError(t('auth.termsRequired'));
      return;
    }

    setLoading(true);
    try {
      const result = await signUp({ email, password, nome, plano });
      if (result.needsEmailConfirmation) {
        setSuccess(t('auth.confirmEmailSent'));
      } else {
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      setError(formatAuthError(err, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
    <AuthCard title={t('auth.registerTitle')} subtitle={t('auth.registerSubtitle')}>
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500/20 border border-green-500 text-green-200 px-4 py-3 rounded-lg mb-4 text-sm">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="reg-nome" className="block text-sm font-medium text-gray-300 mb-2">
            {t('auth.gymNameLabel')}
          </label>
          <input
            id="reg-nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
          />
        </div>

        <div>
          <label htmlFor="reg-email" className="block text-sm font-medium text-gray-300 mb-2">
            {t('common.email')}
          </label>
          <input
            id="reg-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
          />
        </div>

        <div>
          <label htmlFor="reg-plano" className="block text-sm font-medium text-gray-300 mb-2">
            {t('auth.planLabel')}
          </label>
          <select
            id="reg-plano"
            value={plano}
            onChange={(e) => setPlano(e.target.value)}
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
          >
            {pricingPlans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {formatMoney(p.priceMonthly, locale)}
                {t('pricing.perMonth')}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="reg-password" className="block text-sm font-medium text-gray-300 mb-2">
            {t('common.password')}
          </label>
          <input
            id="reg-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
          />
        </div>

        <div>
          <label htmlFor="reg-confirm" className="block text-sm font-medium text-gray-300 mb-2">
            {t('auth.confirmPasswordLabel')}
          </label>
          <input
            id="reg-confirm"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
          />
        </div>

        <label className="flex items-start gap-2 text-sm text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={aceiteTermos}
            onChange={(e) => setAceiteTermos(e.target.checked)}
            className="mt-1 rounded"
          />
          <span>
            {t('auth.termsPrefix')}{' '}
            <Link to="/termos" className="text-purple-400 hover:underline">
              {t('footer.terms')}
            </Link>{' '}
            {t('auth.termsAnd')}{' '}
            <Link to="/privacidade" className="text-purple-400 hover:underline">
              {t('footer.privacy')}
            </Link>
            .
          </span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg disabled:opacity-50"
        >
          {loading ? t('auth.registerLoading') : t('auth.registerSubmit')}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-400">
        {t('auth.hasAccount')}{' '}
        <Link to="/login" className="text-purple-400 hover:text-purple-300 font-medium">
          {t('auth.loginSubmit')}
        </Link>
      </p>
    </AuthCard>
    </PublicLayout>
  );
}
