-- Fake-order protection: per-store limits, a blocklist of phones and IPs, and the request
-- details / risk flags recorded on each order so sellers can spot suspicious ones.
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS order_protection jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.store_orders
  ADD COLUMN IF NOT EXISTS customer_ip text,
  ADD COLUMN IF NOT EXISTS user_agent text,
  ADD COLUMN IF NOT EXISTS risk_flags text[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS store_orders_store_phone_idx ON public.store_orders(store_id, customer_phone, created_at DESC);
CREATE INDEX IF NOT EXISTS store_orders_store_ip_idx ON public.store_orders(store_id, customer_ip, created_at DESC);

CREATE TABLE IF NOT EXISTS public.store_blocklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('phone', 'ip')),
  value text NOT NULL CHECK (char_length(value) BETWEEN 3 AND 64),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, kind, value)
);

ALTER TABLE public.store_blocklist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dropy_blocklist_owner_all ON public.store_blocklist;
CREATE POLICY dropy_blocklist_owner_all ON public.store_blocklist
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.vendor_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.vendor_id = auth.uid()));

REVOKE ALL ON public.store_blocklist FROM anon;
