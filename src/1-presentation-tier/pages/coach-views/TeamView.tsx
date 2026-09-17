import { useMemo, useState, useEffect } from 'react';
import {
  FileText,
  Users,
  Filter,
  CheckCircle2,
  UserPlus,
  FolderUp,
  Search,
  ArrowUpDown,
  Pencil,
  Archive,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { TeamBulkUploadModal } from '../../components/ui/TeamBulkUploadModal';
import { AddAthleteModal } from '../../components/ui/AddAthleteModal';
import { useAuthStore } from '../../../2-application-tier/stores/authStore';
import { TableSkeleton } from '../../components/ui/SkeletonLoading';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { DocumentChecklistModal } from '../../components/ui/DocumentChecklistModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamApi } from '../../../3-data-tier/api/teamApi';
import { listEvents } from '../../../3-data-tier/services/eventService';
import { TOTAL_REQUIRED_DOCUMENTS } from '../../../3-data-tier/api/documentsApi';
import { coachProfileApi } from '../../../3-data-tier/api/coachProfileApi';
import {
  getScreeningRoster,
  type AthleteScreeningStatus,
} from '../../../3-data-tier/api/screeningApi';
import { getProfile } from '../../../3-data-tier/services/profileService';
import { supabase } from '../../../3-data-tier/config/SupabaseClient';
import { AthleteExportSelectModal } from '../../components/ui/AthleteExportSelectModal';
import { getExportData } from '../../../3-data-tier/api/exportApi';
// TODO: confirm this path once the tertiary generator's real location is settled
import { generatePrisaaForm01BTertiary } from '../../../3-data-tier/services/prisaaForm01BTertiary';
import { canonicalizeInstitutionName, getSchoolAbbreviation } from '../../../3-data-tier/constant/schools';

export function formatSportTeamName(rawSport?: string | null): string {
  if (!rawSport) return 'Team';

  const cleanSport = rawSport
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());

  return `${cleanSport} Team`;
}

export function getFullSchoolName(institutionId?: string | null): string {
  return canonicalizeInstitutionName(institutionId) ?? '';
}

// Best-effort fallback for when prisaa_academic_data has no lastName/firstName
// filled in — splits the roster's single `name` field instead.
// NOTE: this is a heuristic. Multi-word surnames (e.g. "de la Cruz") or names
// with a suffix (Jr., III) will not split perfectly — worth a manual glance
// at the generated form before submitting it anywhere official.
// Only pulls a token out as a middle initial if it actually looks like one
// (a single letter, optionally followed by a period) — a real given name
// like "Grace" won't match this, so it stays part of firstName instead of
// getting wrongly shortened to "G."
function extractInitialIfPresent(words: string[]): { rest: string[]; initial: string } {
  if (words.length < 2) return { rest: words, initial: '' };
  const last = words[words.length - 1];
  if (/^[A-Za-z]\.?$/.test(last)) {
    return { rest: words.slice(0, -1), initial: last.replace('.', '').toUpperCase() };
  }
  return { rest: words, initial: '' };
}

export function splitFullName(fullName: string): {
  lastName: string;
  firstName: string;
  middleInitial: string;
} {
  const trimmed = fullName.trim();
  if (!trimmed) return { lastName: '', firstName: '', middleInitial: '' };

  // Expected format from the Add Athlete form: "Last Name, First Name M.I."
  if (trimmed.includes(',')) {
    const [last, rest = ''] = trimmed.split(',').map((s) => s.trim());
    const restParts = rest.split(/\s+/).filter(Boolean);
    const { rest: firstNameParts, initial } = extractInitialIfPresent(restParts);
    return {
      lastName: last,
      firstName: firstNameParts.join(' '),
      middleInitial: initial,
    };
  }

  // Fallback for names typed without the comma format.
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return { lastName: parts[0], firstName: '', middleInitial: '' };

  const lastName = parts[parts.length - 1];
  const { rest: firstNameParts, initial } = extractInitialIfPresent(parts.slice(0, -1));

  return {
    lastName,
    firstName: firstNameParts.join(' '),
    middleInitial: initial,
  };
}

