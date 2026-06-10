import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { migrateLegacyStorage } from './config/brand';
import './i18n';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import EnvGuard from './components/EnvGuard';
import CookieConsent from './components/CookieConsent';
import './index.css';

migrateLegacyStorage();

const rootEl = document.getElementById('root');
if (!rootEl) {
  document.body.innerHTML =
    '<div style="padding:2rem;font-family:sans-serif;color:#111">Elemento #root não encontrado.</div>';
} else {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <ErrorBoundary>
        <EnvGuard>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <App />
            <CookieConsent />
          </BrowserRouter>
        </EnvGuard>
      </ErrorBoundary>
    </React.StrictMode>,
  );
}
