import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { dispatchMessage } from '../lib/billing';
import Modal from '../components/Modal';
import type { Aluno, CanalMensagem, StatusMensagem } from '../types/database';

interface MensagemRow {
  id: string;
  aluno_id: string;
  canal: CanalMensagem;
  assunto: string | null;
  corpo: string;
  status: StatusMensagem;
  enviado_em: string | null;
  created_at: string;
  alunos: { nome: string; email: string } | null;
}

const CANAL_LABEL: Record<CanalMensagem, string> = {
  email: 'E-mail',
  sms: 'SMS',
  push: 'Push',
  whatsapp: 'WhatsApp',
};

const STATUS_CLASS: Record<StatusMensagem, string> = {
  enviada: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  entregue: 'bg-green-500/10 text-green-400 border-green-500/20',
  lida: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  falhou: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function MessagesPage() {
  const [rows, setRows] = useState<MensagemRow[]>([]);
  const [alunos, setAlunos] = useState<Pick<Aluno, 'id' | 'nome'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [erro, setErro] = useState('');
  const [form, setForm] = useState({
    aluno_id: '',
    canal: 'email' as CanalMensagem,
    assunto: '',
    corpo: '',
  });

  const carregar = useCallback(async () => {
    setLoading(true);
    const [msgRes, alunosRes] = await Promise.all([
      supabase
        .from('mensagens')
        .select('*, alunos(nome, email)')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase.from('alunos').select('id, nome').order('nome'),
    ]);
    setRows((msgRes.data as MensagemRow[]) ?? []);
    setAlunos((alunosRes.data as Pick<Aluno, 'id' | 'nome'>[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    const { data, error } = await supabase
      .from('mensagens')
      .insert({
        aluno_id: form.aluno_id,
        canal: form.canal,
        assunto: form.assunto || null,
        corpo: form.corpo,
        status: 'enviada',
        enviado_em: new Date().toISOString(),
      })
      .select('id')
      .single();
    if (error) {
      setErro(error.message);
      return;
    }
    if (data?.id) {
      try {
        await dispatchMessage(data.id as string);
      } catch {
        /* registrado; envio pode exigir RESEND_API_KEY */
      }
    }
    setModalOpen(false);
    setForm({ aluno_id: '', canal: 'email', assunto: '', corpo: '' });
    carregar();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Mensagens</h1>
          <p className="text-sm text-gray-400 mt-1">
            Envie comunicados e avisos para seus alunos.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          aria-label="Nova mensagem"
          className="btn-primary px-4 py-2 text-sm flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">send</span> Nova mensagem
        </button>
      </div>

      <div className="glass-card rounded-2xl overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead className="bg-gray-900/80 border-b border-gray-800">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Aluno</th>
              <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Canal</th>
              <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Assunto</th>
              <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
              <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Data</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                  Carregando mensagens...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                  Nenhuma mensagem enviada.
                </td>
              </tr>
            ) : (
              rows.map((m) => (
                <tr key={m.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold text-white">{m.alunos?.nome}</td>
                  <td className="px-6 py-4 text-sm text-gray-400">{CANAL_LABEL[m.canal]}</td>
                  <td className="px-6 py-4 text-sm text-gray-300 max-w-xs truncate">
                    {m.assunto || m.corpo.slice(0, 40)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold border capitalize ${STATUS_CLASS[m.status]}`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(m.created_at).toLocaleString('pt-BR')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal title="Enviar nova mensagem" open={modalOpen} onClose={() => setModalOpen(false)}>
        <p className="text-gray-400 text-sm mb-4">
          O aviso chegará no canal selecionado do aluno e também no Portal.
        </p>
        {erro && <p className="text-red-400 text-sm mb-4">{erro}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <select
            aria-label="Canal de Envio"
            value={form.canal}
            onChange={(e) => setForm({ ...form, canal: e.target.value as CanalMensagem })}
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50 appearance-none"
          >
            {(Object.keys(CANAL_LABEL) as CanalMensagem[]).map((c) => (
              <option key={c} value={c} className="bg-gray-900">
                {CANAL_LABEL[c]}
              </option>
            ))}
          </select>
          <input
            aria-label="Assunto da Mensagem"
            placeholder="Assunto (Opcional)"
            value={form.assunto}
            onChange={(e) => setForm({ ...form, assunto: e.target.value })}
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
          />
          <textarea
            required
            rows={4}
            aria-label="Corpo da Mensagem"
            placeholder="Escreva sua mensagem aqui..."
            value={form.corpo}
            onChange={(e) => setForm({ ...form, corpo: e.target.value })}
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50 resize-none"
          />
          <button type="submit" className="btn-primary w-full py-3 mt-2">
            Disparar Mensagem
          </button>
        </form>
      </Modal>
    </div>
  );
}
