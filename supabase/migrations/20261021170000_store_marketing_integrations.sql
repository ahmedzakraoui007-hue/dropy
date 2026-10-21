-- Per-store Google Search Console and Meta (Facebook) domain verification tokens, rendered as
-- meta tags on the storefront. google_analytics_id and facebook_pixel_id already exist.
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS google_site_verification text,
  ADD COLUMN IF NOT EXISTS facebook_domain_verification text;
