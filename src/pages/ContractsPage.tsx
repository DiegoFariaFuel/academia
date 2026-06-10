import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/auth.store';
import type { Contrato, Aluno } from '../types/database';

export default function ContractsPage() {
  const academiaId = useAuthStore((s) => s.user?.academiaId || null);
  
  const [contratos, setContratos] = useState<(Contrato & { alunos: Aluno })[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);

  const [novoContratoOpen, setNovoContratoOpen] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState('');
  const [tipoSelecionado, setTipoSelecionado] = useState('Matrícula');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    const [cRes, aRes] = await Promise.all([
      supabase.from('contratos').select('*, alunos(*)').order('created_at', { ascending: false }),
      supabase.from('alunos').select('*').eq('status', 'ativo').order('nome')
    ]);
    
    setContratos(cRes.data as any || []);
    setAlunos(aRes.data as Aluno[] || []);
    setLoading(false);
  };

  const gerarContrato = async () => {
    if (!alunoSelecionado) return;
    await supabase.from('contratos').insert({
      academia_id: academiaId,
      aluno_id: alunoSelecionado,
      tipo: tipoSelecionado,
      status: 'pendente_assinatura'
    });
    setNovoContratoOpen(false);
    carregarDados();
  };

  const assinarContrato = async (id: string) => {
    await supabase.from('contratos').update({
      status: 'assinado',
      assinado_em: new Date().toISOString(),
      ip_assinatura: '192.168.1.1' // fake ip for demo
    }).eq('id', id);
    carregarDados();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Contratos e LGPD</h1>
          <p className="text-gray-400">Gestão de termos de aceite e contratos assinados</p>
        </div>
        <button onClick={() => setNovoContratoOpen(true)} className="btn-primary">Gerar Novo Contrato</button>
      </div>

      {novoContratoOpen && (
        <div className="glass-panel p-6 rounded-2xl mb-6">
          <h3 className="text-xl font-bold text-white mb-4">Gerar Contrato para Aluno</h3>
          <div className="flex gap-4">
            <select value={alunoSelecionado} onChange={e => setAlunoSelecionado(e.target.value)} className="flex-1 bg-gray-900/50 border border-gray-800 rounded-xl p-3 text-white">
              <option value="">Selecione o Aluno</option>
              {alunos.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
            <select value={tipoSelecionado} onChange={e => setTipoSelecionado(e.target.value)} className="w-48 bg-gray-900/50 border border-gray-800 rounded-xl p-3 text-white">
              <option value="Matrícula">Matrícula / Plano</option>
              <option value="LGPD">Termo LGPD</option>
              <option value="Personal">Personal Trainer</option>
            </select>
            <button onClick={gerarContrato} className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 rounded-xl">Gerar Documento</button>
            <button onClick={() => setNovoContratoOpen(false)} className="text-gray-400 hover:text-white px-4">Cancelar</button>
          </div>
        </div>
      )}

      <div className="glass-panel rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/5">
            <tr className="text-gray-400 text-sm border-b border-white/5">
              <th className="p-4 font-medium">Aluno</th>
              <th className="p-4 font-medium">Tipo de Documento</th>
              <th className="p-4 font-medium">Data Emissão</th>
              <th className="p-4 font-medium text-center">Status</th>
              <th className="p-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {contratos.map(c => (
              <tr key={c.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="p-4 text-white font-bold">{c.alunos?.nome}</td>
                <td className="p-4 text-gray-300">{c.tipo}</td>
                <td className="p-4 text-gray-400">{new Date(c.created_at).toLocaleDateString('pt-BR')}</td>
                <td className="p-4 text-center">
                  {c.status === 'assinado' ? (
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded uppercase font-bold">Assinado</span>
                  ) : (
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded uppercase font-bold">Pendente</span>
                  )}
                </td>
                <td className="p-4 text-right">
                  {c.status !== 'assinado' ? (
                    <button onClick={() => assinarContrato(c.id)} className="text-purple-400 hover:text-white font-medium">Registrar Assinatura (Teste)</button>
                  ) : (
                    <div className="text-xs text-gray-500 flex flex-col items-end">
                      <span>{new Date(c.assinado_em!).toLocaleString('pt-BR')}</span>
                      <span>IP: {c.ip_assinatura}</span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {contratos.length === 0 && !loading && (
              <tr><td colSpan={5} className="p-6 text-center text-gray-500">Nenhum contrato gerado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
