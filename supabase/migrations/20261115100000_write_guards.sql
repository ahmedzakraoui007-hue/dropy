CREATE OR REPLACE FUNCTION public.is_trusted_writer()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT coalesce(auth.role(), '') = 'service_role'
    OR current_user IN ('postgres', 'supabase_admin')
    OR public.is_admin();
$$;

CREATE OR REPLACE FUNCTION public.guard_store_order_items()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF public.is_trusted_writer() THEN
    RETURN NEW;
  END IF;
  IF NEW.store_order_id IS DISTINCT FROM OLD.store_order_id
    OR NEW.store_product_id IS DISTINCT FROM OLD.store_product_id
    OR NEW.supplier_id IS DISTINCT FROM OLD.supplier_id
    OR NEW.supplier_order_id IS DISTINCT FROM OLD.supplier_order_id
    OR NEW.unit_price IS DISTINCT FROM OLD.unit_price
    OR NEW.total_price IS DISTINCT FROM OLD.total_price
    OR NEW.quantity IS DISTINCT FROM OLD.quantity
    OR NEW.fulfillment_type IS DISTINCT FROM OLD.fulfillment_type THEN
    RAISE EXCEPTION 'order item fields are managed by the server';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS store_order_items_guard ON public.store_order_items;
CREATE TRIGGER store_order_items_guard
  BEFORE UPDATE ON public.store_order_items
  FOR EACH ROW EXECUTE FUNCTION public.guard_store_order_items();

CREATE OR REPLACE FUNCTION public.guard_content_briefs()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF public.is_trusted_writer() THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.status IS NULL OR NEW.status NOT IN ('draft', 'published') THEN
      NEW.status := 'published';
    END IF;
    NEW.selected_creator_id := NULL;
    NEW.is_disputed := false;
    RETURN NEW;
  END IF;
  IF NEW.selected_creator_id IS DISTINCT FROM OLD.selected_creator_id
    OR NEW.is_disputed IS DISTINCT FROM OLD.is_disputed
    OR NEW.store_id IS DISTINCT FROM OLD.store_id THEN
    RAISE EXCEPTION 'brief assignment fields are managed by the server';
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status
    AND NOT (OLD.status IN ('draft', 'published') AND NEW.status IN ('draft', 'published', 'cancelled')) THEN
    RAISE EXCEPTION 'brief status is managed by the server';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS content_briefs_guard ON public.content_briefs;
CREATE TRIGGER content_briefs_guard
  BEFORE INSERT OR UPDATE ON public.content_briefs
  FOR EACH ROW EXECUTE FUNCTION public.guard_content_briefs();

CREATE OR REPLACE FUNCTION public.guard_store_agency_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF public.is_trusted_writer() THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.agency_created_by := NULL;
    NEW.handed_over_at := NULL;
    RETURN NEW;
  END IF;
  IF NEW.agency_created_by IS DISTINCT FROM OLD.agency_created_by
    OR NEW.handed_over_at IS DISTINCT FROM OLD.handed_over_at THEN
    RAISE EXCEPTION 'agency fields are managed by the server';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stores_agency_guard ON public.stores;
CREATE TRIGGER stores_agency_guard
  BEFORE INSERT OR UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.guard_store_agency_fields();
