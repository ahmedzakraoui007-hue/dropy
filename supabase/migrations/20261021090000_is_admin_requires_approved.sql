-- Re-running 20261016120000_rls_lockdown.sql replaced is_admin() with its older body, so a
-- suspended or rejected admin kept admin access in RLS. Restore the status check from
-- 20261016170000_fix_profile_triggers.sql.

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND status = 'approved');
$$;
