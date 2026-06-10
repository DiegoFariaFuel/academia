import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import PublicHeader from './PublicHeader';
import PublicFooter from './PublicFooter';
import LegalPageNav from '../legal/LegalPageNav';

interface PublicLayoutProps {
  children: ReactNode;
}

const LEGAL_PATHS = ['/privacidade', '/termos', '/cookies', '/contato', '/privacy', '/terms'];

export default function PublicLayout({ children }: PublicLayoutProps) {
  const { pathname } = useLocation();
  const showLegalNav = LEGAL_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-gray-100">
      <PublicHeader />
      {showLegalNav && <LegalPageNav />}
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
