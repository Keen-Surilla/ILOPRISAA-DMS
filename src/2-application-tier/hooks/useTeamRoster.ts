import { useCallback, useEffect, useState } from "react";
import { teamApi, TeamApiError, type TeamMember } from "../../3-data-tier/api/teamApi"; // adjust path to your project
import { getSimplifiedDocumentChecksForAthletes, type SimplifiedDocumentChecks } from "../../3-data-tier/api/documentsApi"; // adjust path to your project
import type { AthleteRecord } from "../../1-presentation-tier/pages/coach-views/Reports"; // adjust path to wherever ReportsPage lives

/**
 * ASSUMED SHAPE of `team_members.prisaa_academic_data`.
 *
 * I don't have your actual JSONB schema, so this is a best guess based on
 * the fields your Screening Forms flow needs (transcript units, computed
 * eligibility, and committee remarks). Please confirm or correct this
 * against your real column — either paste a sample row, or point me at the
 * type in `database.types.ts` — and I'll fix `mapTeamMemberToAthlete` below
 * to match exactly.
 *
 * NOTE: `documents` used to live here too, but that was wrong — it read
 * from a static JSONB blob that never reflects an actual upload, and its
 * status union didn't even include "missing" (so an athlete who'd never
 * uploaded anything silently showed as "pending"). Document status now
 * comes from documentsApi.getSimplifiedDocumentChecksForAthletes(), which
 * queries the real `documents` table — see below.
 */
interface PrisaaAcademicData {
  highSchoolGradYear?: number;
  firstSemester?: { passedUnits: number; enrolledUnits: number; failed?: boolean };
  secondSemester?: { enrolledUnits: number };
  eligibility?: "eligible" | "pending" | "ineligible";
  remarks?: string;
}

function computeYearLevel(division?: string | null): string {
  // ASSUMPTION: `division` holds something like "2nd Yr" already.
  // Replace with the real mapping once confirmed.
  return division ?? "—";
}

export function mapTeamMemberToAthlete(member: TeamMember, docs?: SimplifiedDocumentChecks): AthleteRecord {
  const academic = (member.prisaa_academic_data ?? {}) as PrisaaAcademicData;

  return {
    id: member.id,
    name: member.name,
    yearLevel: computeYearLevel(member.division),
    dateOfBirth: member.date_of_birth
      ? new Date(member.date_of_birth).toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        })
      : "—",
    highSchoolGradYear: academic.highSchoolGradYear ?? 0,
    firstSemester: academic.firstSemester ?? { passedUnits: 0, enrolledUnits: 0 },
    secondSemester: academic.secondSemester ?? { enrolledUnits: 0 },
    // Real document state — not uploaded shows "missing" (renders as "—" in
    // the table), uploaded-but-unreviewed shows "pending", and so on. See
    // documentsApi.ts's collapseGroup() for exactly how each is derived.
    documents: {
      psa: docs?.psa ?? { status: "missing" },
      medical: docs?.medical ?? { status: "missing" },
      waiver: docs?.waiver ?? { status: "missing" },
    },
    eligibility: academic.eligibility ?? "pending",
    remarks: academic.remarks ?? "Awaiting committee review.",
  };
}

interface UseTeamRosterResult {
  athletes: AthleteRecord[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Fetches a coach's roster from Supabase (via teamApi) and maps it into
 * the shape ReportsPage expects. Pass the signed-in coach's id — wire this
 * up to whatever your auth hook/context is called (e.g. `useAuth().user.id`).
 */
export function useTeamRoster(coachId: string | undefined): UseTeamRosterResult {
  const [athletes, setAthletes] = useState<AthleteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!coachId) {
      setAthletes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await teamApi.getTeamMembers(coachId);
      const athleteIds = rows.map((row) => row.id);
      // Real document status — always fetched fresh from the `documents`
      // table, never trusted from prisaa_academic_data. This is what makes
      // "not uploaded / pending / verified" actually accurate.
      const docChecks = await getSimplifiedDocumentChecksForAthletes(athleteIds);
      setAthletes(rows.map((row) => mapTeamMemberToAthlete(row, docChecks[row.id])));
    } catch (err) {
      setError(err instanceof TeamApiError ? err.message : "Could not load your team or their document status.");
    } finally {
      setLoading(false);
    }
  }, [coachId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { athletes, loading, error, refetch };
}