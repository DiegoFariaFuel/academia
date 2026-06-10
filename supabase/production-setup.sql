-- Production setup SQL
CREATE TABLE IF NOT EXISTS public.staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_staff boolean DEFAULT false
);
