import { supabase } from '../config/SupabaseClient';

export interface AthleteExportData {
  athleteId: string;
  name: string;
  dateOfBirth: string | null;
  age: number | null;
  academicData: {
    lastName: string;
    firstName: string;
    middleInitial: string;
    yearGraduatedFromSHS: string;
    yearLevel: string;
    course: string;
    schoolPresentlyEnrolled: string;
    academicLoad: {
      firstSemester: { enrolled: number; units: number; passed: number; failed: number; percentage: number };
      secondSemester: { enrolled: number; units: number; passed: number; failed: number; percentage: number };
    };
  };
  photoStoragePath: string | null;
}

export async function getExportData(athleteIds: string[]): Promise<AthleteExportData[]> {
  const { data: athletes, error: athletesError } = await supabase
    .from('team_members')
    .select('id, name, date_of_birth, prisaa_academic_data')
    .in('id', athleteIds);

  if (athletesError) {
    console.error('Error fetching athletes for export:', athletesError);
    throw new Error('Could not load athlete data for export.');
  }

  const { data: photos, error: photosError } = await supabase
    .from('documents')
    .select('athlete_id, storage_path')
    .in('athlete_id', athleteIds)
    .eq('document_type', 'id_picture_1');

  if (photosError) {
    console.error('Error fetching photos for export:', photosError);
  }

  const photoMap = new Map((photos ?? []).map((p) => [p.athlete_id, p.storage_path]));

  return athleteIds.map((id) => {
    const athlete = (athletes ?? []).find((a) => a.id === id);
    const academicData = (athlete?.prisaa_academic_data as any) ?? {};

    const dob = athlete?.date_of_birth ?? null;
    const age = dob ? new Date().getFullYear() - new Date(dob).getFullYear() : null;

    return {
      athleteId: id,
      name: athlete?.name ?? 'Unknown',
      dateOfBirth: dob,
      age,
   academicData: {
          lastName: academicData.lastName ?? '',
          firstName: academicData.firstName ?? '',
          middleInitial: academicData.middleInitial ?? '',
          yearGraduatedFromSHS: academicData.yearGraduatedFromSHS ?? '',
          yearLevel: academicData.yearLevel ?? '',
          course: academicData.course ?? '',
          schoolPresentlyEnrolled: academicData.schoolPresentlyEnrolled ?? '',
          academicLoad: academicData.academicLoad ?? {
          firstSemester: { enrolled: 0, units: 0, passed: 0, failed: 0, percentage: 0 },
          secondSemester: { enrolled: 0, units: 0, passed: 0, failed: 0, percentage: 0 },
        },
      },
      photoStoragePath: photoMap.get(id) ?? null,
    };
  });
}

export async function downloadImageAsBuffer(storagePath: string): Promise<ArrayBuffer | null> {
  const { data, error } = await supabase.storage.from('athlete-documents').download(storagePath);
  if (error || !data) return null;
  return data.arrayBuffer();
}