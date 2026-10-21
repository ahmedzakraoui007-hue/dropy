-- Sellers running TikTok ads need their own pixel on the storefront, next to facebook_pixel_id.
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS tiktok_pixel_id text;
