import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PublicLayout from '../../components/public/PublicLayout';
import AuthCard from '../../components/auth/AuthCard';
import { useAuthStore } from '../../stores/auth.store';
import { formatAuthError } from '../../lib/authErrors';

export default function LoginPage() {
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
      navigate(role === 'aluno' ? '/portal' : '/dashboard');
    } catch (err: unknown) {
      setError(formatAuthError(err, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <AuthCard title={t('auth.loginTitle')} subtitle={t('auth.loginSubtitle')}>
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-gray-300 mb-2">
              {t('common.email')}
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="login-password" className="block text-sm font-medium text-gray-300">
                {t('common.password')}
              </label>
              <Link to="/esqueci-senha" className="text-xs text-purple-400 hover:text-purple-300">
                {t('auth.forgot')}
              </Link>
            </div>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg disabled:opacity-50"
          >
            {loading ? t('auth.loginLoading') : t('auth.loginSubmit')}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-400">
          {t('auth.noAccount')}{' '}
          <Link to="/cadastro" className="text-purple-400 hover:text-purple-300 font-medium">
            {t('auth.signupLink')}
          </Link>
        </p>
        <p className="mt-4 text-center text-xs text-gray-500">
          <Link to="/portal/login" className="text-purple-400 hover:underline">
            {t('nav.portal')}
          </Link>
        </p>
      </AuthCard>
    </PublicLayout>
  );
}
