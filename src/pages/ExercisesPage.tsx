import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';
import { useAuthStore } from '../stores/auth.store';
import type { Exercicio } from '../types/database';

export default function ExercisesPage() {
  const { t } = useTranslation();
  const academiaId = useAuthStore((s) => s.user?.academiaId || null);

  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [exercicioEmEdicao, setExercicioEmEdicao] = useState<Exercicio | null>(null);

  const [form, setForm] = useState({
    nome: '',
    grupo_muscular: '',
    instrucoes: '',
    video_url: ''
  });

  const GRUPOS_MUSCULARES = [
    'Peito', 'Costas', 'Pernas', 'Ombros', 'Bíceps', 'Tríceps', 'Abdômen', 'Glúteos', 'Cardio', 'Full Body'
  ];

  useEffect(() => {
    carregarExercicios();
  }, []);

  const carregarExercicios = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('exercicios')
      .select('*')
      .order('nome');
    
    setExercicios((data as Exercicio[]) || []);
    setLoading(false);
  };

  const abrirModal = (exercicio?: Exercicio) => {
    if (exercicio) {
      setExercicioEmEdicao(exercicio);
      setForm({
        nome: exercicio.nome,
        grupo_muscular: exercicio.grupo_muscular,
        instrucoes: exercicio.instrucoes || '',
        video_url: exercicio.video_url || ''
      });
    } else {
      setExercicioEmEdicao(null);
      setForm({ nome: '', grupo_muscular: 'Peito', instrucoes: '', video_url: '' });
    }
    setModalOpen(true);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);

    const payload = {
      academia_id: academiaId,
      nome: form.nome,
      grupo_muscular: form.grupo_muscular,
      instrucoes: form.instrucoes,
      video_url: form.video_url
    };

    if (exercicioEmEdicao) {
      await supabase.from('exercicios').update(payload).eq('id', exercicioEmEdicao.id);
    } else {
      await supabase.from('exercicios').insert(payload);
    }

    await carregarExercicios();
    setModalOpen(false);
    setSalvando(false);
  };

  const handleExcluir = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este exercício?')) return;
    await supabase.from('exercicios').delete().eq('id', id);
    carregarExercicios();
  };

  const exerciciosFiltrados = exercicios.filter(e => 
    e.nome.toLowerCase().includes(busca.toLowerCase()) || 
    e.grupo_muscular.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Biblioteca de Exercícios</h1>
          <p className="text-gray-400">Cadastre todos os exercícios para montagem das fichas</p>
        </div>
        <button onClick={() => abrirModal()} className="btn-primary flex items-center gap-2">
          <span className="material-symbols-outlined">add</span>
          Novo Exercício
        </button>
      </div>

      <div className="glass-panel rounded-2xl p-6 border border-white/5">
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-500">search</span>
            <input
              type="text"
              placeholder="Buscar por nome ou grupo muscular..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500">Carregando exercícios...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exerciciosFiltrados.map(exercicio => (
              <div key={exercicio.id} className="bg-gray-900/50 rounded-xl p-4 border border-white/5 flex flex-col justify-between group hover:border-purple-500/30 transition-colors">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded font-medium border border-purple-500/30">
                      {exercicio.grupo_muscular}
                    </span>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => abrirModal(exercicio)} className="text-gray-400 hover:text-white">
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button onClick={() => handleExcluir(exercicio.id)} className="text-gray-400 hover:text-red-400">
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">{exercicio.nome}</h3>
                  <p className="text-sm text-gray-400 line-clamp-2 mb-3">{exercicio.instrucoes || 'Sem instruções detalhadas'}</p>
                </div>
                {exercicio.video_url && (
                  <a href={exercicio.video_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300">
                    <span className="material-symbols-outlined text-[16px]">play_circle</span>
                    Ver Vídeo de Execução
                  </a>
                )}
              </div>
            ))}
            
            {exerciciosFiltrados.length === 0 && (
              <div className="col-span-full text-center py-10 text-gray-500">
                Nenhum exercício encontrado.
              </div>
            )}
          </div>
        )}
      </div>

      <Modal title={exercicioEmEdicao ? "Editar Exercício" : "Novo Exercício"} open={modalOpen} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSalvar} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nome do Exercício</label>
            <input
              required
              type="text"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              className="w-full px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
              placeholder="Ex: Supino Reto"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Grupo Muscular</label>
            <select
              value={form.grupo_muscular}
              onChange={(e) => setForm({ ...form, grupo_muscular: e.target.value })}
              className="w-full px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
            >
              {GRUPOS_MUSCULARES.map(grupo => (
                <option key={grupo} value={grupo}>{grupo}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Instruções de Execução (Opcional)</label>
            <textarea
              value={form.instrucoes}
              onChange={(e) => setForm({ ...form, instrucoes: e.target.value })}
              className="w-full px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50 h-24"
              placeholder="Ex: Mantenha as costas retas, desça a barra até a linha do peito..."
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Link do Vídeo (YouTube, etc) - Opcional</label>
            <input
              type="url"
              value={form.video_url}
              onChange={(e) => setForm({ ...form, video_url: e.target.value })}
              className="w-full px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
              placeholder="https://..."
            />
          </div>

          <button type="submit" disabled={salvando} className="btn-primary w-full py-3 mt-4">
            {salvando ? 'Salvando...' : 'Salvar Exercício'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
