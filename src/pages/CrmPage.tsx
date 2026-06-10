import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/auth.store';
import type { AlunoSegmentacao, Aluno } from '../types/database';

export default function CrmPage() {
  const academiaId = useAuthStore((s) => s.user?.academiaId || null);
  const [segmentacoes, setSegmentacoes] = useState<(AlunoSegmentacao & { alunos: Aluno })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarSegmentacao();
  }, []);

  const carregarSegmentacao = async () => {
    setLoading(true);
    // Ideally this table is populated by cron/triggers.
    // For this demo, we just fetch it.
    const { data } = await supabase
      .from('aluno_segmentacao')
      .select('*, alunos(*)')
      .order('ltv_estimado', { ascending: false });
    
    setSegmentacoes(data as any || []);
    setLoading(false);
  };

  const vips = segmentacoes.filter(s => s.is_vip);
  const churnRisk = segmentacoes.filter(s => s.is_risco_churn);

  const calcularScoreChurn = (s: AlunoSegmentacao) => {
    // Simulador de Motor de Inteligência Artificial para Churn
    let score = 50;
    if (s.is_inadimplente) score += 35;
    if (s.ultima_interacao) {
      const diasAusente = (new Date().getTime() - new Date(s.ultima_interacao).getTime()) / (1000 * 3600 * 24);
      if (diasAusente > 15) score += 25;
      if (diasAusente > 30) score += 15;
    }
    return Math.min(score, 99); // max 99%
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-white">CRM & Retenção</h1>
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">auto_awesome</span> Powered by AI
            </span>
          </div>
          <p className="text-gray-400">Análise Preditiva de LTV e Risco de Cancelamento</p>
        </div>
        <button className="btn-primary" onClick={carregarSegmentacao}>Atualizar Dados</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Painel VIP */}
        <div className="glass-panel p-6 rounded-2xl border-t-4 border-yellow-500">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-yellow-500">star</span>
            <h2 className="text-xl font-bold text-white">Alunos VIP</h2>
          </div>
          <p className="text-sm text-gray-400 mb-4">Top clientes pelo Lifetime Value (LTV).</p>
          
          <ul className="space-y-2">
            {vips.length === 0 && <li className="text-gray-500 text-sm">Nenhum aluno classificado como VIP.</li>}
            {vips.map(s => (
              <li key={s.id} className="flex justify-between items-center p-3 rounded-lg hover:bg-white/5 transition">
                <div>
                  <p className="text-white font-bold">{s.alunos?.nome}</p>
                  <p className="text-xs text-gray-400">Última interação: {new Date(s.ultima_interacao || s.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="text-right">
                  <span className="text-yellow-400 font-bold">LTV: R$ {s.ltv_estimado.toFixed(2)}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Painel Churn */}
        <div className="glass-panel p-6 rounded-2xl border-t-4 border-red-500">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-red-500">warning</span>
            <h2 className="text-xl font-bold text-white">Risco de Churn</h2>
          </div>
          <p className="text-sm text-gray-400 mb-4">Alunos com ausência prolongada ou faturas pendentes.</p>
          
          <ul className="space-y-2">
            {churnRisk.length === 0 && <li className="text-gray-500 text-sm">Nenhum aluno em risco crítico. O algoritmo não detectou anomalias.</li>}
            {churnRisk.map(s => {
              const score = calcularScoreChurn(s);
              return (
                <li key={s.id} className="flex justify-between items-center p-3 rounded-lg hover:bg-white/5 transition border border-red-500/10 bg-red-500/5 mb-2">
                  <div>
                    <p className="text-white font-bold">{s.alunos?.nome}</p>
                    <p className="text-xs text-red-400 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">psychology</span>
                      Motivo IA: {s.is_inadimplente ? 'Inadimplência + Ausência' : 'Queda brusca de frequência'}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Score Churn</p>
                      <p className={`font-bold text-lg ${score > 80 ? 'text-red-500' : 'text-orange-400'}`}>{score}%</p>
                    </div>
                    <button className="text-xs bg-green-500 hover:bg-green-400 text-white px-3 py-2 rounded-lg font-bold shadow-lg shadow-green-500/20 transition-all flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">chat</span> Ação de Resgate
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

    </div>
  );
}
