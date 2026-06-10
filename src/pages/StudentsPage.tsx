import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';
import { useSubscription } from '../hooks/useSubscription';
import { parseStudentsCsv, toInsertPayload, type StudentImportRow } from '../lib/importStudents';
import type { Aluno, StatusAluno, Plano } from '../types/database';
import { useAuthStore } from '../stores/auth.store';

const STATUS_CLASS: Record<StatusAluno, string> = {
  ativo: 'bg-green-500/10 text-green-400 border-green-500/20',
  inativo: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  bloqueado: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  cancelado: 'bg-red-500/10 text-red-400 border-red-500/20',
  trial: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

const emptyForm = {
  nome: '',
  email: '',
  telefone: '',
  cpf: '',
  plano_id: '',
  status: 'ativo' as StatusAluno,
  valor_mensalidade: '',
  is_personal: false,
  personal_id: '',
};

export default function StudentsPage() {
  const { t } = useTranslation();
  const { canAddStudent, studentLimit, activeStudents } = useSubscription();
  const academiaId = useAuthStore((s) => s.user?.academiaId || null);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [pacotes, setPacotes] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<StudentImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const [editando, setEditando] = useState<Aluno | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const statusLabel = useMemo(
    (): Record<StatusAluno, string> => ({
      ativo: t('students.statusAtivo'),
      inativo: t('students.statusInativo'),
      bloqueado: 'Bloqueado',
      cancelado: t('students.statusCancelado'),
      trial: 'Trial',
    }),
    [t],
  );

  const carregar = useCallback(async () => {
    setLoading(true);
    const { data: alunosData, error: alunosError } = await supabase
      .from('alunos')
      .select('*, aluno_planos(status, planos(nome))')
      .is('deleted_at', null)
      .order('nome', { ascending: true });

    const { data: pacotesData } = await supabase
      .from('planos')
      .select('*')
      .is('deleted_at', null)
      .order('preco', { ascending: true });

    if (alunosError) setErro(alunosError.message);
    setAlunos((alunosData as any[]) ?? []);
    if (pacotesData) setPacotes(pacotesData as Plano[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const filtrados = useMemo(() => {
    const filtroMin = filtro.toLowerCase();
    return alunos.filter(
      (a) =>
        a.nome.toLowerCase().includes(filtroMin) ||
        a.email.toLowerCase().includes(filtroMin),
    );
  }, [alunos, filtro]);

  const personais = useMemo(() => alunos.filter(a => a.is_personal), [alunos]);

  const abrirNovo = () => {
    if (!canAddStudent) {
      setErro(t('subscription.limitReached', { limit: studentLimit ?? 0 }));
      return;
    }
    setEditando(null);
    setForm(emptyForm);
    setErro('');
    setModalOpen(true);
  };

  const abrirImport = () => {
    setImportRows([]);
    setImportMsg('');
    setImportOpen(true);
  };

  const handleCsvFile = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    const { rows, errors } = parseStudentsCsv(text);
    setImportRows(rows);
    if (rows.length === 0) {
      setImportMsg(t('students.importEmpty'));
    } else if (errors.length > 0) {
      setImportMsg(t('students.importPreview', { count: rows.length }));
    } else {
      setImportMsg(t('students.importPreview', { count: rows.length }));
    }
  };

  const handleImport = async () => {
    if (importRows.length === 0) {
      setImportMsg(t('students.importEmpty'));
      return;
    }

    const slotsLeft =
      studentLimit === null ? importRows.length : Math.max(0, studentLimit - activeStudents);
    if (slotsLeft === 0) {
      setImportMsg(t('subscription.limitReached', { limit: studentLimit ?? 0 }));
      return;
    }

    const batch = importRows.slice(0, slotsLeft);
    if (batch.length < importRows.length) {
      setImportMsg(t('students.importLimit', { count: batch.length }));
    }

    setImporting(true);
    const { error } = await supabase.from('alunos').insert(toInsertPayload(batch, academiaId));
    setImporting(false);

    if (error) {
      setImportMsg(error.message);
      return;
    }

    setImportMsg(t('students.importDone', { count: batch.length }));
    setImportRows([]);
    carregar();
    if (batch.length === importRows.length) {
      setTimeout(() => setImportOpen(false), 1500);
    }
  };

  const abrirEditar = (aluno: Aluno) => {
    setEditando(aluno);
    setForm({
      nome: aluno.nome,
      email: aluno.email,
      telefone: aluno.telefone ?? '',
      cpf: aluno.cpf ?? '',
      plano_id: aluno.plano_id ?? '',
      status: aluno.status,
      valor_mensalidade: '',
      is_personal: aluno.is_personal || false,
      personal_id: aluno.personal_id ?? '',
    });
    setErro('');
    setModalOpen(true);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setErro('');

    if (!editando && !canAddStudent) {
      setErro(t('subscription.limitReached', { limit: studentLimit ?? 0 }));
      setSalvando(false);
      return;
    }

    const payload = {
      academia_id: academiaId,
      nome: form.nome,
      email: form.email,
      telefone: form.telefone || null,
      cpf: form.cpf || null,
      plano_id: form.plano_id || null,
      status: form.status,
      is_personal: form.is_personal,
      personal_id: form.personal_id || null,
    };

    let novoAlunoId: string | null = null;

    if (editando) {
      const { error } = await supabase.from('alunos').update(payload).eq('id', editando.id);
      if (error) {
        setErro(error.message);
        setSalvando(false);
        return;
      }
    } else {
      const { error, data } = await supabase.from('alunos').insert({
        ...payload,
        data_vencimento: new Date(Date.now() + 30 * 86400000).toISOString(),
      }).select('id').single();

      if (error) {
        setErro(error.message);
        setSalvando(false);
        return;
      }
      novoAlunoId = data?.id;

      if (novoAlunoId && form.valor_mensalidade) {
        let numMeses = 1;
        if (form.plano_id) {
          const pacoteSelecionado = pacotes.find(p => p.id === form.plano_id);
          if (pacoteSelecionado) {
            numMeses = Math.max(1, Math.round((pacoteSelecionado.duracao_dias || 30) / 30));
          }
        }

        const pagamentosToInsert = Array.from({ length: numMeses }).map((_, i) => {
          const dataVencimento = new Date();
          dataVencimento.setMonth(dataVencimento.getMonth() + i);
          return {
            aluno_id: novoAlunoId,
            valor: Number(form.valor_mensalidade),
            status: 'pendente',
            vencimento: dataVencimento.toISOString(),
          };
        });

        const { error: pgError } = await supabase.from('pagamentos').insert(pagamentosToInsert);
        if (pgError) {
          setErro('Aluno criado, mas falha ao gerar pagamentos: ' + pgError.message);
          setSalvando(false);
          return;
        }
      }
    }

    setSalvando(false);
    setModalOpen(false);
    setEditando(null);
    setForm(emptyForm);
    carregar();
  };

  const excluir = async (aluno: Aluno) => {
    if (!confirm(t('students.deleteConfirm', { name: aluno.nome }))) return;
    const { error } = await supabase.from('alunos').delete().eq('id', aluno.id);
    if (error) alert(error.message);
    else carregar();
  };

  const toggleAcesso = async (aluno: Aluno) => {
    await supabase
      .from('alunos')
      .update({ acesso_liberado: !aluno.acesso_liberado })
      .eq('id', aluno.id);
    carregar();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">{t('sidebar.students')}</h1>
          {studentLimit !== null && (
            <p className="text-sm text-gray-500 mt-1">
              {activeStudents} / {studentLimit}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={abrirImport}
            aria-label={t('students.import')}
            className="px-4 py-2 glass-panel hover:bg-white/5 text-white rounded-xl transition-all text-sm font-medium"
          >
            {t('students.import')}
          </button>
          <button
            type="button"
            onClick={abrirNovo}
            aria-label={t('students.new')}
            className="btn-primary px-4 py-2 text-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span> {t('students.new')}
          </button>
        </div>
      </div>

      {erro && !modalOpen && (
        <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-4 py-2">{erro}</p>
      )}

      <input
            type="search"
            placeholder={t('students.search')}
            aria-label={t('students.search')}
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
        className="w-full max-w-md px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
      />

      <div className="glass-card rounded-2xl overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-gray-900/80 border-b border-gray-800">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-300">{t('students.name')}</th>
              <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-300">{t('students.email')}</th>
              <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-300">{t('students.status')}</th>
              <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-300">{t('students.plan')}</th>
              <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-300">{t('students.access')}</th>
              <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-300">{t('students.dueDate')}</th>
              <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-300">{t('students.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                  {t('students.loading')}
                </td>
              </tr>
            ) : filtrados.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                  {t('students.empty')}
                </td>
              </tr>
            ) : (
              filtrados.map((aluno) => (
                <tr key={aluno.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="px-6 py-4 text-sm text-white">{aluno.nome}</td>
                  <td className="px-6 py-4 text-sm text-gray-400">{aluno.email}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-300 capitalize">{statusLabel[aluno.status as StatusAluno]}</span>
                      {aluno.is_personal && <span className="text-[10px] uppercase font-bold text-blue-400">Personal Trainer</span>}
                      {!aluno.is_personal && aluno.personal_id && (
                        <span className="text-[10px] text-gray-500">Personal: {personais.find(p => p.id === aluno.personal_id)?.nome || '—'}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400 capitalize">
                    {(aluno as any).aluno_planos?.find((ap: any) => ap.status === 'ativo' || ap.status === 'pago')?.planos?.nome || '—'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      type="button"
                      onClick={() => toggleAcesso(aluno)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all hover:opacity-80 ${
                        aluno.acesso_liberado
                          ? 'bg-green-500/10 text-green-400 border-green-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}
                    >
                      {aluno.acesso_liberado ? t('students.accessGranted') : t('students.accessBlocked')}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {aluno.data_vencimento
                      ? new Date(aluno.data_vencimento).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm space-x-3">
                    <button
                      type="button"
                      onClick={() => abrirEditar(aluno)}
                      aria-label={`${t('students.edit')} ${aluno.nome}`}
                      className="text-purple-400 hover:text-purple-300 transition-colors font-medium"
                    >
                      {t('students.edit')}
                    </button>
                    <button
                      type="button"
                      onClick={() => excluir(aluno)}
                      aria-label={`${t('students.delete')} ${aluno.nome}`}
                      className="text-red-400 hover:text-red-300 transition-colors font-medium"
                    >
                      {t('students.delete')}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal title={editando ? t('students.editTitle') : t('students.newTitle')} open={modalOpen} onClose={() => setModalOpen(false)}>
        {erro && <p className="text-red-400 text-sm mb-3">{erro}</p>}
        <form onSubmit={handleSalvar} className="space-y-3">
          <input
            required
            placeholder={t('students.name')}
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
          />
          <input
            required
            type="email"
            placeholder={t('students.email')}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
          />
          <input
            placeholder={t('students.phone')}
            value={form.telefone}
            onChange={(e) => setForm({ ...form, telefone: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
          />
          <input
            placeholder={t('students.cpf')}
            value={form.cpf}
            onChange={(e) => setForm({ ...form, cpf: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
          />
          {!editando && (
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Valor da Mensalidade (R$)"
              value={form.valor_mensalidade}
              onChange={(e) => setForm({ ...form, valor_mensalidade: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
            />
          )}
          <select
            value={form.plano_id}
            onChange={(e) => {
              const selectedId = e.target.value;
              const pacoteSelecionado = pacotes.find(p => p.id === selectedId);
              setForm({ 
                ...form, 
                plano_id: selectedId,
                valor_mensalidade: pacoteSelecionado && !editando ? pacoteSelecionado.preco.toString() : form.valor_mensalidade
              });
            }}
            className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50 appearance-none"
          >
            <option value="" className="bg-gray-900">Selecione um pacote...</option>
            {pacotes.map(p => (
              <option key={p.id} value={p.id} className="bg-gray-900">{p.nome} - R$ {p.preco.toFixed(2)}</option>
            ))}
          </select>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as StatusAluno })}
            className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50 appearance-none"
          >
            {(Object.keys(statusLabel) as StatusAluno[]).map((s) => (
              <option key={s} value={s} className="bg-gray-900">
                {statusLabel[s]}
              </option>
            ))}
          </select>
          
          <div className="flex items-center gap-3 p-3 bg-gray-900/50 border border-gray-800 rounded-xl">
            <input
              type="checkbox"
              id="is_personal"
              checked={form.is_personal}
              onChange={(e) => setForm({ ...form, is_personal: e.target.checked, personal_id: '' })}
              className="w-5 h-5 rounded border-gray-600 text-purple-600 focus:ring-purple-500 bg-gray-800"
            />
            <label htmlFor="is_personal" className="text-sm text-white font-medium cursor-pointer">
              Atua como Personal Trainer (b2b)
            </label>
          </div>

          {!form.is_personal && personais.length > 0 && (
            <select
              value={form.personal_id || ''}
              onChange={(e) => setForm({ ...form, personal_id: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50 appearance-none"
            >
              <option value="" className="bg-gray-900">Nenhum Personal vinculado</option>
              {personais.map(p => (
                <option key={p.id} value={p.id} className="bg-gray-900">{p.nome}</option>
              ))}
            </select>
          )}
          <button
            type="submit"
            disabled={salvando}
            className="btn-primary w-full py-3 mt-2 disabled:opacity-50"
          >
            {salvando ? t('students.saving') : t('common.save')}
          </button>
        </form>
      </Modal>

      <Modal title={t('students.importTitle')} open={importOpen} onClose={() => setImportOpen(false)}>
        <p className="text-gray-400 text-sm mb-4">{t('students.importHelp')}</p>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => void handleCsvFile(e.target.files?.[0] ?? null)}
          className="w-full text-sm text-gray-300 mb-4"
        />
        {importMsg && <p className="text-sm text-gray-300 mb-4">{importMsg}</p>}
        <button
          type="button"
          disabled={importing || importRows.length === 0}
          onClick={() => void handleImport()}
          className="btn-primary w-full py-3 disabled:opacity-50"
        >
          {importing ? t('students.importing') : t('students.importSubmit')}
        </button>
      </Modal>
    </div>
  );
}
