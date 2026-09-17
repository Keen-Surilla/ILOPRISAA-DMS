CREATE OR REPLACE FUNCTION public.school_admin_can_view_coach_team(p_coach_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles AS school_admin
    JOIN public.profiles AS coach
      ON coach.id = p_coach_id
    WHERE school_admin.id = (SELECT auth.uid())
      AND school_admin.role = 'school_admin'::public.user_role
      AND school_admin.institution_id IS NOT NULL
      AND coach.role = 'coach'::public.user_role
      AND coach.institution_id = school_admin.institution_id
  );
$function$;

REVOKE ALL ON FUNCTION public.school_admin_can_view_coach_team(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.school_admin_can_view_coach_team(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.school_admin_can_view_coach_team(uuid) TO authenticated;

DROP POLICY IF EXISTS "School admins can view institution team_members"
  ON public.team_members;

CREATE POLICY "School admins can view institution team_members"
  ON public.team_members
  FOR SELECT
  TO authenticated
  USING (public.school_admin_can_view_coach_team(team_members.coach_id));
