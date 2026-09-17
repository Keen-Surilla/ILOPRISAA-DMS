CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_profile_id UUID NOT NULL REFERENCES public.profiles(id),
  athlete_id UUID NOT NULL REFERENCES public.team_members(id),
  created_by_profile_id UUID NOT NULL REFERENCES public.profiles(id),
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_recipient_profile_id ON public.notifications(recipient_profile_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Limit client privileges independently of row ownership policies.
REVOKE ALL ON TABLE public.notifications FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.notifications TO authenticated;
GRANT UPDATE (read_at) ON TABLE public.notifications TO authenticated;

CREATE POLICY "notifications: school admins create own"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_my_role() = 'school_admin'
    AND created_by_profile_id = auth.uid()
  );

CREATE POLICY "notifications: recipients read own"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (recipient_profile_id = auth.uid());

CREATE POLICY "notifications: recipients update own"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (recipient_profile_id = auth.uid())
  WITH CHECK (recipient_profile_id = auth.uid());
