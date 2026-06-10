import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/auth.store';
import type { Ticket, Aluno } from '../types/database';
import Modal from '../components/Modal';

export default function TicketsPage() {
  const [tickets, setTickets] = useState<(Ticket & { alunos: Aluno })[]>([]);
  const [loading, setLoading] = useState(true);
  const [responderModal, setResponderModal] = useState<(Ticket & { alunos: Aluno }) | null>(null);
  const [resposta, setResposta] = useState('');

  useEffect(() => {
    carregarTickets();
  }, []);

  const carregarTickets = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('tickets')
      .select('*, alunos(*)')
      .order('created_at', { ascending: false });
    
    setTickets(data as any || []);
    setLoading(false);
  };

  const mudarStatus = async (id: string, novoStatus: string) => {
    const payload: any = { status: novoStatus };
    if (novoStatus === 'resolvido') payload.resolvido_em = new Date().toISOString();
    
    await supabase.from('tickets').update(payload).eq('id', id);
    carregarTickets();
  };

  const enviarResposta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responderModal) return;
    
    // In a real app we would save this to a ticket_messages table or trigger an email.
    // For now we just resolve it.
    await mudarStatus(responderModal.id, 'resolvido');
    setResponderModal(null);
    setResposta('');
  };

  const statusColor = (status: string) => {
    if (status === 'aberto') return 'bg-red-500/20 text-red-400';
    if (status === 'andamento') return 'bg-yellow-500/20 text-yellow-400';
    if (status === 'resolvido') return 'bg-green-500/20 text-green-400';
    return 'bg-gray-500/20 text-gray-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Central de Atendimento</h1>
          <p className="text-gray-400">Gerencie dúvidas, chamados e solicitações dos alunos</p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/5">
            <tr className="text-gray-400 text-sm border-b border-white/5">
              <th className="p-4 font-medium">Aluno</th>
              <th className="p-4 font-medium">Assunto</th>
              <th className="p-4 font-medium">Prioridade</th>
              <th className="p-4 font-medium text-center">Status</th>
              <th className="p-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {tickets.map(t => (
              <tr key={t.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="p-4 text-white font-bold">{t.alunos?.nome}</td>
                <td className="p-4 text-gray-300">
                  <span className="block font-semibold text-white">{t.assunto}</span>
                  <span className="text-xs text-gray-500 truncate max-w-[200px] inline-block">{t.descricao}</span>
                </td>
                <td className="p-4 text-gray-400 capitalize">{t.prioridade}</td>
                <td className="p-4 text-center">
                  <span className={`px-2 py-1 text-xs font-bold rounded uppercase ${statusColor(t.status)}`}>
                    {t.status}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  {t.status !== 'resolvido' && (
                    <>
                      {t.status === 'aberto' && (
                        <button onClick={() => mudarStatus(t.id, 'andamento')} className="text-yellow-400 hover:text-white font-medium">Em Andamento</button>
                      )}
                      <button onClick={() => setResponderModal(t)} className="text-purple-400 hover:text-white font-medium bg-purple-500/10 px-3 py-1 rounded">Responder</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {tickets.length === 0 && !loading && (
              <tr><td colSpan={5} className="p-6 text-center text-gray-500">Nenhum ticket aberto no momento. Tudo tranquilo!</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal title="Responder Chamado" open={!!responderModal} onClose={() => setResponderModal(null)}>
        {responderModal && (
          <form onSubmit={enviarResposta} className="space-y-4">
            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
              <p className="text-sm text-gray-400 mb-1">Dúvida de {responderModal.alunos?.nome}:</p>
              <p className="text-white font-medium">{responderModal.descricao}</p>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Sua Resposta</label>
              <textarea 
                required 
                value={resposta} 
                onChange={e => setResposta(e.target.value)} 
                rows={4}
                className="w-full bg-gray-900/50 border border-gray-800 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500/50"
                placeholder="Escreva a resposta para o aluno..."
              ></textarea>
            </div>
            
            <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl transition-colors">
              Enviar e Marcar como Resolvido
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
}
