import React, { useMemo, useState, useEffect } from 'react';
import { X, FileText, Users, Filter, CheckCircle2, UserPlus } from 'lucide-react';
import { useAuthStore } from '../../../2-application-tier/stores/authStore';
import { TableSkeleton } from '../../components/ui/SkeletonLoading';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { DocumentChecklistModal } from '../../components/ui/DocumentChecklistModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamApi } from '../../../3-data-tier/api/teamApi';
import { listEvents } from '../../../3-data-tier/services/eventService';
import { documentsApi, TOTAL_REQUIRED_DOCUMENTS } from '../../../3-data-tier/api/documentsApi';
import { getProfile } from '../../../3-data-tier/services/profileService';
import { Link as LinkIcon, Check } from 'lucide-react';
import { supabase } from '../../../3-data-tier/config/SupabaseClient';
import { DivisionSelect } from '../../components/ui/DivisionSelect';

const ILOPRISAA_SCHOOLS: Record<string, string> = {
  'western institute of technology': 'WIT',
  'central philippine university': 'CPU',
  'john b. lacson foundation maritime university': 'JBLFMU',
  'hua siong college of iloilo': 'HSCI',
  'st. robert\'s international college': 'SRIC',
  'st. roberts international college': 'SRIC',
  'iloilo doctors\' college': 'IDC',
  'iloilo doctors college': 'IDC',
  'ateneo de iloilo': 'ADI',
  'colegio de san jose': 'CSJ',
  'santa isabel college of iloilo': 'SICI',
  'iloilo scholastic academy': 'ISA',
  'st. paul university iloilo': 'SPUI',
  'university of san agustin': 'USA',
  'iloilo integrated school foundation': 'IISF'
};

export function getSchoolAbbreviation(schoolName?: string | null): string {
  if (!schoolName) return 'ILOPRISAA'; // Fallback if no school is entered yet
  const normalized = schoolName.trim().toLowerCase();
  
  if (ILOPRISAA_SCHOOLS[normalized]) {
    return ILOPRISAA_SCHOOLS[normalized];
  }
  
  return schoolName
    .split(/[\s-]+/)
    .map(word => word[0])
    .filter(char => char && /[a-zA-Z]/.test(char))
    .join('')
    .toUpperCase();
}

export function formatSportTeamName(rawSport?: string | null): string {
  if (!rawSport) return 'Team';
  const cleanSport = rawSport.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return `${cleanSport} Team`;
}

function getPrisaaAge(dob: string | null | undefined, eventYear: number): number | null {
  if (!dob) return null;
  const birthYear = new Date(dob).getFullYear();
  if (Number.isNaN(birthYear)) return null;
  return eventYear - birthYear;
}

export function useTeamDashboardData(currentUserId: string) {
const { data: athletes = [], isLoading: isLoadingAthletes } = useQuery({
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
        queryClient.invalidateQueries({ queryKey: ['teamMembers', currentUserId] });
        queryClient.invalidateQueries({ queryKey: ['archivedTeamMembers', currentUserId] });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [currentUserId, queryClient]);




  const { data: allEvents = [], isLoading: isLoadingEvents } = useQuery({
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
      .filter(ev => {
        if (!ev || !ev.event_date) return false;
        const isActualEvent = ev.type === 'event';
        const eventDate = new Date(ev.event_date);
        
        return isActualEvent && eventDate >= today;
      })
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
  }, [allEvents]);

  const { data: profile, isLoading: isLoadingProfile } = useQuery({
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
    isLoading: isLoadingAthletes || isLoadingEvents || isLoadingProfile,
  };
}

export default function TeamView() {
  const { user } = useAuthStore();
  const currentUserId = user?.id || '';

  const queryClient = useQueryClient();

  const { athletes, eventCount, upcomingEvents, profile, isLoading } = useTeamDashboardData(currentUserId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAthlete, setNewAthlete] = useState({ name: '', email: '', division: '', date_of_birth: '' });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [athleteToDelete, setAthleteToDelete] = useState<string | null>(null);
  const [docsAthlete, setDocsAthlete] = useState<{ id: string; name: string } | null>(null);
  const [shouldRenderAddModal, setShouldRenderAddModal] = useState(false);
  const [isAddModalClosing, setIsAddModalClosing] = useState(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen]);

  const DIVISION_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'elementary', label: 'Elementary' },
  { key: 'highschool', label: 'High School' },
  { key: 'tertiary', label: 'Tertiary' },
] as const;

const [divisionFilter, setDivisionFilter] = useState<(typeof DIVISION_FILTERS)[number]['key']>('all');
const [showDivisionFilters, setShowDivisionFilters] = useState(false);

