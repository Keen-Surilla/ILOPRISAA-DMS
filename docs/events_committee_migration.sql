-- =============================================================================
-- ILOPRISAA — Committee + Calendar migration ONLY
-- Run this in Supabase SQL Editor. Do NOT re-run rls_policies.sql if policies
-- already exist (you will get "policy already exists" errors).
-- Safe to run this file more than once (uses DROP IF EXISTS + IF NOT EXISTS).
-- =============================================================================

-- 1) Add committee to user_role enum (skip if already added)
DO $$ BEGIN
  ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'committee';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2) Calendar events table
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_kind text NOT NULL CHECK (event_kind IN (
    'game_start', 'document_deadline', 'waiver_deadline', 'form_deadline', 'other'
  )),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- 3) Calendar RLS (idempotent)
DROP POLICY IF EXISTS "events: authenticated read" ON public.calendar_events;
CREATE POLICY "events: authenticated read"
  ON public.calendar_events FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "events: committee manage" ON public.calendar_events;
CREATE POLICY "events: committee manage"
  ON public.calendar_events FOR ALL
  TO authenticated
  USING (public.get_my_role() IN ('committee', 'admin'))
  WITH CHECK (public.get_my_role() IN ('committee', 'admin'));

-- 4) Committee document access (idempotent)
DROP POLICY IF EXISTS "documents: committee read all" ON public.documents;
CREATE POLICY "documents: committee read all"
  ON public.documents FOR SELECT
  TO authenticated
  USING (public.get_my_role() IN ('committee', 'admin'));

DROP POLICY IF EXISTS "documents: committee update" ON public.documents;
CREATE POLICY "documents: committee update"
  ON public.documents FOR UPDATE
  TO authenticated
  USING (public.get_my_role() IN ('committee', 'admin'));
