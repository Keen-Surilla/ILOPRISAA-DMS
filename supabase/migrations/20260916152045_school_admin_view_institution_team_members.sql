CREATE POLICY "School admins can view institution team_members"
  ON public.team_members
  FOR SELECT
  TO authenticated
  USING (
    public.my_role() = 'school_admin'::public.user_role
    AND EXISTS (
      SELECT 1
      FROM public.profiles AS school_admin
      JOIN public.profiles AS coach
        ON coach.institution_id = school_admin.institution_id
      WHERE school_admin.id = auth.uid()
        AND school_admin.institution_id IS NOT NULL
        AND coach.id = team_members.coach_id
        AND coach.role = 'coach'::public.user_role
    )
  );
