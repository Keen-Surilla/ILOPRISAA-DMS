export interface School {
  id: string;
  name: string;
  abbreviation: string;
  aliases?: string[];
}

export const ILOPRISAA_SCHOOLS: School[] = [
  { id: 'Western Institute of Technology', name: 'Western Institute of Technology', abbreviation: 'WIT', aliases: ['WIT'] },
  { id: 'Central Philippine University', name: 'Central Philippine University', abbreviation: 'CPU', aliases: ['CPU'] },
  { id: 'John B. Lacson Foundation Maritime University', name: 'John B. Lacson Foundation Maritime University', abbreviation: 'JBLFMU', aliases: ['JBLFMU', 'JOHN B'] },
  { id: 'Hua Siong College of Iloilo', name: 'Hua Siong College of Iloilo', abbreviation: 'HSCI', aliases: ['HSCI', 'HUA SIONG'] },
  { id: "St. Robert's International College", name: "St. Robert's International College", abbreviation: 'SRIC', aliases: ['SRIC', 'ST ROBERTS INTERNATIONAL COLLEGE'] },
  { id: "Iloilo Doctors' College", name: "Iloilo Doctors' College", abbreviation: 'IDC', aliases: ['IDC', 'DOCTORS', 'ILOILO DOCTORS COLLEGE'] },
  { id: 'Ateneo de Iloilo', name: 'Ateneo de Iloilo', abbreviation: 'ADI', aliases: ['ADI'] },
  { id: 'Colegio de San Jose', name: 'Colegio de San Jose', abbreviation: 'CSJ', aliases: ['CSJ'] },
  { id: 'Santa Isabel College of Iloilo', name: 'Santa Isabel College of Iloilo', abbreviation: 'SICI', aliases: ['SICI'] },
  { id: 'Iloilo Scholastic Academy', name: 'Iloilo Scholastic Academy', abbreviation: 'ISA', aliases: ['ISA'] },
  { id: 'St. Paul University Iloilo', name: 'St. Paul University Iloilo', abbreviation: 'SPUI', aliases: ['SPUI', 'ST. PAUL', 'ST PAUL'] },
  { id: 'University of San Agustin', name: 'University of San Agustin', abbreviation: 'USA', aliases: ['USA', 'SAN AG'] },
  { id: 'Iloilo Integrated School Foundation', name: 'Iloilo Integrated School Foundation', abbreviation: 'IISF', aliases: ['IISF'] },
];

function normalizeInstitutionKey(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[.'’]/g, '')
    .replace(/\s+/g, ' ');
}

export function findSchool(institutionId: string | null | undefined): School | null {
  if (!institutionId) return null;
  const q = normalizeInstitutionKey(institutionId);

  return (
    ILOPRISAA_SCHOOLS.find(
      (s) =>
        normalizeInstitutionKey(s.id) === q ||
        normalizeInstitutionKey(s.name) === q ||
        normalizeInstitutionKey(s.abbreviation) === q ||
        (s.aliases ?? []).some((alias) => normalizeInstitutionKey(alias) === q)
    ) ?? null
  );
}

export function canonicalizeInstitutionName(institutionId: string | null | undefined): string | null {
  if (!institutionId) return null;
  const trimmed = institutionId.trim();
  if (!trimmed) return null;
  return findSchool(trimmed)?.name ?? trimmed;
}

export function getSchoolAbbreviation(institutionId: string | null | undefined): string {
  const school = findSchool(institutionId);
  if (school) return school.abbreviation;

  const trimmed = institutionId?.trim();
  if (!trimmed) return 'ILOPRISAA';

  return trimmed
    .split(/[\s-]+/)
    .map((word) => word[0])
    .filter((char) => char && /[a-zA-Z]/.test(char))
    .join('')
    .toUpperCase();
}
