import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface SidebarProps {
  isOpen: boolean;
}

export default function Sidebar({ isOpen }: SidebarProps) {
  const { t } = useTranslation();
  const location = useLocation();

  const menuItems = [
    { path: '/live', labelKey: 'Central de Comando', icon: <span className="material-symbols-outlined text-[20px] text-green-400">emergency</span> },
    { path: '/dashboard', labelKey: 'sidebar.dashboard', icon: <span className="material-symbols-outlined text-[20px]">dashboard</span> },
    { path: '/students', labelKey: 'sidebar.students', icon: <span className="material-symbols-outlined text-[20px]">group</span> },
    { path: '/packages', labelKey: 'sidebar.packages', icon: <span className="material-symbols-outlined text-[20px]">inventory_2</span> },
    { path: '/modalidades', labelKey: 'Modalidades', icon: <span className="material-symbols-outlined text-[20px]">sports_gymnastics</span> },
    { path: '/turmas', labelKey: 'Turmas & Agenda', icon: <span className="material-symbols-outlined text-[20px]">event_available</span> },
    { path: '/assessments', labelKey: 'Saúde & Evolução', icon: <span className="material-symbols-outlined text-[20px]">monitor_weight</span> },
    { path: '/exercises', labelKey: 'Biblioteca de Exercícios', icon: <span className="material-symbols-outlined text-[20px]">fitness_center</span> },
    { path: '/workouts', labelKey: 'Treinos e Fichas', icon: <span className="material-symbols-outlined text-[20px]">assignment</span> },
    { path: '/pos', labelKey: 'Estoque & PDV', icon: <span className="material-symbols-outlined text-[20px]">storefront</span> },
    { path: '/financial', labelKey: 'Caixa & Despesas', icon: <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span> },
    { path: '/contracts', labelKey: 'Contratos & LGPD', icon: <span className="material-symbols-outlined text-[20px]">contract</span> },
    { path: '/commissions', labelKey: 'Comissões', icon: <span className="material-symbols-outlined text-[20px]">payments</span> },
    { path: '/payments', labelKey: 'sidebar.payments', icon: <span className="material-symbols-outlined text-[20px]">credit_card</span> },
    { path: '/access-logs', labelKey: 'sidebar.access', icon: <span className="material-symbols-outlined text-[20px]">meeting_room</span> },
    { path: '/biometrics', labelKey: 'sidebar.biometrics', icon: <span className="material-symbols-outlined text-[20px]">fingerprint</span> },
    { path: '/messages', labelKey: 'sidebar.messages', icon: <span className="material-symbols-outlined text-[20px]">mail</span> },
    { path: '/tickets', labelKey: 'Atendimento (Tickets)', icon: <span className="material-symbols-outlined text-[20px]">support_agent</span> },
  ];

  const adminMenu = [
    { path: '/crm', labelKey: 'CRM & Retenção', icon: <span className="material-symbols-outlined text-[20px]">insights</span> },
    { path: '/integrations', labelKey: 'Integrações/APIs', icon: <span className="material-symbols-outlined text-[20px]">webhook</span> },
    { path: '/settings', labelKey: 'sidebar.settings', icon: <span className="material-symbols-outlined text-[20px]">settings</span> },
  ];

  const allMenuItems = [...menuItems, ...adminMenu];

  return (
    <div
      className={`${
        isOpen ? 'w-64' : 'w-20'
      } glass-panel border-r border-white/5 transition-all duration-300 hidden md:flex flex-col z-20 relative`}
    >
      <div className="p-6 border-b border-white/5 flex items-center justify-center min-h-[80px]">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
          {isOpen ? t('common.brand') : <span className="material-symbols-outlined text-purple-400 align-middle">fitness_center</span>}
        </h1>
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {allMenuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`block px-4 py-3 rounded-xl transition-all duration-200 group ${
              location.pathname === item.path
                ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-white border border-purple-500/30 shadow-lg shadow-purple-500/10'
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
            title={t(item.labelKey)}
          >
            <span className="text-sm font-medium flex items-center gap-3">
              <span className={`material-symbols-outlined text-[20px] transition-colors ${location.pathname === item.path ? 'text-purple-400' : 'group-hover:text-purple-400'}`}>
                {item.icon.props.children}
              </span>
              {isOpen && <span>{item.labelKey.includes('.') ? t(item.labelKey) : item.labelKey}</span>}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
