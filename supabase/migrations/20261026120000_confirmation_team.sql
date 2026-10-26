-- Confirmation team: sellers invite "agent" accounts that confirm or cancel the store's orders.
-- Agents are created by the server (/api/seller/team); they can read the orders of stores where
-- they are an active member, and act on them only through /api/seller/orders/[id].
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'seller', 'supplier', 'creator', 'agent'));

CREATE TABLE IF NOT EXISTS public.store_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'agent' CHECK (role IN ('agent')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, user_id)
);

CREATE INDEX IF NOT EXISTS store_members_user_idx ON public.store_members(user_id) WHERE status = 'active';

ALTER TABLE public.store_orders
  ADD COLUMN IF NOT EXISTS handled_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.is_store_member(p_store_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.store_members m
    WHERE m.store_id = p_store_id AND m.user_id = auth.uid() AND m.status = 'active'
  );
$$;

ALTER TABLE public.store_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dropy_store_members_owner ON public.store_members;
CREATE POLICY dropy_store_members_owner ON public.store_members
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.vendor_id = auth.uid()));

DROP POLICY IF EXISTS dropy_store_members_self ON public.store_members;
CREATE POLICY dropy_store_members_self ON public.store_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

REVOKE INSERT, UPDATE, DELETE ON public.store_members FROM anon, authenticated;

-- Agents read (never write) the orders, order items and store row of stores they belong to.
DROP POLICY IF EXISTS dropy_store_orders_member_read ON public.store_orders;
CREATE POLICY dropy_store_orders_member_read ON public.store_orders
  FOR SELECT TO authenticated
  USING (public.is_store_member(store_id));

DROP POLICY IF EXISTS dropy_store_order_items_member_read ON public.store_order_items;
CREATE POLICY dropy_store_order_items_member_read ON public.store_order_items
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.store_orders o WHERE o.id = store_order_id AND public.is_store_member(o.store_id)));
