import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';
import { useAuthStore } from '../stores/auth.store';
import type { Turma, Modalidade, DiaSemana, StatusTurma, Staff } from '../types/database';

const DIAS_SEMANA: Record<DiaSemana, string> = {
  seg: 'Segunda-feira',
  ter: 'Terça-feira',
  qua: 'Quarta-feira',
  qui: 'Quinta-feira',
  sex: 'Sexta-feira',
  sab: 'Sábado',
  dom: 'Domingo',
};

const STATUS_TURMA_LABEL: Record<StatusTurma, string> = {
  aberta: 'Aberta',
  lotada: 'Lotada',
  cancelada: 'Cancelada',
  concluida: 'Concluída',
};

const emptyForm = {
  modalidade_id: '',
  instrutor_id: '',
  dia_semana: 'seg' as DiaSemana,
  horario: '18:00',
  data_inicio: new Date().toISOString().split('T')[0],
  data_fim: '',
  status: 'aberta' as StatusTurma,
};

// Extended type for rendering
type TurmaView = Turma & {
  modalidades: Pick<Modalidade, 'nome' | 'duracao_minutos' | 'capacidade_maxima'> | null;
  staff: Pick<Staff, 'nome'> | null;
};

export default function ClassesPage() {
  const { t } = useTranslation();
  const academiaId = useAuthStore((s) => s.user?.academiaId || null);
  
  const [turmas, setTurmas] = useState<TurmaView[]>([]);
  const [modalidades, setModalidades] = useState<Modalidade[]>([]);
  const [instrutores, setInstrutores] = useState<Staff[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<TurmaView | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    
    // Load Turmas with relations
    const { data: turmasData, error: turmasError } = await supabase
      .from('turmas')
      .select('*, modalidades(nome, duracao_minutos, capacidade_maxima), staff(nome)')
      .order('horario', { ascending: true });

    // Load dependencies for form
    const { data: modData } = await supabase.from('modalidades').select('*').eq('ativo', true);
    const { data: staffData } = await supabase.from('staff').select('*').is('deleted_at', null);

    if (turmasError) setErro(turmasError.message);
    setTurmas((turmasData as any) ?? []);
    setModalidades(modData || []);
    setInstrutores(staffData || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const abrirNovo = () => {
    setEditando(null);
    setForm(emptyForm);
    setErro('');
    setModalOpen(true);
  };

  const abrirEditar = (turma: TurmaView) => {
    setEditando(turma);
    setForm({
      modalidade_id: turma.modalidade_id,
      instrutor_id: turma.instrutor_id || '',
      dia_semana: turma.dia_semana,
      horario: turma.horario.substring(0, 5), // "18:00:00" -> "18:00"
      data_inicio: turma.data_inicio,
      data_fim: turma.data_fim || '',
      status: turma.status,
    });
    setErro('');
    setModalOpen(true);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setErro('');

    const payload = {
      academia_id: academiaId,
      modalidade_id: form.modalidade_id,
      instrutor_id: form.instrutor_id || null,
      dia_semana: form.dia_semana,
      horario: form.horario,
      data_inicio: form.data_inicio,
      data_fim: form.data_fim || null,
      status: form.status,
    };

    if (editando) {
      const { error } = await supabase.from('turmas').update(payload).eq('id', editando.id);
      if (error) {
        setErro(error.message);
        setSalvando(false);
        return;
      }
    } else {
      const { error } = await supabase.from('turmas').insert(payload);
      if (error) {
        setErro(error.message);
        setSalvando(false);
        return;
      }
    }

    setSalvando(false);
    setModalOpen(false);
    carregar();
  };

  const excluir = async (turma: Turma) => {
    if (!confirm('Deseja excluir esta turma?')) return;
    const { error } = await supabase.from('turmas').delete().eq('id', turma.id);
    if (error) alert(error.message);
    else carregar();
  };

  const formatHorario = (timeStr: string) => timeStr.substring(0, 5);

  const turmasPorDia = useMemo(() => {
    const agrupado: Record<string, TurmaView[]> = {};
    Object.keys(DIAS_SEMANA).forEach(dia => agrupado[dia] = []);
    
    turmas.forEach(t => {
      if (agrupado[t.dia_semana]) {
        agrupado[t.dia_semana].push(t);
      }
    });
    return agrupado;
  }, [turmas]);

  const ORDER = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Turmas & Agenda</h1>
          <p className="text-sm text-gray-400 mt-1">
            Programe os horários das aulas coletivas na sua academia.
          </p>
        </div>
        <button
          type="button"
          onClick={abrirNovo}
          className="btn-primary px-4 py-2 text-sm flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span> Nova Turma
        </button>
      </div>

      {erro && !modalOpen && (
        <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-4 py-2">{erro}</p>
      )}

      {loading ? (
        <p className="text-gray-400">{t('common.loading')}</p>
      ) : turmas.length === 0 ? (
        <div className="glass-panel p-8 text-center rounded-2xl">
          <p className="text-gray-400 mb-4">Nenhuma turma agendada.</p>
          <button onClick={abrirNovo} className="text-purple-400 font-medium hover:text-purple-300">
            Criar primeira turma
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-7 lg:grid-cols-4 md:grid-cols-2 gap-4">
          {ORDER.map((dia) => {
            const turmasDia = turmasPorDia[dia];
            if (turmasDia.length === 0) return null;

            return (
              <div key={dia} className="flex flex-col gap-3">
                <div className="bg-gray-900/80 rounded-xl p-3 border border-white/5 text-center sticky top-0 z-10">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    {DIAS_SEMANA[dia as DiaSemana].split('-')[0]}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">{turmasDia.length} aula(s)</p>
                </div>
                
                {turmasDia.map((turma) => (
                  <div key={turma.id} className={`glass-card p-4 rounded-xl flex flex-col gap-2 ${turma.status === 'cancelada' ? 'opacity-50' : ''}`}>
                    <div className="flex justify-between items-start">
                      <span className="text-lg font-bold text-purple-400">
                        {formatHorario(turma.horario)}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                        turma.status === 'aberta' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                        turma.status === 'lotada' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 
                        'bg-gray-500/10 text-gray-400 border-gray-500/20'
                      }`}>
                        {STATUS_TURMA_LABEL[turma.status]}
                      </span>
                    </div>
                    
                    <div>
                      <p className="text-white font-medium">{turma.modalidades?.nome || 'Sem Modalidade'}</p>
                      <p className="text-xs text-gray-400">
                        {turma.modalidades?.duracao_minutos} min • {turma.modalidades?.capacidade_maxima} vagas
                      </p>
                    </div>

                    {turma.staff?.nome && (
                      <div className="mt-2 text-xs text-gray-300 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">person</span>
                        {turma.staff.nome}
                      </div>
                    )}

                    <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
                      <button onClick={() => abrirEditar(turma)} className="text-xs text-purple-400 hover:text-white flex-1 text-center">Editar</button>
                      <button onClick={() => excluir(turma)} className="text-xs text-red-400 hover:text-white flex-1 text-center">Excluir</button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      <Modal title={editando ? 'Editar Turma' : 'Nova Turma'} open={modalOpen} onClose={() => setModalOpen(false)}>
        {erro && <p className="text-red-400 text-sm mb-3">{erro}</p>}
        <form onSubmit={handleSalvar} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Modalidade</label>
            <select
              required
              value={form.modalidade_id}
              onChange={(e) => setForm({ ...form, modalidade_id: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50 appearance-none"
            >
              <option value="" className="bg-gray-900">Selecione...</option>
              {modalidades.map(m => (
                <option key={m.id} value={m.id} className="bg-gray-900">{m.nome} ({m.duracao_minutos} min)</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Instrutor (Opcional)</label>
            <select
              value={form.instrutor_id}
              onChange={(e) => setForm({ ...form, instrutor_id: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50 appearance-none"
            >
              <option value="" className="bg-gray-900">Nenhum instrutor específico</option>
              {instrutores.map(s => (
                <option key={s.id} value={s.id} className="bg-gray-900">{s.nome}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Dia da Semana</label>
              <select
                required
                value={form.dia_semana}
                onChange={(e) => setForm({ ...form, dia_semana: e.target.value as DiaSemana })}
                className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50 appearance-none"
              >
                {Object.entries(DIAS_SEMANA).map(([val, label]) => (
                  <option key={val} value={val} className="bg-gray-900">{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Horário (HH:MM)</label>
              <input
                required
                type="time"
                value={form.horario}
                onChange={(e) => setForm({ ...form, horario: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Data Início</label>
              <input
                required
                type="date"
                value={form.data_inicio}
                onChange={(e) => setForm({ ...form, data_inicio: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-800 rounded-xl text-gray-400 focus:outline-none focus:border-purple-500/50"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Data Fim (Opcional)</label>
              <input
                type="date"
                value={form.data_fim}
                onChange={(e) => setForm({ ...form, data_fim: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-800 rounded-xl text-gray-400 focus:outline-none focus:border-purple-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Status</label>
            <select
              required
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as StatusTurma })}
              className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500/50 appearance-none"
            >
              {Object.entries(STATUS_TURMA_LABEL).map(([val, label]) => (
                <option key={val} value={val} className="bg-gray-900">{label}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={salvando}
            className="btn-primary w-full py-3 mt-4 disabled:opacity-50"
          >
            {salvando ? t('common.loading') : t('common.save')}
          </button>
        </form>
      </Modal>
    </div>
  );
}
