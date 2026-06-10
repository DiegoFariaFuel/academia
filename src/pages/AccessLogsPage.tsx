/// <reference types="w3c-web-serial" />
import { useCallback, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';
import { Html5Qrcode } from 'html5-qrcode';
import type { Aluno, CheckinHoje, TipoBiometria } from '../types/database';
import { loadModels, detectSingleFace, findBestMatch, jsonToDescriptor } from '../lib/faceRecognition';

export default function AccessLogsPage() {
  const [checkins, setCheckins] = useState<CheckinHoje[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Camera State
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null);
  const [cameraError, setCameraError] = useState('');

  // Web Serial State
  const [port, setPort] = useState<SerialPort | null>(null);
  const [serialReader, setSerialReader] = useState<ReadableStreamDefaultReader | null>(null);
  const [serialError, setSerialError] = useState('');
  const [serialStatus, setSerialStatus] = useState<'desconectado' | 'conectado' | 'lendo'>('desconectado');

  // Facial Recognition State
  const [faceModalOpen, setFaceModalOpen] = useState(false);
  const faceVideoRef = useRef<HTMLVideoElement>(null);
  const faceStreamRef = useRef<MediaStream | null>(null);
  const faceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [faceStatus, setFaceStatus] = useState<'idle' | 'loading' | 'scanning' | 'matched'>('idle');
  const [faceError, setFaceError] = useState('');
  const [lastMatchName, setLastMatchName] = useState('');
  const knownFacesRef = useRef<{ alunoId: string; descriptor: Float32Array; nome: string }[]>([]);
  const cooldownRef = useRef<Set<string>>(new Set());

  // --- Sistema de Som (Beeps) ---
  const playSound = useCallback((type: 'success' | 'error') => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
        
        setTimeout(() => {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(1200, ctx.currentTime);
          gain2.gain.setValueAtTime(0.1, ctx.currentTime);
          osc2.start();
          osc2.stop(ctx.currentTime + 0.15);
        }, 150);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {}
  }, []);

  const carregar = useCallback(async () => {
    const { data, error } = await supabase.from('vw_checkins_hoje').select('*').limit(100);

    if (error) {
      const fallback = await supabase
        .from('checkins')
        .select('id, created_at, tipo, acesso, motivo_negado, confianca, alunos(nome, foto_url)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (fallback.data) {
        setCheckins(
          fallback.data.map((c: Record<string, unknown>) => ({
            id: c.id as string,
            created_at: c.created_at as string,
            nome: (c.alunos as { nome: string })?.nome ?? '—',
            foto_url: (c.alunos as { foto_url: string | null })?.foto_url ?? null,
            tipo: c.tipo as TipoBiometria,
            acesso: c.acesso as boolean,
            motivo_negado: c.motivo_negado as string | null,
            confianca: c.confianca as number | null,
          })),
        );
      }
    } else {
      setCheckins((data as CheckinHoje[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    carregar();
    const interval = setInterval(carregar, 15000);
    return () => clearInterval(interval);
  }, [carregar]);

  // --- HTML5 QR Code Scanner ---
  const iniciarCamera = async () => {
    setCameraModalOpen(true);
    setCameraError('');
    
    // Pequeno delay para garantir que o modal montou a div 'reader'
    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode('qr-reader');
        setScanner(html5QrCode);
        
        await html5QrCode.start(
          { facingMode: "user" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            html5QrCode.pause();
            const acesso = await processarCheckin(decodedText, 'facial', 100, 'webcam-qr');
            if (acesso) {
              playSound('success');
              // Se a catraca física estiver conectada, manda abrir também!
              if (port) {
                await enviarComandoAbertura(port);
              }
            } else {
              playSound('error');
            }
            // Retoma leitura após 2 segundos
            setTimeout(() => {
              if (html5QrCode.getState() === 2) { // se não foi parado totalmente
                html5QrCode.resume();
              }
            }, 2000);
          },
          (errorMessage) => {
            // ignorar erros de scan frame-a-frame
          }
        );
      } catch (err) {
        setCameraError('Erro ao acessar câmera: ' + (err instanceof Error ? err.message : String(err)));
      }
    }, 100);
  };

  const pararCamera = async () => {
    setCameraModalOpen(false);
    if (scanner) {
      try {
        await scanner.stop();
        scanner.clear();
      } catch (e) {
        console.error("Erro ao parar scanner", e);
      }
      setScanner(null);
    }
  };

  // --- Web Serial API ---
  const conectarSerial = async () => {
    if (!('serial' in navigator)) {
      setSerialError('Seu navegador não suporta a Web Serial API (Requer Chrome/Edge no PC).');
      return;
    }
    
    try {
      setSerialError('');
      const selectedPort = await navigator.serial.requestPort();
      await selectedPort.open({ baudRate: 9600 });
      setPort(selectedPort);
      setSerialStatus('conectado');
      
      if (!selectedPort.readable) {
        throw new Error("Porta não legível.");
      }
      const decoder = new TextDecoderStream();
      const readableStreamClosed = selectedPort.readable.pipeTo(decoder.writable as any);
      const reader = decoder.readable.getReader();
      setSerialReader(reader);
      
      // Loop infinito de leitura da porta Serial
      leituraSerialLoop(reader, selectedPort);
    } catch (err) {
      setSerialError('Erro ao conectar porta serial: ' + (err instanceof Error ? err.message : String(err)));
      setSerialStatus('desconectado');
    }
  };

  const leituraSerialLoop = async (reader: ReadableStreamDefaultReader, currentPort: SerialPort) => {
    let buffer = '';
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          buffer += value;
          // Suponha que o leitor envia dados terminados em \n ou \r
          if (buffer.includes('\n') || buffer.includes('\r')) {
            const hash = buffer.trim();
            buffer = ''; // limpa o buffer
            
            if (hash.length > 0) {
              setSerialStatus('lendo');
              
              // Em um sistema real, você buscaria de quem é o hash
              // Aqui chamaremos uma RPC simulada, mas no banco real, a RPC buscaria por biometria
              const { data: biometria } = await supabase
                .from('biometrias')
                .select('aluno_id')
                .eq('hash', hash)
                .maybeSingle();

              if (biometria) {
                const acesso = await processarCheckin(biometria.aluno_id, 'digital', 99, 'porta-serial');
                if (acesso) {
                  playSound('success');
                  await enviarComandoAbertura(currentPort);
                } else {
                  playSound('error');
                }
              } else {
                playSound('error');
                setSerialError('Hash biométrico/RFID não reconhecido: ' + hash);
              }
              
              setTimeout(() => setSerialStatus('conectado'), 2000);
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro de leitura serial:', error);
      desconectarSerial();
    }
  };

  const enviarComandoAbertura = async (currentPort: SerialPort) => {
    if (currentPort.writable) {
      const encoder = new TextEncoder();
      const writer = currentPort.writable.getWriter();
      // Envia comando genérico de relé (depende da catraca, ex: "OPEN\n" ou hex)
      await writer.write(encoder.encode("OPEN\n"));
      writer.releaseLock();
    }
  };

  const desconectarSerial = async () => {
    try {
      if (serialReader) {
        await serialReader.cancel();
      }
      if (port) {
        await port.close();
      }
    } catch (e) {}
    setPort(null);
    setSerialReader(null);
    setSerialStatus('desconectado');
  };

  // --- Função Comum de Checkin ---
  const processarCheckin = async (aluno_id: string, tipo: TipoBiometria, confianca: number, dispositivo: string) => {
    const { data, error } = await supabase.rpc('registrar_checkin', {
      p_aluno_id: aluno_id,
      p_tipo: tipo,
      p_confianca: confianca,
      p_dispositivo: dispositivo,
    });
    carregar();
    if (error) {
      console.error(error);
      return false;
    }
    return true;
  };

  // --- Reconhecimento Facial por IA ---
  const iniciarReconhecimentoFacial = async () => {
    setFaceModalOpen(true);
    setFaceError('');
    setFaceStatus('loading');
    setLastMatchName('');

    try {
      // 1. Load AI models
      await loadModels();

      // 2. Load all facial biometrics from DB
      const { data: bios, error } = await supabase
        .from('biometrias')
        .select('aluno_id, hash, alunos(nome)')
        .eq('tipo', 'facial')
        .eq('ativo', true);

      if (error) throw error;

      const faces: { alunoId: string; descriptor: Float32Array; nome: string }[] = [];
      for (const b of (bios ?? [])) {
        try {
          const descriptor = jsonToDescriptor(b.hash);
          if (descriptor.length === 128) {
            faces.push({
              alunoId: b.aluno_id,
              descriptor,
              nome: (b.alunos as any)?.nome ?? 'Desconhecido',
            });
          }
        } catch {
          // Skip invalid hashes
        }
      }
      knownFacesRef.current = faces;

      if (faces.length === 0) {
        setFaceError('Nenhuma biometria facial cadastrada. Cadastre rostos na página de Biometrias primeiro.');
        setFaceStatus('idle');
        return;
      }

      // 3. Open webcam
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });
      faceStreamRef.current = stream;
      if (faceVideoRef.current) {
        faceVideoRef.current.srcObject = stream;
        await faceVideoRef.current.play();
      }

      setFaceStatus('scanning');

      // 4. Start detection loop (every 600ms)
      faceIntervalRef.current = setInterval(async () => {
        if (!faceVideoRef.current) return;
        try {
          const descriptor = await detectSingleFace(faceVideoRef.current);
          if (!descriptor) return;

          const match = findBestMatch(descriptor, knownFacesRef.current, 0.55);
          if (match && !cooldownRef.current.has(match.alunoId)) {
            // MATCH FOUND!
            cooldownRef.current.add(match.alunoId);
            const matchedFace = knownFacesRef.current.find((f) => f.alunoId === match.alunoId);
            setLastMatchName(matchedFace?.nome ?? '');
            setFaceStatus('matched');

            const acesso = await processarCheckin(match.alunoId, 'facial', Math.round((1 - match.distance) * 100), 'webcam-facial');
            if (acesso) {
              playSound('success');
              if (port) {
                await enviarComandoAbertura(port);
              }
            } else {
              playSound('error');
            }

            // 5-second cooldown per student
            setTimeout(() => {
              cooldownRef.current.delete(match.alunoId);
              setFaceStatus('scanning');
              setLastMatchName('');
            }, 5000);
          }
        } catch {
          // Skip frame errors
        }
      }, 600);
    } catch (err) {
      setFaceError('Erro: ' + (err instanceof Error ? err.message : String(err)));
      setFaceStatus('idle');
    }
  };

  const pararReconhecimentoFacial = () => {
    if (faceIntervalRef.current) {
      clearInterval(faceIntervalRef.current);
      faceIntervalRef.current = null;
    }
    if (faceStreamRef.current) {
      faceStreamRef.current.getTracks().forEach((t) => t.stop());
      faceStreamRef.current = null;
    }
    setFaceModalOpen(false);
    setFaceStatus('idle');
    cooldownRef.current.clear();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Monitor de Hardware</h1>
          <p className="text-sm text-gray-400 mt-1">
            Conexão nativa e tempo real com dispositivos da recepção.
          </p>
        </div>
        
        <div className="flex gap-3 flex-wrap">
          <button
            type="button"
            onClick={iniciarCamera}
            aria-label="Ativar Câmera QR"
            className="px-4 py-2 glass-panel hover:bg-white/5 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2 border border-gray-800"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">qr_code_scanner</span> QR Code
          </button>

          <button
            type="button"
            onClick={iniciarReconhecimentoFacial}
            aria-label="Ativar Reconhecimento Facial"
            className="px-4 py-2 glass-panel hover:bg-purple-500/10 text-purple-400 rounded-xl text-sm font-medium transition-all flex items-center gap-2 border border-purple-500/30"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">face</span> Reconhecimento Facial
          </button>
          
          {serialStatus === 'desconectado' ? (
            <button
              type="button"
              onClick={conectarSerial}
              className="btn-primary px-4 py-2 text-sm flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">usb</span> Conectar Catraca (COM)
            </button>
          ) : (
            <button
              type="button"
              onClick={desconectarSerial}
              className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-sm font-medium flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px] animate-pulse">cable</span> 
              {serialStatus === 'lendo' ? 'Lendo...' : 'Desconectar Catraca'}
            </button>
          )}
        </div>
      </div>

      {serialError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
          <span className="material-symbols-outlined">error</span> {serialError}
        </div>
      )}

      <div className="glass-card rounded-2xl overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-gray-900/80 border-b border-gray-800">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Horário</th>
              <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Aluno</th>
              <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Método Físico</th>
              <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Catraca</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                  Aguardando eventos do hardware...
                </td>
              </tr>
            ) : checkins.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                  Nenhum check-in registrado na recepção hoje.
                </td>
              </tr>
            ) : (
              checkins.map((c) => (
                <tr key={c.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-400 font-medium">
                    {new Date(c.created_at).toLocaleTimeString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-white">{c.nome}</td>
                  <td className="px-6 py-4 text-sm text-gray-400 capitalize flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">
                      {c.tipo === 'facial' ? 'qr_code' : 'fingerprint'}
                    </span>
                    {c.tipo}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {c.acesso ? (
                      <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1 rounded-full text-xs font-semibold">Giro Liberado</span>
                    ) : (
                      <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full text-xs font-semibold">
                        Bloqueado {c.motivo_negado ? `(${c.motivo_negado})` : ''}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal title="Leitor QR Code Ativo" open={cameraModalOpen} onClose={pararCamera}>
        <div className="space-y-4">
          {cameraError ? (
            <p className="text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-sm">{cameraError}</p>
          ) : (
            <>
              <div className="bg-black/50 border border-gray-800 rounded-xl overflow-hidden aspect-video relative flex items-center justify-center">
                <div id="qr-reader" className="w-full h-full [&>video]:w-full [&>video]:h-full [&>video]:object-cover border-0"></div>
              </div>
              <p className="text-gray-400 text-sm text-center">
                Aponte o QR Code do aluno para a lente. A leitura e liberação são instantâneas.
              </p>
            </>
          )}
          <button onClick={pararCamera} className="glass-panel w-full py-3 rounded-xl border border-gray-800 hover:bg-gray-800/50 transition-all text-white font-medium">
            Desligar Câmera
          </button>
        </div>
      </Modal>

      {/* --- Facial Recognition Modal --- */}
      <Modal title="Reconhecimento Facial Ativo" open={faceModalOpen} onClose={pararReconhecimentoFacial}>
        <div className="space-y-4">
          {faceError ? (
            <p className="text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-sm">{faceError}</p>
          ) : (
            <>
              <div className="bg-black/50 border border-gray-800 rounded-xl overflow-hidden aspect-video relative flex items-center justify-center">
                <video ref={faceVideoRef} className="w-full h-full object-cover" muted playsInline />

                {faceStatus === 'loading' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 gap-2">
                    <span className="material-symbols-outlined text-purple-400 text-4xl animate-spin">neurology</span>
                    <p className="text-purple-400 text-sm animate-pulse">Carregando IA e biometrias…</p>
                  </div>
                )}

                {faceStatus === 'scanning' && (
                  <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur px-3 py-1.5 rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-green-400 text-xs font-medium">Escaneando rostos…</span>
                  </div>
                )}

                {faceStatus === 'matched' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-900/40 backdrop-blur-sm">
                    <span className="material-symbols-outlined text-green-400 text-6xl">check_circle</span>
                    <p className="text-green-400 text-lg font-bold mt-2">{lastMatchName}</p>
                    <p className="text-green-300 text-sm">Acesso liberado!</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">
                  {knownFacesRef.current.length} rosto(s) cadastrado(s)
                </span>
                <span className="text-gray-500 text-xs">
                  Distância máx: 0.55 • Cooldown: 5s
                </span>
              </div>
            </>
          )}
          <button
            onClick={pararReconhecimentoFacial}
            className="glass-panel w-full py-3 rounded-xl border border-gray-800 hover:bg-gray-800/50 transition-all text-white font-medium"
          >
            Desligar Reconhecimento Facial
          </button>
        </div>
      </Modal>
    </div>
  );
}
