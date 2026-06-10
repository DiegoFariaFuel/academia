import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/auth.store';
import { QRCodeSVG } from 'qrcode.react';
import AiChatbot from '../../components/portal/AiChatbot';

export default function StudentPortalPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  
  const [alunoData, setAlunoData] = useState<any>(null);
  const [treinoAtivo, setTreinoAtivo] = useState<any>(null);
  const [faturas, setFaturas] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [novoTicket, setNovoTicket] = useState({ assunto: '', descricao: '' });
  
  const [tab, setTab] = useState<'treino'|'financeiro'|'catraca'|'suporte'>('treino');

  useEffect(() => {
    const load = async () => {
      const { data: aluno } = await supabase
        .from('alunos')
        .select('*')
        .eq('auth_user_id', user?.id ?? '')
        .maybeSingle();

      if (!aluno) {
        setLoading(false);
        return;
      }
      setAlunoData(aluno);

      // Load Faturas
      const { data: fRes } = await supabase.from('faturas').select('*').eq('aluno_id', aluno.id).order('data_vencimento', { ascending: false });
      setFaturas(fRes || []);

      // Load Treino Ativo
      const { data: atRes } = await supabase.from('aluno_treinos').select('*, treinos(*, treino_exercicios(*, exercicios(*)))').eq('aluno_id', aluno.id).eq('ativo', true).maybeSingle();
      if (atRes) {
        setTreinoAtivo(atRes.treinos);
      }

      // Load Tickets
      const { data: tRes } = await supabase.from('tickets').select('*').eq('aluno_id', aluno.id).order('created_at', { ascending: false });
      setTickets(tRes || []);

      setLoading(false);
    };
    void load();
  }, [user?.id]);

  if (loading) return <div className="text-white p-6">Carregando portal...</div>;
  if (!alunoData) return <div className="text-white p-6">Conta de aluno não encontrada. Peça para a recepção vincular seu e-mail.</div>;

  return (
    <div className="max-w-md mx-auto bg-gray-950 min-h-[calc(100vh-4rem)] pb-20">
      <div className="bg-gradient-to-r from-purple-900 to-pink-900 p-6 rounded-b-3xl mb-6 shadow-lg">
        <h1 className="text-2xl font-bold text-white mb-1">Olá, {alunoData.nome.split(' ')[0]}!</h1>
        <p className="text-gray-300 text-sm">Bora treinar hoje?</p>
      </div>

      <div className="px-4 space-y-6">
        
        {/* TABS */}
        <div className="flex bg-gray-900 p-1 rounded-xl overflow-x-auto gap-1 hide-scrollbar">
          <button onClick={() => setTab('treino')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${tab === 'treino' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}>Treino</button>
          <button onClick={() => setTab('financeiro')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${tab === 'financeiro' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}>Financeiro</button>
          <button onClick={() => setTab('catraca')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${tab === 'catraca' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}>Acesso</button>
          <button onClick={() => setTab('suporte')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${tab === 'suporte' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}>Ajuda</button>
        </div>

        {/* TAB: TREINO */}
        {tab === 'treino' && (
          <div className="space-y-4">
            {!treinoAtivo ? (
              <div className="glass-panel p-6 rounded-2xl text-center text-gray-400">Nenhum treino ativo montado pelo seu professor.</div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-bold text-white">{treinoAtivo.nome}</h2>
                  <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">{treinoAtivo.foco}</span>
                </div>
                {treinoAtivo.treino_exercicios?.sort((a:any, b:any) => a.ordem - b.ordem).map((te: any) => (
                  <div key={te.id} className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-800 rounded flex items-center justify-center text-gray-400 shrink-0">
                      <span className="material-symbols-outlined">fitness_center</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-sm leading-tight mb-1">{te.exercicios?.nome}</h3>
                      <p className="text-gray-400 text-xs">{te.series} séries de {te.repeticoes}</p>
                      {te.descanso_segundos > 0 && <p className="text-xs text-purple-400 mt-1">Descanso: {te.descanso_segundos}s</p>}
                    </div>
                    <button className="w-8 h-8 rounded-full border-2 border-purple-500 flex items-center justify-center text-purple-500 hover:bg-purple-500 hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* TAB: FINANCEIRO */}
        {tab === 'financeiro' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-2">Faturas e Pagamentos</h2>
            {faturas.length === 0 && <p className="text-gray-400 text-sm">Nenhuma fatura encontrada.</p>}
            
            {faturas.map((f: any) => (
              <div key={f.id} className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-400 text-sm">Venc. {new Date(f.data_vencimento).toLocaleDateString('pt-BR')}</span>
                  {f.status === 'pago' ? (
                    <span className="text-green-400 text-xs font-bold bg-green-400/10 px-2 py-1 rounded">Pago</span>
                  ) : f.status === 'atrasado' ? (
                    <span className="text-red-400 text-xs font-bold bg-red-400/10 px-2 py-1 rounded">Atrasado</span>
                  ) : (
                    <span className="text-yellow-400 text-xs font-bold bg-yellow-400/10 px-2 py-1 rounded">Pendente</span>
                  )}
                </div>
                <div className="text-2xl font-bold text-white mb-4">R$ {f.valor.toFixed(2)}</div>
                
                {f.status !== 'pago' && (
                  <div className="flex gap-2">
                    <button className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">qr_code</span> PIX Copia/Cola
                    </button>
                    <button className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">credit_card</span> Cartão
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TAB: CATRACA */}
        {tab === 'catraca' && (
          <div className="space-y-6 text-center">
            <h2 className="text-xl font-bold text-white mb-2">Acesso à Academia</h2>
            <p className="text-gray-400 text-sm mb-6">Encoste o QR Code no leitor da catraca para liberar sua entrada hoje.</p>
            
            <div className="inline-block bg-white p-6 rounded-2xl shadow-[0_0_40px_rgba(168,85,247,0.3)] border-4 border-purple-500/20">
              <QRCodeSVG value={`ACCESS_TOKEN_${alunoData.id}`} size={220} level="Q" />
            </div>
            
            <p className="text-xs text-gray-500 mt-4">Este código é dinâmico e expira em 30 segundos.</p>
          </div>
        )}

        {/* TAB: SUPORTE */}
        {tab === 'suporte' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-2">Central de Ajuda</h2>
            <p className="text-gray-400 text-sm mb-4">Mande uma mensagem para a recepção ou professores.</p>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              await supabase.from('tickets').insert({
                aluno_id: alunoData.id,
                academia_id: alunoData.academia_id,
                assunto: novoTicket.assunto,
                descricao: novoTicket.descricao,
                prioridade: 'normal',
                status: 'aberto'
              });
              setNovoTicket({ assunto: '', descricao: '' });
              const { data } = await supabase.from('tickets').select('*').eq('aluno_id', alunoData.id).order('created_at', { ascending: false });
              setTickets(data || []);
            }} className="bg-gray-900 border border-gray-800 p-4 rounded-xl space-y-4">
              <input required value={novoTicket.assunto} onChange={e => setNovoTicket({...novoTicket, assunto: e.target.value})} placeholder="Ex: Dúvida sobre o treino, Trancar Plano" className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white text-sm" />
              <textarea required value={novoTicket.descricao} onChange={e => setNovoTicket({...novoTicket, descricao: e.target.value})} placeholder="Como podemos ajudar?" className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white text-sm h-20" />
              <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-lg text-sm">Enviar Chamado</button>
            </form>

            <div className="space-y-3 mt-6">
              <h3 className="font-bold text-white text-lg">Seus Chamados</h3>
              {tickets.length === 0 && <p className="text-gray-500 text-sm">Nenhum chamado aberto.</p>}
              {tickets.map(t => (
                <div key={t.id} className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-white">{t.assunto}</h4>
                    <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${t.status === 'resolvido' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{t.status}</span>
                  </div>
                  <p className="text-gray-400 text-sm">{t.descricao}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
      
      {/* Botão flutuante da IA */}
      <AiChatbot />
    </div>
  );
}
