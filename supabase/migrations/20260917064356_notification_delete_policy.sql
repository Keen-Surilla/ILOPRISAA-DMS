GRANT DELETE ON TABLE public.notifications TO authenticated;

CREATE POLICY "Recipients can delete own notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (recipient_profile_id = (SELECT auth.uid()));
