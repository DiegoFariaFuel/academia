import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';
import { useAuthStore } from '../stores/auth.store';
import type { Plano } from '../types/database';

const emptyForm = {
  nome: '',
  descricao: '',
  preco: '',
  duracao_dias: 30,
  beneficios: [] as string[],
  recorrencia: '1 month',
  ativo: true,
};

export default function PackagesPage() {
  const { t } = useTranslation();
  const academiaId = useAuthStore((s) => s.user?.academiaId || null);
  const [pacotes, setPacotes] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Plano | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [novoServico, setNovoServico] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('planos')
      .select('*')
      .is('deleted_at', null)
      .order('ativo', { ascending: false })
      .order('preco', { ascending: true });

    if (error) setErro(error.message);
    setPacotes((data as Plano[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const abrirNovo = () => {
    setEditando(null);
    setForm(emptyForm);
    setNovoServico('');
    setErro('');
    setModalOpen(true);
  };

  const abrirEditar = (pacote: Plano) => {
    setEditando(pacote);
    setForm({
      nome: pacote.nome,
      descricao: pacote.descricao || '',
      preco: pacote.preco.toString(),
      duracao_dias: pacote.duracao_dias || 30,
      beneficios: pacote.beneficios || [],
      recorrencia: pacote.recorrencia || '1 month',
      ativo: pacote.ativo,
    });
    setNovoServico('');
    setErro('');
    setModalOpen(true);
  };

  const adicionarServico = () => {
    if (novoServico.trim() && !form.beneficios.includes(novoServico.trim())) {
      setForm({ ...form, beneficios: [...form.beneficios, novoServico.trim()] });
      setNovoServico('');
    }
  };

  const removerServico = (servico: string) => {
    setForm({ ...form, beneficios: form.beneficios.filter(s => s !== servico) });
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setErro('');

    const payload = {
      academia_id: academiaId,
      nome: form.nome,
      descricao: form.descricao,
      preco: Number(form.preco),
      duracao_dias: Number(form.duracao_dias),
      beneficios: form.beneficios,
      recorrencia: form.recorrencia,
      ativo: form.ativo,
    };

    if (editando) {
      const { error } = await supabase.from('planos').update(payload).eq('id', editando.id);
      if (error) {
        setErro(error.message);
        setSalvando(false);
        return;
      }
    } else {
      const { error } = await supabase.from('planos').insert(payload);
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

  const toggleAtivo = async (pacote: Plano) => {
    await supabase
      .from('planos')
      .update({ ativo: !pacote.ativo })
      .eq('id', pacote.id);
    carregar();
  };

  const excluir = async (pacote: Plano) => {
    // Check if it has students first
    const { count } = await supabase
      .from('alunos')
      .select('*', { count: 'exact', head: true })
      .eq('plano_id', pacote.id);

    if (count && count > 0) {
      alert(t('packages.hasStudents'));
      return;
    }

    if (!confirm(t('packages.deleteConfirm', { name: pacote.nome }))) return;
    const { error } = await supabase.from('planos').update({ deleted_at: new Date().toISOString() }).eq('id', pacote.id);
    if (error) alert(error.message);
    else carregar();
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getDurationLabel = (days: number) => {
    if (days === 30) return t('packages.days30');
    if (days === 90) return t('packages.days90');
    if (days === 180) return t('packages.days180');
    if (days === 365) return t('packages.days365');
    return `${days} dias`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-white">{t('packages.title')}</h1>
        <button
          type="button"
          onClick={abrirNovo}
          className="btn-primary px-4 py-2 text-sm flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span> {t('packages.new')}
        </button>
      </div>

      {erro && !modalOpen && (
        <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-4 py-2">{erro}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-gray-400">{t('common.loading')}</p>
        ) : pacotes.length === 0 ? (
          <p className="text-gray-400">{t('packages.empty')}</p>
        ) : (
          pacotes.map((pacote) => (
            <div key={pacote.id} className={`glass-card p-6 rounded-2xl flex flex-col justify-between ${!pacote.ativo ? 'opacity-60' : ''}`}>
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-white">{pacote.nome}</h3>
                  <span className={`px-2 py-1 text-xs font-semibold rounded border ${pacote.ativo ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                    {pacote.ativo ? t('packages.active') : t('packages.inactive')}
                  </span>
                </div>
                {pacote.descricao && <p className="text-gray-400 text-sm mb-4">{pacote.descricao}</p>}
                
                <div className="text-2xl font-bold text-white mb-1">
                  {formatPrice(pacote.preco)}
                </div>
                <div className="text-sm text-purple-400 mb-4">
                  {getDurationLabel(pacote.duracao_dias || 30)}
                </div>

                {pacote.beneficios && pacote.beneficios.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {pacote.beneficios.map((serv, i) => (
                      <span key={i} className="px-2 py-1 bg-white/5 text-gray-300 rounded text-xs">
                        {serv}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 border-t border-white/10 pt-4 mt-auto">
                <button
                  onClick={() => abrirEditar(pacote)}
                  className="flex-1 py-2 text-sm text-center text-purple-400 hover:bg-white/5 rounded transition-colors"
                >
                  {t('packages.edit')}
                </button>
                <button
                  onClick={() => toggleAtivo(pacote)}
                  className="flex-1 py-2 text-sm text-center text-gray-300 hover:bg-white/5 rounded transition-colors"
                >
                  {pacote.ativo ? t('packages.inactive') : t('packages.active')}
                </button>
                <button
                  onClick={() => excluir(pacote)}
                  className="flex-1 py-2 text-sm text-center text-red-400 hover:bg-white/5 rounded transition-colors"
                >
                  {t('packages.delete')}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal title={editando ? t('packages.edit') : t('packages.new')} open={modalOpen} onClose={() => setModalOpen(false)}>
        {erro && <p className="text-red-400 text-sm mb-3">{erro}</p>}
        <form onSubmit={handleSalvar} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">{t('packages.name')}</label>
            <input
              required
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">{t('packages.description')}</label>
            <input
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t('packages.price')}</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={form.preco}
                onChange={(e) => setForm({ ...form, preco: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t('packages.duration')}</label>
              <select
                value={form.duracao_dias}
                onChange={(e) => setForm({ ...form, duracao_dias: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50 appearance-none"
              >
                <option value={30} className="bg-gray-900">{t('packages.days30')}</option>
                <option value={90} className="bg-gray-900">{t('packages.days90')}</option>
                <option value={180} className="bg-gray-900">{t('packages.days180')}</option>
                <option value={365} className="bg-gray-900">{t('packages.days365')}</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">{t('packages.services')}</label>
            <div className="flex gap-2 mb-2">
              <input
                value={novoServico}
                onChange={(e) => setNovoServico(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    adicionarServico();
                  }
                }}
                placeholder={t('packages.addService')}
                className="flex-1 px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
              />
              <button
                type="button"
                onClick={adicionarServico}
                className="px-4 py-2 bg-purple-600/20 text-purple-400 rounded-xl hover:bg-purple-600/30 transition-colors"
              >
                +
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.beneficios.map((serv, i) => (
                <span key={i} className="px-3 py-1 bg-white/10 text-white rounded-full text-sm flex items-center gap-2">
                  {serv}
                  <button type="button" onClick={() => removerServico(serv)} className="text-gray-400 hover:text-white">&times;</button>
                </span>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-white cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={form.ativo}
              onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
              className="rounded border-gray-700 bg-gray-900 text-purple-500 focus:ring-purple-500 focus:ring-offset-gray-900"
            />
            {t('packages.active')}
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
