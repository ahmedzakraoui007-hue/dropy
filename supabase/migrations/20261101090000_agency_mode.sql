ALTER TABLE public.seller_mcp_tokens
  ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'store' CHECK (scope IN ('store', 'agency'));

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS agency_created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS handed_over_at timestamptz;

CREATE INDEX IF NOT EXISTS stores_agency_created_idx ON public.stores (agency_created_by) WHERE agency_created_by IS NOT NULL;
