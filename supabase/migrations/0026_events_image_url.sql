-- Add image attachment support to events
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS image_url text;

-- Reuse the announcements storage bucket (already created in 0025)
-- but add a policy for events uploads under the same bucket path
DROP POLICY IF EXISTS "Admins can upload event images" ON storage.objects;
CREATE POLICY "Admins can upload event images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'announcements'
  AND is_admin()
);
