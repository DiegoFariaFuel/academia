import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from './stores/auth.store';
import SubscriptionGuard from './components/SubscriptionGuard';
import { lazy, Suspense } from 'react';

const LandingPage = lazy(() => import('./pages/landing/LandingPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const PortalLoginPage = lazy(() => import('./pages/portal/PortalLoginPage'));
const PricingPage = lazy(() => import('./pages/public/PricingPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/legal/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('./pages/legal/TermsOfServicePage'));
const CookiePolicyPage = lazy(() => import('./pages/legal/CookiePolicyPage'));
const ContactPage = lazy(() => import('./pages/legal/ContactPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const StudentsPage = lazy(() => import('./pages/StudentsPage'));
const PackagesPage = lazy(() => import('./pages/PackagesPage'));
const ModalitiesPage = lazy(() => import('./pages/ModalitiesPage'));
const ClassesPage = lazy(() => import('./pages/ClassesPage'));
const AssessmentsPage = lazy(() => import('./pages/AssessmentsPage'));
const ExercisesPage = lazy(() => import('./pages/ExercisesPage'));
const WorkoutsPage = lazy(() => import('./pages/WorkoutsPage'));
const PosPage = lazy(() => import('./pages/PosPage'));
const FinancialPage = lazy(() => import('./pages/FinancialPage'));
const ContractsPage = lazy(() => import('./pages/ContractsPage'));
const CommissionsPage = lazy(() => import('./pages/CommissionsPage'));
const PaymentsPage = lazy(() => import('./pages/PaymentsPage'));
const AccessLogsPage = lazy(() => import('./pages/AccessLogsPage'));
const BiometricsPage = lazy(() => import('./pages/BiometricsPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const SetupPage = lazy(() => import('./pages/SetupPage'));
const IntegrationsPage = lazy(() => import('./pages/IntegrationsPage'));
const CrmPage = lazy(() => import('./pages/CrmPage'));
const TicketsPage = lazy(() => import('./pages/TicketsPage'));
const ReceptionLivePage = lazy(() => import('./pages/ReceptionLivePage'));
const StudentPortalPage = lazy(() => import('./pages/portal/StudentPortalPage'));
import Layout from './components/Layout';
import PortalLayout from './components/portal/PortalLayout';

function LoadingScreen() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">
      {t('common.loading')}
    </div>
  );
}

function StaffProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isStaff, isAluno, loading } = useAuthStore();

  if (loading) return <LoadingScreen />;
  if (!isStaff) {
    if (isAluno) return <Navigate to="/portal" replace />;
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <SubscriptionGuard>{children}</SubscriptionGuard>
    </Layout>
  );
}

function PortalProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAluno, isStaff, loading } = useAuthStore();

  if (loading) return <LoadingScreen />;
  if (!isAluno) {
    if (isStaff) return <Navigate to="/dashboard" replace />;
    return <Navigate to="/portal/login" replace />;
  }

  return <PortalLayout>{children}</PortalLayout>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isStaff, isAluno, loading } = useAuthStore();

  if (loading) return <LoadingScreen />;
  if (isAuthenticated && isStaff) return <Navigate to="/dashboard" replace />;
  if (isAuthenticated && isAluno) return <Navigate to="/portal" replace />;

  return <>{children}</>;
}

export default function App() {
  const { init } = useAuthStore();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    init().then((fn) => {
      unsubscribe = fn;
    });
    return () => unsubscribe?.();
  }, [init]);

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/" element={<PublicOnlyRoute><LandingPage /></PublicOnlyRoute>} />
        <Route path="/precos" element={<PricingPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/privacidade" element={<PrivacyPolicyPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/termos" element={<TermsOfServicePage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/cookies" element={<CookiePolicyPage />} />
        <Route path="/contato" element={<ContactPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route path="/cadastro" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
        <Route path="/esqueci-senha" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />
        <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
        <Route path="/portal/login" element={<PublicOnlyRoute><PortalLoginPage /></PublicOnlyRoute>} />
        <Route path="/portal" element={<PortalProtectedRoute><StudentPortalPage /></PortalProtectedRoute>} />
        <Route path="/dashboard" element={<StaffProtectedRoute><DashboardPage /></StaffProtectedRoute>} />
        <Route path="/students" element={<StaffProtectedRoute><StudentsPage /></StaffProtectedRoute>} />
        <Route path="/packages" element={<StaffProtectedRoute><PackagesPage /></StaffProtectedRoute>} />
        <Route path="/modalidades" element={<StaffProtectedRoute><ModalitiesPage /></StaffProtectedRoute>} />
        <Route path="/turmas" element={<StaffProtectedRoute><ClassesPage /></StaffProtectedRoute>} />
        <Route path="/assessments" element={<StaffProtectedRoute><AssessmentsPage /></StaffProtectedRoute>} />
        <Route path="/exercises" element={<StaffProtectedRoute><ExercisesPage /></StaffProtectedRoute>} />
        <Route path="/workouts" element={<StaffProtectedRoute><WorkoutsPage /></StaffProtectedRoute>} />
        <Route path="/pos" element={<StaffProtectedRoute><PosPage /></StaffProtectedRoute>} />
        <Route path="/financial" element={<StaffProtectedRoute><FinancialPage /></StaffProtectedRoute>} />
        <Route path="/contracts" element={<StaffProtectedRoute><ContractsPage /></StaffProtectedRoute>} />
        <Route path="/commissions" element={<StaffProtectedRoute><CommissionsPage /></StaffProtectedRoute>} />
        <Route path="/payments" element={<StaffProtectedRoute><PaymentsPage /></StaffProtectedRoute>} />
        <Route path="/access-logs" element={<StaffProtectedRoute><AccessLogsPage /></StaffProtectedRoute>} />
        <Route path="/biometrics" element={<StaffProtectedRoute><BiometricsPage /></StaffProtectedRoute>} />
        <Route path="/messages" element={<StaffProtectedRoute><MessagesPage /></StaffProtectedRoute>} />
        <Route path="/crm" element={<StaffProtectedRoute><CrmPage /></StaffProtectedRoute>} />
        <Route path="/tickets" element={<StaffProtectedRoute><TicketsPage /></StaffProtectedRoute>} />
        <Route path="/live" element={<StaffProtectedRoute><ReceptionLivePage /></StaffProtectedRoute>} />
        <Route path="/settings" element={<StaffProtectedRoute><SettingsPage /></StaffProtectedRoute>} />
        <Route path="/integrations" element={<StaffProtectedRoute><IntegrationsPage /></StaffProtectedRoute>} />
        <Route path="/setup" element={<StaffProtectedRoute><SetupPage /></StaffProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
