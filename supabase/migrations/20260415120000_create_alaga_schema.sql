-- Alaga Mobile schema baseline

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  purpose TEXT,
  time_of_day TEXT,
  frequency TEXT,
  pill_photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_medications_name ON medications(name);
CREATE INDEX IF NOT EXISTS idx_medications_time_of_day ON medications(time_of_day);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reminder_action') THEN
    CREATE TYPE reminder_action AS ENUM ('taken', 'snoozed', 'missed');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'emotion_state') THEN
    CREATE TYPE emotion_state AS ENUM ('calm', 'confused', 'stressed');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'emotion_source') THEN
    CREATE TYPE emotion_source AS ENUM ('none', 'self_report', 'behavior_rule');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS reminder_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  action reminder_action NOT NULL,
  emotion_state emotion_state NOT NULL DEFAULT 'calm',
  emotion_source emotion_source NOT NULL DEFAULT 'none',
  rule_trigger TEXT,
  dwell_time_seconds INTEGER DEFAULT 0,
  snooze_count INTEGER DEFAULT 0,
  pill_photo_open_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reminder_events_medication_id ON reminder_events(medication_id);
CREATE INDEX IF NOT EXISTS idx_reminder_events_scheduled_for ON reminder_events(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_reminder_events_action ON reminder_events(action);
CREATE INDEX IF NOT EXISTS idx_reminder_events_emotion_state ON reminder_events(emotion_state);
CREATE INDEX IF NOT EXISTS idx_reminder_events_created_at ON reminder_events(created_at);
CREATE INDEX IF NOT EXISTS idx_reminder_events_med_date ON reminder_events(medication_id, scheduled_for DESC);

ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_events ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE medications TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE reminder_events TO anon, authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'medications' AND policyname = 'medications_read_all'
  ) THEN
    CREATE POLICY medications_read_all ON medications
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'medications' AND policyname = 'medications_insert_all'
  ) THEN
    CREATE POLICY medications_insert_all ON medications
      FOR INSERT
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'medications' AND policyname = 'medications_update_all'
  ) THEN
    CREATE POLICY medications_update_all ON medications
      FOR UPDATE
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'medications' AND policyname = 'medications_delete_all'
  ) THEN
    CREATE POLICY medications_delete_all ON medications
      FOR DELETE
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'reminder_events' AND policyname = 'reminder_events_read_all'
  ) THEN
    CREATE POLICY reminder_events_read_all ON reminder_events
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'reminder_events' AND policyname = 'reminder_events_insert_all'
  ) THEN
    CREATE POLICY reminder_events_insert_all ON reminder_events
      FOR INSERT
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'reminder_events' AND policyname = 'reminder_events_update_all'
  ) THEN
    CREATE POLICY reminder_events_update_all ON reminder_events
      FOR UPDATE
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'reminder_events' AND policyname = 'reminder_events_delete_all'
  ) THEN
    CREATE POLICY reminder_events_delete_all ON reminder_events
      FOR DELETE
      USING (true);
  END IF;
END $$;