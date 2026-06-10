import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';
import { useAuthStore } from '../stores/auth.store';
import type { Aluno, AvaliacaoFisica, Anamnese } from '../types/database';

export default function AssessmentsPage() {
  const { t } = useTranslation();
  const academiaId = useAuthStore((s) => s.user?.academiaId || null);
  const staffId = useAuthStore((s) => s.user?.id || null);

  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  
  // States para aluno selecionado
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);
  const [anamnese, setAnamnese] = useState<Anamnese | null>(null);
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoFisica[]>([]);
  
  const [modalAvaliacaoOpen, setModalAvaliacaoOpen] = useState(false);
  const [modalAnamneseOpen, setModalAnamneseOpen] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Form states
  const [formAvaliacao, setFormAvaliacao] = useState({
    peso: '',
    altura: '',
    percentual_gordura: '',
    observacoes: ''
  });

  const [formAnamnese, setFormAnamnese] = useState({
    hipertensao: false,
    diabetes: false,
    lesoes: '',
    medicamentos: '',
    observacoes: ''
  });

  useEffect(() => {
    carregarAlunos();
  }, []);

  const carregarAlunos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('alunos')
      .select('*')
      .eq('status', 'ativo')
      .order('nome');
    
    setAlunos((data as Aluno[]) || []);
    setLoading(false);
  };

  const selecionarAluno = async (aluno: Aluno) => {
    setAlunoSelecionado(aluno);
    
    // Carrega a anamnese se existir
    const { data: anamneseData } = await supabase
      .from('anamneses')
      .select('*')
      .eq('aluno_id', aluno.id)
      .single();
    
    if (anamneseData) {
      setAnamnese(anamneseData as Anamnese);
      setFormAnamnese({
        hipertensao: anamneseData.respostas.hipertensao || false,
        diabetes: anamneseData.respostas.diabetes || false,
        lesoes: anamneseData.respostas.lesoes || '',
        medicamentos: anamneseData.respostas.medicamentos || '',
        observacoes: anamneseData.observacoes || ''
      });
    } else {
      setAnamnese(null);
      setFormAnamnese({
        hipertensao: false,
        diabetes: false,
        lesoes: '',
        medicamentos: '',
        observacoes: ''
      });
    }

    // Carrega avaliações físicas
    const { data: avaliacoesData } = await supabase
      .from('avaliacoes_fisicas')
      .select('*')
      .eq('aluno_id', aluno.id)
      .order('data_avaliacao', { ascending: false });

    setAvaliacoes((avaliacoesData as AvaliacaoFisica[]) || []);
  };

  const handleSalvarAvaliacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alunoSelecionado) return;
    setSalvando(true);

    const novaAvaliacao = {
      aluno_id: alunoSelecionado.id,
      peso: formAvaliacao.peso ? parseFloat(formAvaliacao.peso) : null,
      altura: formAvaliacao.altura ? parseFloat(formAvaliacao.altura) : null,
      percentual_gordura: formAvaliacao.percentual_gordura ? parseFloat(formAvaliacao.percentual_gordura) : null,
      observacoes: formAvaliacao.observacoes,
      criado_por: staffId,
      data_avaliacao: new Date().toISOString().split('T')[0]
    };

    const { error, data } = await supabase.from('avaliacoes_fisicas').insert(novaAvaliacao).select().single();
    
    if (!error && data) {
      // Salva a evolução
      await supabase.from('evolucao_fisica').insert({
        aluno_id: alunoSelecionado.id,
        avaliacao_id: data.id,
        peso: novaAvaliacao.peso,
        gordura: novaAvaliacao.percentual_gordura
      });
      
      setAvaliacoes([data as AvaliacaoFisica, ...avaliacoes]);
      setModalAvaliacaoOpen(false);
      setFormAvaliacao({ peso: '', altura: '', percentual_gordura: '', observacoes: '' });
    }
    setSalvando(false);
  };

  const handleSalvarAnamnese = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alunoSelecionado) return;
    setSalvando(true);

    const payload = {
      aluno_id: alunoSelecionado.id,
      respostas: {
        hipertensao: formAnamnese.hipertensao,
        diabetes: formAnamnese.diabetes,
        lesoes: formAnamnese.lesoes,
        medicamentos: formAnamnese.medicamentos
      },
      observacoes: formAnamnese.observacoes
    };

    if (anamnese) {
      const { data } = await supabase.from('anamneses').update(payload).eq('id', anamnese.id).select().single();
      if (data) setAnamnese(data as Anamnese);
    } else {
      const { data } = await supabase.from('anamneses').insert(payload).select().single();
      if (data) setAnamnese(data as Anamnese);
    }

    setSalvando(false);
    setModalAnamneseOpen(false);
  };

  const calcularIMC = (peso?: number | null, altura?: number | null) => {
    if (!peso || !altura) return '-';
    // Altura em metros
    const alt = altura > 3 ? altura / 100 : altura;
    const imc = peso / (alt * alt);
    return imc.toFixed(1);
  };

  const alunosFiltrados = alunos.filter(a => a.nome.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Coluna da Esquerda: Lista de Alunos */}
      <div className="w-1/3 glass-panel rounded-2xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h2 className="text-xl font-bold text-white mb-4">Selecione um Aluno</h2>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-500 text-[20px]">search</span>
            <input
              type="text"
              placeholder="Buscar aluno..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <p className="text-center text-gray-500 mt-4">Carregando...</p>
          ) : (
            alunosFiltrados.map(aluno => (
              <button
                key={aluno.id}
                onClick={() => selecionarAluno(aluno)}
                className={`w-full text-left p-3 rounded-xl transition-colors mb-1 ${
                  alunoSelecionado?.id === aluno.id 
                    ? 'bg-purple-500/20 border border-purple-500/30' 
                    : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                <p className="text-white font-medium">{aluno.nome}</p>
                <p className="text-xs text-gray-400">{aluno.email}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Coluna da Direita: Dados de Saúde */}
      <div className="w-2/3 glass-panel rounded-2xl p-6 overflow-y-auto flex flex-col">
        {!alunoSelecionado ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <span className="material-symbols-outlined text-4xl mb-2">medical_services</span>
              <p>Selecione um aluno para ver o prontuário</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Cabecalho do Aluno */}
            <div className="flex justify-between items-start border-b border-white/5 pb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">{alunoSelecionado.nome}</h2>
                <p className="text-gray-400">Prontuário e Histórico de Evolução Física</p>
              </div>
            </div>

            {/* Anamnese Card */}
            <div className="bg-gray-900/50 rounded-xl p-5 border border-white/5">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 text-white">
                  <span className="material-symbols-outlined text-purple-400">health_and_safety</span>
                  <h3 className="text-lg font-bold">Anamnese</h3>
                </div>
                <button 
                  onClick={() => setModalAnamneseOpen(true)}
                  className="text-sm text-purple-400 hover:text-white"
                >
                  {anamnese ? 'Editar' : 'Preencher'}
                </button>
              </div>

              {!anamnese ? (
                <p className="text-gray-500 text-sm">Nenhuma anamnese preenchida ainda.</p>
              ) : (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center justify-between bg-gray-800/30 p-2 rounded">
                    <span className="text-gray-400">Hipertensão:</span>
                    <span className={anamnese.respostas.hipertensao ? 'text-red-400' : 'text-green-400'}>
                      {anamnese.respostas.hipertensao ? 'SIM' : 'NÃO'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-800/30 p-2 rounded">
                    <span className="text-gray-400">Diabetes:</span>
                    <span className={anamnese.respostas.diabetes ? 'text-red-400' : 'text-green-400'}>
                      {anamnese.respostas.diabetes ? 'SIM' : 'NÃO'}
                    </span>
                  </div>
                  {anamnese.respostas.lesoes && (
                    <div className="col-span-2 bg-gray-800/30 p-2 rounded">
                      <span className="text-gray-400 block mb-1">Lesões / Dores:</span>
                      <span className="text-white">{anamnese.respostas.lesoes}</span>
                    </div>
                  )}
                  {anamnese.observacoes && (
                    <div className="col-span-2 bg-gray-800/30 p-2 rounded">
                      <span className="text-gray-400 block mb-1">Observações Médicas:</span>
                      <span className="text-white">{anamnese.observacoes}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Avaliações Físicas */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 text-white">
                  <span className="material-symbols-outlined text-blue-400">monitor_weight</span>
                  <h3 className="text-lg font-bold">Histórico de Avaliações</h3>
                </div>
                <button 
                  onClick={() => setModalAvaliacaoOpen(true)}
                  className="btn-primary text-sm px-3 py-1.5"
                >
                  Nova Avaliação
                </button>
              </div>

              {avaliacoes.length === 0 ? (
                <p className="text-gray-500 text-sm">O aluno ainda não possui avaliações físicas.</p>
              ) : (
                <div className="space-y-3">
                  {avaliacoes.map((av, idx) => (
                    <div key={av.id} className="bg-gray-900/50 rounded-xl p-4 border border-white/5 flex flex-wrap gap-6 items-center justify-between">
                      <div>
                        <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Data</span>
                        <p className="text-white">{new Date(av.data_avaliacao).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Peso</span>
                        <p className="text-white text-lg">{av.peso ? `${av.peso} kg` : '-'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Gordura</span>
                        <p className="text-white text-lg">{av.percentual_gordura ? `${av.percentual_gordura}%` : '-'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">IMC</span>
                        <p className="text-blue-400 text-lg">{calcularIMC(av.peso, av.altura)}</p>
                      </div>
                      {idx === 0 && (
                        <div className="bg-purple-500/10 text-purple-400 text-xs px-2 py-1 rounded border border-purple-500/20">
                          Mais Recente
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL ANAMNESE */}
      <Modal title="Questionário de Anamnese" open={modalAnamneseOpen} onClose={() => setModalAnamneseOpen(false)}>
        <form onSubmit={handleSalvarAnamnese} className="space-y-4">
          <div className="flex gap-4 mb-4">
            <label className="flex items-center gap-2 text-white cursor-pointer bg-gray-900/50 p-3 rounded-xl border border-gray-800 flex-1">
              <input
                type="checkbox"
                checked={formAnamnese.hipertensao}
                onChange={(e) => setFormAnamnese({ ...formAnamnese, hipertensao: e.target.checked })}
                className="rounded border-gray-700 bg-gray-900 text-red-500 focus:ring-red-500"
              />
              Tem Hipertensão?
            </label>
            <label className="flex items-center gap-2 text-white cursor-pointer bg-gray-900/50 p-3 rounded-xl border border-gray-800 flex-1">
              <input
                type="checkbox"
                checked={formAnamnese.diabetes}
                onChange={(e) => setFormAnamnese({ ...formAnamnese, diabetes: e.target.checked })}
                className="rounded border-gray-700 bg-gray-900 text-red-500 focus:ring-red-500"
              />
              Tem Diabetes?
            </label>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Lesões, cirurgias ou dores (Detalhe)</label>
            <textarea
              value={formAnamnese.lesoes}
              onChange={(e) => setFormAnamnese({ ...formAnamnese, lesoes: e.target.value })}
              className="w-full px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50 h-20"
              placeholder="Ex: Cirurgia no joelho direito em 2020"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Medicamentos Controlados</label>
            <textarea
              value={formAnamnese.medicamentos}
              onChange={(e) => setFormAnamnese({ ...formAnamnese, medicamentos: e.target.value })}
              className="w-full px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50 h-20"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Observações Médicas da Academia</label>
            <textarea
              value={formAnamnese.observacoes}
              onChange={(e) => setFormAnamnese({ ...formAnamnese, observacoes: e.target.value })}
              className="w-full px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50 h-20"
            />
          </div>

          <button type="submit" disabled={salvando} className="btn-primary w-full py-3 mt-4">
            {salvando ? 'Salvando...' : 'Salvar Anamnese'}
          </button>
        </form>
      </Modal>

      {/* MODAL AVALIACAO FISICA */}
      <Modal title="Nova Avaliação Física" open={modalAvaliacaoOpen} onClose={() => setModalAvaliacaoOpen(false)}>
        <form onSubmit={handleSalvarAvaliacao} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Peso (kg)</label>
              <input
                required
                type="number"
                step="0.1"
                value={formAvaliacao.peso}
                onChange={(e) => setFormAvaliacao({ ...formAvaliacao, peso: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Altura (cm ou m)</label>
              <input
                type="number"
                step="0.01"
                value={formAvaliacao.altura}
                onChange={(e) => setFormAvaliacao({ ...formAvaliacao, altura: e.target.value })}
                placeholder="Ex: 1.75"
                className="w-full px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">% Gordura Corporal</label>
            <input
              type="number"
              step="0.1"
              value={formAvaliacao.percentual_gordura}
              onChange={(e) => setFormAvaliacao({ ...formAvaliacao, percentual_gordura: e.target.value })}
              className="w-full px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Observações da Avaliação</label>
            <textarea
              value={formAvaliacao.observacoes}
              onChange={(e) => setFormAvaliacao({ ...formAvaliacao, observacoes: e.target.value })}
              className="w-full px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-blue-500/50 h-24"
            />
          </div>

          <button type="submit" disabled={salvando} className="w-full py-3 mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors">
            {salvando ? 'Salvando...' : 'Registrar Medidas'}
          </button>
        </form>
      </Modal>

    </div>
  );
}
