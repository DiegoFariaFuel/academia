import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';
import { useAuthStore } from '../stores/auth.store';
import type { Aluno, Treino, Exercicio, TreinoExercicio, AlunoTreino } from '../types/database';

export default function WorkoutsPage() {
  const academiaId = useAuthStore((s) => s.user?.academiaId || null);
  const staffId = useAuthStore((s) => s.user?.id || null);

  const [activeTab, setActiveTab] = useState<'templates' | 'alunos'>('templates');
  const [loading, setLoading] = useState(true);

  // States
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);

  // Modals
  const [modalTreinoOpen, setModalTreinoOpen] = useState(false);
  const [modalAtribuirOpen, setModalAtribuirOpen] = useState(false);
  const [modalIAOpen, setModalIAOpen] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [gerandoIA, setGerandoIA] = useState(false);

  // Selecoes
  const [treinoSelecionado, setTreinoSelecionado] = useState<Treino | null>(null);
  const [exerciciosDoTreino, setExerciciosDoTreino] = useState<(TreinoExercicio & { exercicios: Exercicio })[]>([]);
  
  // Aluno
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);
  const [treinosDoAluno, setTreinosDoAluno] = useState<(AlunoTreino & { treinos: Treino })[]>([]);

  const [formTreino, setFormTreino] = useState({
    nome: '',
    descricao: '',
    nivel: 'iniciante' as any
  });

  const [formExercicio, setFormExercicio] = useState({
    exercicio_id: '',
    series: 3,
    repeticoes: '10-12',
    descanso_segundos: 60,
    ordem: 1
  });

  useEffect(() => {
    carregarDadosBase();
  }, []);

  const carregarDadosBase = async () => {
    setLoading(true);
    const [tRes, eRes, aRes] = await Promise.all([
      supabase.from('treinos').select('*').order('nome'),
      supabase.from('exercicios').select('*').order('grupo_muscular'),
      supabase.from('alunos').select('*').eq('status', 'ativo').order('nome')
    ]);
    
    setTreinos((tRes.data as Treino[]) || []);
    setExercicios((eRes.data as Exercicio[]) || []);
    setAlunos((aRes.data as Aluno[]) || []);
    setLoading(false);
  };

  const carregarExerciciosDoTreino = async (treino: Treino) => {
    setTreinoSelecionado(treino);
    const { data } = await supabase
      .from('treino_exercicios')
      .select('*, exercicios(*)')
      .eq('treino_id', treino.id)
      .order('ordem');
    
    setExerciciosDoTreino(data as any || []);
  };

  const handleSalvarTreino = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);

    const { data } = await supabase.from('treinos').insert({
      academia_id: academiaId,
      nome: formTreino.nome,
      descricao: formTreino.descricao,
      nivel: formTreino.nivel
    }).select().single();

    if (data) {
      setTreinos([...treinos, data as Treino]);
      setModalTreinoOpen(false);
      carregarExerciciosDoTreino(data as Treino); // auto select
    }
    setSalvando(false);
  };

  const handleAdicionarExercicio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!treinoSelecionado || !formExercicio.exercicio_id) return;
    
    await supabase.from('treino_exercicios').insert({
      treino_id: treinoSelecionado.id,
      exercicio_id: formExercicio.exercicio_id,
      series: formExercicio.series,
      repeticoes: formExercicio.repeticoes,
      descanso_segundos: formExercicio.descanso_segundos,
      ordem: formExercicio.ordem
    });

    carregarExerciciosDoTreino(treinoSelecionado);
    setFormExercicio({ ...formExercicio, exercicio_id: '', ordem: formExercicio.ordem + 1 });
  };

  const handleRemoverExercicio = async (id: string) => {
    await supabase.from('treino_exercicios').delete().eq('id', id);
    if (treinoSelecionado) carregarExerciciosDoTreino(treinoSelecionado);
  };

  // Funcoes Aluno
  const selecionarAluno = async (aluno: Aluno) => {
    setAlunoSelecionado(aluno);
    const { data } = await supabase
      .from('aluno_treinos')
      .select('*, treinos(*)')
      .eq('aluno_id', aluno.id)
      .eq('ativo', true);
    setTreinosDoAluno(data as any || []);
  };

  const handleAtribuirTreino = async (treinoId: string) => {
    if (!alunoSelecionado) return;
    await supabase.from('aluno_treinos').insert({
      aluno_id: alunoSelecionado.id,
      treino_id: treinoId,
      prescrito_por: staffId,
      data_inicio: new Date().toISOString().split('T')[0],
      ativo: true
    });
    setModalAtribuirOpen(false);
    selecionarAluno(alunoSelecionado);
  };

  const handleDesativarTreinoAluno = async (id: string) => {
    await supabase.from('aluno_treinos').update({ ativo: false, data_fim: new Date().toISOString().split('T')[0] }).eq('id', id);
    if (alunoSelecionado) selecionarAluno(alunoSelecionado);
  };

  const gerarTreinoComIA = () => {
    setGerandoIA(true);
    // Simula tempo da requisição para API (ex: OpenAI)
    setTimeout(() => {
      setFormTreino({
        nome: 'Ficha A (Gerada por IA)',
        descricao: 'Treino otimizado para hipertrofia com base no biotipo e objetivos do aluno (Foco: Superiores).',
        nivel: 'intermediario' as any
      });
      setGerandoIA(false);
      setModalIAOpen(false);
      setModalTreinoOpen(true); // Abre o modal normal mas preenchido pela IA
    }, 2500);
  };

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Prescrição de Treinos</h1>
          <p className="text-gray-400">Monte fichas padrão e atribua aos seus alunos</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/5 pb-2">
        <button 
          onClick={() => setActiveTab('templates')}
          className={`pb-2 px-1 font-medium transition-colors ${activeTab === 'templates' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}
        >
          Modelos de Ficha (Templates)
        </button>
        <button 
          onClick={() => setActiveTab('alunos')}
          className={`pb-2 px-1 font-medium transition-colors ${activeTab === 'alunos' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}
        >
          Fichas dos Alunos
        </button>
      </div>

      {loading ? (
        <div className="text-gray-400">Carregando...</div>
      ) : activeTab === 'templates' ? (
        // TAB: TEMPLATES
        <div className="flex flex-1 gap-6 min-h-0">
          <div className="w-1/3 glass-panel rounded-2xl p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">Treinos</h2>
              <div className="space-x-2 flex">
                <button onClick={() => setModalIAOpen(true)} className="flex items-center gap-1 text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white px-2 py-1 rounded font-bold hover:opacity-80">
                  <span className="material-symbols-outlined text-[14px]">auto_awesome</span> IA
                </button>
                <button onClick={() => setModalTreinoOpen(true)} className="text-purple-400 text-sm font-medium hover:text-white">+ Novo</button>
              </div>
            </div>
            <div className="space-y-2">
              {treinos.map(t => (
                <button
                  key={t.id}
                  onClick={() => carregarExerciciosDoTreino(t)}
                  className={`w-full text-left p-3 rounded-xl border transition-colors ${treinoSelecionado?.id === t.id ? 'bg-purple-500/20 border-purple-500/30 text-white' : 'border-transparent text-gray-300 hover:bg-white/5'}`}
                >
                  <p className="font-bold">{t.nome}</p>
                  <p className="text-xs text-gray-400 capitalize">{t.nivel}</p>
                </button>
              ))}
              {treinos.length === 0 && <p className="text-sm text-gray-500">Nenhum treino criado.</p>}
            </div>
          </div>

          <div className="w-2/3 glass-panel rounded-2xl p-6 overflow-y-auto">
            {!treinoSelecionado ? (
              <div className="h-full flex items-center justify-center text-gray-500">Selecione um treino para ver a ficha</div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">{treinoSelecionado.nome}</h2>
                <p className="text-gray-400 mb-6">{treinoSelecionado.descricao}</p>
                
                <form onSubmit={handleAdicionarExercicio} className="bg-gray-900/50 p-4 rounded-xl border border-white/5 mb-6">
                  <h3 className="text-white font-medium mb-3">Adicionar Exercício na Ficha</h3>
                  <div className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-4">
                      <label className="text-xs text-gray-400">Exercício</label>
                      <select required value={formExercicio.exercicio_id} onChange={(e) => setFormExercicio({...formExercicio, exercicio_id: e.target.value})} className="w-full bg-gray-800 rounded p-2 text-white border border-gray-700 text-sm">
                        <option value="">Selecione...</option>
                        {exercicios.map(e => <option key={e.id} value={e.id}>{e.nome} ({e.grupo_muscular})</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-gray-400">Séries</label>
                      <input type="number" required min="1" value={formExercicio.series} onChange={(e) => setFormExercicio({...formExercicio, series: parseInt(e.target.value)})} className="w-full bg-gray-800 rounded p-2 text-white border border-gray-700 text-sm" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-gray-400">Reps (Ex: 10-12)</label>
                      <input type="text" required value={formExercicio.repeticoes} onChange={(e) => setFormExercicio({...formExercicio, repeticoes: e.target.value})} className="w-full bg-gray-800 rounded p-2 text-white border border-gray-700 text-sm" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-gray-400">Descanso (s)</label>
                      <input type="number" value={formExercicio.descanso_segundos} onChange={(e) => setFormExercicio({...formExercicio, descanso_segundos: parseInt(e.target.value)})} className="w-full bg-gray-800 rounded p-2 text-white border border-gray-700 text-sm" />
                    </div>
                    <div className="col-span-2">
                      <button type="submit" className="w-full btn-primary py-2 text-sm">+</button>
                    </div>
                  </div>
                </form>

                <div className="space-y-2">
                  {exerciciosDoTreino.map((te, idx) => (
                    <div key={te.id} className="bg-gray-800/30 p-3 rounded-lg border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-300">
                        <span className="font-mono text-purple-400 font-bold bg-purple-500/10 px-2 rounded">{idx + 1}</span>
                        <span className="text-white font-medium w-48">{te.exercicios.nome}</span>
                        <span className="w-24 border-l border-gray-700 pl-4">{te.series} séries</span>
                        <span className="w-24 border-l border-gray-700 pl-4">{te.repeticoes} reps</span>
                        <span className="border-l border-gray-700 pl-4">{te.descanso_segundos}s descanso</span>
                      </div>
                      <button onClick={() => handleRemoverExercicio(te.id)} className="text-gray-500 hover:text-red-400 material-symbols-outlined text-lg">delete</button>
                    </div>
                  ))}
                  {exerciciosDoTreino.length === 0 && <p className="text-sm text-gray-500">A ficha está vazia.</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        // TAB: ALUNOS E ATRIBUICAO
        <div className="flex flex-1 gap-6 min-h-0">
          <div className="w-1/3 glass-panel rounded-2xl p-4 overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-4">Selecione o Aluno</h2>
            <div className="space-y-2">
              {alunos.map(a => (
                <button
                  key={a.id}
                  onClick={() => selecionarAluno(a)}
                  className={`w-full text-left p-3 rounded-xl border transition-colors ${alunoSelecionado?.id === a.id ? 'bg-purple-500/20 border-purple-500/30 text-white' : 'border-transparent text-gray-300 hover:bg-white/5'}`}
                >
                  <p className="font-bold">{a.nome}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="w-2/3 glass-panel rounded-2xl p-6 overflow-y-auto">
            {!alunoSelecionado ? (
              <div className="h-full flex items-center justify-center text-gray-500">Selecione um aluno para ver seus treinos</div>
            ) : (
              <div>
                <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{alunoSelecionado.nome}</h2>
                    <p className="text-gray-400">Treinos Prescritos</p>
                  </div>
                  <button onClick={() => setModalAtribuirOpen(true)} className="btn-primary">Prescrever Ficha</button>
                </div>

                <div className="space-y-4">
                  {treinosDoAluno.map(at => (
                    <div key={at.id} className="bg-gray-900/50 p-5 rounded-xl border border-white/5 flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="material-symbols-outlined text-purple-400">fitness_center</span>
                          <h3 className="text-lg font-bold text-white">{at.treinos.nome}</h3>
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded uppercase font-bold">Ativo</span>
                        </div>
                        <p className="text-sm text-gray-400 mb-1">{at.treinos.descricao}</p>
                        <p className="text-xs text-gray-500 font-mono">Iniciado em: {new Date(at.data_inicio).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <button onClick={() => handleDesativarTreinoAluno(at.id)} className="text-red-400 hover:text-red-300 text-sm font-medium">Remover / Concluir</button>
                    </div>
                  ))}
                  {treinosDoAluno.length === 0 && <p className="text-gray-500">Nenhum treino ativo para este aluno.</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Criar Treino */}
      <Modal title="Novo Template de Ficha" open={modalTreinoOpen} onClose={() => setModalTreinoOpen(false)}>
        <form onSubmit={handleSalvarTreino} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nome da Ficha</label>
            <input required type="text" value={formTreino.nome} onChange={e => setFormTreino({...formTreino, nome: e.target.value})} className="w-full px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50" placeholder="Ex: Ficha A - Hipertrofia Peito" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nível</label>
            <select value={formTreino.nivel} onChange={e => setFormTreino({...formTreino, nivel: e.target.value})} className="w-full px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50">
              <option value="iniciante">Iniciante</option>
              <option value="intermediario">Intermediário</option>
              <option value="avancado">Avançado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Descrição</label>
            <textarea value={formTreino.descricao} onChange={e => setFormTreino({...formTreino, descricao: e.target.value})} className="w-full px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50 h-20" placeholder="Foco em hipertrofia..." />
          </div>
          <button type="submit" disabled={salvando} className="btn-primary w-full py-3">Salvar Ficha Vazia</button>
        </form>
      </Modal>

      {/* Modal Atribuir Treino */}
      <Modal title={`Prescrever para ${alunoSelecionado?.nome}`} open={modalAtribuirOpen} onClose={() => setModalAtribuirOpen(false)}>
        <div className="space-y-3">
          <p className="text-sm text-gray-400 mb-4">Escolha um dos seus templates para vincular ao aluno.</p>
          {treinos.map(t => (
            <button key={t.id} onClick={() => handleAtribuirTreino(t.id)} className="w-full text-left p-4 bg-gray-900/50 border border-white/5 hover:border-purple-500/30 rounded-xl transition-colors">
              <p className="font-bold text-white">{t.nome}</p>
              <p className="text-xs text-gray-400">{t.nivel}</p>
            </button>
          ))}
        </div>
      </Modal>

      {/* Modal Inteligência Artificial */}
      <Modal title="AI Coach" open={modalIAOpen} onClose={() => {if(!gerandoIA) setModalIAOpen(false)}}>
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="material-symbols-outlined text-white text-3xl">psychology</span>
          </div>
          <h3 className="text-lg font-bold text-white">Gerador de Treino Inteligente</h3>
          <p className="text-sm text-gray-400">A nossa IA lerá as últimas avaliações físicas e objetivos de todos os alunos para sugerir o melhor template genérico para ser salvo na biblioteca.</p>
          
          <button 
            onClick={gerarTreinoComIA} 
            disabled={gerandoIA}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white font-bold py-3 rounded-xl transition-all"
          >
            {gerandoIA ? 'Analisando dados (Aguarde)...' : 'Gerar Template Perfeito'}
          </button>
        </div>
      </Modal>

    </div>
  );
}
