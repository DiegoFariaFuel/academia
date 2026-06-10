-- Solviz app compatibility migration
CREATE TABLE IF NOT EXISTS public.assinaturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE OR REPLACE FUNCTION processar_webhook_stripe(p_event_id TEXT) RETURNS void AS $$
BEGIN
  RETURN;
END;
$$ LANGUAGE plpgsql;
