-- Create the storage bucket 'store-assets' if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-assets', 'store-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow public access to view files (logos, banners)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'store-assets' );

-- Policy to allow authenticated users to upload their own assets
-- We assume they can upload to a folder named with their user ID (or just allow auth uploads generally for now)
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'store-assets' AND (storage.foldername(name))[1] = auth.uid()::text );

-- Allow update/delete for owner
CREATE POLICY "Owner Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'store-assets' AND (storage.foldername(name))[1] = auth.uid()::text );

CREATE POLICY "Owner Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'store-assets' AND (storage.foldername(name))[1] = auth.uid()::text );
