CREATE TABLE coach_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  prisaa_form_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_coach_profiles_profile_id ON coach_profiles(profile_id);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_coach_profiles_updated_at
  BEFORE UPDATE ON coach_profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

ALTER TABLE coach_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view their own profile"
  ON coach_profiles FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Coaches can insert their own profile"
  ON coach_profiles FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Coaches can update their own profile"
  ON coach_profiles FOR UPDATE
  USING (profile_id = auth.uid());