function getPrisaaAge(
  dob: string | null | undefined,
  eventYear: number
): number | null {
  if (!dob) return null;

  const birthYear = new Date(dob).getFullYear();

  if (Number.isNaN(birthYear)) return null;

  return eventYear - birthYear;
}

type EligibilityFilter =
  | 'all'
  | 'ready'
  | 'pending_verification'
  | 'missing_documents';

const CATEGORY_FILTERS = [
  { key: 'all', label: 'All Categories', division: null, gender: null },
  { key: 'elementary_boys', label: 'Elementary Boys', division: 'elementary', gender: 'Male' },
  { key: 'elementary_girls', label: 'Elementary Girls', division: 'elementary', gender: 'Female' },
  { key: 'highschool_boys', label: 'High School Boys', division: 'highschool', gender: 'Male' },
  { key: 'highschool_girls', label: 'High School Girls', division: 'highschool', gender: 'Female' },
  { key: 'tertiary_men', label: 'Tertiary Men', division: 'tertiary', gender: 'Male' },
  { key: 'tertiary_women', label: 'Tertiary Women', division: 'tertiary', gender: 'Female' },
] as const;

type CategoryFilter = (typeof CATEGORY_FILTERS)[number]['key'];

function EligibilityBadge({
  status,
}: {
  status?: AthleteScreeningStatus['eligibility'];
}) {
  if (status === 'ready') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Verified
      </span>
    );
  }

  if (status === 'pending_verification') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 whitespace-nowrap">
        <Clock className="w-3.5 h-3.5" />
        Under Review
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 whitespace-nowrap">
      <AlertCircle className="w-3.5 h-3.5" />
      Action Required
    </span>
  );
}

