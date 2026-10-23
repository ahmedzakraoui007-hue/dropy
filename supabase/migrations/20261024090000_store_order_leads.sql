-- Contacts left in the quick order form without submitting it ("abandoned orders"), so the seller can
-- call them back. Written only through /api/store/leads (service role); the store owner reads and
-- updates them. Kept 30 days.
CREATE TABLE IF NOT EXISTS public.store_order_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  store_product_id uuid REFERENCES public.store_products(id) ON DELETE SET NULL,
  variant_id text,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity BETWEEN 1 AND 100),
  customer_name text,
  customer_phone text NOT NULL,
  customer_governorate text,
  customer_city text,
  customer_address text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'contacted', 'converted', 'dismissed')),
  order_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS store_order_leads_store_idx ON public.store_order_leads(store_id, status, created_at DESC);

ALTER TABLE public.store_order_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dropy_order_leads_owner_read ON public.store_order_leads;
CREATE POLICY dropy_order_leads_owner_read ON public.store_order_leads
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.vendor_id = auth.uid()));

DROP POLICY IF EXISTS dropy_order_leads_owner_update ON public.store_order_leads;
CREATE POLICY dropy_order_leads_owner_update ON public.store_order_leads
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.vendor_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.vendor_id = auth.uid()));

REVOKE INSERT, DELETE ON public.store_order_leads FROM anon, authenticated;
REVOKE UPDATE ON public.store_order_leads FROM anon;
