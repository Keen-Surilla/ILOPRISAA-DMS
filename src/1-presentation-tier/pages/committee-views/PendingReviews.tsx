// src/1-presentation-tier/pages/committee-views/PendingReviews.tsx

import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronDown,
  Search,
  Building2,
  Loader2,
  Inbox,
  X,
  RotateCcw,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '../../../2-application-tier/stores/authStore';
import {
  getPendingDocuments,
  verifyDocument,
  rejectDocument,
  getSignedUrl,
} from '../../../3-data-tier/api/committeeApi';
import { findSchool } from '../../../3-data-tier/constant/schools';

type PendingDoc = Awaited<ReturnType<typeof getPendingDocuments>>[number];

function prettifyDocType(type: string): string {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getLevel(doc: PendingDoc): string {
  switch ((doc.division ?? '').toLowerCase()) {
    case 'elementary': return 'Elementary';
    case 'highschool': return 'Secondary';
    case 'tertiary': return 'Tertiary';
    default: return doc.division ?? '';
  }
}

function getSport(doc: PendingDoc): string {
  return doc.sport?.trim() ?? '';
}

function getGender(doc: PendingDoc): string {
  return doc.gender?.trim() ?? '';
}

function getSchoolName(doc: PendingDoc): string {
  return findSchool(doc.institution_id)?.name ?? 'Unassigned School';
}

function groupDocuments(documents: PendingDoc[]) {
  const schools = new Map<string, {
    label: string;
    coaches: Map<string, {
      coachName: string;
      athletes: Map<string, { athleteName: string; docs: PendingDoc[] }>;
    }>;
  }>();

  for (const doc of documents) {
    const school = findSchool(doc.institution_id);
    const schoolKey = school?.id ?? 'UNASSIGNED';
    const schoolLabel = school?.name ?? 'Unassigned School';
    const coachKey = doc.coach_id || `COACH:${doc.coach_name || 'UNASSIGNED'}`;
    const athleteKey = doc.athlete_id;

    if (!schools.has(schoolKey)) {
      schools.set(schoolKey, { label: schoolLabel, coaches: new Map() });
    }

    const schoolGroup = schools.get(schoolKey)!;

    if (!schoolGroup.coaches.has(coachKey)) {
      schoolGroup.coaches.set(coachKey, {
        coachName: doc.coach_name || 'Unassigned Coach',
        athletes: new Map(),
      });
    }

    const coachGroup = schoolGroup.coaches.get(coachKey)!;

    if (!coachGroup.athletes.has(athleteKey)) {
      coachGroup.athletes.set(athleteKey, {
        athleteName: doc.athlete_name || 'Unknown Athlete',
        docs: [],
      });
    }

    coachGroup.athletes.get(athleteKey)!.docs.push(doc);
  }

  return Array.from(schools.entries()).map(([schoolKey, school]) => ({
    schoolKey,
    schoolName: school.label,
    totalDocs: Array.from(school.coaches.values())
      .flatMap((coach) => Array.from(coach.athletes.values()).map((athlete) => athlete.docs))
      .reduce((sum, docs) => sum + docs.length, 0),
    coaches: Array.from(school.coaches.entries()).map(([coachKey, coach]) => ({
      coachKey,
      coachName: coach.coachName,
      totalDocs: Array.from(coach.athletes.values()).reduce(
        (sum, athlete) => sum + athlete.docs.length, 0
      ),
      athletes: Array.from(coach.athletes.entries()).map(([athleteId, athlete]) => ({
        athleteId,
        athleteName: athlete.athleteName,
        docs: athlete.docs,
      })),
    })),
  }));
}

export default function PendingReviews() {
  const { user } = useAuthStore();
  const reviewerId = user?.id || '';

  const queryClient = useQueryClient();

  // ----------------------------------------
  // Review / rejection state
  // ----------------------------------------

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');

  // ----------------------------------------
  // Search / filter state
  // ----------------------------------------

  const [search, setSearch] = useState('');

  const [schoolFilter, setSchoolFilter] = useState('ALL');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [sportFilter, setSportFilter] = useState('ALL');
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [documentTypeFilter, setDocumentTypeFilter] = useState('ALL');

  const [collapsedSchools, setCollapsedSchools] =
    useState<Set<string>>(new Set());

  // ----------------------------------------
  // Query
  // ----------------------------------------

  const {
    data: documents = [],
    isLoading,
  } = useQuery({
    queryKey: ['pendingDocuments'],
    queryFn: getPendingDocuments,
  });

  // ----------------------------------------
  // Mutations
  // ----------------------------------------

  const verifyMutation = useMutation({
    mutationFn: (documentId: string) =>
      verifyDocument(documentId, reviewerId),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['pendingDocuments'],
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () =>
      rejectDocument(
        rejectingId as string,
        reviewerId,
        rejectNotes
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['pendingDocuments'],
      });

      setRejectingId(null);
      setRejectNotes('');
    },
  });

  // ----------------------------------------
  // View document
  // ----------------------------------------

  const handleView = async (storagePath: string) => {
    const url = await getSignedUrl(storagePath);

    window.open(
      url,
      '_blank',
      'noopener,noreferrer'
    );
  };

  // ----------------------------------------
  // Dynamic filter options
  // ----------------------------------------

  const schoolOptions = useMemo(() => {
    const names = new Set<string>();

    documents.forEach((doc) => {
      names.add(getSchoolName(doc));
    });

    return Array.from(names).sort();
  }, [documents]);

  const levelOptions = useMemo(() => {
    const values = new Set<string>();

    documents.forEach((rawDoc) => {
      const doc = rawDoc;
      const value = getLevel(doc);

      if (value) {
        values.add(value);
      }
    });

    // Prefer your application's standard ordering.
    const preferredOrder = [
      'Elementary',
      'Secondary',
      'Tertiary',
    ];

    return [
      ...preferredOrder.filter((value) => values.has(value)),
      ...Array.from(values)
        .filter((value) => !preferredOrder.includes(value))
        .sort(),
    ];
  }, [documents]);

  const sportOptions = useMemo(() => {
    const values = new Set<string>();
    documents.forEach((doc) => {
      const value = getSport(doc);
      if (value) values.add(value);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [documents]);

  const genderOptions = useMemo(() => {
    const values = new Set<string>();
    documents.forEach((doc) => {
      const value = getGender(doc);
      if (value) values.add(value);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [documents]);

  const documentTypeOptions = useMemo(() => {
    const values = new Set<string>();

    documents.forEach((doc) => {
      if (doc.document_type) {
        values.add(doc.document_type);
      }
    });

    return Array.from(values).sort();
  }, [documents]);

  // ----------------------------------------
  // Filtering
  // ----------------------------------------

  const filteredDocuments = useMemo(() => {
    const q = search.trim().toLowerCase();

    return documents.filter((rawDoc) => {
      const doc = rawDoc;

      const schoolName = getSchoolName(doc);
      const level = getLevel(doc);
      const sport = getSport(doc);
      const gender = getGender(doc);

      // Search
      const matchesSearch =
        !q ||
        doc.athlete_name?.toLowerCase().includes(q) ||
        doc.coach_name?.toLowerCase().includes(q) ||
        doc.institution_id?.toLowerCase().includes(q) ||
        schoolName.toLowerCase().includes(q) ||
        doc.original_filename?.toLowerCase().includes(q) ||
        prettifyDocType(doc.document_type).toLowerCase().includes(q) ||
        sport.toLowerCase().includes(q) ||
        gender.toLowerCase().includes(q);

      // School
      const matchesSchool =
        schoolFilter === 'ALL' ||
        schoolName === schoolFilter;

      // Level
      const matchesLevel =
        levelFilter === 'ALL' ||
        level === levelFilter;

      // Sport / Gender
      const matchesSport =
        sportFilter === 'ALL' ||
        sport === sportFilter;

      const matchesGender =
        genderFilter === 'ALL' ||
        gender === genderFilter;

      // Document type
      const matchesDocumentType =
        documentTypeFilter === 'ALL' ||
        doc.document_type === documentTypeFilter;

      return (
        matchesSearch &&
        matchesSchool &&
        matchesLevel &&
        matchesSport &&
        matchesGender &&
        matchesDocumentType
      );
    });
  }, [
    documents,
    search,
    schoolFilter,
    levelFilter,
    sportFilter,
    genderFilter,
    documentTypeFilter,
  ]);

  // ----------------------------------------
  // Group filtered documents
  // ----------------------------------------

  const schoolGroups = useMemo(
    () => groupDocuments(filteredDocuments),
    [filteredDocuments]
  );

  const athleteCount = useMemo(
    () =>
      new Set(
        filteredDocuments.map(
          (doc) => doc.athlete_id
        )
      ).size,
    [filteredDocuments]
  );

  // ----------------------------------------
  // Active filter count
  // ----------------------------------------

  const activeFilterCount = [
    schoolFilter !== 'ALL',
    levelFilter !== 'ALL',
    sportFilter !== 'ALL',
    genderFilter !== 'ALL',
    documentTypeFilter !== 'ALL',
  ].filter(Boolean).length;

  // ----------------------------------------
  // Clear filters
  // ----------------------------------------

  const clearFilters = () => {
    setSearch('');
    setSchoolFilter('ALL');
    setLevelFilter('ALL');
    setSportFilter('ALL');
    setGenderFilter('ALL');
    setDocumentTypeFilter('ALL');
  };

  // ----------------------------------------
  // Remove individual filter
  // ----------------------------------------

  const removeFilter = (
    filter: 'school' | 'level' | 'sport' | 'gender' | 'documentType'
  ) => {
    switch (filter) {
      case 'school':
        setSchoolFilter('ALL');
        break;

      case 'level':
        setLevelFilter('ALL');
        break;

      case 'sport':
        setSportFilter('ALL');
        break;

      case 'gender':
        setGenderFilter('ALL');
        break;

      case 'documentType':
        setDocumentTypeFilter('ALL');
        break;
    }
  };

  // ----------------------------------------
  // School collapse
  // ----------------------------------------

  const toggleSchool = (schoolKey: string) => {
    setCollapsedSchools((prev) => {
      const next = new Set(prev);

      if (next.has(schoolKey)) {
        next.delete(schoolKey);
      } else {
        next.add(schoolKey);
      }

      return next;
    });
  };

  const collapseAll = () => {
    setCollapsedSchools(
      new Set(
        schoolGroups.map(
          (school) => school.schoolKey
        )
      )
    );
  };

  const expandAll = () => {
    setCollapsedSchools(new Set());
  };

  // ----------------------------------------
  // Render
  // ----------------------------------------

  return (
    <div className="animate-in fade-in duration-300">

      {/* =====================================
          PAGE HEADER
      ====================================== */}

      <header className="mb-4">

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[18px] font-bold tracking-tight text-slate-800">
                Pending Reviews
              </h2>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Pending Review: {documents.length}
              </span>

              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Verified
              </span>

              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-100 px-2.5 py-1 text-[11px] font-bold text-red-600">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                Flagged
              </span>
            </div>

            <p className="text-slate-500 text-[11px] mt-1">
              {filteredDocuments.length === documents.length
                ? `${documents.length} ${
                    documents.length === 1
                      ? 'document'
                      : 'documents'
                  } awaiting verification`
                : `Showing ${filteredDocuments.length} of ${documents.length} documents`}
              
              {athleteCount > 0 &&
                ` across ${athleteCount} ${
                  athleteCount === 1
                    ? 'athlete'
                    : 'athletes'
                }`}
            </p>
          </div>

        </div>
      </header>

      {/* =====================================
          FILTER PANEL
      ====================================== */}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-2.5 mb-4">

        {/* PRIMARY FILTERS */}

        <div className="flex flex-wrap gap-2">

          {/* SEARCH */}

          <div className="relative flex-1 min-w-[220px]">
            <Search
              className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search athlete, coach, school, or document..."
              className="
                w-full
                h-9
                pl-9
                pr-3
                text-xs
                border
                border-slate-200
                rounded-lg
                outline-none
                text-slate-700
                placeholder:text-slate-400
                focus:border-blue-400
                focus:ring-2
                focus:ring-blue-50
                transition
              "
            />
          </div>

          {/* SCHOOL */}

          <FilterSelect
            value={schoolFilter}
            onChange={setSchoolFilter}
            options={schoolOptions}
            placeholder="All Schools"
          />

          {/* LEVEL */}

          <FilterSelect
            value={levelFilter}
            onChange={setLevelFilter}
            options={levelOptions}
            placeholder="All Levels"
          />

          <FilterSelect
            value={sportFilter}
            onChange={setSportFilter}
            options={sportOptions}
            placeholder="All Sports"
          />

          <FilterSelect
            value={genderFilter}
            onChange={setGenderFilter}
            options={genderOptions}
            placeholder="All Genders"
          />

        </div>

        {/* SECONDARY FILTERS */}

        <div className="flex flex-wrap items-center gap-2 mt-2">

          {activeFilterCount > 0 && (
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mr-1">
              Active:
            </span>
          )}

          {/* Active School */}

          {schoolFilter !== 'ALL' && (
            <FilterChip
              label={schoolFilter}
              onRemove={() =>
                removeFilter('school')
              }
            />
          )}

          {/* Active Level */}

          {levelFilter !== 'ALL' && (
            <FilterChip
              label={levelFilter}
              onRemove={() =>
                removeFilter('level')
              }
            />
          )}

          {sportFilter !== 'ALL' && (
            <FilterChip
              label={sportFilter}
              onRemove={() =>
                removeFilter('sport')
              }
            />
          )}

          {genderFilter !== 'ALL' && (
            <FilterChip
              label={genderFilter}
              onRemove={() =>
                removeFilter('gender')
              }
            />
          )}

          {/* Active Document Type */}

          {documentTypeFilter !== 'ALL' && (
            <FilterChip
              label={prettifyDocType(
                documentTypeFilter
              )}
              onRemove={() =>
                removeFilter(
                  'documentType'
                )
              }
            />
          )}

          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="
                text-[10px]
                font-semibold
                text-red-500
                hover:text-red-600
                px-1.5
                transition
              "
            >
              Clear all
            </button>
          )}

          <div className="ml-auto flex items-center gap-2">

            {/* DOCUMENT TYPE */}

            <FilterSelect
              value={documentTypeFilter}
              onChange={setDocumentTypeFilter}
              options={documentTypeOptions}
              placeholder="All Document Types"
              compact
            />

            {/* COLLAPSE */}

            <button
              onClick={
                collapsedSchools.size ===
                schoolGroups.length
                  ? expandAll
                  : collapseAll
              }
              className="
                h-9
                px-3
                rounded-lg
                border
                border-slate-200
                bg-white
                text-xs
                font-semibold
                text-slate-600
                hover:bg-slate-50
                flex
                items-center
                gap-1.5
                transition
              "
            >
              <ChevronDown
                className={`
                  w-3.5
                  h-3.5
                  transition-transform
                  ${
                    collapsedSchools.size ===
                    schoolGroups.length
                      ? '-rotate-90'
                      : ''
                  }
                `}
              />

              {collapsedSchools.size ===
              schoolGroups.length
                ? 'Expand All'
                : 'Collapse All'}
            </button>

          </div>
        </div>

      </div>

      {/* =====================================
          CONTENT
      ====================================== */}

      {isLoading ? (

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 flex items-center justify-center text-sm text-slate-400 gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading...
        </div>

      ) : filteredDocuments.length === 0 ? (

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 flex flex-col items-center justify-center text-center">

          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
            <Inbox className="w-5 h-5 text-slate-300" />
          </div>

          <p className="text-sm font-semibold text-slate-600">
            {search ||
            activeFilterCount > 0
              ? 'No documents match your filters'
              : 'Nothing pending review'}
          </p>

          <p className="text-xs text-slate-400 mt-1">
            {search ||
            activeFilterCount > 0
              ? 'Try adjusting or clearing your filters.'
              : "You're fully caught up."}
          </p>

          {(search ||
            activeFilterCount > 0) && (
            <button
              onClick={clearFilters}
              className="
                mt-4
                inline-flex
                items-center
                gap-1.5
                px-3
                py-1.5
                text-xs
                font-semibold
                text-blue-600
                bg-blue-50
                hover:bg-blue-100
                rounded-lg
              "
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear Filters
            </button>
          )}

        </div>

      ) : (

        <div className="space-y-3">

          {schoolGroups.map((school) => {

            const isCollapsed =
              collapsedSchools.has(
                school.schoolKey
              );

            return (

              <div
                key={school.schoolKey}
                className="
                  bg-white
                  rounded-xl
                  shadow-sm
                  border
                  border-slate-200
                  overflow-hidden
                "
              >

                {/* SCHOOL HEADER */}

                <button
                  onClick={() =>
                    toggleSchool(
                      school.schoolKey
                    )
                  }
                  className="
                    w-full
                    flex
                    items-center
                    justify-between
                    gap-4
                    px-3
                    py-2.5
                    bg-slate-50/70
                    hover:bg-slate-50
                    transition-colors
                  "
                >

                  <div className="flex items-center gap-2.5 min-w-0">

                    <div className="
                      w-7
                      h-7
                      rounded-lg
                      bg-slate-100
                      flex
                      items-center
                      justify-center
                      text-slate-500
                      shrink-0
                    ">
                      <Building2 className="w-3.5 h-3.5" />
                    </div>

                    <div className="text-left min-w-0">

                      <div className="flex items-center gap-2">

                        <p className="text-xs font-bold text-slate-800 truncate">
                          {school.schoolName}
                        </p>

                        <span className="text-[10px] text-slate-400">
                          Tertiary Division
                        </span>

                        <span className="hidden sm:inline text-[10px] text-slate-400">
                          • {school.coaches.length}{' '}
                          {school.coaches.length === 1
                            ? 'coach'
                            : 'coaches'}
                        </span>

                      </div>

                    </div>

                  </div>

                  <div className="flex items-center gap-2 shrink-0">

                    <span className="
                      text-[10px]
                      font-bold
                      text-amber-700
                      bg-amber-50
                      border
                      border-amber-100
                      px-2
                      py-1
                      rounded-md
                    ">
                      {school.totalDocs} pending
                    </span>

                    <ChevronDown
                      className={`
                        w-3.5
                        h-3.5
                        text-slate-400
                        transition-transform
                        ${
                          isCollapsed
                            ? '-rotate-90'
                            : ''
                        }
                      `}
                    />

                  </div>

                </button>

                {/* SCHOOL CONTENT */}

                {!isCollapsed && (

                  <div className="divide-y divide-slate-100">

                    {school.coaches.map(
                      (coach) => (

                        <div
                          key={coach.coachKey}
                          className="px-3 py-3"
                        >

                          {/* COACH */}

                          <div className="flex items-center gap-2 mb-2">

                            <p className="
                              text-[10px]
                              font-bold
                              uppercase
                              tracking-wide
                              text-slate-500
                            ">
                              {coach.coachName}
                            </p>

                            <span className="
                              text-[9px]
                              font-bold
                              text-slate-400
                              bg-slate-50
                              border
                              border-slate-100
                              px-1.5
                              py-0.5
                              rounded-full
                            ">
                              {coach.totalDocs}{' '}
                              {coach.totalDocs === 1
                                ? 'doc'
                                : 'docs'}
                            </span>

                          </div>

                          {/* ATHLETES */}

                          <div className="space-y-2">

                            {coach.athletes.map(
                              (athlete) => (

                                <div
                                  key={athlete.athleteId}
                                >

                                  <div className="
                                    flex
                                    items-center
                                    gap-2
                                    mb-1.5
                                  ">

                                    <div className="
                                      w-6
                                      h-6
                                      rounded-full
                                      bg-blue-50
                                      flex
                                      items-center
                                      justify-center
                                      text-blue-600
                                      text-[9px]
                                      font-bold
                                      uppercase
                                      shrink-0
                                    ">
                                      {athlete.athleteName.charAt(
                                        0
                                      )}
                                    </div>

                                    <p className="
                                      text-xs
                                      font-semibold
                                      text-slate-700
                                    ">
                                      {athlete.athleteName}
                                    </p>

                                    <span className="
                                      text-[9px]
                                      font-semibold
                                      text-slate-400
                                      bg-slate-50
                                      px-1.5
                                      py-0.5
                                      rounded-full
                                    ">
                                      {athlete.docs.length}{' '}
                                      {athlete.docs.length === 1
                                        ? 'document'
                                        : 'documents'}
                                    </span>

                                  </div>

                                  {/* DOCUMENTS */}

                                  <ul className="space-y-1.5 pl-8">

                                    {athlete.docs.map(
                                      (doc) => {

                                        const isVerifying =
                                          verifyMutation.isPending &&
                                          verifyMutation.variables ===
                                            doc.id;

                                        const isRejectingThis =
                                          rejectMutation.isPending &&
                                          rejectingId ===
                                            doc.id;

                                        return (

                                          <li
                                            key={doc.id}
                                            className="
                                              bg-white
                                              border
                                              border-slate-100
                                              rounded-lg
                                              px-3
                                              py-2
                                            "
                                          >

                                            <div className="
                                              flex
                                              items-center
                                              justify-between
                                              gap-3
                                            ">

                                              <div className="
                                                flex
                                                items-center
                                                gap-2
                                                min-w-0
                                              ">

                                                <div className="
                                                  w-6
                                                  h-6
                                                  rounded-md
                                                  bg-slate-50
                                                  flex
                                                  items-center
                                                  justify-center
                                                  shrink-0
                                                ">
                                                  <Building2
                                                    className="
                                                      w-3
                                                      h-3
                                                      text-slate-400
                                                    "
                                                  />
                                                </div>

                                                <div className="min-w-0">

                                                  <div className="
                                                    flex
                                                    items-center
                                                    gap-1.5
                                                    flex-wrap
                                                  ">

                                                    <p className="
                                                      text-[11px]
                                                      font-bold
                                                      text-slate-700
                                                    ">
                                                      {prettifyDocType(
                                                        doc.document_type
                                                      )}
                                                    </p>

                                                    <span className="
                                                      text-[9px]
                                                      font-semibold
                                                      text-amber-700
                                                      bg-amber-50
                                                      border
                                                      border-amber-100
                                                      px-1.5
                                                      py-0.5
                                                      rounded
                                                    ">
                                                      Pending Review
                                                    </span>

                                                  </div>

                                                  <p className="
                                                    text-[10px]
                                                    text-slate-400
                                                    truncate
                                                    mt-0.5
                                                  ">
                                                    PDF ·{' '}
                                                    {doc.original_filename}
                                                  </p>

                                                </div>

                                              </div>

                                              {/* ACTIONS */}

                                              <div className="
                                                flex
                                                items-center
                                                gap-1
                                                shrink-0
                                              ">

                                                <button
                                                  onClick={() =>
                                                    handleView(
                                                      doc.storage_path
                                                    )
                                                  }
                                                  title="View document"
                                                  className="
                                                    p-1.5
                                                    text-slate-400
                                                    hover:text-blue-600
                                                    hover:bg-blue-50
                                                    rounded-md
                                                    transition
                                                  "
                                                >
                                                  <ExternalLink className="w-3.5 h-3.5" />
                                                </button>

                                                <button
                                                  onClick={() =>
                                                    verifyMutation.mutate(
                                                      doc.id
                                                    )
                                                  }
                                                  disabled={
                                                    isVerifying
                                                  }
                                                  className="
                                                    h-7
                                                    flex
                                                    items-center
                                                    gap-1
                                                    px-2.5
                                                    text-[10px]
                                                    font-bold
                                                    text-emerald-700
                                                    bg-emerald-50
                                                    hover:bg-emerald-100
                                                    disabled:opacity-60
                                                    rounded-md
                                                    transition
                                                  "
                                                >

                                                  {isVerifying ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                  ) : (
                                                    <CheckCircle2 className="w-3 h-3" />
                                                  )}

                                                  Verify

                                                </button>

                                                <button
                                                  onClick={() =>
                                                    setRejectingId(
                                                      rejectingId ===
                                                        doc.id
                                                        ? null
                                                        : doc.id
                                                    )
                                                  }
                                                  className="
                                                    h-7
                                                    flex
                                                    items-center
                                                    gap-1
                                                    px-2.5
                                                    text-[10px]
                                                    font-bold
                                                    text-red-700
                                                    bg-red-50
                                                    hover:bg-red-100
                                                    rounded-md
                                                    transition
                                                  "
                                                >
                                                  <XCircle className="w-3 h-3" />
                                                  Reject
                                                </button>

                                              </div>

                                            </div>

                                            {/* REJECTION */}

                                            {rejectingId ===
                                              doc.id && (

                                              <div className="
                                                mt-2
                                                pt-2
                                                border-t
                                                border-slate-100
                                                flex
                                                gap-2
                                              ">

                                                <input
                                                  value={
                                                    rejectNotes
                                                  }
                                                  onChange={(e) =>
                                                    setRejectNotes(
                                                      e.target.value
                                                    )
                                                  }
                                                  placeholder="Reason for rejection..."
                                                  autoFocus
                                                  className="
                                                    flex-1
                                                    h-7
                                                    px-2.5
                                                    text-[10px]
                                                    bg-white
                                                    border
                                                    border-slate-200
                                                    rounded-md
                                                    outline-none
                                                    focus:border-red-400
                                                    focus:ring-2
                                                    focus:ring-red-50
                                                  "
                                                />

                                                <button
                                                  onClick={() =>
                                                    rejectMutation.mutate()
                                                  }
                                                  disabled={
                                                    isRejectingThis ||
                                                    !rejectNotes.trim()
                                                  }
                                                  className="
                                                    h-7
                                                    px-2.5
                                                    text-[10px]
                                                    font-bold
                                                    text-white
                                                    bg-red-600
                                                    hover:bg-red-700
                                                    disabled:opacity-60
                                                    rounded-md
                                                  "
                                                >
                                                  {isRejectingThis && (
                                                    <Loader2 className="w-3 h-3 inline mr-1 animate-spin" />
                                                  )}
                                                  Confirm
                                                </button>

                                                <button
                                                  onClick={() => {
                                                    setRejectingId(
                                                      null
                                                    );
                                                    setRejectNotes(
                                                      ''
                                                    );
                                                  }}
                                                  className="
                                                    h-7
                                                    px-2
                                                    text-[10px]
                                                    font-semibold
                                                    text-slate-500
                                                    hover:text-slate-700
                                                  "
                                                >
                                                  Cancel
                                                </button>

                                              </div>

                                            )}

                                          </li>

                                        );
                                      }
                                    )}

                                  </ul>

                                </div>

                              )
                            )}

                          </div>

                        </div>

                      )
                    )}

                  </div>

                )}

              </div>

            );
          })}

        </div>

      )}

    </div>
  );
}

/* =========================================================
   FILTER SELECT
========================================================= */

type FilterSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  compact?: boolean;
};

function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
  compact = false,
}: FilterSelectProps) {
  return (
    <div className="relative">

      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className={`
          appearance-none
          h-9
          ${compact ? 'min-w-[145px]' : 'min-w-[115px]'}
          max-w-[220px]
          pl-3
          pr-8
          text-xs
          font-medium
          text-slate-700
          bg-white
          border
          border-slate-200
          rounded-lg
          outline-none
          cursor-pointer
          hover:bg-slate-50
          focus:border-blue-400
          focus:ring-2
          focus:ring-blue-50
          transition
        `}
      >

        <option value="ALL">
          {placeholder}
          {options.length > 0
            ? ` (${options.length})`
            : ''}
        </option>

        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}

      </select>

      <ChevronDown
        className="
          pointer-events-none
          absolute
          right-2.5
          top-1/2
          -translate-y-1/2
          w-3.5
          h-3.5
          text-slate-400
        "
      />

    </div>
  );
}

/* =========================================================
   ACTIVE FILTER CHIP
========================================================= */

function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span
      className="
        inline-flex
        items-center
        gap-1
        max-w-[220px]
        text-[10px]
        font-semibold
        text-blue-700
        bg-blue-50
        border
        border-blue-100
        px-2
        py-1
        rounded-md
      "
    >

      <span className="truncate">
        {label}
      </span>

      <button
        onClick={onRemove}
        className="
          shrink-0
          p-0.5
          rounded
          hover:bg-blue-100
          transition
        "
        aria-label={`Remove ${label} filter`}
      >
        <X className="w-2.5 h-2.5" />
      </button>

    </span>
  );
}