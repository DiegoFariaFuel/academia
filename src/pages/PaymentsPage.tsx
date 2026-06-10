import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';
import type { Aluno, Pagamento, StatusPagamento } from '../types/database';

const STATUS_LABEL: Record<StatusPagamento, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  atrasado: 'Atrasado',
  cancelado: 'Cancelado',
  estornado: 'Estornado',
};

const STATUS_CLASS: Record<StatusPagamento, string> = {
  pendente: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  pago: 'bg-green-500/10 text-green-400 border-green-500/20',
  atrasado: 'bg-red-500/10 text-red-400 border-red-500/20',
  cancelado: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  estornado: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

type PagamentoComAluno = Pagamento & {
  alunos: { nome: string; email: string } | null;
};

export default function PaymentsPage() {
  const [pagamentos, setPagamentos] = useState<PagamentoComAluno[]>([]);
  const [alunos, setAlunos] = useState<Pick<Aluno, 'id' | 'nome'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [erro, setErro] = useState('');
  const [form, setForm] = useState({
    aluno_id: '',
    valor: '',
    status: 'pendente' as StatusPagamento,
    data_vencimento: '',
  });

  const carregar = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('pagamentos')
      .select('*, alunos(nome, email)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (filtroStatus) query = query.eq('status', filtroStatus);

    const { data, error } = await query;
    if (error) setErro(error.message);
    setPagamentos((data as PagamentoComAluno[]) ?? []);
    setLoading(false);
  }, [filtroStatus]);

  useEffect(() => {
    carregar();
    supabase
      .from('alunos')
      .select('id, nome')
      .order('nome')
      .then(({ data }) => setAlunos((data as Pick<Aluno, 'id' | 'nome'>[]) ?? []));
  }, [carregar]);

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    const { error } = await supabase.from('pagamentos').insert({
      aluno_id: form.aluno_id,
      valor: Number(form.valor),
      status: form.status,
      vencimento: form.data_vencimento || null,
      data_pagamento: form.status === 'pago' ? new Date().toISOString() : null,
    });
    if (error) {
      setErro(error.message);
      return;
    }
    setModalOpen(false);
    setForm({ aluno_id: '', valor: '', status: 'pendente', data_vencimento: '' });
    carregar();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Pagamentos</h1>
          <p className="text-sm text-gray-400 mt-1">
            Gestão financeira e faturas integradas com a Stripe.
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <select
            aria-label="Filtrar por status"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500/50 appearance-none"
          >
            <option value="" className="bg-gray-900">Todos os Status</option>
            {(Object.keys(STATUS_LABEL) as StatusPagamento[]).map((s) => (
              <option key={s} value={s} className="bg-gray-900">
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            aria-label="Novo lançamento"
            className="btn-primary px-4 py-2 text-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span> Lançamento
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead className="bg-gray-900/80 border-b border-gray-800">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Aluno</th>
              <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Valor</th>
              <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
              <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Vencimento</th>
              <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Pago em</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                  Carregando faturas...
                </td>
              </tr>
            ) : pagamentos.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                  Nenhum pagamento encontrado.
                </td>
              </tr>
            ) : (
              pagamentos.map((p) => (
                <tr key={p.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 text-sm">
                    <p className="text-white font-medium">{p.alunos?.nome ?? '—'}</p>
                    <p className="text-gray-500 text-xs">{p.alunos?.email}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-white">R$ {Number(p.valor).toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_CLASS[p.status]}`}>
                      {STATUS_LABEL[p.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {p.vencimento
                      ? new Date(p.vencimento).toLocaleDateString('pt-BR')
                      : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {p.data_pagamento
                      ? new Date(p.data_pagamento).toLocaleString('pt-BR')
                      : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal title="Novo lançamento financeiro" open={modalOpen} onClose={() => setModalOpen(false)}>
        <p className="text-gray-400 text-sm mb-4">
          Crie um lançamento manual. Lançamentos via Stripe são sincronizados automaticamente.
        </p>
        {erro && <p className="text-red-400 text-sm mb-4">{erro}</p>}
        <form onSubmit={handleCriar} className="space-y-4">
          <select
            required
            aria-label="Selecione o Aluno"
            value={form.aluno_id}
            onChange={(e) => setForm({ ...form, aluno_id: e.target.value })}
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50 appearance-none"
          >
            <option value="" className="bg-gray-900">Selecione o Aluno</option>
            {alunos.map((a) => (
              <option key={a.id} value={a.id} className="bg-gray-900">
                {a.nome}
              </option>
            ))}
          </select>
          <input
            required
            type="number"
            step="0.01"
            min="0"
            aria-label="Valor (R$)"
            placeholder="Valor (R$)"
            value={form.valor}
            onChange={(e) => setForm({ ...form, valor: e.target.value })}
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
          />
          <div className="grid grid-cols-2 gap-4">
            <select
              aria-label="Status do Pagamento"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as StatusPagamento })}
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50 appearance-none"
            >
              {(Object.keys(STATUS_LABEL) as StatusPagamento[]).map((s) => (
                <option key={s} value={s} className="bg-gray-900">
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            <input
              type="date"
              aria-label="Data de Vencimento"
              value={form.data_vencimento}
              onChange={(e) => setForm({ ...form, data_vencimento: e.target.value })}
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-gray-400 focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <button type="submit" className="btn-primary w-full py-3 mt-2">
            Salvar Lançamento
          </button>
        </form>
      </Modal>
    </div>
  );
}
