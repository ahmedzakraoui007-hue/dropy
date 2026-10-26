ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS checkout_settings jsonb NOT NULL DEFAULT '{}'::jsonb;