export function useTeamDashboardData(currentUserId: string) {
  const {
    data: athletes = [],
    isLoading: isLoadingAthletes,
  } = useQuery({
    queryKey: ['teamMembers', currentUserId],
    queryFn: () => teamApi.getTeamMembers(currentUserId),
    enabled: !!currentUserId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    select: (data) => data.filter((m) => m.status === 'active'),
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel('team_members_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'team_members' },
        () => {
          queryClient.invalidateQueries({
            queryKey: ['teamMembers', currentUserId],
          });

          queryClient.invalidateQueries({
            queryKey: ['archivedTeamMembers', currentUserId],
          });

          queryClient.invalidateQueries({
            queryKey: ['screeningRoster', currentUserId],
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, queryClient]);

  const {
    data: allEvents = [],
    isLoading: isLoadingEvents,
  } = useQuery({
    queryKey: ['events', currentUserId],
    queryFn: () => listEvents({ userId: currentUserId }),
    enabled: !!currentUserId,
    staleTime: 30_000,
  });

  const upcomingEvents = useMemo(() => {
    if (!Array.isArray(allEvents)) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return allEvents
      .filter((ev) => {
        if (!ev || !ev.event_date) return false;

        const isActualEvent = ev.type === 'event';
        const eventDate = new Date(ev.event_date);

        return isActualEvent && eventDate >= today;
      })
      .sort(
        (a, b) =>
          new Date(a.event_date).getTime() -
          new Date(b.event_date).getTime()
      );
  }, [allEvents]);

  const {
    data: profile,
    isLoading: isLoadingProfile,
  } = useQuery({
    queryKey: ['coachProfile', currentUserId],
    queryFn: () => getProfile(currentUserId),
    enabled: !!currentUserId,
    staleTime: 1000 * 60 * 5,
  });

  const { data: coachProfile } = useQuery({
    queryKey: ['coachProfileDetails', currentUserId],
    queryFn: () => coachProfileApi.getMyProfile(currentUserId),
    enabled: !!currentUserId,
    staleTime: 1000 * 60 * 5,
  });

  const allowedCoachSports = useMemo(() => {
    return Array.from(
      new Set(
        [
          profile?.sport,
          ...(coachProfile?.secondaryDisciplines ?? []),
        ]
          .map((sport) => sport?.trim() ?? '')
          .filter(Boolean)
      )
    );
  }, [profile?.sport, coachProfile?.secondaryDisciplines]);

  return {
    athletes,
    eventCount: upcomingEvents.length,
    upcomingEvents,
    profile,
    allowedCoachSports,
    isLoading:
      isLoadingAthletes ||
      isLoadingEvents ||
      isLoadingProfile,
  };
}

export default function TeamView() {
  const { user } = useAuthStore();
  const currentUserId = user?.id || '';

  const queryClient = useQueryClient();

  const {
    athletes,
    eventCount,
    upcomingEvents,
    profile,
    allowedCoachSports,
    isLoading,
  } = useTeamDashboardData(currentUserId);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function handleExportConfirm({
    athleteIds,
    level,
  }: {
    athleteIds: string[];
    level: 'elementary' | 'secondary' | 'tertiary';
  }) {
    if (level !== 'tertiary') {
      // Secondary/Elementary generators aren't built yet — tertiary only for now.
      return;
    }

    setErrorMessage(null);

    // Hard stop regardless of whatever the modal's own checkboxes allowed —
    // the form has one MEN/WOMEN checkbox for the whole sheet, so a mixed
    // selection can never be allowed to reach the generator.
    const selectedAthletes = athletes.filter((a) => athleteIds.includes(a.id));
    const distinctGenders = new Set(
      selectedAthletes.map((a) => (a.gender ?? '').trim().toLowerCase()).filter(Boolean)
    );
    if (distinctGenders.size > 1) {
      setErrorMessage(
        'Selected athletes have different genders. A single Form 01B sheet can only contain athletes of the same gender.'
      );
      return;
    }

    setIsExporting(true);
    try {
      const exportData = await getExportData(athleteIds);
      const rosterById = new Map(athletes.map((a) => [a.id, a]));

      const preparedExportData = exportData.map((a) => {
        const rosterAthlete = rosterById.get(a.athleteId) as
          | {
              name?: string;
              year_level?: string | null;
              course?: string | null;
              year_graduated_shs?: string | null;
            }
          | undefined;

        const hasStructuredName =
          a.academicData.lastName.trim() || a.academicData.firstName.trim();
        const nameFallback =
          !hasStructuredName && rosterAthlete?.name
            ? splitFullName(rosterAthlete.name)
            : null;

        return {
          ...a,
          academicData: {
            ...a.academicData,
            lastName: nameFallback ? nameFallback.lastName : a.academicData.lastName,
            firstName: nameFallback ? nameFallback.firstName : a.academicData.firstName,
            middleInitial: nameFallback
              ? nameFallback.middleInitial
              : a.academicData.middleInitial,
            // Year level, course, and year graduated from SHS all now live as
            // real columns on team_members (not the old prisaa_academic_data
            // JSONB, which nothing writes to) — read from the roster record.
            yearLevel: a.academicData.yearLevel || rosterAthlete?.year_level || '',
            course: a.academicData.course || rosterAthlete?.course || '',
            yearGraduatedFromSHS:
              a.academicData.yearGraduatedFromSHS || rosterAthlete?.year_graduated_shs || '',
            // School presently enrolled = the coach's school, full name (not abbreviation).
            schoolPresentlyEnrolled: getFullSchoolName(profile?.institution_id),
          },
        };
      });


      // `division` is education level (elementary/highschool/tertiary) — the
      // actual gender field on team_members is `gender` ('Male'/'Female').
      const firstAthlete = athletes.find((a) => a.id === athleteIds[0]) as
        | { gender?: string | null }
        | undefined;
      const divisionGender =
        (firstAthlete?.gender ?? '').toLowerCase() === 'female' ? 'WOMEN' : 'MEN';

      const blob = await generatePrisaaForm01BTertiary(
        preparedExportData,
        {
          cluster: 'Iloilo',
          region: '6 - Western Visayas',
          sportsEvent: profile?.sport ?? '',
          divisionGender,
        },
        {
          // TODO: confirm the actual coach-name field on `profile`
          name: (profile as any)?.full_name ?? (profile as any)?.name ?? 'Coach',
          photoBuffer: null,
        }
      );

      downloadBlob(blob, `PRISAA-Form-01B-${Date.now()}.xlsx`);
      setIsExportModalOpen(false);
    } catch (err) {
      console.error('Export failed:', err);
      // TODO: surface this to the user instead of just logging it
    } finally {
      setIsExporting(false);
    }
  }

  const {
    data: screeningRoster = [],
    isLoading: isLoadingScreening,
  } = useQuery({
    queryKey: ['screeningRoster', currentUserId],
    queryFn: () => getScreeningRoster(currentUserId),
    enabled: !!currentUserId,
    staleTime: 30_000,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [athleteToDelete, setAthleteToDelete] =
    useState<string | null>(null);

  const [docsAthlete, setDocsAthlete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [isTeamBulkUploadOpen, setIsTeamBulkUploadOpen] =
    useState(false);

  const [athleteToEdit, setAthleteToEdit] = useState<{
    id: string;
    name: string;
    email: string;
    date_of_birth: string;
    division: '' | 'elementary' | 'highschool' | 'tertiary';
    year_level: string;
    course?: string;
    year_graduated_shs?: string;
    sport: string;
    gender: '' | 'Male' | 'Female';
  } | null>(null);

  const [categoryFilter, setCategoryFilter] =
    useState<CategoryFilter>('all');

  const [showCategoryFilters, setShowCategoryFilters] =
    useState(false);

  const [eligibilityFilter, setEligibilityFilter] =
    useState<EligibilityFilter>('all');

  const [searchQuery, setSearchQuery] = useState('');

  const [sortOrder, setSortOrder] =
    useState<'asc' | 'desc'>('asc');

  const [currentPage, setCurrentPage] = useState(1);

  const PAGE_SIZE = 6;

  const screeningByAthleteId = useMemo(() => {
    return new Map(
      screeningRoster.map((athlete) => [
        athlete.athleteId,
        athlete,
      ])
    );
  }, [screeningRoster]);

  const eligibilityCounts = useMemo(
    () => ({
      all: screeningRoster.length,

      verified: screeningRoster.filter(
        (a) => a.eligibility === 'ready'
      ).length,

      underReview: screeningRoster.filter(
        (a) => a.eligibility === 'pending_verification'
      ).length,

      actionRequired: screeningRoster.filter(
        (a) => a.eligibility === 'missing_documents'
      ).length,
    }),
    [screeningRoster]
  );

  const getTeamAcronym = (id?: string) => {
    return getSchoolAbbreviation(id);
  };

  const eligibilityEventYear = useMemo(() => {
    return upcomingEvents[0]?.event_date
      ? new Date(upcomingEvents[0].event_date).getFullYear()
      : new Date().getFullYear();
  }, [upcomingEvents]);

  const filteredAthletes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const result = athletes.filter((athlete) => {
      const screening = screeningByAthleteId.get(athlete.id);

      const selectedCategory = CATEGORY_FILTERS.find(
        (filter) => filter.key === categoryFilter
      );

      const matchesCategory =
  categoryFilter === 'all' ||
  (
    athlete.division === selectedCategory?.division &&
    (athlete.gender ?? '').trim().toLowerCase() ===
      selectedCategory?.gender?.toLowerCase()
  );

      const matchesEligibility =
        eligibilityFilter === 'all' ||
        screening?.eligibility === eligibilityFilter;

      const matchesSearch =
        !query ||
        athlete.name.toLowerCase().includes(query) ||
        athlete.email.toLowerCase().includes(query) ||
        athlete.id.toLowerCase().includes(query);

      return (
        matchesCategory &&
        matchesEligibility &&
        matchesSearch
      );
    });

    return [...result].sort((a, b) => {
      const comparison = a.name.localeCompare(
        b.name,
        undefined,
        { sensitivity: 'base' }
      );

      return sortOrder === 'asc'
        ? comparison
        : -comparison;
    });
  }, [
    athletes,
    screeningByAthleteId,
    categoryFilter,
    eligibilityFilter,
    searchQuery,
    sortOrder,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAthletes.length / PAGE_SIZE)
  );

  const paginatedAthletes = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;

    return filteredAthletes.slice(
      start,
      start + PAGE_SIZE
    );
  }, [filteredAthletes, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    categoryFilter,
    eligibilityFilter,
    searchQuery,
    sortOrder,
  ]);

  const deleteAthleteMutation = useMutation({
    mutationFn: (id: string) =>
      teamApi.archiveAthlete(id, currentUserId),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['teamMembers', currentUserId],
      });

      queryClient.invalidateQueries({
        queryKey: ['archivedTeamMembers', currentUserId],
      });

      queryClient.invalidateQueries({
        queryKey: ['screeningRoster', currentUserId],
      });

      setAthleteToDelete(null);
    },

    onError: (error) => {
      console.error(
        'Failed to archive athlete:',
        error
      );

      alert(
        'Failed to archive athlete. Please try again.'
      );
    },
  });

  const handleOpenEdit = (member: typeof athletes[number]) => {
    setErrorMessage(null);

    setAthleteToEdit({
      id: member.id,
      name: member.name,
      email: member.email,
      date_of_birth: member.date_of_birth ?? '',
      division: (member.division ?? '') as '' | 'elementary' | 'highschool' | 'tertiary',
      year_level: member.year_level ?? '',
      course: (member as any).course ?? '',
      year_graduated_shs: (member as any).year_graduated_shs ?? '',
      sport: member.sport ?? profile?.sport ?? '',
      gender: (member.gender ?? '') as '' | 'Male' | 'Female',
    });
  };

  const confirmDeleteAthlete = () => {
    if (!athleteToDelete) return;

    deleteAthleteMutation.mutate(
      athleteToDelete
    );
  };

  if (isLoading || isLoadingScreening) {
    return (
      <div className="space-y-6 animate-pulse p-6">
        <div>
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-md w-64 mb-2" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-96" />
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl h-24" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl h-24" />
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl h-24" />
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-md w-40 mb-2" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-72" />
          </div>

          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-md w-full" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="px-5 py-3">
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16" />
                  </th>
                  <th className="px-5 py-3">
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20" />
                  </th>
                  <th className="px-5 py-3">
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-28" />
                  </th>
                  <th className="px-5 py-3">
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16 ml-auto" />
                  </th>
                </tr>
              </thead>

              <tbody>
                <TableSkeleton rows={6} />
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 motion-reduce:animate-none">

      {/* PAGE HEADER */}
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-200">
            Team Roster
          </h1>

          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-2xl">
            Manage your athletes and document compliance.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setErrorMessage(null);
            setIsExportModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-colors shrink-0"
        >
          <FileText className="w-4 h-4" />
          Export Athlete Gallery
        </button>
      </header>

      {/* TEAM PROFILE BANNER - Removed Coach info completely */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 flex flex-col justify-center items-start gap-2">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          {getTeamAcronym(profile?.institution_id)}{' '}
          {formatSportTeamName(profile?.sport)}
        </h2>

        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-2xl">
          {profile?.team_motto ||
            'The National Sports Association of Private Schools, Colleges and Universities of the Philippines'}
        </p>
      </div>

      {/* SUMMARY - Removed circular icons on the right side of each box */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Total Athletes
          </p>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mt-1">
            {athletes.length}
          </h3>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Verified
          </p>
          <h3 className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
            {eligibilityCounts.verified}
          </h3>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Under Review
          </p>
          <h3 className="text-2xl font-bold text-blue-700 dark:text-blue-400 mt-1">
            {eligibilityCounts.underReview}
          </h3>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Action Required
          </p>
          <h3 className="text-2xl font-bold text-amber-700 dark:text-amber-400 mt-1">
            {eligibilityCounts.actionRequired}
          </h3>
        </div>
      </div>

      {/* UPCOMING EVENTS */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Upcoming Events
          </p>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mt-1">
            {eventCount}
          </h3>
        </div>

        <div className="w-11 h-11 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="18" height="18" x="3" y="4" rx="2" />
            <line x1="16" x2="16" y1="2" y2="6" />
            <line x1="8" x2="8" y1="2" y2="6" />
            <line x1="3" x2="21" y1="10" y2="10" />
          </svg>
        </div>
      </div>

      {/* ATHLETES LIST */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">

        {/* HEADER */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">

            {/* TITLE + CATEGORY FILTER */}
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Athletes List
                </h2>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setShowCategoryFilters((v) => !v)
                    }
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />

                    {CATEGORY_FILTERS.find(
                      (f) => f.key === categoryFilter
                    )?.label || 'All'}
                  </button>

                  {showCategoryFilters && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() =>
                          setShowCategoryFilters(false)
                        }
                      />

                      <div className="absolute left-0 top-full mt-2 z-20 w-44 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg p-1.5">
                        {CATEGORY_FILTERS.map((f) => {
                          const isActive =
                            categoryFilter === f.key;

                          return (
                            <button
                              key={f.key}
                              type="button"
                              onClick={() => {
                                setCategoryFilter(f.key);
                                setShowCategoryFilters(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition ${
                                isActive
                                  ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-semibold'
                                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                              }`}
                            >
                              {f.label}

                              {isActive && (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Manage athletes and track their eligibility documents.
              </p>
            </div>

            {/* ACTIONS */}
            <div className="flex items-center gap-2 shrink-0">

              <button
                type="button"
                onClick={() =>
                  setIsTeamBulkUploadOpen(true)
                }
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition"
              >
                <FolderUp className="w-4 h-4" />
                Upload Team Documents
              </button>

              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                Add Athlete
              </button>

            </div>
          </div>
        </div>

        {/* FILTER + SEARCH (Fixed dark mode text visibility) */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-transparent">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">

            {/* ELIGIBILITY FILTERS */}
            <div className="flex items-center gap-1.5 flex-wrap">

              <button
                type="button"
                onClick={() =>
                  setEligibilityFilter('all')
                }
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  eligibilityFilter === 'all'
                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-[#adc6ff] border-blue-200 dark:border-[#adc6ff]/30'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                All
                <span className="font-bold">
                  {eligibilityCounts.all}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setEligibilityFilter('ready')
                }
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  eligibilityFilter === 'ready'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-[#4edea3] border-emerald-200 dark:border-emerald-500/30'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Verified
                <span className="font-bold">
                  {eligibilityCounts.verified}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setEligibilityFilter(
                    'pending_verification'
                  )
                }
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  eligibilityFilter === 'pending_verification'
                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-[#adc6ff] border-blue-200 dark:border-[#adc6ff]/30'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Under Review
                <span className="font-bold">
                  {eligibilityCounts.underReview}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setEligibilityFilter(
                    'missing_documents'
                  )
                }
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  eligibilityFilter === 'missing_documents'
                    ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Action Required
                <span className="font-bold">
                  {eligibilityCounts.actionRequired}
                </span>
              </button>
            </div>

            {/* SEARCH + SORT */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) =>
                    setSearchQuery(e.target.value)
                  }
                  placeholder="Search by name, email, or ID..."
                  className="w-full sm:w-64 pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>

              <div className="relative">
                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />

                <select
                  value={sortOrder}
                  onChange={(e) =>
                    setSortOrder(
                      e.target.value as 'asc' | 'desc'
                    )
                  }
                  className="appearance-none pl-8 pr-8 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-600 dark:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                >
                  <option value="asc">
                    Name (A-Z)
                  </option>
                  <option value="desc">
                    Name (Z-A)
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Athlete
                </th>

                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Documents
                </th>

                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Eligibility Status
                </th>

                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {athletes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-14 px-5 text-center">
                    <div className="mx-auto max-w-sm">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto">
                        <Users className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                      </div>

                      <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        No athletes yet
                      </p>

                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                        Add your first athlete to begin managing eligibility documents.
                      </p>

                      <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                      >
                        <UserPlus className="w-4 h-4" />
                        Add Athlete
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredAthletes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-14 px-5 text-center">
                    <Search className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto" />

                    <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                      No athletes found
                    </p>

                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                      Try changing your filters or search query.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedAthletes.map((member) => {
                  const screening =
                    screeningByAthleteId.get(member.id);

                  const missingCount =
                    screening?.missingTypes.length ?? 0;

                  const uploadedCount = Math.max(
                    0,
                    TOTAL_REQUIRED_DOCUMENTS - missingCount
                  );

                  const complete =
                    screening?.eligibility === 'ready';

                  return (
                    <tr
                      key={member.id}
                      className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* ATHLETE */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
                            {member.name
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                {member.name}
                              </p>

                              {member.year_level && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                  {member.year_level}
                                </span>
                              )}

                              {getPrisaaAge(
                                member.date_of_birth,
                                eligibilityEventYear
                              ) === 25 && (
                                <span
                                  title="This athlete will be ineligible next year under the PRISAA age cutoff."
                                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 whitespace-nowrap"
                                >
                                  Final Playing Year
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-[320px]">
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* DOCUMENTS */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                            complete
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-amber-700 dark:text-amber-400'
                          }`}
                        >
                          {complete
                            ? `${TOTAL_REQUIRED_DOCUMENTS}/${TOTAL_REQUIRED_DOCUMENTS} Complete`
                            : `${uploadedCount}/${TOTAL_REQUIRED_DOCUMENTS} Documents`}
                        </span>
                      </td>

                      {/* ELIGIBILITY */}
                      <td className="px-5 py-4">
                        <EligibilityBadge
                          status={screening?.eligibility}
                        />
                      </td>

                      {/* ACTIONS */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">

                          <button
                            type="button"
                            onClick={() =>
                              handleOpenEdit(member)
                            }
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition"
                            title="Edit athlete"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setDocsAthlete({
                                id: member.id,
                                name: member.name,
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-700 dark:hover:text-blue-400 transition"
                            title="Upload documents"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Upload docs
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setAthleteToDelete(member.id)
                            }
                            className="p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 transition"
                            title="Archive athlete"
                          >
                            <Archive className="w-4 h-4" />
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        {filteredAthletes.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {Math.min(
                  (currentPage - 1) * PAGE_SIZE + 1,
                  filteredAthletes.length
                )}{' '}
                –{' '}
                {Math.min(
                  currentPage * PAGE_SIZE,
                  filteredAthletes.length
                )}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {filteredAthletes.length}
              </span>{' '}
              athletes
            </p>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.max(1, p - 1)
                    )
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Previous
                </button>

                {Array.from(
                  { length: totalPages },
                  (_, i) => i + 1
                ).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() =>
                      setCurrentPage(page)
                    }
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${
                      page === currentPage
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(totalPages, p + 1)
                    )
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ADD / EDIT ATHLETE MODAL */}
      <AddAthleteModal
        isOpen={isModalOpen || !!athleteToEdit}
        onClose={() => {
          setIsModalOpen(false);
          setAthleteToEdit(null);
        }}
        coachId={currentUserId}
        coachSport={profile?.sport}
        coachSports={allowedCoachSports}
        athleteToEdit={athleteToEdit}
      />


      {/* ARCHIVE CONFIRMATION */}
      <ConfirmModal
        isOpen={athleteToDelete !== null}
        title="Archive Athlete"
        message="This athlete will be moved to the Archive tab and removed from your active roster. You can restore them anytime from there."
        confirmText="Archive"
        onConfirm={confirmDeleteAthlete}
        onCancel={() =>
          setAthleteToDelete(null)
        }
      />

      {/* DOCUMENTS */}
      <DocumentChecklistModal
        isOpen={docsAthlete !== null}
        athleteId={docsAthlete?.id ?? null}
        athleteName={docsAthlete?.name ?? ''}
        coachUserId={currentUserId}
        eligibilityCheckDate={
          upcomingEvents[0]?.event_date ?? null
        }
        onClose={() => setDocsAthlete(null)}
      />

      {/* BULK UPLOAD */}
      <TeamBulkUploadModal
        isOpen={isTeamBulkUploadOpen}
        onClose={() =>
          setIsTeamBulkUploadOpen(false)
        }
        roster={athletes.map((a) => ({
          id: a.id,
          name: a.name,
        }))}
        coachUserId={currentUserId}
        eligibilityCheckDate={
          upcomingEvents[0]?.event_date ?? null
        }
      />

      {/* EXPORT FORM 01B */}
      <AthleteExportSelectModal
        isOpen={isExportModalOpen}
        onClose={() => {
          setIsExportModalOpen(false);
          setErrorMessage(null);
        }}
        athletes={athletes.map((a) => ({
          id: a.id,
          name: a.name,
          year_level: a.year_level ?? null,
          gender: a.gender ?? null,
        }))}
        onConfirm={handleExportConfirm}
        isExporting={isExporting}
        errorMessage={errorMessage}
      />
    </div>
  );
}
