export interface School {
  id: string;
  name: string;
}

export const ILOPRISAA_SCHOOLS: School[] = [
  { id: 'CPU', name: 'Central Philippine University' },
  { id: 'SAN AG', name: 'University of San Agustin' },
  { id: 'JOHN B', name: 'John B. Lacson Foundation Maritime University' },
  { id: 'WIT', name: 'Western Institute of Technology' },
  { id: 'DOCTORS', name: 'Iloilo Doctors College' },
  { id: 'ST. PAUL', name: 'St. Paul University Iloilo' },
  { id: 'UI', name: 'PHINMA University of Iloilo' },
  { id: 'HUA SIONG', name: 'Hua Siong College of Iloilo' },
  { id: 'SAGRADO', name: 'Colegio del Sagrado Corazon de Jesus' },
  { id: 'SJI', name: 'Sun Yat Sen High School' },
];


export function findSchool(institutionId: string | null | undefined): School | null {
  if (!institutionId) return null;
  const q = institutionId.trim().toUpperCase();
  return (
    ILOPRISAA_SCHOOLS.find(
      (s) => s.id.toUpperCase() === q || s.name.toUpperCase() === q
    ) ?? null
  );
}