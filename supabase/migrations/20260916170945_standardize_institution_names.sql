UPDATE public.profiles
SET institution_id = CASE upper(btrim(institution_id))
  WHEN 'WIT' THEN 'Western Institute of Technology'
  WHEN 'CPU' THEN 'Central Philippine University'
  WHEN 'JBLFMU' THEN 'John B. Lacson Foundation Maritime University'
  WHEN 'JOHN B' THEN 'John B. Lacson Foundation Maritime University'
  WHEN 'HSCI' THEN 'Hua Siong College of Iloilo'
  WHEN 'HUA SIONG' THEN 'Hua Siong College of Iloilo'
  WHEN 'SRIC' THEN 'St. Robert''s International College'
  WHEN 'ST ROBERTS INTERNATIONAL COLLEGE' THEN 'St. Robert''s International College'
  WHEN 'ST. ROBERTS INTERNATIONAL COLLEGE' THEN 'St. Robert''s International College'
  WHEN 'IDC' THEN 'Iloilo Doctors'' College'
  WHEN 'DOCTORS' THEN 'Iloilo Doctors'' College'
  WHEN 'ILOILO DOCTORS COLLEGE' THEN 'Iloilo Doctors'' College'
  WHEN 'ILOILO DOCTORS'' COLLEGE' THEN 'Iloilo Doctors'' College'
  WHEN 'ADI' THEN 'Ateneo de Iloilo'
  WHEN 'CSJ' THEN 'Colegio de San Jose'
  WHEN 'SICI' THEN 'Santa Isabel College of Iloilo'
  WHEN 'ISA' THEN 'Iloilo Scholastic Academy'
  WHEN 'SPUI' THEN 'St. Paul University Iloilo'
  WHEN 'ST. PAUL' THEN 'St. Paul University Iloilo'
  WHEN 'ST PAUL' THEN 'St. Paul University Iloilo'
  WHEN 'USA' THEN 'University of San Agustin'
  WHEN 'SAN AG' THEN 'University of San Agustin'
  WHEN 'IISF' THEN 'Iloilo Integrated School Foundation'
  ELSE btrim(institution_id)
END
WHERE institution_id IS NOT NULL;

UPDATE public.invites
SET institution_id = CASE upper(btrim(institution_id))
  WHEN 'WIT' THEN 'Western Institute of Technology'
  WHEN 'CPU' THEN 'Central Philippine University'
  WHEN 'JBLFMU' THEN 'John B. Lacson Foundation Maritime University'
  WHEN 'JOHN B' THEN 'John B. Lacson Foundation Maritime University'
  WHEN 'HSCI' THEN 'Hua Siong College of Iloilo'
  WHEN 'HUA SIONG' THEN 'Hua Siong College of Iloilo'
  WHEN 'SRIC' THEN 'St. Robert''s International College'
  WHEN 'ST ROBERTS INTERNATIONAL COLLEGE' THEN 'St. Robert''s International College'
  WHEN 'ST. ROBERTS INTERNATIONAL COLLEGE' THEN 'St. Robert''s International College'
  WHEN 'IDC' THEN 'Iloilo Doctors'' College'
  WHEN 'DOCTORS' THEN 'Iloilo Doctors'' College'
  WHEN 'ILOILO DOCTORS COLLEGE' THEN 'Iloilo Doctors'' College'
  WHEN 'ILOILO DOCTORS'' COLLEGE' THEN 'Iloilo Doctors'' College'
  WHEN 'ADI' THEN 'Ateneo de Iloilo'
  WHEN 'CSJ' THEN 'Colegio de San Jose'
  WHEN 'SICI' THEN 'Santa Isabel College of Iloilo'
  WHEN 'ISA' THEN 'Iloilo Scholastic Academy'
  WHEN 'SPUI' THEN 'St. Paul University Iloilo'
  WHEN 'ST. PAUL' THEN 'St. Paul University Iloilo'
  WHEN 'ST PAUL' THEN 'St. Paul University Iloilo'
  WHEN 'USA' THEN 'University of San Agustin'
  WHEN 'SAN AG' THEN 'University of San Agustin'
  WHEN 'IISF' THEN 'Iloilo Integrated School Foundation'
  ELSE btrim(institution_id)
END
WHERE institution_id IS NOT NULL;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_institution_id_canonical;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_institution_id_canonical
  CHECK (
    institution_id IS NULL OR institution_id IN (
      'Western Institute of Technology',
      'Central Philippine University',
      'John B. Lacson Foundation Maritime University',
      'Hua Siong College of Iloilo',
      'St. Robert''s International College',
      'Iloilo Doctors'' College',
      'Ateneo de Iloilo',
      'Colegio de San Jose',
      'Santa Isabel College of Iloilo',
      'Iloilo Scholastic Academy',
      'St. Paul University Iloilo',
      'University of San Agustin',
      'Iloilo Integrated School Foundation'
    )
  );

ALTER TABLE public.invites
  DROP CONSTRAINT IF EXISTS invites_institution_id_canonical;

ALTER TABLE public.invites
  ADD CONSTRAINT invites_institution_id_canonical
  CHECK (
    institution_id IS NULL OR institution_id IN (
      'Western Institute of Technology',
      'Central Philippine University',
      'John B. Lacson Foundation Maritime University',
      'Hua Siong College of Iloilo',
      'St. Robert''s International College',
      'Iloilo Doctors'' College',
      'Ateneo de Iloilo',
      'Colegio de San Jose',
      'Santa Isabel College of Iloilo',
      'Iloilo Scholastic Academy',
      'St. Paul University Iloilo',
      'University of San Agustin',
      'Iloilo Integrated School Foundation'
    )
  );

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
