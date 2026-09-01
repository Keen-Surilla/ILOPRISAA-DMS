CREATE TYPE public.user_role_new AS ENUM ('athlete', 'coach', 'school_admin', 'committee', 'admin');

ALTER TABLE public.profiles
  ALTER COLUMN role TYPE public.user_role_new
  USING CASE 
    WHEN role::text = 'super_admin' THEN 'admin'::public.user_role_new
    WHEN role::text = 'admin' THEN 'school_admin'::public.user_role_new
    ELSE role::text::public.user_role_new
  END;

ALTER TABLE public.invites
  ALTER COLUMN role TYPE public.user_role_new
  USING CASE 
    WHEN role::text = 'super_admin' THEN 'admin'::public.user_role_new
    WHEN role::text = 'admin' THEN 'school_admin'::public.user_role_new
    ELSE role::text::public.user_role_new
  END;

DROP TYPE public.user_role CASCADE;

ALTER TYPE public.user_role_new RENAME TO user_role;

-- Recreate RLS on invites table after type migration
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "invites: users see own sent invites" ON public.invites;
DROP POLICY IF EXISTS "invites: admins see all" ON public.invites;
DROP POLICY IF EXISTS "invites: users create own" ON public.invites;
DROP POLICY IF EXISTS "invites: users update own" ON public.invites;

-- Users can see invites they created (invited_by = auth.uid()).
CREATE POLICY "invites: users see own sent invites"
  ON public.invites
  FOR SELECT
  USING (invited_by = auth.uid());

-- Admins (top-level) can see all invites.
CREATE POLICY "invites: admins see all"
  ON public.invites
  FOR SELECT
  USING (public.get_my_role() = 'admin');

-- Users can only create invites for themselves.
CREATE POLICY "invites: users create own"
  ON public.invites
  FOR INSERT
  WITH CHECK (invited_by = auth.uid());

-- Users can only update invites they created.
CREATE POLICY "invites: users update own"
  ON public.invites
  FOR UPDATE
  USING (invited_by = auth.uid());

