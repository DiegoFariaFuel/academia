import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PublicLayout from '../../components/public/PublicLayout';
import AuthCard from '../../components/auth/AuthCard';
import { useAuthStore } from '../../stores/auth.store';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { forgotPassword } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <AuthCard title={t('auth.forgotTitle')} subtitle={t('auth.forgotSubtitle')}>
        {success ? (
          <div className="text-center space-y-4">
            <p className="text-green-300 text-sm">{t('auth.forgotSuccess')}</p>
            <Link to="/login" className="text-purple-400 hover:text-purple-300 text-sm font-medium">
              {t('auth.loginSubmit')}
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-300 mb-2">
                  {t('common.email')}
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg disabled:opacity-50"
              >
                {loading ? t('auth.loginLoading') : t('auth.forgotSubmit')}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-gray-400">
              <Link to="/login" className="text-purple-400 hover:text-purple-300">
                ← {t('auth.loginSubmit')}
              </Link>
            </p>
          </>
        )}
      </AuthCard>
    </PublicLayout>
  );
}
