import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/auth.store';
import type { Aluno, Plano, AlunoTreino, Treino } from '../types/database';

type LiveEvent = {
  id: string;
  timestamp: Date;
  aluno: Aluno;
  planoNome: string;
  statusFinanceiro: 'OK' | 'ATRASADO';
  treinoAtivo: string;
};

export default function ReceptionLivePage() {
  const academiaId = useAuthStore((s) => s.user?.academiaId || null);
  
  const [loading, setLoading] = useState(true);
  const [alunosCompletos, setAlunosCompletos] = useState<LiveEvent[]>([]);
  const [liveFeed, setLiveFeed] = useState<LiveEvent[]>([]);
  const [alunoDestaque, setAlunoDestaque] = useState<LiveEvent | null>(null);
  
  const simuladorRef = useRef<number | null>(null);

  useEffect(() => {
    carregarDadosMockados();
    return () => pararSimulador();
  }, []);

  const carregarDadosMockados = async () => {
    setLoading(true);
    
    // Busca alunos com planos e treinos ativos para montar a base do simulador
    const { data: alunos } = await supabase
      .from('alunos')
      .select(`
        *,
        aluno_planos(status, planos(nome)),
        aluno_treinos(treinos(nome)),
        faturas(status)
      `)
      .eq('status', 'ativo')
      .limit(20);

    if (alunos) {
      const baseAlunos: LiveEvent[] = alunos.map((a: any) => {
        // Mock do status financeiro baseado na tabela faturas (se tiver atrasada)
        const hasAtrasada = a.faturas?.some((f: any) => f.status === 'atrasado');
        const finStatus = hasAtrasada ? 'ATRASADO' : 'OK';
        
        // Acha plano ativo
        const plano = a.aluno_planos?.find((p: any) => p.status === 'ativo')?.planos?.nome || 'Avulso / Sem Plano Ativo';
        
        // Acha treino ativo
        const treino = a.aluno_treinos?.[0]?.treinos?.nome || 'Ficha de Treino não prescrita';

        return {
          id: '',
          timestamp: new Date(),
          aluno: a,
          planoNome: plano,
          statusFinanceiro: finStatus,
          treinoAtivo: treino
        };
      });

      setAlunosCompletos(baseAlunos);
    }
    
    setLoading(false);
  };

  const iniciarSimulador = () => {
    if (alunosCompletos.length === 0) return;
    
    pararSimulador();
    
    // Dispara um evento a cada 4 a 8 segundos
    simuladorRef.current = window.setInterval(() => {
      const randomAluno = alunosCompletos[Math.floor(Math.random() * alunosCompletos.length)];
      const novoEvento = {
        ...randomAluno,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date()
      };
      
      setAlunoDestaque(novoEvento);
      setLiveFeed(prev => [novoEvento, ...prev].slice(0, 10)); // Mantém só os últimos 10 na sidebar
      
    }, 6000); // 6 segundos
  };

  const pararSimulador = () => {
    if (simuladorRef.current) window.clearInterval(simuladorRef.current);
  };

  if (loading) {
    return <div className="text-white text-center mt-20">Carregando Sala de Comando...</div>;
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      {/* Header Central de Comando */}
      <div className="flex justify-between items-center bg-gray-900/50 p-4 rounded-2xl border border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-500/20 text-red-500 rounded-xl flex items-center justify-center animate-pulse">
            <span className="material-symbols-outlined text-3xl">emergency</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white uppercase tracking-wider">Live Control Center</h1>
            <p className="text-gray-400 text-sm">Monitoramento 360° da Recepção em Tempo Real</p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <button onClick={iniciarSimulador} className="bg-green-500/20 text-green-400 font-bold px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-green-500/30">
            <span className="material-symbols-outlined">play_circle</span> Iniciar Simulador Catraca
          </button>
          <button onClick={pararSimulador} className="bg-red-500/20 text-red-400 font-bold px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-red-500/30">
            <span className="material-symbols-outlined">stop_circle</span> Parar
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 flex gap-4 min-h-0">
        
        {/* Lado Esquerdo: Raio X do Aluno Atual (Destaque) */}
        <div className="w-2/3 glass-panel rounded-2xl p-6 flex flex-col relative overflow-hidden">
          {!alunoDestaque ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
              <span className="material-symbols-outlined text-6xl mb-4 opacity-50">sensor_door</span>
              <p className="text-xl font-bold">Aguardando acesso na catraca...</p>
              <p className="text-sm">Clique em "Iniciar Simulador" acima.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col animate-fade-in-up">
              
              {/* Overlay de Câmera Fictícia */}
              <div className="absolute top-4 right-4 bg-black/60 rounded-lg p-2 border border-white/10 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-white font-mono uppercase tracking-widest">CAM-01 TURNSTILE LIVE</span>
              </div>

              {/* Status Banner Gigante */}
              <div className={`w-full py-4 text-center rounded-2xl mb-8 border-2 ${alunoDestaque.statusFinanceiro === 'OK' ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-red-500/20 border-red-500/50 text-red-400'}`}>
                <h2 className="text-4xl font-black uppercase tracking-widest flex items-center justify-center gap-3">
                  <span className="material-symbols-outlined text-5xl">
                    {alunoDestaque.statusFinanceiro === 'OK' ? 'check_circle' : 'warning'}
                  </span>
                  {alunoDestaque.statusFinanceiro === 'OK' ? 'ACESSO LIBERADO' : 'ACESSO BLOQUEADO: INADIMPLENTE'}
                </h2>
              </div>

              <div className="flex gap-8 items-start">
                {/* Foto do Aluno */}
                <div className="w-48 h-48 rounded-3xl bg-gray-800 border-4 border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center relative shadow-2xl">
                  {alunoDestaque.aluno.foto_url ? (
                     <img src={alunoDestaque.aluno.foto_url} alt="Foto" className="w-full h-full object-cover" />
                  ) : (
                     <span className="material-symbols-outlined text-7xl text-gray-600">person</span>
                  )}
                  {/* Marcador de Rosto Facial Recognition Fake */}
                  <div className="absolute inset-0 border-2 border-green-500/50 rounded-3xl m-4 opacity-50">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-green-400"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-green-400"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-green-400"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-green-400"></div>
                  </div>
                </div>

                {/* Dados Cadastrais Mastigados */}
                <div className="flex-1 space-y-6">
                  <div>
                    <h3 className="text-5xl font-black text-white mb-2">{alunoDestaque.aluno.nome}</h3>
                    <p className="text-xl text-gray-400 font-mono">CPF: {alunoDestaque.aluno.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") || 'Não cadastrado'}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-900/80 p-4 rounded-xl border border-white/5">
                      <p className="text-gray-500 text-sm font-bold uppercase mb-1">Pacote Adquirido</p>
                      <p className="text-xl text-white font-bold">{alunoDestaque.planoNome}</p>
                    </div>
                    
                    <div className="bg-gray-900/80 p-4 rounded-xl border border-white/5">
                      <p className="text-gray-500 text-sm font-bold uppercase mb-1">Status Financeiro</p>
                      <p className={`text-xl font-bold ${alunoDestaque.statusFinanceiro === 'OK' ? 'text-green-400' : 'text-red-400'}`}>
                        {alunoDestaque.statusFinanceiro === 'OK' ? 'Em dia' : 'Fatura Atrasada'}
                      </p>
                    </div>

                    <div className="col-span-2 bg-gradient-to-r from-purple-900/40 to-blue-900/40 p-5 rounded-xl border border-purple-500/20">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="material-symbols-outlined text-purple-400 text-3xl">fitness_center</span>
                        <p className="text-purple-400 text-sm font-bold uppercase">Treino Sugerido para Hoje</p>
                      </div>
                      <p className="text-2xl text-white font-bold">{alunoDestaque.treinoAtivo}</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Lado Direito: Feed de Entradas Timeline */}
        <div className="w-1/3 glass-panel rounded-2xl p-4 flex flex-col overflow-hidden">
          <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">Log de Acessos Recentes</h3>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {liveFeed.length === 0 && <p className="text-sm text-gray-500 text-center mt-10">Nenhum acesso computado.</p>}
            
            {liveFeed.map((event, idx) => (
              <div key={event.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${idx === 0 ? 'bg-white/10 border-white/20 scale-100' : 'bg-gray-900/50 border-white/5 opacity-80'}`}>
                
                <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {event.aluno.foto_url ? (
                    <img src={event.aluno.foto_url} alt="Foto" className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-gray-500">person</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold truncate text-sm">{event.aluno.nome}</p>
                  <p className="text-gray-400 text-xs">{event.timestamp.toLocaleTimeString('pt-BR')}</p>
                </div>

                <div className={`w-3 h-3 rounded-full flex-shrink-0 shadow-lg ${event.statusFinanceiro === 'OK' ? 'bg-green-500 shadow-green-500/50' : 'bg-red-500 shadow-red-500/50'}`}></div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />

    </div>
  );
}
