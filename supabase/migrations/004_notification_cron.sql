-- =============================================
-- Schedule send-notifications edge function
-- Goal: 2 notifications per user per day
-- =============================================
--
-- ONE-TIME MANUAL STEP (required before this migration works):
--
-- 1. Store the Supabase service_role key in Vault so cron can authenticate
--    to the edge function. Run this in the SQL editor ONCE:
--
--      SELECT vault.create_secret(
--        '<PASTE_YOUR_SERVICE_ROLE_KEY_HERE>',
--        'service_role_key'
--      );
--
--    Get the key from: Supabase Dashboard -> Project Settings -> API
--    -> "service_role" key (NEVER commit this).
--
-- 2. Run this migration.
--
-- Schedule:
--   08:00 UTC -> Turkey 11:00 (morning slot)
--   15:00 UTC -> Turkey 18:00 (evening slot)
--   ~7h gap between runs; edge function enforces 4h per-user minimum
--   and per-user quiet hours / timezone are already respected inside.
-- =============================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Idempotent unschedule so re-running this migration replaces the jobs
DO $$
BEGIN
  PERFORM cron.unschedule('send-notifications-morning')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-notifications-morning');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('send-notifications-evening')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-notifications-evening');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Morning batch: 08:00 UTC every day
SELECT cron.schedule(
  'send-notifications-morning',
  '0 8 * * *',
  $job$
  SELECT net.http_post(
    url := 'https://djdwolekentrczauhlpl.supabase.co/functions/v1/send-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret
        FROM vault.decrypted_secrets
        WHERE name = 'service_role_key'
        LIMIT 1
      )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $job$
);

-- Evening batch: 15:00 UTC every day
SELECT cron.schedule(
  'send-notifications-evening',
  '0 15 * * *',
  $job$
  SELECT net.http_post(
    url := 'https://djdwolekentrczauhlpl.supabase.co/functions/v1/send-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret
        FROM vault.decrypted_secrets
        WHERE name = 'service_role_key'
        LIMIT 1
      )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $job$
);

-- Verify (run after migration to confirm jobs are registered):
--   SELECT jobname, schedule, active FROM cron.job
--   WHERE jobname LIKE 'send-notifications-%';
--
-- Inspect run history:
--   SELECT * FROM cron.job_run_details
--   WHERE jobid IN (SELECT jobid FROM cron.job WHERE jobname LIKE 'send-notifications-%')
--   ORDER BY start_time DESC LIMIT 20;
