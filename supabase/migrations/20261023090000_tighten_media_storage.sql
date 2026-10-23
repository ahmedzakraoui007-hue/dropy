-- The "media" bucket had leftover policies letting any signed-in user upload, overwrite or delete any
-- file in it. Uploads already go to "<user id>/..." and are covered by dropy_owner_insert/update/delete.
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Insert" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
