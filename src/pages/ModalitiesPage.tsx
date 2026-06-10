import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';
import { useAuthStore } from '../stores/auth.store';
import type { Modalidade } from '../types/database';

const emptyForm = {
  nome: '',
  descricao: '',
  duracao_minutos: 60,
  capacidade_maxima: 20,
  ativo: true,
};

export default function ModalitiesPage() {
  const { t } = useTranslation();
  const academiaId = useAuthStore((s) => s.user?.academiaId || null);
  const [modalidades, setModalidades] = useState<Modalidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Modalidade | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('modalidades')
      .select('*')
      .order('ativo', { ascending: false })
      .order('nome', { ascending: true });

    if (error) setErro(error.message);
    setModalidades((data as Modalidade[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const abrirNovo = () => {
    setEditando(null);
    setForm(emptyForm);
    setErro('');
    setModalOpen(true);
  };

  const abrirEditar = (mod: Modalidade) => {
    setEditando(mod);
    setForm({
      nome: mod.nome,
      descricao: mod.descricao || '',
      duracao_minutos: mod.duracao_minutos,
      capacidade_maxima: mod.capacidade_maxima,
      ativo: mod.ativo,
    });
    setErro('');
    setModalOpen(true);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setErro('');

    const payload = {
      academia_id: academiaId,
      nome: form.nome,
      descricao: form.descricao,
      duracao_minutos: Number(form.duracao_minutos),
      capacidade_maxima: Number(form.capacidade_maxima),
      ativo: form.ativo,
    };

    if (editando) {
      const { error } = await supabase.from('modalidades').update(payload).eq('id', editando.id);
      if (error) {
        setErro(error.message);
        setSalvando(false);
        return;
      }
    } else {
      const { error } = await supabase.from('modalidades').insert(payload);
      if (error) {
        setErro(error.message);
        setSalvando(false);
        return;
      }
    }

    setSalvando(false);
    setModalOpen(false);
    carregar();
  };

  const toggleAtivo = async (mod: Modalidade) => {
    await supabase
      .from('modalidades')
      .update({ ativo: !mod.ativo })
      .eq('id', mod.id);
    carregar();
  };

  const excluir = async (mod: Modalidade) => {
    // Check if it has classes first
    const { count } = await supabase
      .from('turmas')
      .select('*', { count: 'exact', head: true })
      .eq('modalidade_id', mod.id);

    if (count && count > 0) {
      alert('Esta modalidade possui turmas ativas. Exclua as turmas primeiro.');
      return;
    }

    if (!confirm(`Deseja excluir a modalidade ${mod.nome}?`)) return;
    const { error } = await supabase.from('modalidades').delete().eq('id', mod.id);
    if (error) alert(error.message);
    else carregar();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Modalidades</h1>
          <p className="text-sm text-gray-400 mt-1">
            Gerencie os tipos de aulas oferecidas na academia (CrossFit, Spinning, Natação, etc).
          </p>
        </div>
        <button
          type="button"
          onClick={abrirNovo}
          className="btn-primary px-4 py-2 text-sm flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span> Nova Modalidade
        </button>
      </div>

      {erro && !modalOpen && (
        <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-4 py-2">{erro}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-gray-400">{t('common.loading')}</p>
        ) : modalidades.length === 0 ? (
          <p className="text-gray-400">Nenhuma modalidade cadastrada.</p>
        ) : (
          modalidades.map((mod) => (
            <div key={mod.id} className={`glass-card p-6 rounded-2xl flex flex-col justify-between ${!mod.ativo ? 'opacity-60' : ''}`}>
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-white">{mod.nome}</h3>
                  <span className={`px-2 py-1 text-xs font-semibold rounded border ${mod.ativo ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                    {mod.ativo ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
                {mod.descricao && <p className="text-gray-400 text-sm mb-4">{mod.descricao}</p>}
                
                <div className="flex gap-4 mb-6">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Duração</p>
                    <p className="text-white font-semibold">{mod.duracao_minutos} min</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Capacidade</p>
                    <p className="text-white font-semibold">{mod.capacidade_maxima} vagas</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 border-t border-white/10 pt-4 mt-auto">
                <button
                  onClick={() => abrirEditar(mod)}
                  className="flex-1 py-2 text-sm text-center text-purple-400 hover:bg-white/5 rounded transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => toggleAtivo(mod)}
                  className="flex-1 py-2 text-sm text-center text-gray-300 hover:bg-white/5 rounded transition-colors"
                >
                  {mod.ativo ? 'Desativar' : 'Ativar'}
                </button>
                <button
                  onClick={() => excluir(mod)}
                  className="flex-1 py-2 text-sm text-center text-red-400 hover:bg-white/5 rounded transition-colors"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal title={editando ? 'Editar Modalidade' : 'Nova Modalidade'} open={modalOpen} onClose={() => setModalOpen(false)}>
        {erro && <p className="text-red-400 text-sm mb-3">{erro}</p>}
        <form onSubmit={handleSalvar} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nome da Modalidade (Ex: Natação, CrossFit)</label>
            <input
              required
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Descrição</label>
            <input
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Duração (Minutos)</label>
              <input
                required
                type="number"
                min="1"
                value={form.duracao_minutos}
                onChange={(e) => setForm({ ...form, duracao_minutos: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Capacidade Máxima</label>
              <input
                required
                type="number"
                min="1"
                value={form.capacidade_maxima}
                onChange={(e) => setForm({ ...form, capacidade_maxima: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
              />
            </div>
          </div>
          
          <label className="flex items-center gap-2 text-white cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={form.ativo}
              onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
              className="rounded border-gray-700 bg-gray-900 text-purple-500 focus:ring-purple-500 focus:ring-offset-gray-900"
            />
            Modalidade Ativa
          </label>

          <button
            type="submit"
            disabled={salvando}
            className="btn-primary w-full py-3 mt-4 disabled:opacity-50"
          >
            {salvando ? t('common.loading') : t('common.save')}
          </button>
        </form>
      </Modal>
    </div>
  );
}
