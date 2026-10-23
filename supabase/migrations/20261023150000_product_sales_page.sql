-- Sales-page content for each store product: an optional "was" price shown struck through, and
-- seller-written selling points ({ badge, highlights[], faq[{question, answer}] }).
ALTER TABLE public.store_products
  ADD COLUMN IF NOT EXISTS compare_at_price numeric(10,2),
  ADD COLUMN IF NOT EXISTS sales_content jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.store_products DROP CONSTRAINT IF EXISTS store_products_compare_at_price_check;
ALTER TABLE public.store_products
  ADD CONSTRAINT store_products_compare_at_price_check CHECK (compare_at_price IS NULL OR compare_at_price > 0);
