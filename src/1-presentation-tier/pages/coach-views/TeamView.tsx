import React, { useMemo, useState, useEffect } from 'react';
import {
  X,
  FileText,
  Users,
  Filter,
  CheckCircle2,
  UserPlus,
  FolderUp,
  Search,
  ArrowUpDown,
  Pencil,
  Trash2,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { TeamBulkUploadModal } from '../../components/ui/TeamBulkUploadModal';
import { useAuthStore } from '../../../2-application-tier/stores/authStore';
import { TableSkeleton } from '../../components/ui/SkeletonLoading';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { DocumentChecklistModal } from '../../components/ui/DocumentChecklistModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamApi } from '../../../3-data-tier/api/teamApi';
import { listEvents } from '../../../3-data-tier/services/eventService';
import { TOTAL_REQUIRED_DOCUMENTS } from '../../../3-data-tier/api/documentsApi';
import {
  getScreeningRoster,
  type AthleteScreeningStatus,
} from '../../../3-data-tier/api/screeningApi';
import { getProfile } from '../../../3-data-tier/services/profileService';
import { supabase } from '../../../3-data-tier/config/SupabaseClient';
import { DivisionSelect } from '../../components/ui/DivisionSelect';
import { SexOption } from '../../components/ui/SexOption';

const ILOPRISAA_SCHOOLS: Record<string, string> = {
  'western institute of technology': 'WIT',
  'central philippine university': 'CPU',
  'john b. lacson foundation maritime university': 'JBLFMU',
  'hua siong college of iloilo': 'HSCI',
  "st. robert's international college": 'SRIC',
  'st. roberts international college': 'SRIC',
  "iloilo doctors' college": 'IDC',
  'iloilo doctors college': 'IDC',
  'ateneo de iloilo': 'ADI',
  'colegio de san jose': 'CSJ',
  'santa isabel college of iloilo': 'SICI',
  'iloilo scholastic academy': 'ISA',
  'st. paul university iloilo': 'SPUI',
  'university of san agustin': 'USA',
  'iloilo integrated school foundation': 'IISF',
};

const YEAR_LEVEL_OPTIONS = [
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
  'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12',
  '1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year',
] as const;

export function getSchoolAbbreviation(schoolName?: string | null): string {
  if (!schoolName) return 'ILOPRISAA';

  const normalized = schoolName.trim().toLowerCase();

  if (ILOPRISAA_SCHOOLS[normalized]) {
    return ILOPRISAA_SCHOOLS[normalized];
  }

  return schoolName
    .split(/[\s-]+/)
    .map((word) => word[0])
    .filter((char) => char && /[a-zA-Z]/.test(char))
    .join('')
    .toUpperCase();
}

export function formatSportTeamName(rawSport?: string | null): string {
  if (!rawSport) return 'Team';

  const cleanSport = rawSport
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());

  return `${cleanSport} Team`;
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

const DIVISION_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'elementary', label: 'Elementary' },
  { key: 'highschool', label: 'High School' },
  { key: 'tertiary', label: 'Tertiary' },
] as const;

