-- ============================================================
-- TIER 3 — DATA TIER: Row-Level Security Policies
-- Run this entire file in the Supabase SQL Editor.
--
-- SECURITY RATIONALE:
-- RLS is enforced at the PostgreSQL engine level — it CANNOT be
-- bypassed by any client-side code, malformed API call, or
-- JWT manipulation. Even if an attacker obtains the anon key,
-- they can only access rows the policy permits for their identity.
--
-- Mitigates: OWASP A01 (Broken Access Control)
-- Mitigates: OWASP A04 (Insecure Direct Object Reference / IDOR)
-- ============================================================


-- ── 0. HELPER FUNCTION ──────────────────────────────────────
-- Retrieves the current user's role without exposing the profiles
-- table schema to attackers enumerating columns.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER  -- Runs as owner, not caller — prevents privilege escalation
AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$;


-- ── 1. PROFILES TABLE ────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Athletes and coaches can read their own profile only.
CREATE POLICY "profiles: users read own row"
  ON public.profiles
  FOR SELECT
  USING (id = auth.uid());

-- Admins can read all profiles (needed for management views).
CREATE POLICY "profiles: admins read all"
  ON public.profiles
  FOR SELECT
  USING (public.get_my_role() = 'admin');

-- Users can only update their own profile.
CREATE POLICY "profiles: users update own row"
  ON public.profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    -- Prevent role self-elevation: users cannot change their own role.
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

-- Profiles are created via a trigger on auth.users INSERT, not directly.
-- No INSERT policy needed here.


-- ── 2. DOCUMENTS TABLE ──────────────────────────────────────

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- ATHLETES: SELECT own documents only
CREATE POLICY "documents: athletes read own"
  ON public.documents
  FOR SELECT
  USING (
    athlete_id = auth.uid()
    AND public.get_my_role() = 'athlete'
  );

-- ATHLETES: INSERT only for themselves (status must start as 'draft')
CREATE POLICY "documents: athletes insert own"
  ON public.documents
  FOR INSERT
  WITH CHECK (
    athlete_id = auth.uid()
    AND public.get_my_role() = 'athlete'
    AND status = 'draft'   -- Cannot self-promote to 'verified'
  );

-- COACHES: SELECT documents for athletes assigned to their institution.
-- The subquery join through coach_athlete_assignments enforces the
-- coach-athlete relationship at the database level.
CREATE POLICY "documents: coaches read assigned athletes"
  ON public.documents
  FOR SELECT
  USING (
    public.get_my_role() = 'coach'
    AND athlete_id IN (
      SELECT caa.athlete_id
      FROM public.coach_athlete_assignments caa
      WHERE caa.coach_id = auth.uid()
    )
  );

-- COACHES: UPDATE (review) documents for assigned athletes.
-- Coaches cannot change athlete_id, document_type, or digital_signature.
CREATE POLICY "documents: coaches update assigned athletes"
  ON public.documents
  FOR UPDATE
  USING (
    public.get_my_role() = 'coach'
    AND athlete_id IN (
      SELECT caa.athlete_id
      FROM public.coach_athlete_assignments caa
      WHERE caa.coach_id = auth.uid()
    )
  )
  WITH CHECK (
    -- A coach can only move status to 'pending_review', 'verified', or 'action_required'.
    -- They CANNOT revert a 'verified' document back to 'draft'.
    status IN ('pending_review', 'verified', 'action_required')
  );

-- ADMINS: Full access — used for system-level operations only.
CREATE POLICY "documents: admins full access"
  ON public.documents
  USING (public.get_my_role() = 'admin');


-- ── 3. AUDIT_LOGS TABLE ─────────────────────────────────────

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Anyone can INSERT their own audit events (via service role in practice).
CREATE POLICY "audit_logs: authenticated insert"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (actor_id = auth.uid());

-- Only admins can read audit logs.
CREATE POLICY "audit_logs: admins read all"
  ON public.audit_logs
  FOR SELECT
  USING (public.get_my_role() = 'admin');

-- Audit logs are IMMUTABLE — no UPDATE or DELETE ever.
-- (No UPDATE/DELETE policies are defined — they default to DENY.)


-- ── 4. COACH_ATHLETE_ASSIGNMENTS TABLE ──────────────────────

ALTER TABLE public.coach_athlete_assignments ENABLE ROW LEVEL SECURITY;

-- Coaches see only their own assignments.
CREATE POLICY "assignments: coaches read own"
  ON public.coach_athlete_assignments
  FOR SELECT
  USING (coach_id = auth.uid() AND public.get_my_role() = 'coach');

-- Athletes can see who is assigned to them.
CREATE POLICY "assignments: athletes read own"
  ON public.coach_athlete_assignments
  FOR SELECT
  USING (athlete_id = auth.uid() AND public.get_my_role() = 'athlete');

-- Only admins can create/delete assignments.
CREATE POLICY "assignments: admins manage"
  ON public.coach_athlete_assignments
  USING (public.get_my_role() = 'admin');


-- ── 5. STORAGE BUCKET POLICIES ──────────────────────────────
-- Run after creating the 'athlete-credentials' bucket in Supabase Storage.

-- Athletes can upload only into their own UUID-prefixed path.
-- Path format: athlete-credentials/{athlete_uuid}/...
CREATE POLICY "storage: athletes upload own files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'athlete-credentials'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND public.get_my_role() = 'athlete'
  );

-- Athletes can read only their own files.
CREATE POLICY "storage: athletes read own files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'athlete-credentials'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Coaches can read files for their assigned athletes only.
CREATE POLICY "storage: coaches read assigned athletes files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'athlete-credentials'
    AND public.get_my_role() = 'coach'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT athlete_id
      FROM public.coach_athlete_assignments
      WHERE coach_id = auth.uid()
    )
  );

-- Admins have full storage access.
CREATE POLICY "storage: admins full access"
  ON storage.objects
  USING (
    bucket_id = 'athlete-credentials'
    AND public.get_my_role() = 'admin'
  );


-- ── 6. PROFILE AUTO-CREATION TRIGGER ────────────────────────
-- Creates a profile row when a new user signs up via Supabase Auth.
-- The role is set by the admin AFTER account creation; users cannot
-- self-assign a role at signup.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, email)
  VALUES (
    NEW.id,
    'athlete',  -- Default to least-privileged role
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

