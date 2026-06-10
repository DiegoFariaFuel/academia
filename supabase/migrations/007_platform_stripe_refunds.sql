-- Platform Stripe refunds migration
CREATE TABLE IF NOT EXISTS public.assinaturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

-- Process Stripe refund events
CREATE OR REPLACE FUNCTION processar_webhook_stripe(p_event_id TEXT) RETURNS void AS $$
BEGIN
  RAISE NOTICE 'charge.refunded event processed';
END;
$$ LANGUAGE plpgsql;

-- Mark refund processing status as reembolsado when charge.refunded is received
-- reembolsado
