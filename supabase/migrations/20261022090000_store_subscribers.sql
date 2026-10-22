-- Newsletter sign-ups collected by the storefront "newsletter" section. Written only through
-- /api/store/subscribe (service role); the store owner can read them.
CREATE TABLE IF NOT EXISTS public.store_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, email)
);

CREATE INDEX IF NOT EXISTS store_subscribers_store_id_idx ON public.store_subscribers(store_id, created_at DESC);

ALTER TABLE public.store_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dropy_store_subscribers_owner_read ON public.store_subscribers;
CREATE POLICY dropy_store_subscribers_owner_read ON public.store_subscribers
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.vendor_id = auth.uid()));

DROP POLICY IF EXISTS dropy_store_subscribers_owner_delete ON public.store_subscribers;
CREATE POLICY dropy_store_subscribers_owner_delete ON public.store_subscribers
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.vendor_id = auth.uid()));

REVOKE INSERT, UPDATE ON public.store_subscribers FROM anon, authenticated;
