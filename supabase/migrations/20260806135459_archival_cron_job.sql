CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION run_daily_archival()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  cutoff_year INT;
BEGIN
  SELECT COALESCE(
    EXTRACT(YEAR FROM MIN(event_date))::INT,
    EXTRACT(YEAR FROM CURRENT_DATE)::INT
  )
  INTO cutoff_year
  FROM events
  WHERE type = 'event'
    AND event_date >= CURRENT_DATE;

  UPDATE team_members
  SET status = 'archived'
  WHERE status = 'active'
    AND date_of_birth IS NOT NULL
    AND calculate_prisaa_age(date_of_birth, cutoff_year) >= 26;
END;
$$;

SELECT cron.schedule(
  'daily-athlete-archival',
  '0 0 * * *',
  $$SELECT run_daily_archival();$$
);