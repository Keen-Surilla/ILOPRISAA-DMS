CREATE TYPE public.user_role_new AS ENUM ('athlete', 'coach', 'school_admin', 'committee', 'admin');

DROP POLICY IF EXISTS "Committee can read audit log"
  ON public.document_audit_log;

DROP POLICY IF EXISTS "Committee can view coach profiles"
  ON public.profiles;

DROP POLICY IF EXISTS "Committee can view team_members"
  ON public.team_members;

DROP POLICY IF EXISTS resource_documents_admin_delete
  ON public.resource_documents;

DROP POLICY IF EXISTS resource_documents_admin_insert
  ON public.resource_documents;

DROP POLICY IF EXISTS resource_documents_admin_update
  ON public.resource_documents;

DROP POLICY IF EXISTS committee_templates_admin_delete
  ON storage.objects;

DROP POLICY IF EXISTS committee_templates_admin_write
  ON storage.objects;

DROP POLICY IF EXISTS invites_insert_role_check
  ON public.invites;

DROP POLICY IF EXISTS invites_select_own
  ON public.invites;

DROP FUNCTION IF EXISTS public.get_invite_by_token(uuid);
DROP FUNCTION IF EXISTS public.my_role();

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

DROP TYPE public.user_role;

ALTER TYPE public.user_role_new RENAME TO user_role;

CREATE OR REPLACE FUNCTION public.my_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $function$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.get_invite_by_token(p_token uuid)
RETURNS TABLE(
  email text,
  role public.user_role,
  status public.invite_status,
  expires_at timestamp with time zone,
  institution_id text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT email, role, status, expires_at, institution_id
  FROM public.invites
  WHERE token = p_token;
$function$;

CREATE POLICY "Committee can read audit log"
  ON public.document_audit_log
  FOR SELECT
  TO authenticated
  USING (public.my_role() = 'committee'::public.user_role);

CREATE POLICY "Committee can view coach profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.my_role() = 'committee'::public.user_role);

CREATE POLICY "Committee can view team_members"
  ON public.team_members
  FOR SELECT
  TO authenticated
  USING (public.my_role() = 'committee'::public.user_role);

CREATE POLICY resource_documents_admin_delete
  ON public.resource_documents
  FOR DELETE
  TO authenticated
  USING (public.my_role() = 'school_admin'::public.user_role);

CREATE POLICY resource_documents_admin_insert
  ON public.resource_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (public.my_role() = 'school_admin'::public.user_role);

CREATE POLICY resource_documents_admin_update
  ON public.resource_documents
  FOR UPDATE
  TO authenticated
  USING (public.my_role() = 'school_admin'::public.user_role)
  WITH CHECK (public.my_role() = 'school_admin'::public.user_role);

CREATE POLICY committee_templates_admin_delete
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'committee_templates'
    AND public.my_role() = 'school_admin'::public.user_role
  );

CREATE POLICY committee_templates_admin_write
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'committee_templates'
    AND public.my_role() = 'school_admin'::public.user_role
  );

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

