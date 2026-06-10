import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';
import { useAuthStore } from '../stores/auth.store';
import type { CaixaDiario, Despesa } from '../types/database';

export default function FinancialPage() {
  const academiaId = useAuthStore((s) => s.user?.academiaId || null);
  
  const [activeTab, setActiveTab] = useState<'caixa' | 'despesas'>('caixa');
  const [loading, setLoading] = useState(true);

  // States Caixa
  const [caixas, setCaixas] = useState<CaixaDiario[]>([]);
  const [modalCaixaOpen, setModalCaixaOpen] = useState(false);
  const [formCaixa, setFormCaixa] = useState({ data: new Date().toISOString().split('T')[0], abertura: '' });

  // States Despesas
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [modalDespesaOpen, setModalDespesaOpen] = useState(false);
  const [formDespesa, setFormDespesa] = useState({
    categoria: 'Energia',
    valor: '',
    vencimento: new Date().toISOString().split('T')[0],
    pago: false
  });

  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (activeTab === 'caixa') carregarCaixas();
    else carregarDespesas();
  }, [activeTab]);

  const carregarCaixas = async () => {
    setLoading(true);
    const { data } = await supabase.from('caixa_diario').select('*').order('data', { ascending: false });
    setCaixas((data as CaixaDiario[]) || []);
    setLoading(false);
  };

  const carregarDespesas = async () => {
    setLoading(true);
    const { data } = await supabase.from('despesas').select('*').order('vencimento', { ascending: true });
    setDespesas((data as Despesa[]) || []);
    setLoading(false);
  };

  // HANDLERS CAIXA
  const handleAbrirCaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    await supabase.from('caixa_diario').insert({
      academia_id: academiaId,
      data: formCaixa.data,
      abertura: parseFloat(formCaixa.abertura)
    });
    await carregarCaixas();
    setModalCaixaOpen(false);
    setSalvando(false);
  };

  const fecharCaixa = async (id: string) => {
    const fechamento = prompt('Qual o valor de fechamento (gaveta + cartões)?');
    if (!fechamento) return;
    await supabase.from('caixa_diario').update({ fechamento: parseFloat(fechamento) }).eq('id', id);
    carregarCaixas();
  };

  // HANDLERS DESPESAS
  const handleSalvarDespesa = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    await supabase.from('despesas').insert({
      academia_id: academiaId,
      categoria: formDespesa.categoria,
      valor: parseFloat(formDespesa.valor),
      vencimento: formDespesa.vencimento,
      pago: formDespesa.pago
    });
    await carregarDespesas();
    setModalDespesaOpen(false);
    setSalvando(false);
  };

  const alternarPagamento = async (id: string, atual: boolean) => {
    await supabase.from('despesas').update({ pago: !atual }).eq('id', id);
    carregarDespesas();
  };

  const CATEGORIAS_DESPESA = ['Aluguel', 'Energia', 'Água', 'Salários', 'Equipamentos', 'Manutenção', 'Marketing', 'Impostos', 'Outros'];

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Financeiro e ERP</h1>
          <p className="text-gray-400">Controle de caixa diário e gestão de contas a pagar</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-white/5 pb-2">
        <button onClick={() => setActiveTab('caixa')} className={`pb-2 px-1 font-medium transition-colors ${activeTab === 'caixa' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}>
          Caixa Diário (Recepção)
        </button>
        <button onClick={() => setActiveTab('despesas')} className={`pb-2 px-1 font-medium transition-colors ${activeTab === 'despesas' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}>
          Contas a Pagar (Despesas)
        </button>
      </div>

      <div className="glass-panel rounded-2xl p-6 overflow-y-auto min-h-0 flex-1">
        {loading ? (
          <div className="text-gray-400">Carregando...</div>
        ) : activeTab === 'caixa' ? (
          // ABA CAIXA
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Histórico de Caixa</h2>
              <button onClick={() => setModalCaixaOpen(true)} className="btn-primary flex items-center gap-2">
                <span className="material-symbols-outlined">point_of_sale</span>
                Abrir Novo Caixa
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 text-sm">
                    <th className="pb-3 font-medium">Data</th>
                    <th className="pb-3 font-medium text-right">Valor Abertura</th>
                    <th className="pb-3 font-medium text-right">Valor Fechamento</th>
                    <th className="pb-3 font-medium text-center">Status</th>
                    <th className="pb-3 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {caixas.map(c => (
                    <tr key={c.id} className="border-b border-gray-800/50 hover:bg-white/5 transition-colors">
                      <td className="py-4 text-white font-medium">{new Date(c.data).toLocaleDateString('pt-BR')}</td>
                      <td className="py-4 text-right font-mono">R$ {c.abertura.toFixed(2)}</td>
                      <td className="py-4 text-right font-mono text-green-400">{c.fechamento ? `R$ ${c.fechamento.toFixed(2)}` : '-'}</td>
                      <td className="py-4 text-center">
                        {c.fechamento ? (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded font-bold uppercase">Fechado</span>
                        ) : (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded font-bold uppercase">Aberto</span>
                        )}
                      </td>
                      <td className="py-4 text-right">
                        {!c.fechamento && (
                          <button onClick={() => fecharCaixa(c.id)} className="text-purple-400 hover:text-white font-medium">Informar Fechamento</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {caixas.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-gray-500">Nenhum caixa aberto.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          // ABA DESPESAS
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Contas a Pagar</h2>
              <button onClick={() => setModalDespesaOpen(true)} className="btn-primary flex items-center gap-2">
                <span className="material-symbols-outlined">receipt_long</span>
                Lançar Despesa
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 text-sm">
                    <th className="pb-3 font-medium">Categoria</th>
                    <th className="pb-3 font-medium">Vencimento</th>
                    <th className="pb-3 font-medium text-right">Valor</th>
                    <th className="pb-3 font-medium text-center">Status</th>
                    <th className="pb-3 font-medium text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {despesas.map(d => {
                    const isVencido = !d.pago && new Date(d.vencimento) < new Date();
                    return (
                    <tr key={d.id} className="border-b border-gray-800/50 hover:bg-white/5 transition-colors">
                      <td className="py-4 text-white font-medium flex items-center gap-2">
                        <span className="material-symbols-outlined text-gray-500">category</span>
                        {d.categoria}
                      </td>
                      <td className={`py-4 ${isVencido ? 'text-red-400 font-bold' : 'text-gray-300'}`}>
                        {new Date(d.vencimento).toLocaleDateString('pt-BR')}
                        {isVencido && <span className="ml-2 text-[10px] uppercase text-red-500 border border-red-500 px-1 rounded">Vencida</span>}
                      </td>
                      <td className="py-4 text-right font-mono text-white">R$ {d.valor.toFixed(2)}</td>
                      <td className="py-4 text-center">
                        <span className={`px-2 py-1 text-xs rounded font-bold uppercase ${d.pago ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {d.pago ? 'Pago' : 'Aberto'}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <button onClick={() => alternarPagamento(d.id, d.pago)} className="text-gray-400 hover:text-white transition-colors">
                          <span className="material-symbols-outlined text-[20px]">{d.pago ? 'cancel' : 'check_circle'}</span>
                        </button>
                      </td>
                    </tr>
                  )})}
                  {despesas.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-gray-500">Nenhuma despesa lançada.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal Abertura de Caixa */}
      <Modal title="Abrir Caixa do Dia" open={modalCaixaOpen} onClose={() => setModalCaixaOpen(false)}>
        <form onSubmit={handleAbrirCaixa} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Data</label>
            <input required type="date" value={formCaixa.data} onChange={e => setFormCaixa({...formCaixa, data: e.target.value})} className="w-full px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Valor em Dinheiro na Gaveta (R$)</label>
            <input required type="number" step="0.01" value={formCaixa.abertura} onChange={e => setFormCaixa({...formCaixa, abertura: e.target.value})} className="w-full px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50" placeholder="Ex: 150.00" />
          </div>
          <button type="submit" disabled={salvando} className="btn-primary w-full py-3 mt-4">Registrar Abertura</button>
        </form>
      </Modal>

      {/* Modal Despesa */}
      <Modal title="Lançar Nova Despesa" open={modalDespesaOpen} onClose={() => setModalDespesaOpen(false)}>
        <form onSubmit={handleSalvarDespesa} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Categoria</label>
            <select required value={formDespesa.categoria} onChange={e => setFormDespesa({...formDespesa, categoria: e.target.value})} className="w-full px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50">
              {CATEGORIAS_DESPESA.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Valor (R$)</label>
              <input required type="number" step="0.01" value={formDespesa.valor} onChange={e => setFormDespesa({...formDespesa, valor: e.target.value})} className="w-full px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Vencimento</label>
              <input required type="date" value={formDespesa.vencimento} onChange={e => setFormDespesa({...formDespesa, vencimento: e.target.value})} className="w-full px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-white bg-gray-900/50 p-3 rounded-xl border border-gray-800 cursor-pointer">
            <input type="checkbox" checked={formDespesa.pago} onChange={e => setFormDespesa({...formDespesa, pago: e.target.checked})} className="rounded bg-gray-800 border-gray-700 text-purple-500 focus:ring-purple-500" />
            Já está paga?
          </label>
          <button type="submit" disabled={salvando} className="btn-primary w-full py-3 mt-4">Salvar Despesa</button>
        </form>
      </Modal>

    </div>
  );
}
