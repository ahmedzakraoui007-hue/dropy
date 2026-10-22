-- Cash-on-delivery orders are confirmed by phone before suppliers see them; cancellations keep a
-- reason and give the stock back, which needs the variant each line used.
ALTER TABLE public.store_orders
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_reason text;

ALTER TABLE public.store_order_items
  ADD COLUMN IF NOT EXISTS variant_id uuid;
