import { useCallback, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';
import type { Aluno, TipoBiometria } from '../types/database';
import { loadModels, detectSingleFace, descriptorToJson } from '../lib/faceRecognition';

interface BiometriaRow {
  id: string;
  aluno_id: string;
  tipo: TipoBiometria;
  hash: string;
  dispositivo: string | null;
  confianca: number | null;
  ativo: boolean;
  created_at: string;
  alunos: { nome: string; email: string } | null;
}

export default function BiometricsPage() {
  const [rows, setRows] = useState<BiometriaRow[]>([]);
  const [alunos, setAlunos] = useState<Pick<Aluno, 'id' | 'nome'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [erro, setErro] = useState('');
  const [form, setForm] = useState({
    aluno_id: '',
    tipo: 'facial' as TipoBiometria,
    hash: '',
    dispositivo: '',
    confianca: '95',
  });

  // Webcam capture state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [capturing, setCapturing] = useState(false);
  const [captureStatus, setCaptureStatus] = useState<'idle' | 'loading' | 'detecting' | 'done' | 'error'>('idle');
  const streamRef = useRef<MediaStream | null>(null);

  const iniciarCaptura = async () => {
    setCapturing(true);
    setCaptureStatus('loading');
    setErro('');
    try {
      await loadModels();
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCaptureStatus('detecting');
    } catch (err) {
      setErro('Erro ao acessar câmera ou carregar modelos: ' + (err instanceof Error ? err.message : String(err)));
      setCaptureStatus('error');
      setCapturing(false);
    }
  };

  const capturarRosto = async () => {
    if (!videoRef.current) return;
    setCaptureStatus('detecting');
    const descriptor = await detectSingleFace(videoRef.current);
    if (descriptor) {
      setForm((prev) => ({
        ...prev,
        hash: descriptorToJson(descriptor),
        dispositivo: 'webcam-facial',
        confianca: '99',
      }));
      setCaptureStatus('done');
      pararCaptura();
    } else {
      setErro('Nenhum rosto detectado. Posicione-se melhor e tente novamente.');
    }
  };

  const pararCaptura = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCapturing(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const carregar = useCallback(async () => {
    setLoading(true);
    const [bioRes, alunosRes] = await Promise.all([
      supabase
        .from('biometrias')
        .select('*, alunos(nome, email)')
        .order('created_at', { ascending: false }),
      supabase.from('alunos').select('id, nome').order('nome'),
    ]);
    if (bioRes.error) setErro(bioRes.error.message);
    setRows((bioRes.data as BiometriaRow[]) ?? []);
    setAlunos((alunosRes.data as Pick<Aluno, 'id' | 'nome'>[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    const { error } = await supabase.from('biometrias').insert({
      aluno_id: form.aluno_id,
      tipo: form.tipo,
      hash: form.hash,
      dispositivo: form.dispositivo || null,
      confianca: Number(form.confianca),
    });
    if (error) {
      setErro(error.message);
      return;
    }
    setModalOpen(false);
    setForm({ aluno_id: '', tipo: 'facial', hash: '', dispositivo: '', confianca: '95' });
    carregar();
  };

  const toggleAtivo = async (row: BiometriaRow) => {
    await supabase.from('biometrias').update({ ativo: !row.ativo }).eq('id', row.id);
    carregar();
  };

  const remover = async (id: string) => {
    if (!confirm('Remover template biométrico?')) return;
    await supabase.from('biometrias').delete().eq('id', id);
    carregar();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Biometrias</h1>
          <p className="text-sm text-gray-400 mt-1">
            Gerencie os dados biométricos (hash) usados pela catraca e webcam.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          aria-label="Cadastrar template"
          className="btn-primary px-4 py-2 text-sm flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span> Cadastrar template
        </button>
      </div>

      {erro && !modalOpen && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm font-medium">
          {erro}
        </div>
      )}

      <div className="glass-card rounded-2xl overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead className="bg-gray-900/80 border-b border-gray-800">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Aluno</th>
              <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Tipo</th>
              <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Hash</th>
              <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Confiança</th>
              <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Ativo</th>
              <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                  Carregando dados biométricos...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                  Nenhuma biometria cadastrada
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold text-white">{r.alunos?.nome}</td>
                  <td className="px-6 py-4 text-sm text-gray-400 capitalize flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">
                      {r.tipo === 'facial' ? 'face' : 'fingerprint'}
                    </span>
                    {r.tipo}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono truncate max-w-[200px]">
                    {r.hash.slice(0, 16)}…
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">{r.confianca ?? '—'}%</td>
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => toggleAtivo(r)}
                      aria-label={r.ativo ? "Desativar biometria" : "Ativar biometria"}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all hover:opacity-80 ${
                        r.ativo
                          ? 'bg-green-500/10 text-green-400 border-green-500/20'
                          : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                      }`}
                    >
                      {r.ativo ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => remover(r.id)}
                      aria-label={`Excluir biometria de ${r.alunos?.nome}`}
                      className="text-red-400 text-sm hover:text-red-300 font-medium transition-colors"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal title="Novo template biométrico" open={modalOpen} onClose={() => { pararCaptura(); setModalOpen(false); }}>
        <p className="text-gray-400 text-sm mb-4">
          Capture o rosto pela webcam ou insira manualmente o hash do leitor.
        </p>
        {erro && <p className="text-red-400 text-sm mb-4">{erro}</p>}

        {/* --- Webcam Capture Section --- */}
        {form.tipo === 'facial' && (
          <div className="mb-4 space-y-3">
            {capturing ? (
              <div className="space-y-3">
                <div className="bg-black/50 border border-gray-800 rounded-xl overflow-hidden aspect-video relative flex items-center justify-center">
                  <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                  {captureStatus === 'loading' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                      <p className="text-purple-400 text-sm animate-pulse">Carregando IA de reconhecimento facial…</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={capturarRosto}
                    disabled={captureStatus === 'loading'}
                    className="btn-primary flex-1 py-2 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">face</span>
                    Capturar Rosto
                  </button>
                  <button
                    type="button"
                    onClick={pararCaptura}
                    className="px-4 py-2 glass-panel border border-gray-800 rounded-xl text-white text-sm hover:bg-gray-800/50 transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={iniciarCaptura}
                className="w-full py-3 glass-panel border border-dashed border-purple-500/40 rounded-xl text-purple-400 text-sm font-medium hover:bg-purple-500/10 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">videocam</span>
                {captureStatus === 'done' ? '✓ Rosto capturado — Capturar novamente' : 'Capturar pela Webcam'}
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <select
            required
            aria-label="Selecione o aluno"
            value={form.aluno_id}
            onChange={(e) => setForm({ ...form, aluno_id: e.target.value })}
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50 appearance-none"
          >
            <option value="" className="bg-gray-900">Selecione o aluno</option>
            {alunos.map((a) => (
              <option key={a.id} value={a.id} className="bg-gray-900">
                {a.nome}
              </option>
            ))}
          </select>
          <select
            aria-label="Tipo de biometria"
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoBiometria })}
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50 appearance-none"
          >
            <option value="facial" className="bg-gray-900">Reconhecimento Facial</option>
            <option value="digital" className="bg-gray-900">Impressão Digital</option>
          </select>
          <input
            required
            aria-label="Descriptor / Hash do template"
            placeholder={form.tipo === 'facial' ? 'Descriptor facial (gerado automaticamente pela webcam)' : 'Hash SHA-256 do template'}
            value={form.hash}
            onChange={(e) => setForm({ ...form, hash: e.target.value })}
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-purple-500/50"
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              aria-label="Dispositivo de origem"
              placeholder="Dispositivo de origem"
              value={form.dispositivo}
              onChange={(e) => setForm({ ...form, dispositivo: e.target.value })}
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
            />
            <input
              type="number"
              min="0"
              max="100"
              aria-label="Confiança (%)"
              placeholder="Confiança (%)"
              value={form.confianca}
              onChange={(e) => setForm({ ...form, confianca: e.target.value })}
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <button type="submit" className="btn-primary w-full py-3 mt-2">
            Cadastrar Template
          </button>
        </form>
      </Modal>
    </div>
  );
}
