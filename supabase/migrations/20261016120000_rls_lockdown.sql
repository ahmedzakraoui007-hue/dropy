-- Row Level Security lockdown.
-- Before: "Service role can do everything on profiles" applied to every role, so anyone could read
-- and edit any profile (including role = 'admin'); many tables had RLS disabled or no policies.
-- The service role key used by the server bypasses RLS, so none of this affects server routes.

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER so policies don't recurse through RLS)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.owns_store(p_store uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM stores WHERE id = p_store AND vendor_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.owns_seller_profile(p_seller uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p_seller = auth.uid()
      OR EXISTS (SELECT 1 FROM seller_profiles WHERE id = p_seller AND user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.owns_store_product(p_product uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM store_products sp JOIN stores s ON s.id = sp.store_id
    WHERE sp.id = p_product AND s.vendor_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.owns_supplier_product(p_product uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM products WHERE id = p_product AND supplier_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.owns_supplier_order(p_order uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM supplier_orders WHERE id = p_order AND supplier_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.supplier_has_store_order(p_store_order uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM store_order_items WHERE store_order_id = p_store_order AND supplier_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.seller_sees_supplier_order(p_order uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM store_order_items i
    JOIN store_orders o ON o.id = i.store_order_id
    JOIN stores s ON s.id = o.store_id
    WHERE i.supplier_order_id = p_order AND s.vendor_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.owns_shipment(p_shipment uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM delivery_shipments d JOIN supplier_orders so ON so.id = d.supplier_order_id
    WHERE d.id = p_shipment AND so.supplier_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.brief_participant(p_brief uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM content_briefs b JOIN stores s ON s.id = b.store_id
    WHERE b.id = p_brief AND (s.vendor_id = auth.uid() OR b.selected_creator_id = auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION public.owns_creator_profile(p_creator uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p_creator = auth.uid()
      OR EXISTS (SELECT 1 FROM creator_profiles WHERE id = p_creator AND user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.owns_ugc_brief(p_brief uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM ugc_briefs b JOIN seller_profiles sp ON sp.id = b.seller_id
    WHERE b.id = p_brief AND sp.user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION
  public.is_admin(), public.owns_store(uuid), public.owns_seller_profile(uuid), public.owns_store_product(uuid),
  public.owns_supplier_product(uuid), public.owns_supplier_order(uuid), public.supplier_has_store_order(uuid),
  public.seller_sees_supplier_order(uuid), public.owns_shipment(uuid), public.brief_participant(uuid),
  public.owns_creator_profile(uuid), public.owns_ugc_brief(uuid)
FROM public;
GRANT EXECUTE ON FUNCTION
  public.is_admin(), public.owns_store(uuid), public.owns_seller_profile(uuid), public.owns_store_product(uuid),
  public.owns_supplier_product(uuid), public.owns_supplier_order(uuid), public.supplier_has_store_order(uuid),
  public.seller_sees_supplier_order(uuid), public.owns_shipment(uuid), public.brief_participant(uuid),
  public.owns_creator_profile(uuid), public.owns_ugc_brief(uuid)
TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Turn RLS on for every table in public
-- ---------------------------------------------------------------------------

DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- Remove dangerous / over-broad policies
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Service role can do everything on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow individual insert" ON public.profiles;
DROP POLICY IF EXISTS "Allow individual insert creator" ON public.creator_profiles;
DROP POLICY IF EXISTS "Allow individual select creator" ON public.creator_profiles;
DROP POLICY IF EXISTS "Public can view verified creators" ON public.creator_profiles;
DROP POLICY IF EXISTS "Allow individual insert supplier" ON public.supplier_profiles;
DROP POLICY IF EXISTS "Allow individual select supplier" ON public.supplier_profiles;
DROP POLICY IF EXISTS "Customers can insert store reviews" ON public.store_reviews;
DROP POLICY IF EXISTS "Sellers can update their store reviews" ON public.store_reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Public read product reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Anyone can read creator reviews" ON public.creator_reviews;
DROP POLICY IF EXISTS "Public read creator reviews" ON public.creator_reviews;
DROP POLICY IF EXISTS "Creators can update their reviews (replies)" ON public.creator_reviews;
DROP POLICY IF EXISTS "Sellers can insert creator reviews" ON public.creator_reviews;
DROP POLICY IF EXISTS "Sellers can insert supplier reviews" ON public.supplier_reviews;
DROP POLICY IF EXISTS "Suppliers can update their reviews (replies)" ON public.supplier_reviews;
DROP POLICY IF EXISTS "Public can view active promo codes" ON public.promo_codes;
DROP POLICY IF EXISTS "Allow authenticated users to read media" ON public.media_library;
DROP POLICY IF EXISTS "Allow authenticated users to insert media" ON public.media_library;
DROP POLICY IF EXISTS "Sellers can create orders" ON public.orders;

-- ---------------------------------------------------------------------------
-- Admin access everywhere
-- ---------------------------------------------------------------------------

DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS dropy_admin_all ON public.%I', t.tablename);
    EXECUTE format(
      'CREATE POLICY dropy_admin_all ON public.%I FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())',
      t.tablename
    );
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- Helper to (re)create a policy idempotently
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION pg_temp.policy(p_table text, p_name text, p_sql text) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p_name, p_table);
  EXECUTE p_sql;
END $$;

-- profiles: own row only (admins via dropy_admin_all); names of others via profile_cards
SELECT pg_temp.policy('profiles', 'Users can view own profile',
  $p$CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid())$p$);
SELECT pg_temp.policy('profiles', 'Users can update own profile',
  $p$CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid())$p$);

CREATE OR REPLACE VIEW public.profile_cards WITH (security_invoker = false) AS
  SELECT id, full_name, avatar_url, role FROM public.profiles;
REVOKE ALL ON public.profile_cards FROM anon;
GRANT SELECT ON public.profile_cards TO authenticated;

-- creator_profiles
SELECT pg_temp.policy('creator_profiles', 'Creators can manage own profile',
  $p$CREATE POLICY "Creators can manage own profile" ON public.creator_profiles FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())$p$);
SELECT pg_temp.policy('creator_profiles', 'dropy_view_approved_creators',
  $p$CREATE POLICY dropy_view_approved_creators ON public.creator_profiles FOR SELECT TO authenticated USING (status IN ('approved', 'active') OR is_verified = true)$p$);

-- supplier_profiles
SELECT pg_temp.policy('supplier_profiles', 'dropy_supplier_own',
  $p$CREATE POLICY dropy_supplier_own ON public.supplier_profiles FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())$p$);

-- seller_profiles
SELECT pg_temp.policy('seller_profiles', 'dropy_seller_profile_own',
  $p$CREATE POLICY dropy_seller_profile_own ON public.seller_profiles FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())$p$);

-- store builder tables keyed by seller profile (or user id)
SELECT pg_temp.policy('store_configs', 'dropy_store_configs_owner',
  $p$CREATE POLICY dropy_store_configs_owner ON public.store_configs FOR ALL TO authenticated USING (public.owns_seller_profile(seller_id)) WITH CHECK (public.owns_seller_profile(seller_id))$p$);
SELECT pg_temp.policy('store_configs', 'dropy_store_configs_public',
  $p$CREATE POLICY dropy_store_configs_public ON public.store_configs FOR SELECT USING (true)$p$);
SELECT pg_temp.policy('store_settings', 'dropy_store_settings_owner',
  $p$CREATE POLICY dropy_store_settings_owner ON public.store_settings FOR ALL TO authenticated USING (public.owns_seller_profile(seller_id)) WITH CHECK (public.owns_seller_profile(seller_id))$p$);
SELECT pg_temp.policy('store_domains', 'dropy_store_domains_owner',
  $p$CREATE POLICY dropy_store_domains_owner ON public.store_domains FOR ALL TO authenticated USING (public.owns_seller_profile(seller_id)) WITH CHECK (public.owns_seller_profile(seller_id))$p$);
SELECT pg_temp.policy('store_media', 'dropy_store_media_owner',
  $p$CREATE POLICY dropy_store_media_owner ON public.store_media FOR ALL TO authenticated USING (public.owns_seller_profile(seller_id)) WITH CHECK (public.owns_seller_profile(seller_id))$p$);
SELECT pg_temp.policy('store_menus', 'dropy_store_menus_owner',
  $p$CREATE POLICY dropy_store_menus_owner ON public.store_menus FOR ALL TO authenticated USING (public.owns_seller_profile(seller_id)) WITH CHECK (public.owns_seller_profile(seller_id))$p$);
SELECT pg_temp.policy('store_menus', 'dropy_store_menus_public',
  $p$CREATE POLICY dropy_store_menus_public ON public.store_menus FOR SELECT USING (true)$p$);
SELECT pg_temp.policy('store_navigation', 'dropy_store_navigation_owner',
  $p$CREATE POLICY dropy_store_navigation_owner ON public.store_navigation FOR ALL TO authenticated USING (public.owns_seller_profile(seller_id) OR public.owns_store(store_id)) WITH CHECK (public.owns_seller_profile(seller_id) OR public.owns_store(store_id))$p$);
SELECT pg_temp.policy('store_navigation', 'dropy_store_navigation_public',
  $p$CREATE POLICY dropy_store_navigation_public ON public.store_navigation FOR SELECT USING (is_visible IS NOT FALSE)$p$);
SELECT pg_temp.policy('store_pages', 'dropy_store_pages_owner',
  $p$CREATE POLICY dropy_store_pages_owner ON public.store_pages FOR ALL TO authenticated USING (public.owns_store(store_id) OR public.owns_seller_profile(seller_id)) WITH CHECK (public.owns_store(store_id) OR public.owns_seller_profile(seller_id))$p$);
SELECT pg_temp.policy('store_pages', 'dropy_store_pages_public',
  $p$CREATE POLICY dropy_store_pages_public ON public.store_pages FOR SELECT USING (is_published = true)$p$);

-- store products, variants
SELECT pg_temp.policy('store_products', 'dropy_store_products_public',
  $p$CREATE POLICY dropy_store_products_public ON public.store_products FOR SELECT USING (is_active = true)$p$);
SELECT pg_temp.policy('store_product_variants', 'dropy_spv_owner',
  $p$CREATE POLICY dropy_spv_owner ON public.store_product_variants FOR ALL TO authenticated USING (public.owns_store_product(product_id)) WITH CHECK (public.owns_store_product(product_id))$p$);
SELECT pg_temp.policy('store_product_variants', 'dropy_spv_public',
  $p$CREATE POLICY dropy_spv_public ON public.store_product_variants FOR SELECT USING (is_active IS NOT FALSE)$p$);
SELECT pg_temp.policy('store_product_variant_values', 'dropy_spvv_owner',
  $p$CREATE POLICY dropy_spvv_owner ON public.store_product_variant_values FOR ALL TO authenticated
     USING (EXISTS (SELECT 1 FROM public.store_product_variants v WHERE v.id = product_variant_id AND public.owns_store_product(v.product_id)))
     WITH CHECK (EXISTS (SELECT 1 FROM public.store_product_variants v WHERE v.id = product_variant_id AND public.owns_store_product(v.product_id)))$p$);
SELECT pg_temp.policy('store_product_variant_values', 'dropy_spvv_public',
  $p$CREATE POLICY dropy_spvv_public ON public.store_product_variant_values FOR SELECT USING (true)$p$);
SELECT pg_temp.policy('product_variant_values', 'dropy_pvv_supplier',
  $p$CREATE POLICY dropy_pvv_supplier ON public.product_variant_values FOR ALL TO authenticated
     USING (EXISTS (SELECT 1 FROM public.product_variants v WHERE v.id = product_variant_id AND public.owns_supplier_product(v.product_id)))
     WITH CHECK (EXISTS (SELECT 1 FROM public.product_variants v WHERE v.id = product_variant_id AND public.owns_supplier_product(v.product_id)))$p$);
SELECT pg_temp.policy('product_variant_values', 'dropy_pvv_public',
  $p$CREATE POLICY dropy_pvv_public ON public.product_variant_values FOR SELECT USING (true)$p$);

-- reference data readable by everyone
SELECT pg_temp.policy('themes', 'dropy_public_read', $p$CREATE POLICY dropy_public_read ON public.themes FOR SELECT USING (true)$p$);
SELECT pg_temp.policy('section_templates', 'dropy_public_read', $p$CREATE POLICY dropy_public_read ON public.section_templates FOR SELECT USING (true)$p$);
SELECT pg_temp.policy('product_categories', 'dropy_public_read', $p$CREATE POLICY dropy_public_read ON public.product_categories FOR SELECT USING (true)$p$);
SELECT pg_temp.policy('category_variants', 'dropy_public_read', $p$CREATE POLICY dropy_public_read ON public.category_variants FOR SELECT USING (true)$p$);
SELECT pg_temp.policy('variant_types', 'dropy_public_read', $p$CREATE POLICY dropy_public_read ON public.variant_types FOR SELECT USING (true)$p$);
SELECT pg_temp.policy('variant_options', 'dropy_public_read', $p$CREATE POLICY dropy_public_read ON public.variant_options FOR SELECT USING (true)$p$);

-- orders
SELECT pg_temp.policy('store_orders', 'dropy_store_orders_supplier',
  $p$CREATE POLICY dropy_store_orders_supplier ON public.store_orders FOR SELECT TO authenticated USING (public.supplier_has_store_order(id))$p$);
SELECT pg_temp.policy('store_order_items', 'dropy_store_order_items_seller_update',
  $p$CREATE POLICY dropy_store_order_items_seller_update ON public.store_order_items FOR UPDATE TO authenticated
     USING (EXISTS (SELECT 1 FROM public.store_orders o WHERE o.id = store_order_id AND public.owns_store(o.store_id)))$p$);
SELECT pg_temp.policy('store_order_items', 'dropy_store_order_items_supplier',
  $p$CREATE POLICY dropy_store_order_items_supplier ON public.store_order_items FOR SELECT TO authenticated USING (supplier_id = auth.uid())$p$);
SELECT pg_temp.policy('supplier_orders', 'dropy_supplier_orders_supplier',
  $p$CREATE POLICY dropy_supplier_orders_supplier ON public.supplier_orders FOR SELECT TO authenticated USING (supplier_id = auth.uid())$p$);
SELECT pg_temp.policy('supplier_orders', 'dropy_supplier_orders_supplier_update',
  $p$CREATE POLICY dropy_supplier_orders_supplier_update ON public.supplier_orders FOR UPDATE TO authenticated USING (supplier_id = auth.uid()) WITH CHECK (supplier_id = auth.uid())$p$);
SELECT pg_temp.policy('supplier_orders', 'dropy_supplier_orders_seller',
  $p$CREATE POLICY dropy_supplier_orders_seller ON public.supplier_orders FOR SELECT TO authenticated USING (public.seller_sees_supplier_order(id))$p$);
SELECT pg_temp.policy('supplier_order_items', 'dropy_supplier_order_items_supplier',
  $p$CREATE POLICY dropy_supplier_order_items_supplier ON public.supplier_order_items FOR SELECT TO authenticated USING (public.owns_supplier_order(supplier_order_id))$p$);
SELECT pg_temp.policy('supplier_order_items', 'dropy_supplier_order_items_supplier_update',
  $p$CREATE POLICY dropy_supplier_order_items_supplier_update ON public.supplier_order_items FOR UPDATE TO authenticated USING (public.owns_supplier_order(supplier_order_id))$p$);
SELECT pg_temp.policy('delivery_shipments', 'dropy_shipments_supplier',
  $p$CREATE POLICY dropy_shipments_supplier ON public.delivery_shipments FOR SELECT TO authenticated USING (public.owns_supplier_order(supplier_order_id))$p$);
SELECT pg_temp.policy('shipment_tracking_events', 'dropy_tracking_supplier',
  $p$CREATE POLICY dropy_tracking_supplier ON public.shipment_tracking_events FOR SELECT TO authenticated USING (public.owns_shipment(shipment_id))$p$);
SELECT pg_temp.policy('payments', 'dropy_payments_parties',
  $p$CREATE POLICY dropy_payments_parties ON public.payments FOR SELECT TO authenticated USING (supplier_id = auth.uid() OR seller_id = auth.uid())$p$);

-- reviews (writes go through the server)
SELECT pg_temp.policy('store_reviews', 'dropy_store_reviews_owner',
  $p$CREATE POLICY dropy_store_reviews_owner ON public.store_reviews FOR SELECT TO authenticated USING (public.owns_store(store_id))$p$);
SELECT pg_temp.policy('product_reviews', 'dropy_product_reviews_public',
  $p$CREATE POLICY dropy_product_reviews_public ON public.product_reviews FOR SELECT USING (status IN ('published', 'approved'))$p$);
SELECT pg_temp.policy('product_reviews', 'dropy_product_reviews_owner',
  $p$CREATE POLICY dropy_product_reviews_owner ON public.product_reviews FOR SELECT TO authenticated USING (public.owns_store_product(store_product_id))$p$);
SELECT pg_temp.policy('creator_reviews', 'dropy_creator_reviews_public',
  $p$CREATE POLICY dropy_creator_reviews_public ON public.creator_reviews FOR SELECT USING (status IN ('published', 'approved') OR creator_id = auth.uid() OR public.owns_store(store_id))$p$);

-- content (UGC) extras
SELECT pg_temp.policy('content_disputes', 'dropy_disputes_parties',
  $p$CREATE POLICY dropy_disputes_parties ON public.content_disputes FOR SELECT TO authenticated USING (opened_by = auth.uid() OR public.brief_participant(brief_id))$p$);
SELECT pg_temp.policy('content_disputes', 'dropy_disputes_open',
  $p$CREATE POLICY dropy_disputes_open ON public.content_disputes FOR INSERT TO authenticated WITH CHECK (opened_by = auth.uid() AND public.brief_participant(brief_id))$p$);
SELECT pg_temp.policy('creator_portfolio', 'dropy_portfolio_owner',
  $p$CREATE POLICY dropy_portfolio_owner ON public.creator_portfolio FOR ALL TO authenticated USING (public.owns_creator_profile(creator_id)) WITH CHECK (public.owns_creator_profile(creator_id))$p$);
SELECT pg_temp.policy('creator_portfolio', 'dropy_portfolio_read',
  $p$CREATE POLICY dropy_portfolio_read ON public.creator_portfolio FOR SELECT TO authenticated USING (true)$p$);
SELECT pg_temp.policy('notification_preferences', 'dropy_notification_prefs_own',
  $p$CREATE POLICY dropy_notification_prefs_own ON public.notification_preferences FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())$p$);
SELECT pg_temp.policy('media_library', 'dropy_media_library_owner',
  $p$CREATE POLICY dropy_media_library_owner ON public.media_library FOR ALL TO authenticated USING (public.owns_store(store_id)) WITH CHECK (public.owns_store(store_id))$p$);
SELECT pg_temp.policy('store_visits', 'dropy_store_visits_owner',
  $p$CREATE POLICY dropy_store_visits_owner ON public.store_visits FOR SELECT TO authenticated USING (public.owns_store(store_id))$p$);

SELECT pg_temp.policy('notifications', 'dropy_notifications_delete_own',
  $p$CREATE POLICY dropy_notifications_delete_own ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid())$p$);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_catalog_stats') THEN
    DROP POLICY IF EXISTS dropy_public_read ON public.product_catalog_stats;
    CREATE POLICY dropy_public_read ON public.product_catalog_stats FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- legacy UGC tables still used by /seller/ugc pages
SELECT pg_temp.policy('ugc_briefs', 'dropy_ugc_briefs_owner',
  $p$CREATE POLICY dropy_ugc_briefs_owner ON public.ugc_briefs FOR ALL TO authenticated USING (public.owns_seller_profile(seller_id)) WITH CHECK (public.owns_seller_profile(seller_id))$p$);
SELECT pg_temp.policy('ugc_briefs', 'dropy_ugc_briefs_open',
  $p$CREATE POLICY dropy_ugc_briefs_open ON public.ugc_briefs FOR SELECT TO authenticated USING (status = 'published')$p$);
SELECT pg_temp.policy('ugc_applications', 'dropy_ugc_applications_creator',
  $p$CREATE POLICY dropy_ugc_applications_creator ON public.ugc_applications FOR ALL TO authenticated USING (public.owns_creator_profile(creator_id)) WITH CHECK (public.owns_creator_profile(creator_id))$p$);
SELECT pg_temp.policy('ugc_applications', 'dropy_ugc_applications_seller',
  $p$CREATE POLICY dropy_ugc_applications_seller ON public.ugc_applications FOR ALL TO authenticated USING (public.owns_ugc_brief(brief_id)) WITH CHECK (public.owns_ugc_brief(brief_id))$p$);
SELECT pg_temp.policy('ugc_deliverables', 'dropy_ugc_deliverables_creator',
  $p$CREATE POLICY dropy_ugc_deliverables_creator ON public.ugc_deliverables FOR ALL TO authenticated USING (public.owns_creator_profile(creator_id)) WITH CHECK (public.owns_creator_profile(creator_id))$p$);
SELECT pg_temp.policy('ugc_deliverables', 'dropy_ugc_deliverables_seller',
  $p$CREATE POLICY dropy_ugc_deliverables_seller ON public.ugc_deliverables FOR ALL TO authenticated USING (public.owns_ugc_brief(brief_id)) WITH CHECK (public.owns_ugc_brief(brief_id))$p$);
SELECT pg_temp.policy('ugc_payments', 'dropy_ugc_payments_parties',
  $p$CREATE POLICY dropy_ugc_payments_parties ON public.ugc_payments FOR SELECT TO authenticated USING (public.owns_seller_profile(seller_id) OR public.owns_creator_profile(creator_id))$p$);

-- ---------------------------------------------------------------------------
-- Column-level limits: users cannot change role, status, verification, ratings or earnings
-- ---------------------------------------------------------------------------

REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (full_name, phone, avatar_url, bank_name, bank_rib, bank_iban, d17_number, flouci_number, updated_at)
  ON public.profiles TO authenticated;

REVOKE INSERT, UPDATE ON public.creator_profiles FROM anon, authenticated;
GRANT UPDATE (bio, specialties, portfolio_url, portfolio_items, city, hourly_rate, min_project_budget,
  tiktok_handle, instagram_handle, follower_count, instagram_username, specialty, updated_at)
  ON public.creator_profiles TO authenticated;

REVOKE INSERT, UPDATE ON public.supplier_profiles FROM anon, authenticated;
GRANT UPDATE (company_name, tax_id, product_type, pickup_address, contact_name, pickup_notes, updated_at)
  ON public.supplier_profiles TO authenticated;

REVOKE INSERT, UPDATE ON public.seller_profiles FROM anon, authenticated;
GRANT INSERT (user_id, store_name, store_slug, logo_url) ON public.seller_profiles TO authenticated;
GRANT UPDATE (store_name, store_slug, logo_url) ON public.seller_profiles TO authenticated;

REVOKE INSERT, UPDATE, DELETE ON public.store_reviews, public.product_reviews, public.creator_reviews,
  public.supplier_reviews FROM anon;
