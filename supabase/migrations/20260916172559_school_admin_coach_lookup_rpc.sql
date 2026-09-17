CREATE OR REPLACE FUNCTION public.get_school_admin_coaches_by_ids(p_coach_ids uuid[])
RETURNS TABLE (
  id uuid,
  full_name text,
  email text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  WITH caller AS (
    SELECT school_admin.institution_id
    FROM public.profiles AS school_admin
    WHERE school_admin.id = (SELECT auth.uid())
      AND school_admin.role = 'school_admin'::public.user_role
      AND school_admin.institution_id IS NOT NULL
  )
  SELECT coach.id, coach.full_name, coach.email
  FROM public.profiles AS coach
  JOIN caller
    ON caller.institution_id = coach.institution_id
  WHERE (SELECT auth.uid()) IS NOT NULL
    AND coach.role = 'coach'::public.user_role
    AND coach.id = ANY (COALESCE(p_coach_ids, ARRAY[]::uuid[]));
$function$;

REVOKE ALL ON FUNCTION public.get_school_admin_coaches_by_ids(uuid[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_school_admin_coaches_by_ids(uuid[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_school_admin_coaches_by_ids(uuid[]) TO authenticated;
