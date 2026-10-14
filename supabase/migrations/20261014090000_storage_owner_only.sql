-- Restrict storage writes to the owner's folder.
-- Files are stored as <user_id>/<file> (content-deliverables: <brief_id>/<user_id>/<file>).

DROP POLICY IF EXISTS "Auth Upload Store Assets" ON storage.objects;
DROP POLICY IF EXISTS "Auth Manage Store Assets" ON storage.objects;
DROP POLICY IF EXISTS "Auth Delete Store Assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow Auth Upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow Auth Update" ON storage.objects;
DROP POLICY IF EXISTS "Allow Auth Delete" ON storage.objects;

DROP POLICY IF EXISTS "dropy_owner_insert" ON storage.objects;
DROP POLICY IF EXISTS "dropy_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "dropy_owner_delete" ON storage.objects;
DROP POLICY IF EXISTS "dropy_public_read" ON storage.objects;

CREATE POLICY "dropy_owner_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  (bucket_id IN ('store-assets', 'product-images', 'media') AND (storage.foldername(name))[1] = auth.uid()::text)
  OR (bucket_id = 'content-deliverables' AND (storage.foldername(name))[2] = auth.uid()::text)
);

CREATE POLICY "dropy_owner_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  (bucket_id IN ('store-assets', 'product-images', 'media') AND (storage.foldername(name))[1] = auth.uid()::text)
  OR (bucket_id = 'content-deliverables' AND (storage.foldername(name))[2] = auth.uid()::text)
);

CREATE POLICY "dropy_owner_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  (bucket_id IN ('store-assets', 'product-images', 'media') AND (storage.foldername(name))[1] = auth.uid()::text)
  OR (bucket_id = 'content-deliverables' AND (storage.foldername(name))[2] = auth.uid()::text)
);

CREATE POLICY "dropy_public_read"
ON storage.objects FOR SELECT
USING (bucket_id IN ('store-assets', 'product-images', 'media'));
