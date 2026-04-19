-- Guest-first multi-user ownership with anonymous auth support.

ALTER TABLE public.medications
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.reminder_events
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.medications
  ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE public.reminder_events
  ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE public.user_settings
  ALTER COLUMN user_id SET DEFAULT auth.uid();

-- user_settings previously used a singleton row id. Use generated ids so each user can own a row.
ALTER TABLE public.user_settings
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

UPDATE public.user_settings
SET id = gen_random_uuid()::text
WHERE id = 'default';

CREATE INDEX IF NOT EXISTS idx_medications_user_id ON public.medications(user_id);
CREATE INDEX IF NOT EXISTS idx_reminder_events_user_id ON public.reminder_events(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_settings_user_id_unique
  ON public.user_settings(user_id)
  WHERE user_id IS NOT NULL;

REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE public.medications FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE public.reminder_events FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_settings FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.medications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.reminder_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_settings TO authenticated;

DROP POLICY IF EXISTS medications_read_all ON public.medications;
DROP POLICY IF EXISTS medications_insert_all ON public.medications;
DROP POLICY IF EXISTS medications_update_all ON public.medications;
DROP POLICY IF EXISTS medications_delete_all ON public.medications;

DROP POLICY IF EXISTS reminder_events_read_all ON public.reminder_events;
DROP POLICY IF EXISTS reminder_events_insert_all ON public.reminder_events;
DROP POLICY IF EXISTS reminder_events_update_all ON public.reminder_events;
DROP POLICY IF EXISTS reminder_events_delete_all ON public.reminder_events;

DROP POLICY IF EXISTS user_settings_read_all ON public.user_settings;
DROP POLICY IF EXISTS user_settings_insert_all ON public.user_settings;
DROP POLICY IF EXISTS user_settings_update_all ON public.user_settings;
DROP POLICY IF EXISTS user_settings_delete_all ON public.user_settings;

DROP POLICY IF EXISTS medications_select_own ON public.medications;
DROP POLICY IF EXISTS medications_insert_own ON public.medications;
DROP POLICY IF EXISTS medications_update_own ON public.medications;
DROP POLICY IF EXISTS medications_delete_own ON public.medications;

DROP POLICY IF EXISTS reminder_events_select_own ON public.reminder_events;
DROP POLICY IF EXISTS reminder_events_insert_own ON public.reminder_events;
DROP POLICY IF EXISTS reminder_events_update_own ON public.reminder_events;
DROP POLICY IF EXISTS reminder_events_delete_own ON public.reminder_events;

DROP POLICY IF EXISTS user_settings_select_own ON public.user_settings;
DROP POLICY IF EXISTS user_settings_insert_own ON public.user_settings;
DROP POLICY IF EXISTS user_settings_update_own ON public.user_settings;
DROP POLICY IF EXISTS user_settings_delete_own ON public.user_settings;

CREATE POLICY medications_select_own ON public.medications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY medications_insert_own ON public.medications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY medications_update_own ON public.medications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY medications_delete_own ON public.medications
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY reminder_events_select_own ON public.reminder_events
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY reminder_events_insert_own ON public.reminder_events
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.medications m
      WHERE m.id = medication_id
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY reminder_events_update_own ON public.reminder_events
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.medications m
      WHERE m.id = medication_id
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY reminder_events_delete_own ON public.reminder_events
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY user_settings_select_own ON public.user_settings
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY user_settings_insert_own ON public.user_settings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_settings_update_own ON public.user_settings
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_settings_delete_own ON public.user_settings
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

INSERT INTO storage.buckets (id, name, public)
VALUES ('pill-images', 'pill-images', true)
ON CONFLICT (id) DO NOTHING;

UPDATE storage.buckets
SET public = true
WHERE id = 'pill-images';

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
    AND array_length(storage.foldername(name), 1) >= 3
  );

CREATE POLICY pill_images_update_own ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'pill-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'pill-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND array_length(storage.foldername(name), 1) >= 3
  );

CREATE POLICY pill_images_delete_own ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'pill-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