const filteredAthletes = useMemo(() => {
  if (divisionFilter === 'all') return athletes;
  return athletes.filter((a) => a.division === divisionFilter);
}, [athletes, divisionFilter]);


    // Add this inside TeamView.tsx so it can read the acronym!
  const getTeamAcronym = (id?: string) => {
    if (!id) return 'TM'; 
    return id.substring(0, 10).toUpperCase(); 
  };

  const [linkCopied, setLinkCopied] = useState(false);

 const handleCopyInviteLink = () => {
    // 1. Calculate the exact time 30 minutes from right now (in milliseconds)
    const expirationTime = Date.now() + (30 * 60 * 1000); 

    // 2. Create a small package of data
    const tokenData = JSON.stringify({
      // We include the coach ID so you know whose team they belong to!
      coachId: profile?.id, 
      exp: expirationTime
    });

    // 3. Scramble the data into a Base64 string (makes it look like a real security token)
    const encodedToken = btoa(tokenData);

    // 4. Build the URL with the token attached to the end
    const inviteUrl = `${window.location.origin}/athlete-login?invite=${encodedToken}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(inviteUrl);
    
    // Show success checkmark
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // One count-query for the whole roster instead of one per row.
  const athleteIds = useMemo(() => athletes.map(a => a.id), [athletes]);
  const { data: documentCounts = {} } = useQuery({
    queryKey: ['documentCounts', currentUserId, athleteIds],
    queryFn: () => documentsApi.getDocumentCountsForAthletes(athleteIds),
    enabled: athleteIds.length > 0,
  });

  const eligibilityEventYear = useMemo(() => {
  return upcomingEvents[0]?.event_date
    ? new Date(upcomingEvents[0].event_date).getFullYear()
    : new Date().getFullYear();
}, [upcomingEvents]);

  // 2. Setup the Add Mutation
  const addAthleteMutation = useMutation({
    mutationFn: (athleteData: any) => teamApi.addAthlete(athleteData),
    onSuccess: () => {
      // Magically refreshes the athlete list in the background!
      queryClient.invalidateQueries({ queryKey: ['teamMembers', currentUserId] });
      setIsModalOpen(false);
      setNewAthlete({ name: '', email: '', division: '', date_of_birth: '' });
    },
    onError: (error: any) => {
      setErrorMessage(error?.message || "Failed to add athlete.");
    }
  });

  // 3. Setup the Delete Mutation
  const deleteAthleteMutation = useMutation({
    mutationFn: (id: string) => teamApi.deleteAthlete(id, currentUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers', currentUserId] });
      setAthleteToDelete(null); 
    },
    onError: (error) => {
      console.error("Failed to delete athlete:", error);
      alert("Failed to remove athlete. Please try again.");
    }
  });

  // 4. Update the handlers to trigger the mutations
 const handleAddAthlete = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newAthlete.name.trim().length > 100) {
      setErrorMessage("The athlete's name cannot exceed 100 characters.");
      return;
    }

    const cleanedEmail = newAthlete.email.trim().toLowerCase();
    
    if (!cleanedEmail.endsWith('@gmail.com')) {
      setErrorMessage("Please use a valid Gmail address (@gmail.com).");
      return;
    }

    if (!newAthlete.division) {
  setErrorMessage("Please select the athlete's division.");
  return;
}

    if (!newAthlete.date_of_birth) {
      setErrorMessage("Please enter the athlete's date of birth.");
      return;
    }

    const dobDate = new Date(newAthlete.date_of_birth);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (Number.isNaN(dobDate.getTime()) || dobDate > today) {
      setErrorMessage("Please enter a valid date of birth (it can't be in the future).");
      return;
    }

    // Trigger the mutation
    addAthleteMutation.mutate({
      name: newAthlete.name,
      email: cleanedEmail,
      role: 'Athlete',
      coach_id: currentUserId,
      division: newAthlete.division,
      date_of_birth: newAthlete.date_of_birth,
    });
  };
  
  const confirmDeleteAthlete = () => {
    if (!athleteToDelete) return;
    deleteAthleteMutation.mutate(athleteToDelete);
  };



  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse p-6">
        <div>
          <div className="h-8 bg-slate-200 rounded-md w-64 mb-2"></div>
          <div className="h-4 bg-slate-200 rounded-md w-96"></div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl h-24"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl h-24"></div>
          <div className="bg-white border border-slate-200 rounded-xl h-24"></div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div className="h-5 bg-slate-200 rounded-md w-24"></div>
            <div className="h-8 bg-slate-200 rounded-md w-28"></div>
          </div>
          <div className="overflow-x-auto p-6 pt-2">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b-2 border-slate-100 text-sm text-transparent">
                  <th className="pb-3 pl-2 w-2/5">Athletes</th>
                  <th className="pb-3 text-center w-1/5">Role</th>
                  <th className="pb-3 text-center w-1/5">Status</th>
                  <th className="pb-3 text-center w-[10%]">Documents</th>
                  <th className="pb-3 pr-2 w-[10%]"></th>
                </tr>
              </thead>
              <tbody>
                <TableSkeleton rows={3} />
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 motion-reduce:animate-none">
      
 <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
  {/* Left Side: Title Block ONLY */}
  <div>
    <h1 className="text-3xl font-bold tracking-tight text-slate-800">Team Roster</h1>
    <p className="text-slate-500 text-sm mt-1 max-w-2xl">
      Manage your athletes and document compliance.
    </p>
  </div>

  {/* Right Side: Action Buttons (Invite Link + Add Athlete) */}
  <div className="flex items-center gap-3">
    
    {/* THE NEW INVITE LINK BUTTON (Moved to the right) */}
    <button 
      onClick={handleCopyInviteLink}
      className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-[color,background-color,transform] shadow-sm active:scale-95 shrink-0"
      title="Copy Athlete Login Link"
    >
      {linkCopied ? <Check className="w-4 h-4 text-green-600" /> : <LinkIcon className="w-4 h-4" />}
      {linkCopied ? <span className="text-green-700">Copied!</span> : 'Invite Athlete to login'}
    </button>

    {/* Right Side: Your "Add Athlete" Button stays right next to it here */}
    {/* <AddAthleteButton /> */}
    
  </div>
</header>


  {/* --- TEAM PROFILE BANNER --- */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#0f172a] text-white flex flex-col items-center justify-center shadow-sm">
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900">
                  {/* Dynamic: e.g., "WIT Swimming Team" */}
                  {getTeamAcronym(profile?.institution_id)} {formatSportTeamName(profile?.sport)}
                </h2>
              </div>
              <p className="text-slate-500 text-sm mt-1">
                {/* Dynamic: Custom Motto or Fallback */}
                {profile?.team_motto || "The National Sports Association of Private Schools, Colleges and Universities of the Philippines"}
              </p>
            </div>
          </div>

        {/* Right: Coach Details */}
        <div className="flex flex-col w-full md:w-auto md:border-l md:border-slate-100 md:pl-8">
          <p className="text-xs font-medium text-slate-500 mb-2">Coach</p>
          <div className="flex items-center gap-3">
            {/* Coach Avatar Placeholder */}
            <div className="w-12 h-12 bg-slate-300 rounded-full shrink-0"></div>
            <div className="flex flex-col">
              {/* Dynamically uses the logged-in coach's name, or defaults to a fallback */}
              <p className="text-sm font-bold text-slate-800">{user?.full_name}</p>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5">Head Coach</p>
            </div>
          </div>
        </div>
        
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Total Athletes</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{athletes.length}</h3>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Upcoming Events</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{eventCount}</h3>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
          </div>
        </div>
      </div>

      <div className="relative inline-block mb-5">
  <button
    type="button"
    onClick={() => setShowDivisionFilters((v) => !v)}
    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold border border-slate-200 bg-white text-slate-600 hover:border-slate-300 active:scale-[0.97] transition-[color,border-color,transform]"
  >
    <Filter className="w-4 h-4 text-slate-400" />
    {DIVISION_FILTERS.find((f) => f.key === divisionFilter)?.label ?? 'Filter'}
  </button>

  {showDivisionFilters && (
    <>
      <div className="fixed inset-0 z-10" onClick={() => setShowDivisionFilters(false)} />
      <div className="absolute left-0 top-full mt-2 z-20 w-44 bg-white rounded-xl border border-slate-200 shadow-lg p-1.5">
        {DIVISION_FILTERS.map((f) => {
          const isActive = divisionFilter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => {
                setDivisionFilter(f.key);
                setShowDivisionFilters(false);
              }}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm text-left active:scale-[0.98] transition-[color,background-color,transform] ${
                isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f.label}
              {isActive && <CheckCircle2 className="w-3.5 h-3.5" />}
            </button>
          );
        })}
      </div>
    </>
  )}
</div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="font-bold text-slate-700">Athletes List</h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-50 text-blue-700 hover:bg-blue-100 active:scale-[0.97] border border-blue-200 px-3 py-2 rounded-lg text-sm font-medium transition-[color,background-color,transform] flex items-center gap-1.5 shadow-sm"
          >
            <UserPlus className="w-4 h-4" /> Add Athlete
          </button>
        </div>
        
        <div className="overflow-x-auto p-6 pt-2">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b-2 border-slate-100 text-sm text-slate-800">
                <th className="pb-3 font-bold pl-2 w-2/5">Athletes</th>
                <th className="pb-3 font-bold text-center w-1/5">Role</th>
                <th className="pb-3 font-bold text-center w-1/5">Status</th>
                <th className="pb-3 font-bold text-center w-[10%]">Documents</th>
                <th className="pb-3 pr-2 w-[10%]"></th>
              </tr>
            </thead>
            <tbody>
              {athletes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-slate-400">No athletes added yet.</td>
                </tr>
              ) : (
                filteredAthletes.map((member) => {
                  const count = documentCounts[member.id] ?? 0;
                  const complete = count === TOTAL_REQUIRED_DOCUMENTS;
                  return (
                  <tr key={member.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    
                    {/* 1. Athlete Info Column */}
                    <td className="py-3 pl-2 align-middle">
                      <div className="flex gap-4 items-center">
                        <div className="w-10 h-10 bg-slate-200 rounded-full shrink-0 flex items-center justify-center text-slate-500 text-sm font-bold uppercase">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-slate-800">{member.name}</p>
                            {getPrisaaAge(member.date_of_birth, eligibilityEventYear) === 25 && (
                              <span
                                title="This athlete will be ineligible next year under the PRISAA age cutoff."
                                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200 whitespace-nowrap"
                              >
                                Final Playing Year
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-medium text-slate-400 mt-0.5">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    
                    {/* 2. Role Column */}
                    <td className="py-3 text-sm font-medium text-slate-600 text-center align-middle">
                      {member.role}
                    </td>

                    {/* 3. Status Column — now reflects real document progress */}
                    <td className="py-3 text-center align-middle">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        complete
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                      }`}>
                        {complete ? 'Complete' : `${count}/${TOTAL_REQUIRED_DOCUMENTS} Docs`}
                      </span>
                    </td>
                    
                    {/* 4. Documents Column */}
                    <td className="py-3 text-center align-middle">
                      <button 
                        title="Manage Documents"
                        onClick={() => setDocsAthlete({ id: member.id, name: member.name })}
                        className="inline-flex p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 active:scale-90 rounded-lg transition-[color,background-color,transform]"
                      >
                        <FileText className="w-5 h-5 mx-auto" />
                      </button>
                    </td>
                    
                    {/* 5. Delete Column */}
                    <td className="py-3 pr-2 text-right align-middle">
                      <button 
                        onClick={() => setAthleteToDelete(member.id)}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold active:scale-[0.97] rounded-lg transition-[color,background-color,transform] border border-red-100 shadow-sm"
                      >
                        Delete
                      </button>
                    </td>
                    
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal code remains exactly the same below... */}
      {shouldRenderAddModal && (
        <div
          className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4 motion-reduce:animate-none ${
            isAddModalClosing ? 'animate-out fade-out duration-150' : 'animate-in fade-in duration-200'
          }`}
        >
          <div
            className={`bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden motion-reduce:animate-none ${
              isAddModalClosing ? 'animate-out fade-out zoom-out-95 duration-150' : 'animate-in fade-in zoom-in-95 duration-200'
            }`}
          >
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">Add New Athlete</h3>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setErrorMessage(null);
                  setNewAthlete({ name: '', email: '', division: '', date_of_birth: '' });
                }} 
                className="text-slate-400 hover:text-slate-600 active:scale-90 transition-[color,transform]"
              >
                <X className="w-5 h-5"/>
              </button>
            </div>
            
            <form onSubmit={handleAddAthlete} className="p-4 space-y-4">
              {errorMessage && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                  {errorMessage}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  required
                  type="text" 
                  value={newAthlete.name}
                  onChange={(e) => setNewAthlete({...newAthlete, name: e.target.value})}
                  maxLength={100}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  placeholder="e.g. John Doe"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gmail Address</label>
                <input 
                  required
                  type="email" 
                  value={newAthlete.email}
                  onChange={(e) => setNewAthlete({...newAthlete, email: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  placeholder="johndoe@gmail.com"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Division</label>
                <DivisionSelect value={newAthlete.division} onChange={(v) => setNewAthlete({ ...newAthlete, division: v })} required />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                <input
                  required
                  type="date"
                  value={newAthlete.date_of_birth}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setNewAthlete({ ...newAthlete, date_of_birth: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Used to determine PRISAA age-cutoff eligibility for future events.
                </p>
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 active:scale-[0.97] rounded-lg text-sm font-medium transition-[color,background-color,transform]"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white active:scale-[0.97] rounded-lg text-sm font-medium transition-[background-color,transform] shadow-sm shadow-blue-600/20"
                >
                  Save Athlete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={athleteToDelete !== null}
        title="Remove Athlete"
        message="Are you sure you want to remove this athlete from your roster? This action cannot be undone."
        confirmText="Remove"
        onConfirm={confirmDeleteAthlete}
        onCancel={() => setAthleteToDelete(null)}
      />
<DocumentChecklistModal
  isOpen={docsAthlete !== null}
  athleteId={docsAthlete?.id ?? null}
  athleteName={docsAthlete?.name ?? ''}
  coachUserId={currentUserId}
  eligibilityCheckDate={upcomingEvents[0]?.event_date ?? null}
  onClose={() => setDocsAthlete(null)}
/>
    </div>
  );
}