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
    };
  });
}