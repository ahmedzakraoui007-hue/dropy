-- Language of the public storefront: French, Arabic, or both with a switch for visitors.
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS storefront_language text NOT NULL DEFAULT 'fr';

ALTER TABLE public.stores DROP CONSTRAINT IF EXISTS stores_storefront_language_check;
ALTER TABLE public.stores
  ADD CONSTRAINT stores_storefront_language_check CHECK (storefront_language IN ('fr', 'ar', 'both'));
