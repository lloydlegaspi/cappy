-- Alaga Mobile: allow anon/demo inserts for medications
-- Apply this after the base schema from the old Alaga repo.

ALTER TABLE medications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'medications'
      AND policyname = 'medications_insert_all'
  ) THEN
    CREATE POLICY medications_insert_all ON medications
      FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'medications'
      AND policyname = 'medications_delete_all'
  ) THEN
    CREATE POLICY medications_delete_all ON medications
      FOR DELETE
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'medications'
      AND policyname = 'medications_update_all'
  ) THEN
    CREATE POLICY medications_update_all ON medications
      FOR UPDATE
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
