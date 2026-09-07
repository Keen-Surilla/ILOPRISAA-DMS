-- Store athlete sport/gender on the roster record.
-- Manual athlete records do not require an auth profile, so these attributes
-- must live on team_members rather than depending on profiles.user_id.

ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS sport TEXT,
  ADD COLUMN IF NOT EXISTS gender TEXT;

-- Keep the values controlled without making existing/null records invalid.
ALTER TABLE public.team_members
  DROP CONSTRAINT IF EXISTS team_members_gender_check;

ALTER TABLE public.team_members
  ADD CONSTRAINT team_members_gender_check
  CHECK (gender IS NULL OR gender IN ('Male', 'Female'));