-- 1. Approving any profile crashed: create_default_store ran for every role and called
--    create_default_store_pages, which inserted into columns that don't exist.
-- 2. handle_new_user trusted the role sent at sign-up (anyone could register as "admin").
-- 3. Stock was decremented twice per order (trigger + application code).

CREATE OR REPLACE FUNCTION public.create_default_store_pages(p_store_id uuid, p_vendor_slug text, p_store_name text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM store_pages WHERE store_id = p_store_id) THEN
    RETURN;
  END IF;

  INSERT INTO store_pages (store_id, slug, title, page_type, is_published, is_homepage, show_in_navigation, sort_order, is_system, sections)
  VALUES
  (
    p_store_id, 'home', 'Accueil', 'content', true, true, true, 0, false,
    jsonb_build_array(
      jsonb_build_object('id', 'hero-1', 'type', 'hero', 'position', 0, 'is_visible', true,
        'config', jsonb_build_object('badge', 'NOUVELLE COLLECTION', 'title', 'Bienvenue chez ' || p_store_name,
                                     'variant', 'bold', 'subtitle', 'Les meilleurs produits en un seul clic.')),
      jsonb_build_object('id', 'prod-1', 'type', 'products', 'position', 1, 'is_visible', true,
        'config', jsonb_build_object('limit', 8, 'title', 'Nos Produits', 'source', 'store', 'columns', 4)),
      jsonb_build_object('id', 'trust-1', 'type', 'trust_badges', 'position', 2, 'is_visible', true,
        'config', jsonb_build_object('layout', 'row', 'items', jsonb_build_array(
          jsonb_build_object('icon', 'Truck', 'title', 'Livraison partout en Tunisie', 'description', '24/48h'),
          jsonb_build_object('icon', 'Shield', 'title', 'Paiement à la livraison', 'description', '100% sécurisé')))),
      jsonb_build_object('id', 'footer-1', 'type', 'footer', 'position', 3, 'is_visible', true,
        'config', jsonb_build_object('brandName', p_store_name, 'description', 'Votre boutique de confiance.'))
    )
  ),
  (
    p_store_id, 'shop', 'Boutique', 'content', true, false, true, 1, false,
    jsonb_build_array(
      jsonb_build_object('id', 'hero-2', 'type', 'hero', 'position', 0, 'is_visible', true,
        'config', jsonb_build_object('title', 'Boutique', 'height', 300, 'variant', 'classic', 'subtitle', 'Parcourez notre catalogue')),
      jsonb_build_object('id', 'prod-2', 'type', 'products', 'position', 1, 'is_visible', true,
        'config', jsonb_build_object('limit', 20, 'title', 'Tous les produits', 'source', 'store', 'columns', 4)),
      jsonb_build_object('id', 'footer-2', 'type', 'footer', 'position', 2, 'is_visible', true,
        'config', jsonb_build_object('brandName', p_store_name))
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.create_default_store()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_store_id uuid;
  v_name text;
  v_slug text;
BEGIN
  IF NEW.role = 'seller' AND NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved' THEN
    SELECT id, name, slug INTO v_store_id, v_name, v_slug
    FROM stores WHERE vendor_id = NEW.id ORDER BY created_at LIMIT 1;

    IF v_store_id IS NULL THEN
      v_name := COALESCE(NULLIF(NEW.full_name, ''), split_part(NEW.email, '@', 1)) || ' Shop';
      v_slug := trim(BOTH '-' FROM lower(regexp_replace(v_name, '[^a-zA-Z0-9]+', '-', 'g'))) || '-' || substring(NEW.id::text, 1, 6);
      INSERT INTO stores (vendor_id, name, slug, is_active, status)
      VALUES (NEW.id, v_name, v_slug, true, 'draft')
      RETURNING id INTO v_store_id;
    END IF;

    PERFORM create_default_store_pages(v_store_id, v_slug, v_name);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_role text := NEW.raw_user_meta_data->>'role';
BEGIN
  IF v_role IS NULL OR v_role NOT IN ('seller', 'supplier', 'creator') THEN
    v_role := 'seller';
  END IF;

  INSERT INTO profiles (id, email, full_name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), NEW.email),
    v_role,
    'pending'
  )
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND status = 'approved');
$$;

CREATE OR REPLACE FUNCTION public.handle_stock_decrement()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_source uuid;
  v_dropship boolean;
  v_new_stock integer;
BEGIN
  SELECT product_id, is_dropship INTO v_source, v_dropship
  FROM store_products WHERE id = NEW.store_product_id;

  IF v_dropship AND v_source IS NOT NULL THEN
    UPDATE products
    SET stock_quantity = GREATEST(0, stock_quantity - NEW.quantity)
    WHERE id = v_source
    RETURNING stock_quantity INTO v_new_stock;

    IF v_new_stock IS NOT NULL THEN
      UPDATE store_products SET stock_quantity = v_new_stock
      WHERE product_id = v_source AND is_dropship = true;
    END IF;
  ELSE
    UPDATE store_products
    SET stock_quantity = GREATEST(0, stock_quantity - NEW.quantity)
    WHERE id = NEW.store_product_id;
  END IF;

  RETURN NEW;
END;
$$;
