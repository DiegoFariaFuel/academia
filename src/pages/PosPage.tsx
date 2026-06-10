import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';
import { useAuthStore } from '../stores/auth.store';
import type { Produto, Venda, Aluno } from '../types/database';

export default function PosPage() {
  const academiaId = useAuthStore((s) => s.user?.academiaId || null);
  
  const [activeTab, setActiveTab] = useState<'pdv' | 'estoque'>('pdv');
  const [loading, setLoading] = useState(true);

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  
  // States PDV
  const [carrinho, setCarrinho] = useState<{produto: Produto, qtde: number}[]>([]);
  const [alunoSelecionadoId, setAlunoSelecionadoId] = useState<string>('');
  const [finalizandoVenda, setFinalizandoVenda] = useState(false);

  // States Estoque
  const [modalProdutoOpen, setModalProdutoOpen] = useState(false);
  const [salvandoProduto, setSalvandoProduto] = useState(false);
  const [produtoEmEdicao, setProdutoEmEdicao] = useState<Produto | null>(null);
  
  const [formProduto, setFormProduto] = useState({
    nome: '',
    preco: '',
    estoque: ''
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    const [pRes, aRes] = await Promise.all([
      supabase.from('produtos').select('*').eq('ativo', true).order('nome'),
      supabase.from('alunos').select('*').eq('status', 'ativo').order('nome')
    ]);
    
    setProdutos((pRes.data as Produto[]) || []);
    setAlunos((aRes.data as Aluno[]) || []);
    setLoading(false);
  };

  // Funções PDV
  const adicionarAoCarrinho = (produto: Produto) => {
    if (produto.estoque <= 0) {
      alert('Produto sem estoque!');
      return;
    }

    const itemExistente = carrinho.find(item => item.produto.id === produto.id);
    if (itemExistente) {
      if (itemExistente.qtde >= produto.estoque) {
        alert('Estoque insuficiente para adicionar mais.');
        return;
      }
      setCarrinho(carrinho.map(item => 
        item.produto.id === produto.id ? { ...item, qtde: item.qtde + 1 } : item
      ));
    } else {
      setCarrinho([...carrinho, { produto, qtde: 1 }]);
    }
  };

  const removerDoCarrinho = (produtoId: string) => {
    setCarrinho(carrinho.filter(item => item.produto.id !== produtoId));
  };

  const totalCarrinho = carrinho.reduce((acc, item) => acc + (item.produto.preco * item.qtde), 0);

  const finalizarVenda = async () => {
    if (carrinho.length === 0) return;
    setFinalizandoVenda(true);

    try {
      // 1. Criar a venda
      const { data: venda, error: vendaError } = await supabase.from('vendas').insert({
        academia_id: academiaId,
        aluno_id: alunoSelecionadoId || null,
        valor_total: totalCarrinho
      }).select().single();

      if (vendaError) throw vendaError;

      // 2. Registrar movimentações e baixar estoque
      for (const item of carrinho) {
        await supabase.from('movimentacoes_estoque').insert({
          produto_id: item.produto.id,
          tipo: 'venda',
          quantidade: item.qtde,
          venda_id: venda.id
        });

        await supabase.from('produtos').update({
          estoque: item.produto.estoque - item.qtde
        }).eq('id', item.produto.id);
      }

      setCarrinho([]);
      setAlunoSelecionadoId('');
      alert('Venda finalizada com sucesso!');
      await carregarDados(); // atualiza o estoque na tela
    } catch (e) {
      alert('Erro ao finalizar venda.');
      console.error(e);
    } finally {
      setFinalizandoVenda(false);
    }
  };

  // Funções Estoque
  const abrirModalProduto = (prod?: Produto) => {
    if (prod) {
      setProdutoEmEdicao(prod);
      setFormProduto({ nome: prod.nome, preco: prod.preco.toString(), estoque: prod.estoque.toString() });
    } else {
      setProdutoEmEdicao(null);
      setFormProduto({ nome: '', preco: '', estoque: '' });
    }
    setModalProdutoOpen(true);
  };

  const salvarProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvandoProduto(true);

    const payload = {
      academia_id: academiaId,
      nome: formProduto.nome,
      preco: parseFloat(formProduto.preco),
      estoque: parseInt(formProduto.estoque),
      ativo: true
    };

    if (produtoEmEdicao) {
      await supabase.from('produtos').update(payload).eq('id', produtoEmEdicao.id);
    } else {
      await supabase.from('produtos').insert(payload);
    }

    await carregarDados();
    setModalProdutoOpen(false);
    setSalvandoProduto(false);
  };

  const inativarProduto = async (id: string) => {
    if (!window.confirm('Excluir este produto?')) return;
    await supabase.from('produtos').update({ ativo: false }).eq('id', id);
    carregarDados();
  };

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">PDV e Estoque</h1>
          <p className="text-gray-400">Venda de produtos e controle de inventário</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-white/5 pb-2">
        <button onClick={() => setActiveTab('pdv')} className={`pb-2 px-1 font-medium transition-colors ${activeTab === 'pdv' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}>
          Caixa / Ponto de Venda
        </button>
        <button onClick={() => setActiveTab('estoque')} className={`pb-2 px-1 font-medium transition-colors ${activeTab === 'estoque' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}>
          Gerenciar Estoque
        </button>
      </div>

      {loading ? (
        <div className="text-gray-400">Carregando...</div>
      ) : activeTab === 'pdv' ? (
        // TAB: PDV
        <div className="flex flex-1 gap-6 min-h-0">
          <div className="w-2/3 glass-panel rounded-2xl p-6 overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-4">Produtos Disponíveis</h2>
            <div className="grid grid-cols-3 gap-4">
              {produtos.map(p => (
                <button
                  key={p.id}
                  disabled={p.estoque <= 0}
                  onClick={() => adicionarAoCarrinho(p)}
                  className={`bg-gray-900/50 p-4 rounded-xl border border-white/5 text-left transition-colors hover:border-purple-500/30 ${p.estoque <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <p className="font-bold text-white mb-1">{p.nome}</p>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-green-400 font-medium">R$ {p.preco.toFixed(2)}</span>
                    <span className="text-gray-500">Estoque: {p.estoque}</span>
                  </div>
                </button>
              ))}
              {produtos.length === 0 && <p className="text-gray-500 col-span-3 text-center mt-10">Nenhum produto cadastrado.</p>}
            </div>
          </div>

          <div className="w-1/3 glass-panel rounded-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-white/5">
              <h2 className="text-lg font-bold text-white">Carrinho</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {carrinho.map(item => (
                <div key={item.produto.id} className="flex justify-between items-center bg-gray-900/30 p-3 rounded-lg border border-white/5">
                  <div>
                    <p className="text-white font-medium">{item.produto.nome}</p>
                    <p className="text-xs text-gray-400">{item.qtde}x de R$ {item.produto.preco.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-green-400 font-bold">R$ {(item.produto.preco * item.qtde).toFixed(2)}</span>
                    <button onClick={() => removerDoCarrinho(item.produto.id)} className="text-gray-500 hover:text-red-400 material-symbols-outlined text-lg">close</button>
                  </div>
                </div>
              ))}
              {carrinho.length === 0 && <p className="text-gray-500 text-center text-sm mt-10">O carrinho está vazio.</p>}
            </div>

            <div className="p-4 bg-gray-900/80 border-t border-white/5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total da Venda</span>
                <span className="text-2xl font-bold text-white">R$ {totalCarrinho.toFixed(2)}</span>
              </div>
              
              <div>
                <label className="text-xs text-gray-400 block mb-1">Vincular a Aluno (Opcional)</label>
                <select value={alunoSelecionadoId} onChange={e => setAlunoSelecionadoId(e.target.value)} className="w-full bg-gray-800 rounded p-2 text-white border border-gray-700 text-sm">
                  <option value="">-- Cliente Avulso --</option>
                  {alunos.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                </select>
              </div>

              <button 
                onClick={finalizarVenda} 
                disabled={carrinho.length === 0 || finalizandoVenda} 
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
              >
                {finalizandoVenda ? 'Processando...' : 'Finalizar e Baixar Estoque'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        // TAB: ESTOQUE
        <div className="glass-panel rounded-2xl p-6 overflow-y-auto min-h-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Produtos em Estoque</h2>
            <button onClick={() => abrirModalProduto()} className="btn-primary flex items-center gap-2">
              <span className="material-symbols-outlined">add</span>
              Novo Produto
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-sm">
                  <th className="pb-3 font-medium">Nome do Produto</th>
                  <th className="pb-3 font-medium">Preço (R$)</th>
                  <th className="pb-3 font-medium">Estoque Atual</th>
                  <th className="pb-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {produtos.map(p => (
                  <tr key={p.id} className="border-b border-gray-800/50 hover:bg-white/5 transition-colors">
                    <td className="py-3 text-white font-medium">{p.nome}</td>
                    <td className="py-3 text-green-400">R$ {p.preco.toFixed(2)}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${p.estoque <= 5 ? 'bg-red-500/20 text-red-400' : 'bg-gray-800 text-gray-300'}`}>
                        {p.estoque} un
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button onClick={() => abrirModalProduto(p)} className="text-gray-400 hover:text-white mr-3">Editar</button>
                      <button onClick={() => inativarProduto(p.id)} className="text-gray-400 hover:text-red-400">Excluir</button>
                    </td>
                  </tr>
                ))}
                {produtos.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-gray-500">Nenhum produto cadastrado.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Criar Produto */}
      <Modal title={produtoEmEdicao ? "Editar Produto" : "Novo Produto"} open={modalProdutoOpen} onClose={() => setModalProdutoOpen(false)}>
        <form onSubmit={salvarProduto} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nome do Produto</label>
            <input required type="text" value={formProduto.nome} onChange={e => setFormProduto({...formProduto, nome: e.target.value})} className="w-full px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50" placeholder="Ex: Whey Protein Concentrado" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Preço (R$)</label>
              <input required type="number" step="0.01" value={formProduto.preco} onChange={e => setFormProduto({...formProduto, preco: e.target.value})} className="w-full px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Qtd em Estoque</label>
              <input required type="number" value={formProduto.estoque} onChange={e => setFormProduto({...formProduto, estoque: e.target.value})} className="w-full px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50" />
            </div>
          </div>
          <button type="submit" disabled={salvandoProduto} className="btn-primary w-full py-3 mt-4">Salvar Produto</button>
        </form>
      </Modal>
    </div>
  );
}
