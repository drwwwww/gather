-- Add image attachment support to announcements
ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS image_url text;

-- Storage bucket for announcement images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'announcements',
  'announcements',
  true,
  5242880,
  ARRAY['image/jpeg','image/png','image/gif','image/webp','image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (drop first so re-running is safe)
DROP POLICY IF EXISTS "Admins can upload announcement images" ON storage.objects;
CREATE POLICY "Admins can upload announcement images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'announcements'
  AND is_admin()
);

DROP POLICY IF EXISTS "Anyone authenticated can read announcement images" ON storage.objects;
CREATE POLICY "Anyone authenticated can read announcement images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'announcements');

DROP POLICY IF EXISTS "Admins can delete announcement images" ON storage.objects;
CREATE POLICY "Admins can delete announcement images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'announcements'
  AND is_admin()
);
