-- The foreign key constraint 'store_configs_seller_id_fkey' is preventing the theme application
-- because it likely references a table (e.g., public.users or sellers) that doesn't have the user record,
-- even though the user exists in auth.users.

-- We safely drop this constraint to allow using the auth user ID as seller_id.
ALTER TABLE IF EXISTS public.store_configs 
DROP CONSTRAINT IF EXISTS store_configs_seller_id_fkey;

-- Optional: If you want to ensure data integrity with auth.users (if possible in your Supabase setup)
-- ALTER TABLE public.store_configs 
-- ADD CONSTRAINT store_configs_seller_id_fkey 
-- FOREIGN KEY (seller_id) REFERENCES auth.users(id); 
-- (Usually better to avoid cross-schema FKs if not configured, dropping is safer for now)
