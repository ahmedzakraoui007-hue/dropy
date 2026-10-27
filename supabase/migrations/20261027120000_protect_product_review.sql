-- Suppliers manage their own products through RLS, but only Dropy decides whether a product is
-- approved. Without this guard a supplier could set status = 'approved' (or clear a rejection)
-- directly through the API and skip the review.
CREATE OR REPLACE FUNCTION public.protect_product_review()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF coalesce(auth.role(), '') = 'service_role'
    OR current_user IN ('postgres', 'supabase_admin')
    OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending';
    NEW.rejection_reason := NULL;
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'pending' THEN
    RAISE EXCEPTION 'product review status is managed by Dropy';
  END IF;
  IF NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason THEN
    NEW.rejection_reason := OLD.rejection_reason;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_protect_review ON public.products;
CREATE TRIGGER products_protect_review
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.protect_product_review();
