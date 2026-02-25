-- 1. Drop the foreign key constraint that forces theme_id to be a UUID from the 'themes' table
ALTER TABLE IF EXISTS public.store_configs 
DROP CONSTRAINT IF EXISTS store_configs_theme_id_fkey;

-- 2. Change the column type from UUID to TEXT so it accepts 'minimal', 'modern', etc.
ALTER TABLE public.store_configs 
ALTER COLUMN theme_id TYPE text USING theme_id::text;

-- 3. Verification (Optional - just to be sure)
COMMENT ON COLUMN public.store_configs.theme_id IS 'Stored as text to support static theme IDs like minimal, electro';
