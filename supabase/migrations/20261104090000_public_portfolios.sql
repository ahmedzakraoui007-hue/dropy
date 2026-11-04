ALTER TABLE public.creator_profiles
  ADD COLUMN IF NOT EXISTS public_slug text,
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS portfolio_public boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS creator_profiles_public_slug_key ON public.creator_profiles (public_slug);

ALTER TABLE public.creator_profiles DROP CONSTRAINT IF EXISTS creator_profiles_public_slug_format;
ALTER TABLE public.creator_profiles
  ADD CONSTRAINT creator_profiles_public_slug_format
  CHECK (public_slug IS NULL OR public_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
