-- Add missing columns for theme customization if they don't exist
ALTER TABLE store_configs 
ADD COLUMN IF NOT EXISTS colors JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS typography JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS layout JSONB DEFAULT '{}'::jsonb;

-- Ensure RLS doesn't block updates (Verify policies exist)
-- This is just a check, usually handled by existing policies
-- DO NOT DROP existing valid policies here, just ensure columns.
