import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/auth.store';
import { getStudentLimit } from '../lib/planLimits';

export interface AssinaturaInfo {
  plano: string;
  status: string;
  trial_ate: string | null;
  stripe_customer_id: string | null;
}

export function useSubscription() {
  const { user, isStaff } = useAuthStore();
  const [assinatura, setAssinatura] = useState<AssinaturaInfo | null>(null);
  const [activeStudents, setActiveStudents] = useState(0);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!user?.id || !isStaff) {
      setLoading(false);
      return;
    }

    const [subRes, countRes] = await Promise.all([
      supabase
        .from('assinaturas')
        .select('plano, status, trial_ate, stripe_customer_id')
        .eq('staff_id', user.id)
        .maybeSingle(),
      supabase
        .from('alunos')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'ativo'),
    ]);

    setAssinatura((subRes.data as AssinaturaInfo) ?? null);
    setActiveStudents(countRes.count ?? 0);
    setLoading(false);
  }, [user?.id, isStaff]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const plano = assinatura?.plano ?? 'profissional';
  const status = assinatura?.status ?? 'trial';
  const trialEnd = assinatura?.trial_ate ? new Date(assinatura.trial_ate) : null;
  const trialExpired = status === 'trial' && trialEnd !== null && trialEnd < new Date();
  const isActive = status === 'active' || status === 'trialing';
  const blocked = status === 'canceled' || status === 'past_due';
  const canUseApp = !blocked && (isActive || (status === 'trial' && !trialExpired));
  const studentLimit = getStudentLimit(plano);

  return {
    assinatura,
    loading,
    reload,
    plano,
    status,
    trialEnd,
    trialExpired,
    canUseApp,
    activeStudents,
    studentLimit,
    canAddStudent: studentLimit === null || activeStudents < studentLimit,
  };
}
