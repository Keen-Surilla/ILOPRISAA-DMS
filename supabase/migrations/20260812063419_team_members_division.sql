ALTER TABLE team_members
  ADD COLUMN IF NOT EXISTS division TEXT
  CHECK (division IN ('elementary', 'highschool', 'tertiary'));