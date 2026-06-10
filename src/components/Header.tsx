import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/auth.store';

interface HeaderProps {
  onMenuClick: () => void;
  onLogout: () => void;
}

export default function Header({ onMenuClick, onLogout }: HeaderProps) {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  return (
    <header className="glass-panel border-b-0 md:border-b border-white/5 px-6 min-h-[80px] flex items-center justify-between sticky top-0 z-10">
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 hover:bg-gray-700 rounded-lg transition"
        title={t('header.menu')}
        type="button"
      >
        <span className="material-symbols-outlined text-[20px]">menu</span>
      </button>

      <div className="flex-1" />

      <div className="flex items-center space-x-4">
        <div className="text-right">
          <p className="text-sm font-semibold text-white">{user?.name}</p>
          <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
        </div>
        <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white">
          <span className="material-symbols-outlined">person</span>
        </div>
        <button
          onClick={onLogout}
          type="button"
          className="ml-4 px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
        >
          {t('header.logout')}
        </button>
      </div>
    </header>
  );
}
