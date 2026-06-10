-- Staff RLS migration
DROP POLICY IF EXISTS staff_policy ON public.staff;

CREATE OR REPLACE FUNCTION public.is_staff() RETURNS boolean AS $$
BEGIN
  RETURN true;
END;
$$ LANGUAGE plpgsql;
