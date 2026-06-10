import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';
import { useAuthStore } from '../stores/auth.store';
import type { Comissao, Staff } from '../types/database';

export default function CommissionsPage() {
  const academiaId = useAuthStore((s) => s.user?.academiaId || null);
  
  const [comissoes, setComissoes] = useState<(Comissao & { staff: Staff })[]>([]);
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const [form, setForm] = useState({
    staff_id: '',
    valor: '',
    tipo: 'Aula Extra',
    data_pagamento: ''
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    const [cRes, sRes] = await Promise.all([
      supabase.from('comissoes').select('*, staff(*)').order('created_at', { ascending: false }),
      supabase.from('staff').select('*').order('nome')
    ]);
    
    setComissoes(cRes.data as any || []);
    setStaffs(sRes.data as Staff[] || []);
    setLoading(false);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    
    await supabase.from('comissoes').insert({
      academia_id: academiaId,
      staff_id: form.staff_id,
      valor: parseFloat(form.valor),
      tipo: form.tipo,
      status: form.data_pagamento ? 'pago' : 'pendente',
      data_pagamento: form.data_pagamento || null
    });
    
    await carregarDados();
    setModalOpen(false);
    setSalvando(false);
  };

  const marcarPago = async (id: string) => {
    await supabase.from('comissoes').update({
      status: 'pago',
      data_pagamento: new Date().toISOString().split('T')[0]
    }).eq('id', id);
    carregarDados();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Comissões (Personal Trainers)</h1>
          <p className="text-gray-400">Controle de pagamentos de professores e personals</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">Lançar Comissão</button>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="glass-panel p-6 rounded-2xl border border-white/5">
          <p className="text-gray-400 text-sm">Total a Pagar (Pendente)</p>
          <p className="text-2xl font-bold text-red-400">R$ {comissoes.filter(c => c.status === 'pendente').reduce((a,b) => a + b.valor, 0).toFixed(2)}</p>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-white/5">
          <p className="text-gray-400 text-sm">Total Pago (Histórico)</p>
          <p className="text-2xl font-bold text-green-400">R$ {comissoes.filter(c => c.status === 'pago').reduce((a,b) => a + b.valor, 0).toFixed(2)}</p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/5">
            <tr className="text-gray-400 text-sm border-b border-white/5">
              <th className="p-4 font-medium">Profissional</th>
              <th className="p-4 font-medium">Referência (Tipo)</th>
              <th className="p-4 font-medium text-right">Valor (R$)</th>
              <th className="p-4 font-medium text-center">Status</th>
              <th className="p-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {comissoes.map(c => (
              <tr key={c.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="p-4 text-white font-bold">{c.staff?.nome}</td>
                <td className="p-4 text-gray-300">{c.tipo}</td>
                <td className="p-4 text-right font-mono text-white">R$ {c.valor.toFixed(2)}</td>
                <td className="p-4 text-center">
                  {c.status === 'pago' ? (
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded uppercase font-bold">Pago em {c.data_pagamento && new Date(c.data_pagamento).toLocaleDateString('pt-BR')}</span>
                  ) : (
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded uppercase font-bold">Pendente</span>
                  )}
                </td>
                <td className="p-4 text-right">
                  {c.status === 'pendente' && (
                    <button onClick={() => marcarPago(c.id)} className="text-green-400 hover:text-white font-medium">Informar Pagamento</button>
                  )}
                </td>
              </tr>
            ))}
            {comissoes.length === 0 && !loading && (
              <tr><td colSpan={5} className="p-6 text-center text-gray-500">Nenhuma comissão lançada.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal title="Lançar Nova Comissão" open={modalOpen} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSalvar} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Profissional / Professor</label>
            <select required value={form.staff_id} onChange={e => setForm({...form, staff_id: e.target.value})} className="w-full px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50">
              <option value="">Selecione...</option>
              {staffs.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Tipo de Comissão</label>
            <select required value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} className="w-full px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50">
              <option value="Aula Extra">Aula Extra / Substituição</option>
              <option value="Venda Plano">Venda de Plano</option>
              <option value="Personal Trainer">Personal Trainer (Repasse)</option>
              <option value="Avaliação Física">Avaliação Física</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Valor (R$)</label>
            <input required type="number" step="0.01" value={form.valor} onChange={e => setForm({...form, valor: e.target.value})} className="w-full px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Data de Pagamento (Deixe vazio se for Pagar Depois)</label>
            <input type="date" value={form.data_pagamento} onChange={e => setForm({...form, data_pagamento: e.target.value})} className="w-full px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50" />
          </div>
          <button type="submit" disabled={salvando} className="btn-primary w-full py-3 mt-4">Lançar Comissão</button>
        </form>
      </Modal>

    </div>
  );
}
