-- Member sign-up "build your profile" step (mobile): new optional profile
-- fields, plus the storage bucket for avatar photos. See
-- design-handoff/mobile/member-signup-profile-builder-idea.md for the product
-- rationale. All new columns are nullable — the builder screens are fully
-- skippable, per that doc's decision-fatigue guidance.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS favorite_verse text,
  ADD COLUMN IF NOT EXISTS ministry_interests text[],
  -- Marks that this user has been through the profile-builder screens (even if
  -- they skipped every field) — distinguishes "brand new row, show the builder"
  -- from "existing member with no church" (e.g. removed from a church later),
  -- which should go straight to rejoin/church-select instead.
  ADD COLUMN IF NOT EXISTS profile_completed_at timestamptz;

-- Every profile that already exists predates this feature and never needs the
-- builder — without this backfill, an existing member later removed from
-- their church (church_id goes back to null) would be misrouted into the
-- profile-builder instead of straight to rejoin, since profile_completed_at
-- would read as "never completed" on every pre-existing row.
UPDATE profiles SET profile_completed_at = COALESCE(profile_completed_at, created_at)
WHERE profile_completed_at IS NULL;

-- Storage bucket for member avatar photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg','image/png','image/gif','image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Each user may only write inside their own `{auth.uid()}/...` folder.
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can replace their own avatar" ON storage.objects;
CREATE POLICY "Users can replace their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Anyone authenticated can read avatars" ON storage.objects;
CREATE POLICY "Anyone authenticated can read avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');
