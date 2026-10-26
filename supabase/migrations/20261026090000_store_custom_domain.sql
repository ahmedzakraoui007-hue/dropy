-- A store can be served on the seller's own domain (e.g. maboutique.tn) in addition to its subdomain.
-- The domain is added to the Vercel project by /api/seller/domain; status follows Vercel's verification.
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS custom_domain text,
  ADD COLUMN IF NOT EXISTS custom_domain_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS custom_domain_checked_at timestamptz;

ALTER TABLE public.stores DROP CONSTRAINT IF EXISTS stores_custom_domain_status_check;
ALTER TABLE public.stores
  ADD CONSTRAINT stores_custom_domain_status_check CHECK (custom_domain_status IN ('none', 'pending', 'active'));

ALTER TABLE public.stores DROP CONSTRAINT IF EXISTS stores_custom_domain_format_check;
ALTER TABLE public.stores
  ADD CONSTRAINT stores_custom_domain_format_check CHECK (custom_domain IS NULL OR custom_domain ~ '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$');

CREATE UNIQUE INDEX IF NOT EXISTS stores_custom_domain_key ON public.stores (custom_domain) WHERE custom_domain IS NOT NULL;

-- Only the server (service role) may change the domain fields; sellers go through /api/seller/domain.
CREATE OR REPLACE FUNCTION public.protect_store_custom_domain()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF coalesce(auth.role(), '') <> 'service_role' AND current_user NOT IN ('postgres', 'supabase_admin') AND (
    NEW.custom_domain IS DISTINCT FROM OLD.custom_domain
    OR NEW.custom_domain_status IS DISTINCT FROM OLD.custom_domain_status
    OR NEW.custom_domain_checked_at IS DISTINCT FROM OLD.custom_domain_checked_at
  ) THEN
    RAISE EXCEPTION 'custom domain fields are managed by the server';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stores_protect_custom_domain ON public.stores;
CREATE TRIGGER stores_protect_custom_domain
  BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.protect_store_custom_domain();
