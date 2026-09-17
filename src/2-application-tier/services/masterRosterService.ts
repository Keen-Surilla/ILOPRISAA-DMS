import {
  getDocumentDetailsForAthletes,
  TOTAL_REQUIRED_DOCUMENTS,
  type DocumentDetail,
} from '../../3-data-tier/api/documentsApi';
import { getProfilesByIds } from '../../3-data-tier/api/profilesApi';
import { teamApi } from '../../3-data-tier/api/teamApi';

export type MasterRosterEligibility =
  | 'VERIFIED'
  | 'PENDING'
  | 'FLAGGED';

export interface MasterRosterRecord {
  teamMemberId: string;
  name: string;
  avatarUrl?: string;
  division: 'Elementary' | 'High School' | 'Tertiary';
  gender: 'Male' | 'Female' | null;
  category:
    | 'Elementary Boys'
    | 'Elementary Girls'
    | 'High School Boys'
    | 'High School Girls'
    | 'Tertiary Men'
    | 'Tertiary Women'
    | 'Unspecified';
  sport: string;
  coachId: string;
  coachName: string;
  coachEmail: string;
  documentsSubmitted: number;
  documentsTotal: number;
  eligibility: MasterRosterEligibility;
}

type MasterRosterDivision = MasterRosterRecord['division'];
type MasterRosterGender = MasterRosterRecord['gender'];
type MasterRosterCategory = MasterRosterRecord['category'];
type SpecifiedMasterRosterGender = Exclude<MasterRosterGender, null>;

const DIVISION_LABELS: Record<string, MasterRosterDivision> = {
  elementary: 'Elementary',
  highschool: 'High School',
  'high school': 'High School',
  tertiary: 'Tertiary',
};

const GENDER_LABELS: Record<string, SpecifiedMasterRosterGender> = {
  male: 'Male',
  female: 'Female',
};

function normalizeDivision(value: string | null, teamMemberId: string): MasterRosterDivision {
  const normalizedDivision = value?.trim().toLowerCase();
  if (normalizedDivision) {
    const division = DIVISION_LABELS[normalizedDivision];
    if (division) return division;
  }

  throw new Error(`Unsupported division for team member ${teamMemberId}: ${value ?? 'null'}`);
}

function normalizeGender(value: string | null, teamMemberId: string): MasterRosterGender {
  const normalizedGender = value?.trim().toLowerCase();
  if (normalizedGender) {
    const gender = GENDER_LABELS[normalizedGender];
    if (gender) return gender;

    throw new Error(`Unsupported gender for team member ${teamMemberId}: ${value ?? 'null'}`);
  }

  return null;
}

function getCategory(
  division: MasterRosterDivision,
  gender: MasterRosterGender
): MasterRosterCategory {
  if (!gender) return 'Unspecified';

  if (division === 'Elementary') {
    return gender === 'Male' ? 'Elementary Boys' : 'Elementary Girls';
  }
  if (division === 'High School') {
    return gender === 'Male' ? 'High School Boys' : 'High School Girls';
  }
  return gender === 'Male' ? 'Tertiary Men' : 'Tertiary Women';
}

function getEligibility(details: DocumentDetail[]): MasterRosterEligibility {
  if (details.some((detail) => detail.status === 'rejected')) return 'FLAGGED';
  if (details.every((detail) => detail.status === 'verified')) return 'VERIFIED';
  return 'PENDING';
}

export async function getMasterRoster(): Promise<MasterRosterRecord[]> {
  const teamMembers = await teamApi.getTeamMembersForViewer();
  console.log('[getMasterRoster] raw team members:', teamMembers);
  console.log('[getMasterRoster] team members count:', teamMembers.length);
  console.log(
    '[getMasterRoster] team member coach ids:',
    teamMembers.map((member) => ({
      teamMemberId: member.id,
      name: member.name,
      coach_id: member.coach_id,
    }))
  );
  const memberIds = teamMembers.map((member) => member.id);
  const documentDetails = await getDocumentDetailsForAthletes(memberIds);
  const coachIds = [...new Set(
    teamMembers
      .map((member) => member.coach_id)
      .filter((coachId) => coachId.trim().length > 0)
  )];
  const coachProfiles = await getProfilesByIds(coachIds);
  const coachProfileMap = new Map(coachProfiles.map((profile) => [profile.id, profile]));
  const unresolvedCoachIds = coachIds.filter((coachId) => !coachProfileMap.has(coachId));

  if (unresolvedCoachIds.length > 0) {
    console.warn('[getMasterRoster] coach ids not returned by same-school coach lookup:', {
      coachIds: unresolvedCoachIds,
      possibleReasons: [
        'no matching profile exists',
        'profile role is not coach',
        'institution_id is null',
        'coach institution_id does not match the school admin institution_id',
      ],
    });
  }

  return teamMembers.map((member) => {
    const details = documentDetails[member.id] ?? [];
    const coach = coachProfileMap.get(member.coach_id);
    const division = normalizeDivision(member.division, member.id);
    const gender = normalizeGender(member.gender, member.id);

    return {
      teamMemberId: member.id,
      name: member.name,
      division,
      gender,
      category: getCategory(division, gender),
      sport: member.sport ?? '',
      coachId: member.coach_id,
      coachName: coach?.full_name ?? '',
      coachEmail: coach?.email ?? '',
      documentsSubmitted: details.filter((detail) => detail.status !== 'missing').length,
      documentsTotal: TOTAL_REQUIRED_DOCUMENTS,
      eligibility: getEligibility(details),
    };
  });
}
