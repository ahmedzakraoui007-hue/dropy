-- 1. Ensure the bucket exists (Public = true)
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-assets', 'store-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Clean up ANY existing policies for this bucket to avoid conflicts
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow Auth Upload" ON storage.objects;
DROP POLICY IF EXISTS "Owner Update" ON storage.objects;
DROP POLICY IF EXISTS "Owner Delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow Auth Update" ON storage.objects;
DROP POLICY IF EXISTS "Allow Auth Delete" ON storage.objects;

-- 3. Create a SINGLE, simple policy for reading (Public)
CREATE POLICY "Public Read Store Assets"
ON storage.objects FOR SELECT
USING ( bucket_id = 'store-assets' );

-- 4. Create a SINGLE, simple policy for uploading (Authenticated Users)
-- This allows ANY logged-in user to upload to this bucket.
CREATE POLICY "Auth Upload Store Assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'store-assets' );

-- 5. Create a SINGLE, simple policy for update/delete (Authenticated Users)
CREATE POLICY "Auth Manage Store Assets"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'store-assets' );

CREATE POLICY "Auth Delete Store Assets"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'store-assets' );
