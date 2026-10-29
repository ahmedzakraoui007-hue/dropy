CREATE TABLE IF NOT EXISTS public.site_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  business text NOT NULL,
  phone text NOT NULL,
  email text,
  city text,
  activity text,
  links text,
  message text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'in_progress', 'delivered', 'declined')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS site_requests_created_idx ON public.site_requests (created_at DESC);

ALTER TABLE public.site_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS site_requests_admin_all ON public.site_requests;
CREATE POLICY site_requests_admin_all ON public.site_requests
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

REVOKE ALL ON public.site_requests FROM anon;
GRANT SELECT, UPDATE, DELETE ON public.site_requests TO authenticated;
