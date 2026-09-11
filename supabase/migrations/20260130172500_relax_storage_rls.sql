-- Drop the strict folder-based policy
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Owner Update" ON storage.objects;
DROP POLICY IF EXISTS "Owner Delete" ON storage.objects;

-- Create a simpler policy: Allow ANY authenticated user to upload files to 'store-assets'
-- We rely on the filenames being unique enough (random) and the bucket being for store assets.
CREATE POLICY "Allow Auth Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'store-assets' );

-- Allow authenticated users to update/delete their own files (best effort, or just allow all auth for now to unblock)
CREATE POLICY "Allow Auth Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'store-assets' );

CREATE POLICY "Allow Auth Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'store-assets' );