function EligibilityBadge({
  status,
}: {
  status?: AthleteScreeningStatus['eligibility'];
}) {
  if (status === 'ready') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Verified
      </span>
    );
  }

  if (status === 'pending_verification') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
        <Clock className="w-3.5 h-3.5" />
        Under Review
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
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

  return {
    athletes,
    eventCount: upcomingEvents.length,
    upcomingEvents,
    profile,
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
    isLoading,
  } = useTeamDashboardData(currentUserId);

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

  const [newAthlete, setNewAthlete] = useState({
    name: '',
    email: '',
    sport: '',
    gender: '',
    division: '',
    year_level: '',
    date_of_birth: '',
  });

  useEffect(() => {
    if (profile?.sport && !newAthlete.sport) {
      setNewAthlete((current) => ({ ...current, sport: profile.sport || '' }));
    }
  }, [profile?.sport, newAthlete.sport]);

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

  const [shouldRenderAddModal, setShouldRenderAddModal] =
    useState(false);

  const [isAddModalClosing, setIsAddModalClosing] =
    useState(false);

  const [athleteToEdit, setAthleteToEdit] = useState<{
    id: string;
    name: string;
    email: string;
    date_of_birth: string;
    division: string;
    year_level: string;
  } | null>(null);

  const [editAthlete, setEditAthlete] = useState({
    name: '',
    email: '',
    division: '',
    year_level: '',
    date_of_birth: '',
  });

  const [divisionFilter, setDivisionFilter] =
    useState<(typeof DIVISION_FILTERS)[number]['key']>('all');

  const [showDivisionFilters, setShowDivisionFilters] =
    useState(false);

  const [eligibilityFilter, setEligibilityFilter] =
    useState<EligibilityFilter>('all');

  const [searchQuery, setSearchQuery] = useState('');

  const [sortOrder, setSortOrder] =
    useState<'asc' | 'desc'>('asc');

  const [currentPage, setCurrentPage] = useState(1);

  const PAGE_SIZE = 6;

  useEffect(() => {
    if (isModalOpen) {
      setShouldRenderAddModal(true);
      setIsAddModalClosing(false);
      return;
    }

    if (shouldRenderAddModal) {
      setIsAddModalClosing(true);

      const timeout = setTimeout(() => {
        setShouldRenderAddModal(false);
        setIsAddModalClosing(false);
      }, 150);

      return () => clearTimeout(timeout);
    }
  }, [isModalOpen, shouldRenderAddModal]);

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
    if (!id) return 'TM';

    return id.substring(0, 10).toUpperCase();
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

      const matchesDivision =
        divisionFilter === 'all' ||
        athlete.division === divisionFilter;

      const matchesEligibility =
        eligibilityFilter === 'all' ||
        screening?.eligibility === eligibilityFilter;

      const matchesSearch =
        !query ||
        athlete.name.toLowerCase().includes(query) ||
        athlete.email.toLowerCase().includes(query) ||
        athlete.id.toLowerCase().includes(query);

      return (
        matchesDivision &&
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
    divisionFilter,
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
    divisionFilter,
    eligibilityFilter,
    searchQuery,
    sortOrder,
  ]);

  const addAthleteMutation = useMutation({
    mutationFn: (athleteData: any) =>
      teamApi.addAthlete(athleteData),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['teamMembers', currentUserId],
      });

      queryClient.invalidateQueries({
        queryKey: ['screeningRoster', currentUserId],
      });

      setIsModalOpen(false);

      setNewAthlete({
        name: '',
        email: '',
        sport: profile?.sport || '',
        gender: '',
        division: '',
        year_level: '',
        date_of_birth: '',
      });

      setErrorMessage(null);
    },

    onError: (error: any) => {
      setErrorMessage(
        error?.message || 'Failed to add athlete.'
      );
    },
  });

  const updateAthleteMutation = useMutation({
    mutationFn: async () => {
      if (!athleteToEdit) {
        throw new Error('No athlete selected.');
      }

      return teamApi.updateAthlete(
        athleteToEdit.id,
        currentUserId,
        {
          name: editAthlete.name.trim(),
          email: editAthlete.email.trim().toLowerCase(),
          date_of_birth: editAthlete.date_of_birth,
          division: editAthlete.division,
          year_level: editAthlete.year_level || null,
        }
      );
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['teamMembers', currentUserId],
      });

      queryClient.invalidateQueries({
        queryKey: ['screeningRoster', currentUserId],
      });

      setAthleteToEdit(null);

      setEditAthlete({
        name: '',
        email: '',
        division: '',
        year_level: '',
        date_of_birth: '',
      });

      setErrorMessage(null);
    },

    onError: (error: any) => {
      setErrorMessage(
        error?.message || 'Failed to update athlete.'
      );
    },
  });

  const deleteAthleteMutation = useMutation({
    mutationFn: (id: string) =>
      teamApi.deleteAthlete(id, currentUserId),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['teamMembers', currentUserId],
      });

      queryClient.invalidateQueries({
        queryKey: ['screeningRoster', currentUserId],
      });

      setAthleteToDelete(null);
    },

    onError: (error) => {
      console.error(
        'Failed to delete athlete:',
        error
      );

      alert(
        'Failed to remove athlete. Please try again.'
      );
    },
  });

  const handleAddAthlete = (
    e: React.FormEvent
  ) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!currentUserId) {
      setErrorMessage(
        'Unable to identify your account. Please log in again.'
      );
      return;
    }

    const trimmedName =
      newAthlete.name.trim();

    if (!trimmedName) {
      setErrorMessage(
        "The athlete's name is required."
      );
      return;
    }

    if (trimmedName.length > 100) {
      setErrorMessage(
        "The athlete's name cannot exceed 100 characters."
      );
      return;
    }

    const cleanedEmail =
      newAthlete.email.trim().toLowerCase();

    if (!cleanedEmail.endsWith('@gmail.com')) {
      setErrorMessage(
        'Please use a valid Gmail address (@gmail.com).'
      );
      return;
    }

    if (!newAthlete.sport) {
      setErrorMessage(
        'Your coach profile does not have a sport assigned. Please set your primary sport in Settings first.'
      );
      return;
    }

    if (!newAthlete.gender) {
      setErrorMessage(
        "Please select the athlete's gender."
      );
      return;
    }

    if (!newAthlete.division) {
      setErrorMessage(
        "Please select the athlete's division."
      );
      return;
    }

    if (!newAthlete.date_of_birth) {
      setErrorMessage(
        "Please enter the athlete's date of birth."
      );
      return;
    }

    const dobDate =
      new Date(newAthlete.date_of_birth);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (
      Number.isNaN(dobDate.getTime()) ||
      dobDate > today
    ) {
      setErrorMessage(
        "Please enter a valid date of birth (it can't be in the future)."
      );
      return;
    }

    addAthleteMutation.mutate({
      name: trimmedName,
      email: cleanedEmail,
      sport: newAthlete.sport,
      gender: newAthlete.gender,
      role: 'Athlete',
      coach_id: currentUserId,
      division: newAthlete.division,
      year_level: newAthlete.year_level || null,
      date_of_birth: newAthlete.date_of_birth,
    });
  };

  const handleCloseAddModal = () => {
    setIsModalOpen(false);
    setErrorMessage(null);

    setNewAthlete({
      name: '',
      email: '',
      division: '',
      year_level: '',
      date_of_birth: '',
    });
  };

  const handleOpenEdit = (member: typeof athletes[number]) => {
    setErrorMessage(null);

    setAthleteToEdit({
      id: member.id,
      name: member.name,
      email: member.email,
      date_of_birth: member.date_of_birth ?? '',
      division: member.division ?? '',
      year_level: member.year_level ?? '',
    });

    setEditAthlete({
      name: member.name,
      email: member.email,
      date_of_birth: member.date_of_birth ?? '',
      division: member.division ?? '',
      year_level: member.year_level ?? '',
    });
  };

  const handleCloseEditModal = () => {
    setAthleteToEdit(null);
    setErrorMessage(null);

    setEditAthlete({
      name: '',
      email: '',
      division: '',
      year_level: '',
      date_of_birth: '',
    });
  };

  const handleUpdateAthlete = (
    e: React.FormEvent
  ) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName =
      editAthlete.name.trim();

    if (!trimmedName) {
      setErrorMessage(
        "The athlete's name is required."
      );
      return;
    }

    if (trimmedName.length > 100) {
      setErrorMessage(
        "The athlete's name cannot exceed 100 characters."
      );
      return;
    }

    const cleanedEmail =
      editAthlete.email.trim().toLowerCase();

    if (!cleanedEmail.endsWith('@gmail.com')) {
      setErrorMessage(
        'Please use a valid Gmail address (@gmail.com).'
      );
      return;
    }

    if (!editAthlete.division) {
      setErrorMessage(
        "Please select the athlete's division."
      );
      return;
    }

    if (!editAthlete.date_of_birth) {
      setErrorMessage(
        "Please enter the athlete's date of birth."
      );
      return;
    }

    const dobDate =
      new Date(editAthlete.date_of_birth);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (
      Number.isNaN(dobDate.getTime()) ||
      dobDate > today
    ) {
      setErrorMessage(
        "Please enter a valid date of birth (it can't be in the future)."
      );
      return;
    }

    if (!athleteToEdit) {
      setErrorMessage(
        'No athlete selected.'
      );
      return;
    }

    updateAthleteMutation.mutate();
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
          <div className="h-8 bg-slate-200 rounded-md w-64 mb-2" />
          <div className="h-4 bg-slate-200 rounded-md w-96" />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl h-24" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl h-24" />
          <div className="bg-white border border-slate-200 rounded-xl h-24" />
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <div className="h-6 bg-slate-200 rounded-md w-40 mb-2" />
            <div className="h-4 bg-slate-200 rounded-md w-72" />
          </div>

          <div className="p-4 border-b border-slate-100">
            <div className="h-8 bg-slate-200 rounded-md w-full" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-5 py-3">
                    <div className="h-3 bg-slate-200 rounded w-16" />
                  </th>
                  <th className="px-5 py-3">
                    <div className="h-3 bg-slate-200 rounded w-20" />
                  </th>
                  <th className="px-5 py-3">
                    <div className="h-3 bg-slate-200 rounded w-28" />
                  </th>
                  <th className="px-5 py-3">
                    <div className="h-3 bg-slate-200 rounded w-16 ml-auto" />
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
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-slate-800">
          Team Roster
        </h1>

        <p className="text-slate-500 text-sm mt-1 max-w-2xl">
          Manage your athletes and document compliance.
        </p>
      </header>

      {/* TEAM PROFILE BANNER */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#0f172a] text-white flex items-center justify-center shadow-sm">
            <Users className="w-7 h-7" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {getTeamAcronym(profile?.institution_id)}{' '}
              {formatSportTeamName(profile?.sport)}
            </h2>

            <p className="text-slate-500 text-sm mt-1 max-w-2xl">
              {profile?.team_motto ||
                'The National Sports Association of Private Schools, Colleges and Universities of the Philippines'}
            </p>
          </div>
        </div>

        <div className="flex flex-col w-full md:w-auto md:border-l md:border-slate-100 md:pl-8">
          <p className="text-xs font-medium text-slate-500 mb-2">
            Coach
          </p>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-200 rounded-full shrink-0 flex items-center justify-center text-slate-500 text-sm font-bold">
              {user?.full_name?.charAt(0)?.toUpperCase() || 'C'}
            </div>

            <div className="flex flex-col">
              <p className="text-sm font-bold text-slate-800">
                {user?.full_name}
              </p>

              <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                Head Coach
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Total Athletes
            </p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">
              {athletes.length}
            </h3>
          </div>

          <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Verified
            </p>
            <h3 className="text-2xl font-bold text-emerald-700 mt-1">
              {eligibilityCounts.verified}
            </h3>
          </div>

          <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Under Review
            </p>
            <h3 className="text-2xl font-bold text-blue-700 mt-1">
              {eligibilityCounts.underReview}
            </h3>
          </div>

          <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Action Required
            </p>
            <h3 className="text-2xl font-bold text-amber-700 mt-1">
              {eligibilityCounts.actionRequired}
            </h3>
          </div>

          <div className="w-11 h-11 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* UPCOMING EVENTS */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Upcoming Events
          </p>
          <h3 className="text-2xl font-bold text-slate-800 mt-1">
            {eventCount}
          </h3>
        </div>

        <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
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
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

        {/* HEADER */}
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">

            {/* TITLE + DIVISION FILTER */}
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900">
                  Athletes List
                </h2>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setShowDivisionFilters((v) => !v)
                    }
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
                  >
                    <Filter className="w-3.5 h-3.5 text-slate-400" />

                    {DIVISION_FILTERS.find(
                      (f) => f.key === divisionFilter
                    )?.label || 'All'}
                  </button>

                  {showDivisionFilters && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() =>
                          setShowDivisionFilters(false)
                        }
                      />

                      <div className="absolute left-0 top-full mt-2 z-20 w-44 bg-white rounded-xl border border-slate-200 shadow-lg p-1.5">
                        {DIVISION_FILTERS.map((f) => {
                          const isActive =
                            divisionFilter === f.key;

                          return (
                            <button
                              key={f.key}
                              type="button"
                              onClick={() => {
                                setDivisionFilter(f.key);
                                setShowDivisionFilters(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition ${
                                isActive
                                  ? 'bg-blue-50 text-blue-700 font-semibold'
                                  : 'text-slate-600 hover:bg-slate-50'
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

              <p className="text-sm text-slate-500 mt-1">
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
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 transition"
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

        {/* FILTER + SEARCH */}
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/30">
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
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
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
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
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
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
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
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) =>
                    setSearchQuery(e.target.value)
                  }
                  placeholder="Search by name, email, or ID..."
                  className="w-full sm:w-64 pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>

              <div className="relative">
                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />

                <select
                  value={sortOrder}
                  onChange={(e) =>
                    setSortOrder(
                      e.target.value as 'asc' | 'desc'
                    )
                  }
                  className="appearance-none pl-8 pr-8 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
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
              <tr className="border-b border-slate-100">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Athlete
                </th>

                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Documents
                </th>

                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Eligibility Status
                </th>

                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {athletes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-14 px-5 text-center">
                    <div className="mx-auto max-w-sm">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
                        <Users className="w-5 h-5 text-slate-400" />
                      </div>

                      <p className="mt-3 text-sm font-semibold text-slate-700">
                        No athletes yet
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
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
                    <Search className="w-6 h-6 text-slate-300 mx-auto" />

                    <p className="mt-2 text-sm font-medium text-slate-600">
                      No athletes found
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
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
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 transition-colors"
                    >
                      {/* ATHLETE */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                            {member.name
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-slate-900">
                                {member.name}
                              </p>

                              {member.year_level && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                                  {member.year_level}
                                </span>
                              )}

                              {getPrisaaAge(
                                member.date_of_birth,
                                eligibilityEventYear
                              ) === 25 && (
                                <span
                                  title="This athlete will be ineligible next year under the PRISAA age cutoff."
                                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap"
                                >
                                  Final Playing Year
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[320px]">
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* DOCUMENTS */}
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            setDocsAthlete({
                              id: member.id,
                              name: member.name,
                            })
                          }
                          title="Upload documents"
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                            complete
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              complete
                                ? 'bg-emerald-500'
                                : 'bg-amber-500'
                            }`}
                          />

                          {complete
                            ? `${TOTAL_REQUIRED_DOCUMENTS}/${TOTAL_REQUIRED_DOCUMENTS} Complete`
                            : `${uploadedCount}/${TOTAL_REQUIRED_DOCUMENTS} Documents`}
                        </button>
                      </td>

                      {/* ELIGIBILITY */}
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            setDocsAthlete({
                              id: member.id,
                              name: member.name,
                            })
                          }
                          className="hover:opacity-80 transition"
                          title="View eligibility details"
                        >
                          <EligibilityBadge
                            status={screening?.eligibility}
                          />
                        </button>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">

                          <button
                            type="button"
                            onClick={() =>
                              handleOpenEdit(member)
                            }
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
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
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition"
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
                            className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                            title="Delete athlete"
                          >
                            <Trash2 className="w-4 h-4" />
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
          <div className="px-5 py-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-xs text-slate-500">
              Showing{' '}
              <span className="font-semibold text-slate-700">
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
              <span className="font-semibold text-slate-700">
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
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
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
                        : 'text-slate-600 hover:bg-slate-100'
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
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ADD ATHLETE MODAL */}
      {shouldRenderAddModal && (
        <div
          className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4 motion-reduce:animate-none ${
            isAddModalClosing
              ? 'animate-out fade-out duration-150'
              : 'animate-in fade-in duration-200'
          }`}
        >
          <div
            className={`bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden motion-reduce:animate-none ${
              isAddModalClosing
                ? 'animate-out fade-out zoom-out-95 duration-150'
                : 'animate-in fade-in zoom-in-95 duration-200'
            }`}
          >
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-lg text-slate-900">
                  Add New Athlete
                </h3>

                <p className="text-xs text-slate-400 mt-0.5">
                  Add an athlete to your team roster.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseAddModal}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleAddAthlete}
              className="p-5 space-y-4"
            >
              {errorMessage && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name
                </label>

                <input
                  required
                  type="text"
                  value={newAthlete.name}
                  onChange={(e) =>
                    setNewAthlete({
                      ...newAthlete,
                      name: e.target.value,
                    })
                  }
                  maxLength={100}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Gmail Address
                </label>

                <input
                  required
                  type="email"
                  value={newAthlete.email}
                  onChange={(e) =>
                    setNewAthlete({
                      ...newAthlete,
                      email: e.target.value,
                    })
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
                  placeholder="johndoe@gmail.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Sport
                </label>
                <input
                  type="text"
                  value={profile?.sport || newAthlete.sport || ''}
                  readOnly
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-50 text-slate-600 cursor-not-allowed"
                  placeholder="Set your sport in Settings"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Automatically inherited from your coach profile.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Gender
                </label>
                <SexOption
                  value={newAthlete.gender}
                  onChange={(value) =>
                    setNewAthlete({
                      ...newAthlete,
                      gender: value,
                    })
                  }
                  options={['Male', 'Female']}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">
                  Division
                </label>

                <DivisionSelect
                  value={newAthlete.division}
                  onChange={(v) =>
                    setNewAthlete({
                      ...newAthlete,
                      division: v,
                    })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Year Level
                </label>
                <select
                  value={newAthlete.year_level}
                  onChange={(e) =>
                    setNewAthlete({
                      ...newAthlete,
                      year_level: e.target.value,
                    })
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
                >
                  <option value="">Select Year Level</option>
                  {YEAR_LEVEL_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Date of Birth
                </label>

                <input
                  required
                  type="date"
                  value={newAthlete.date_of_birth}
                  max={
                    new Date()
                      .toISOString()
                      .split('T')[0]
                  }
                  onChange={(e) =>
                    setNewAthlete({
                      ...newAthlete,
                      date_of_birth: e.target.value,
                    })
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
                />

                <p className="text-[11px] text-slate-400 mt-1">
                  Used to determine PRISAA age-cutoff eligibility for future events.
                </p>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseAddModal}
                  className="flex-1 px-4 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={addAthleteMutation.isPending}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition shadow-sm"
                >
                  {addAthleteMutation.isPending
                    ? 'Saving...'
                    : 'Save Athlete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ATHLETE MODAL */}
      {athleteToEdit && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-lg text-slate-900">
                  Edit Athlete
                </h3>

                <p className="text-xs text-slate-400 mt-0.5">
                  Update athlete information.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseEditModal}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleUpdateAthlete}
              className="p-5 space-y-4"
            >
              {errorMessage && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name
                </label>

                <input
                  required
                  type="text"
                  value={editAthlete.name}
                  onChange={(e) =>
                    setEditAthlete({
                      ...editAthlete,
                      name: e.target.value,
                    })
                  }
                  maxLength={100}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Gmail Address
                </label>

                <input
                  required
                  type="email"
                  value={editAthlete.email}
                  onChange={(e) =>
                    setEditAthlete({
                      ...editAthlete,
                      email: e.target.value,
                    })
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Division
                </label>

                <DivisionSelect
                  value={editAthlete.division}
                  onChange={(v) =>
                    setEditAthlete({
                      ...editAthlete,
                      division: v,
                    })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Year Level
                </label>
                <select
                  value={editAthlete.year_level}
                  onChange={(e) =>
                    setEditAthlete({
                      ...editAthlete,
                      year_level: e.target.value,
                    })
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
                >
                  <option value="">Select Year Level</option>
                  {YEAR_LEVEL_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Date of Birth
                </label>

                <input
                  required
                  type="date"
                  value={editAthlete.date_of_birth}
                  max={
                    new Date()
                      .toISOString()
                      .split('T')[0]
                  }
                  onChange={(e) =>
                    setEditAthlete({
                      ...editAthlete,
                      date_of_birth: e.target.value,
                    })
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={updateAthleteMutation.isPending}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateAthleteMutation.isPending
                    ? 'Saving...'
                    : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      <ConfirmModal
        isOpen={athleteToDelete !== null}
        title="Remove Athlete"
        message="Are you sure you want to remove this athlete from your roster? This action cannot be undone."
        confirmText="Remove"
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
    </div>
  );
}