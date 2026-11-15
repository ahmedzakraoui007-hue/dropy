ALTER TABLE public.store_products ADD COLUMN IF NOT EXISTS slug text;

CREATE OR REPLACE FUNCTION public.product_slug_base(p_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT coalesce(
    nullif(
      left(
        trim(BOTH '-' FROM regexp_replace(
          translate(lower(coalesce(p_name, '')),
            'àâäáãåçéèêëíìîïñóòôöõúùûüýÿœæ',
            'aaaaaaceeeeiiiinooooouuuuyyoa'),
          '[^a-z0-9ء-ي]+', '-', 'g')),
        70),
      ''),
    'produit');
$$;

CREATE OR REPLACE FUNCTION public.set_store_product_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  base text;
  candidate text;
  n integer := 1;
BEGIN
  IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
    NEW.slug := public.product_slug_base(NEW.slug);
  END IF;
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base := trim(BOTH '-' FROM public.product_slug_base(NEW.name));
  ELSE
    base := NEW.slug;
  END IF;
  candidate := base;
  WHILE EXISTS (SELECT 1 FROM public.store_products WHERE store_id = NEW.store_id AND slug = candidate AND id <> NEW.id) LOOP
    n := n + 1;
    candidate := base || '-' || n;
  END LOOP;
  NEW.slug := candidate;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS store_products_slug ON public.store_products;
CREATE TRIGGER store_products_slug
  BEFORE INSERT OR UPDATE OF slug ON public.store_products
  FOR EACH ROW EXECUTE FUNCTION public.set_store_product_slug();

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT id FROM public.store_products WHERE slug IS NULL ORDER BY created_at, id LOOP
    UPDATE public.store_products SET slug = '' WHERE id = r.id;
  END LOOP;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS store_products_store_slug_key ON public.store_products (store_id, slug);
