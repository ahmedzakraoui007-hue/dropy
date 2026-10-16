-- The old admin policy on products read public.profiles directly, which anonymous visitors
-- can no longer read, so every anonymous products query failed. Admins keep access through
-- dropy_admin_all (public.is_admin()).
DROP POLICY IF EXISTS "Admins can manage all products" ON public.products;
