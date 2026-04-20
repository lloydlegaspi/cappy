-- Fix user_settings upsert target used by the app:
-- .upsert(..., { onConflict: 'user_id' })
--
-- PostgreSQL cannot infer a partial unique index for plain ON CONFLICT (user_id),
-- so ensure a non-partial unique index exists on user_id.

-- Keep the most recently updated row per non-null user_id if drift ever created duplicates.
WITH ranked AS (
  SELECT
    ctid,
    user_id,
    row_number() OVER (
      PARTITION BY user_id
      ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
    ) AS rn
  FROM public.user_settings
  WHERE user_id IS NOT NULL
)
DELETE FROM public.user_settings us
USING ranked r
WHERE us.ctid = r.ctid
  AND r.rn > 1;

-- Remove the old partial unique index created earlier for user_id uniqueness.
DROP INDEX IF EXISTS public.idx_user_settings_user_id_unique;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_index i
    JOIN pg_class t ON t.oid = i.indrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'user_settings'
      AND i.indisunique
      AND i.indpred IS NULL
      AND i.indnatts = 1
      AND pg_get_indexdef(i.indexrelid) LIKE '%(user_id)%'
  ) THEN
    CREATE UNIQUE INDEX idx_user_settings_user_id_unique_full
      ON public.user_settings(user_id);
  END IF;
END $$;
