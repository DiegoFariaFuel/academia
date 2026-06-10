-- Multi-tenant schema setup for academias
CREATE TABLE IF NOT EXISTS public.academias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS academia_id uuid REFERENCES public.academias(id) ON DELETE CASCADE;
