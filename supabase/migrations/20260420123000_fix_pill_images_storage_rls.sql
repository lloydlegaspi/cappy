-- Ensure medication image bucket and RLS policies match current app behavior.
-- App behavior:
--   1) Upload path: <userId>/<medicationId>/<timestamp-random>.<ext>
--   2) App uses getPublicUrl() for display, so bucket must be public.

INSERT INTO storage.buckets (id, name, public)
VALUES ('pill-images', 'pill-images', true)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  public = true;

-- Remove prior app-specific policies so this migration can be re-run safely.
DROP POLICY IF EXISTS pill_images_select_own ON storage.objects;
DROP POLICY IF EXISTS pill_images_insert_own ON storage.objects;
DROP POLICY IF EXISTS pill_images_update_own ON storage.objects;
DROP POLICY IF EXISTS pill_images_delete_own ON storage.objects;

CREATE POLICY pill_images_select_own ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'pill-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY pill_images_insert_own ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'pill-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND array_length(storage.foldername(name), 1) >= 2
  );

CREATE POLICY pill_images_delete_own ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'pill-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
