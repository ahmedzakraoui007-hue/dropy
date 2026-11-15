CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.notify_indexnow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  kind text;
  relevant boolean := false;
BEGIN
  IF TG_TABLE_NAME = 'store_products' THEN
    kind := 'product';
    relevant := NEW.is_active IS TRUE AND (
      TG_OP = 'INSERT'
      OR OLD.is_active IS DISTINCT FROM NEW.is_active
      OR OLD.name IS DISTINCT FROM NEW.name
      OR OLD.description IS DISTINCT FROM NEW.description
      OR OLD.selling_price IS DISTINCT FROM NEW.selling_price
      OR OLD.compare_at_price IS DISTINCT FROM NEW.compare_at_price
      OR OLD.images IS DISTINCT FROM NEW.images
      OR OLD.stock_quantity IS DISTINCT FROM NEW.stock_quantity
      OR OLD.variants IS DISTINCT FROM NEW.variants
    );
  ELSIF TG_TABLE_NAME = 'store_pages' THEN
    kind := 'page';
    relevant := NEW.is_published IS TRUE AND (
      TG_OP = 'INSERT'
      OR OLD.is_published IS DISTINCT FROM NEW.is_published
      OR OLD.sections IS DISTINCT FROM NEW.sections
      OR OLD.title IS DISTINCT FROM NEW.title
      OR OLD.seo_title IS DISTINCT FROM NEW.seo_title
      OR OLD.seo_description IS DISTINCT FROM NEW.seo_description
      OR OLD.content_html IS DISTINCT FROM NEW.content_html
    );
  ELSIF TG_TABLE_NAME = 'stores' THEN
    kind := 'store';
    relevant := NEW.is_active IS TRUE AND (
      TG_OP = 'INSERT'
      OR OLD.is_active IS DISTINCT FROM NEW.is_active
      OR OLD.name IS DISTINCT FROM NEW.name
      OR OLD.description IS DISTINCT FROM NEW.description
      OR OLD.seo_title IS DISTINCT FROM NEW.seo_title
      OR OLD.seo_description IS DISTINCT FROM NEW.seo_description
      OR OLD.custom_domain_status IS DISTINCT FROM NEW.custom_domain_status
    );
  ELSIF TG_TABLE_NAME = 'blog_posts' THEN
    kind := 'post';
    relevant := NEW.status = 'published' AND (
      TG_OP = 'INSERT'
      OR OLD.status IS DISTINCT FROM NEW.status
      OR OLD.title IS DISTINCT FROM NEW.title
      OR OLD.content IS DISTINCT FROM NEW.content
      OR OLD.published_at IS DISTINCT FROM NEW.published_at
    );
  END IF;

  IF relevant THEN
    BEGIN
      PERFORM net.http_post(
        url := 'https://dropy.store/api/indexnow/notify',
        body := jsonb_build_object('type', kind, 'id', NEW.id),
        headers := '{"Content-Type": "application/json"}'::jsonb
      );
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS store_products_indexnow ON public.store_products;
CREATE TRIGGER store_products_indexnow AFTER INSERT OR UPDATE ON public.store_products
  FOR EACH ROW EXECUTE FUNCTION public.notify_indexnow();

DROP TRIGGER IF EXISTS store_pages_indexnow ON public.store_pages;
CREATE TRIGGER store_pages_indexnow AFTER INSERT OR UPDATE ON public.store_pages
  FOR EACH ROW EXECUTE FUNCTION public.notify_indexnow();

DROP TRIGGER IF EXISTS stores_indexnow ON public.stores;
CREATE TRIGGER stores_indexnow AFTER INSERT OR UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.notify_indexnow();

DROP TRIGGER IF EXISTS blog_posts_indexnow ON public.blog_posts;
CREATE TRIGGER blog_posts_indexnow AFTER INSERT OR UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.notify_indexnow();
