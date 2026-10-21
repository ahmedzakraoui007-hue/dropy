-- Delivery fee charged to the customer, optional free-delivery threshold, and quantity offers
-- ([{"min_quantity": 2, "discount_percent": 10}, ...]) applied per order line by /api/store/orders.
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS delivery_fee numeric(10,3) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS free_delivery_threshold numeric(10,3),
  ADD COLUMN IF NOT EXISTS quantity_offers jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.stores DROP CONSTRAINT IF EXISTS stores_delivery_fee_range;
ALTER TABLE public.stores ADD CONSTRAINT stores_delivery_fee_range CHECK (delivery_fee >= 0 AND delivery_fee <= 100);
