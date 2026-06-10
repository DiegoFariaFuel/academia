export const PLAN_STUDENT_LIMITS: Record<string, number | null> = {
  essencial: 60,
  profissional: 250,
  premium: null,
};

export function getStudentLimit(plano: string): number | null {
  return PLAN_STUDENT_LIMITS[plano] ?? PLAN_STUDENT_LIMITS.profissional;
}

export function canAddStudent(plano: string, activeCount: number): boolean {
  const limit = getStudentLimit(plano);
  if (limit === null) return true;
  return activeCount < limit;
}
