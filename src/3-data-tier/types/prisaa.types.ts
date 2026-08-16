// src/3-data-tier/types/prisaa-types.ts

// Add to prisaa.types.ts, replacing my earlier placeholder

export interface EducationEntry {
  school: string;
  yearGraduated: string;
  degreeUnitsEarned: string;
}

export interface RelatedExperienceEntry {
  dateEntered: string;
  status: string;
  rankLevel: string;
  position: string;
  yearsInService: string;
}

export interface PrisaaCoachFormData {
  eventSports: string;
  date: string;

  // Personal Info
  name: string;
  address: string;
  telNo: string;
  dateOfBirth: string;
  placeOfBirth: string;
  height: string;
  weight: string;
  sex: string;
  email: string;
  civilStatus: string;
  citizenship: string;
  religion: string;

  // Family
  fathersName: string;
  fathersOccupation: string;
  mothersName: string;
  mothersOccupation: string;
  theirAddress: string;
  nameOfSpouse: string;
  spouseOccupation: string;

  // Educational Background (fixed 4 rows on the real form)
  educationalBackground: {
    elementary: EducationEntry;
    secondary: EducationEntry;
    tertiary: EducationEntry;
    postGraduate: EducationEntry;
  };

  // Related Experience — variable number of rows, so an array
  relatedExperience: RelatedExperienceEntry[];

  dateAccomplished: string;
}
// src/3-data-tier/types/prisaa-types.ts

export interface CoachFormBlock {
  lastNameFirstNameMI: string;
  dateOfBirth: string;
  yearGraduatedFromSHS?: string; // Senior division only
}

// ── Youth Division (Elementary & High School — identical field structure) ──
export interface YouthAthleteEntry {
  lastNameFirstNameMI: string;
  dateOfBirth: string;
  age: number;
  yearLevel: string;
  schoolPresentlyEnrolled: string;
  eligibilityChecklist: {
    sf10: boolean;
    pc: boolean; // Parent's Consent
    mc: boolean; // Medical Certificate
    dataPrivacy: boolean;
    copyOfPSA: boolean;
    pic: boolean; // 2x2 Picture
  };
  qualified: boolean;
  reasonForDisqualification?: string;
}

// ── Senior Division (Tertiary) ──
export interface AcademicLoadSemester {
  enrolled: number;
  units: number;
  passed: number;
  failed: number;
  percentage: number;
}

export interface SeniorAthleteEntry {
  lastNameFirstNameMI: string;
  dateOfBirth: string;
  age: number;
  yearGraduatedFromSHS: string;
  yearLevelAndCourse: string;
  schoolPresentlyEnrolled: string;
  academicLoad: {
    firstSemester: AcademicLoadSemester;
    secondSemester: AcademicLoadSemester;
  };
  eligibilityChecklist: {
    tor: boolean; // Transcript of Records
    pc: boolean;
    mc: boolean;
    dataPrivacy: boolean;
    copyOfPSA: boolean;
    pic: boolean;
  };
  qualified: boolean;
  reasonForDisqualification?: string;
}

export type Division = 'senior' | 'youth_highschool' | 'youth_elementary';

export interface PrisaaFormExportData {
  division: Division;
  cluster: string;
  region: string;
  sportsEvent: string;
  divisionGender: 'MEN' | 'WOMEN' | 'BOYS' | 'GIRLS';
  coach: CoachFormBlock;
  athletes: (YouthAthleteEntry | SeniorAthleteEntry)[]; // max 5 per sheet — see chunking note
}