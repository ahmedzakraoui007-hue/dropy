-- Logged-out visitors (role "anon") could read profiles (emails, phones, bank details),
-- customer orders and notifications. The app no longer needs anonymous access to these:
-- checkout, order tracking and verified-purchase checks run on the server.

REVOKE ALL ON TABLE
  public.profiles,
  public.store_orders,
  public.store_order_items,
  public.notifications,
  public.notification_preferences,
  public.customers,
  public.supplier_orders,
  public.supplier_order_items,
  public.supplier_profiles,
  public.creator_profiles,
  public.content_payments,
  public.content_messages,
  public.content_disputes,
  public.content_deliveries,
  public.content_applications,
  public.delivery_shipments,
  public.shipment_tracking_events,
  public.payments,
  public.orders,
  public.order_items,
  public.order_timeline,
  public.ugc_payments,
  public.ugc_applications,
  public.ugc_deliverables,
  public.training_progress
FROM anon;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public FROM anon;
GRANT INSERT ON TABLE public.store_visits, public.store_reviews, public.product_reviews TO anon;

REVOKE SELECT ON TABLE public.store_reviews FROM anon;
GRANT SELECT (id, store_id, customer_name, rating, comment, is_verified_purchase, status, seller_reply, created_at)
  ON TABLE public.store_reviews TO anon;
