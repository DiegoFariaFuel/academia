import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PublicLayout from '../../components/public/PublicLayout';
import AuthCard from '../../components/auth/AuthCard';
import { useAuthStore } from '../../stores/auth.store';

export default function PortalLoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const role = await login(email, password);
      if (role === 'aluno') navigate('/portal');
      else navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <AuthCard title={t('auth.portalLoginTitle')} subtitle={t('auth.portalLoginSubtitle')}>
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="portal-email" className="block text-sm font-medium text-gray-300 mb-2">
              {t('common.email')}
            </label>
            <input
              id="portal-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <div>
            <label htmlFor="portal-password" className="block text-sm font-medium text-gray-300 mb-2">
              {t('common.password')}
            </label>
            <input
              id="portal-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 mt-2 disabled:opacity-50"
          >
            {loading ? t('auth.loginLoading') : t('auth.loginSubmit')}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-400">
          <Link to="/login" className="text-purple-400 hover:text-purple-300">
            {t('nav.login')} (staff)
          </Link>
        </p>
      </AuthCard>
    </PublicLayout>
  );
}
