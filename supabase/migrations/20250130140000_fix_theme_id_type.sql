-- Remove Foreign Key constraint first (if exists)
-- We need to find the constraint name, but usually it's `store_configs_theme_id_fkey`.
-- We will try to drop it safely.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'store_configs_theme_id_fkey'
    ) THEN
        ALTER TABLE public.store_configs DROP CONSTRAINT store_configs_theme_id_fkey;
    END IF;
END $$;

-- Alter column type to TEXT to support string IDs like 'minimal', 'bold'
ALTER TABLE public.store_configs ALTER COLUMN theme_id TYPE TEXT;

-- Optional: Drop the old 'themes' table if it is no longer used?
-- For now, let's keep it safe and just fix the blocking column type.
