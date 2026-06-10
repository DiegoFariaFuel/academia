import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import type { DashboardStats, Inadimplente } from '../types/database';

export default function DashboardPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [inadimplentes, setInadimplentes] = useState<Inadimplente[]>([]);
  const [receitaMes, setReceitaMes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const [dashRes, inadRes, pagRes] = await Promise.all([
          supabase.from('vw_dashboard').select('*').single(),
          supabase.from('vw_inadimplentes').select('*').limit(5),
          supabase
            .from('pagamentos')
            .select('valor')
            .eq('status', 'pago')
            .gte('data_pagamento', startOfMonth.toISOString()),
        ]);

        if (dashRes.data) setStats(dashRes.data as DashboardStats);
        if (inadRes.data) setInadimplentes(inadRes.data as Inadimplente[]);

        const pagamentos = (pagRes.data ?? []) as { valor: number }[];
        setReceitaMes(pagamentos.reduce((s, p) => s + Number(p.valor), 0));
      } catch (e) {
        console.warn('Falha ao carregar dados do dashboard (Backend Offline). Usando dados zerados.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const cards = [
    { label: t('dashboard.totalStudents'), value: stats?.total_alunos ?? 0, icon: 'group', color: 'text-blue-400' },
    { label: t('dashboard.activeStudents'), value: stats?.alunos_ativos ?? 0, icon: 'check_circle', color: 'text-green-400' },
    { label: t('dashboard.suspended'), value: stats?.alunos_suspensos ?? 0, icon: 'pause_circle', color: 'text-yellow-400' },
    { label: t('dashboard.blockedAccess'), value: stats?.acesso_bloqueado ?? 0, icon: 'block', color: 'text-red-400' },
    { label: t('dashboard.checkins24h'), value: stats?.checkins_hoje ?? 0, icon: 'meeting_room', color: 'text-pink-400' },
    {
      label: t('dashboard.monthRevenue'),
      value: `R$ ${receitaMes.toFixed(2)}`,
      icon: 'payments',
      color: 'text-purple-400',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">{t('dashboard.title')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div
            key={card.label}
            className="glass-card rounded-2xl p-6 text-white group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl bg-white/5 ${card.color} group-hover:scale-110 transition-transform duration-300`}>
                <span className="material-symbols-outlined">{card.icon}</span>
              </div>
            </div>
            <p className="text-4xl font-bold mb-1 tracking-tight">{loading ? '...' : card.value}</p>
            <p className="text-sm text-gray-400 font-medium">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-red-400">warning</span>
              {t('dashboard.overdue')}
            </h2>
            <Link to="/students" className="text-sm text-purple-400 hover:text-purple-300">
              {t('dashboard.viewStudents')}
            </Link>
          </div>
          {inadimplentes.length === 0 ? (
            <p className="text-gray-400 text-sm">{t('dashboard.noOverdue')}</p>
          ) : (
            <ul className="space-y-2">
              {inadimplentes.map((a) => (
                <li key={a.id} className="flex justify-between items-center text-sm p-3 rounded-lg hover:bg-white/5 transition border border-transparent hover:border-white/5">
                  <span className="text-gray-300 font-medium">{a.nome}</span>
                  <span className="px-2 py-1 rounded bg-red-500/10 text-red-400 text-xs border border-red-500/20">{a.plano}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-green-400">login</span>
              {t('dashboard.access')}
            </h2>
            <Link to="/access-logs" className="text-sm text-purple-400 hover:text-purple-300">
              {t('dashboard.viewCheckins')}
            </Link>
          </div>
          <p className="text-gray-400 text-sm">{t('dashboard.accessHint')}</p>
        </div>
      </div>
    </div>
  );
}
