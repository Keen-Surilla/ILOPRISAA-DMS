import React, { useMemo, useState } from 'react';
import { Plus, X, FileText, Users } from 'lucide-react';
import { useAuthStore } from '../../../2-application-tier/stores/authStore';
import { TableSkeleton } from '../../components/ui/TableSkeleton';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { DocumentChecklistModal } from '../../components/ui/DocumentChecklistModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamApi } from '../../../3-data-tier/api/teamApi';
import { listEvents, type CalendarEventRow } from '../../../3-data-tier/services/eventService';
import { documentsApi, TOTAL_REQUIRED_DOCUMENTS } from '../../../3-data-tier/api/documentsApi';
import { getProfile } from '../../../3-data-tier/services/profileService';

// --- 1. ILOPRISAA ABBREVIATION DICTIONARY ---
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
  
  // Auto-generate an acronym for unknown schools (e.g. "University of Iloilo" -> "UI")
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

export function useTeamDashboardData(currentUserId: string) {
  // 1. Fetch Athletes
  const { data: athletes = [], isLoading: isLoadingAthletes } = useQuery({
    queryKey: ['teamMembers', currentUserId],
    queryFn: () => teamApi.getTeamMembers(currentUserId),
    enabled: !!currentUserId,
    staleTime: 1000 * 60 * 5, 
    gcTime: 1000 * 60 * 15,   
  });

  // 2. Fetch Events (FIXED: Now perfectly synchronized with the Schedule tab!)
  const { data: allEvents = [], isLoading: isLoadingEvents } = useQuery({
    queryKey: ['events', currentUserId],                  // <--- Shares the Schedule tab's cache key
    queryFn: () => listEvents({ userId: currentUserId }), // <--- Passes the specific coach's ID
    enabled: !!currentUserId,
    staleTime: 30_000, 
  });

  // 3. Filter to ALL upcoming events (excluding meetings & deadlines)
  const upcomingEvents = useMemo(() => {
    if (!Array.isArray(allEvents)) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return allEvents
      .filter(ev => {
        // Bulletproof check to prevent crashes
        if (!ev || !ev.event_date) return false;
        
        // ONLY include 'event' types
        const isActualEvent = ev.type === 'event';
        const eventDate = new Date(ev.event_date);
        
        // Keep ALL events from today onwards
        return isActualEvent && eventDate >= today;
      })
      // Sort them so the closest upcoming event is at the top of the list
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
  }, [allEvents]);

  // 4. Fetch Coach Profile
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

  // 1. Get the queryClient to control the cache
  const queryClient = useQueryClient();

const { athletes, eventCount, upcomingEvents, profile, isLoading } = useTeamDashboardData(currentUserId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAthlete, setNewAthlete] = useState({ name: '', email: '' });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [athleteToDelete, setAthleteToDelete] = useState<string | null>(null);
  const [docsAthlete, setDocsAthlete] = useState<{ id: string; name: string } | null>(null);

  // One count-query for the whole roster instead of one per row.
  const athleteIds = useMemo(() => athletes.map(a => a.id), [athletes]);
  const { data: documentCounts = {} } = useQuery({
    queryKey: ['documentCounts', currentUserId, athleteIds],
    queryFn: () => documentsApi.getDocumentCountsForAthletes(athleteIds),
    enabled: athleteIds.length > 0,
  });

  // 2. Setup the Add Mutation
  const addAthleteMutation = useMutation({
    mutationFn: (athleteData: any) => teamApi.addAthlete(athleteData),
    onSuccess: () => {
      // Magically refreshes the athlete list in the background!
      queryClient.invalidateQueries({ queryKey: ['teamMembers', currentUserId] });
      setIsModalOpen(false);
      setNewAthlete({ name: '', email: '' });
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

    // ✅ FIXED: Check newAthlete.name instead of the setter function
    if (newAthlete.name.trim().length > 100) {
      setErrorMessage("The athlete's name cannot exceed 100 characters.");
      return; // Stops the function from continuing
    }

    const cleanedEmail = newAthlete.email.trim().toLowerCase();
    
    if (!cleanedEmail.endsWith('@gmail.com')) {
      setErrorMessage("Please use a valid Gmail address (@gmail.com).");
      return;
    }

    // Trigger the mutation
    addAthleteMutation.mutate({
      name: newAthlete.name,
      email: cleanedEmail,
      role: 'Athlete',
      coach_id: currentUserId
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
    <div className="space-y-6 animate-in fade-in duration-300">
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">Team Roster</h1>
          <p className="text-slate-500 text-sm mt-1 max-w-2xl">
            Manage your athletes and document compliance.
          </p>
        </div>
        
        {/* Your "Add Athlete" Button stays here */}
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
                  {getSchoolAbbreviation(profile?.institution_id)} {formatSportTeamName(profile?.sport)}
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

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="font-bold text-slate-700">Athletes List</h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition flex items-center shadow-sm"
          >
            < div className="w-auto h-4" /> Add Athlete
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
                athletes.map((member) => {
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
                          <p className="text-sm font-bold text-slate-800">{member.name}</p>
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
                        className="inline-flex p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                      >
                        <FileText className="w-5 h-5 mx-auto" />
                      </button>
                    </td>
                    
                    {/* 5. Delete Column */}
                    <td className="py-3 pr-2 text-right align-middle">
                      <button 
                        onClick={() => setAthleteToDelete(member.id)}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg transition-colors border border-red-100 shadow-sm"
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
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden transform transition-all scale-100">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">Add New Athlete</h3>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setErrorMessage(null);
                  setNewAthlete({ name: '', email: '' });
                }} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
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
              
              <div className="pt-2 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm shadow-blue-600/20"
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
        onClose={() => setDocsAthlete(null)}
      />
    </div>
  );
}