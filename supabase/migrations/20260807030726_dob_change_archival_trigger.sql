CREATE OR REPLACE FUNCTION recheck_eligibility_on_dob_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  cutoff_year INT;
BEGIN
  IF NEW.date_of_birth IS DISTINCT FROM OLD.date_of_birth THEN
    SELECT COALESCE(
      EXTRACT(YEAR FROM MIN(event_date))::INT,
      EXTRACT(YEAR FROM CURRENT_DATE)::INT
    )
    INTO cutoff_year
    FROM events
    WHERE type = 'event'
      AND event_date >= CURRENT_DATE;

    IF calculate_prisaa_age(NEW.date_of_birth, cutoff_year) >= 26 THEN
      NEW.status := 'archived';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_recheck_eligibility ON team_members;
CREATE TRIGGER trg_recheck_eligibility
  BEFORE UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION recheck_eligibility_on_dob_change();