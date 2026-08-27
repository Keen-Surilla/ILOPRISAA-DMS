// src/1-presentation-tier/pages/committee-views/PendingReviews.tsx
import { useMemo, useState } from 'react';
import { CheckCircle2, XCircle, ExternalLink, ChevronDown, Search, Building2, Loader2, Inbox } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../2-application-tier/stores/authStore';
import { getPendingDocuments, verifyDocument, rejectDocument, getSignedUrl } from '../../../3-data-tier/api/committeeApi';

type PendingDoc = Awaited<ReturnType<typeof getPendingDocuments>>[number];

function prettifyDocType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// Groups by coach — the closest thing to a "school/team" label the current
// document shape carries. If a dedicated school_name field exists elsewhere
// in your schema, swap `doc.coach_name` below for that and this whole
// grouping upgrades for free.
function groupDocuments(documents: PendingDoc[]) {
  const teams = new Map<string, Map<string, PendingDoc[]>>();

  for (const doc of documents) {
    const teamKey = doc.coach_name || 'Unassigned';
    const athleteKey = doc.athlete_name || 'Unknown Athlete';
    if (!teams.has(teamKey)) teams.set(teamKey, new Map());
    const athletes = teams.get(teamKey)!;
    if (!athletes.has(athleteKey)) athletes.set(athleteKey, []);
    athletes.get(athleteKey)!.push(doc);
  }

  return Array.from(teams.entries()).map(([teamName, athleteMap]) => ({
    teamName,
    totalDocs: Array.from(athleteMap.values()).reduce((sum, docs) => sum + docs.length, 0),
    athletes: Array.from(athleteMap.entries()).map(([athleteName, docs]) => ({ athleteName, docs })),
  }));
}

export default function PendingReviews() {
  const { user } = useAuthStore();
  const reviewerId = user?.id || '';
  const queryClient = useQueryClient();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [search, setSearch] = useState('');
  const [collapsedTeams, setCollapsedTeams] = useState<Set<string>>(new Set());

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['pendingDocuments'],
    queryFn: getPendingDocuments,
  });

  const verifyMutation = useMutation({
    mutationFn: (documentId: string) => verifyDocument(documentId, reviewerId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pendingDocuments'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectDocument(rejectingId as string, reviewerId, rejectNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingDocuments'] });
      setRejectingId(null);
      setRejectNotes('');
    },
  });

  const handleView = async (storagePath: string) => {
    const url = await getSignedUrl(storagePath);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const filteredDocuments = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return documents;
    return documents.filter(
      (doc) =>
        doc.athlete_name?.toLowerCase().includes(q) ||
        doc.coach_name?.toLowerCase().includes(q)
    );
  }, [documents, search]);

  const teamGroups = useMemo(() => groupDocuments(filteredDocuments), [filteredDocuments]);
  const athleteCount = useMemo(() => new Set(filteredDocuments.map((d) => d.athlete_name)).size, [filteredDocuments]);

  const toggleTeam = (teamName: string) => {
    setCollapsedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(teamName)) next.delete(teamName);
      else next.add(teamName);
      return next;
    });
  };

  return (
    <div className="animate-in fade-in duration-300">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-800">Pending Reviews</h2>
          <p className="text-slate-500 text-sm mt-1">
            {documents.length} {documents.length === 1 ? 'document' : 'documents'} awaiting verification
            {athleteCount > 0 && ` across ${athleteCount} ${athleteCount === 1 ? 'athlete' : 'athletes'}`}
          </p>
        </div>
        <div className="relative w-full sm:w-72 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search athlete or team…"
            className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-shadow"
          />
        </div>
      </header>

      {isLoading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 flex items-center justify-center text-sm text-slate-400 gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
            <Inbox className="w-5 h-5 text-slate-300" />
          </div>
          <p className="text-sm font-semibold text-slate-600">
            {search ? 'No matches found' : 'Nothing pending review'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {search ? 'Try a different athlete or team name.' : "You're fully caught up."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {teamGroups.map((team) => {
            const isCollapsed = collapsedTeams.has(team.teamName);
            return (
              <div key={team.teamName} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <button
                  onClick={() => toggleTeam(team.teamName)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{team.teamName}</p>
                      <p className="text-xs text-slate-400">
                        {team.athletes.length} {team.athletes.length === 1 ? 'athlete' : 'athletes'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                      {team.totalDocs} pending
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                  </div>
                </button>

                {!isCollapsed && (
                  <div className="divide-y divide-slate-50 border-t border-slate-50">
                    {team.athletes.map((athlete) => (
                      <div key={athlete.athleteName} className="px-5 py-4">
                        <div className="flex items-center gap-2.5 mb-3">
                          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-[10px] font-bold uppercase shrink-0">
                            {athlete.athleteName.charAt(0)}
                          </div>
                          <p className="text-sm font-semibold text-slate-700">{athlete.athleteName}</p>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                            {athlete.docs.length} {athlete.docs.length === 1 ? 'doc' : 'docs'}
                          </span>
                        </div>

                        <ul className="space-y-2 pl-9.5 sm:pl-10">
                          {athlete.docs.map((doc) => {
                            const isVerifying = verifyMutation.isPending && verifyMutation.variables === doc.id;
                            const isRejectingThis = rejectMutation.isPending && rejectingId === doc.id;
                            return (
                              <li key={doc.id} className="bg-slate-50/60 border border-slate-100 rounded-xl p-3">
                                <div className="flex items-center justify-between gap-4">
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-700">{prettifyDocType(doc.document_type)}</p>
                                    <p className="text-[11px] text-slate-400 truncate">{doc.original_filename}</p>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      onClick={() => handleView(doc.storage_path)}
                                      title="View document"
                                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => verifyMutation.mutate(doc.id)}
                                      disabled={isVerifying}
                                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-60 rounded-lg transition-colors"
                                    >
                                      {isVerifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                      Verify
                                    </button>
                                    <button
                                      onClick={() => setRejectingId(rejectingId === doc.id ? null : doc.id)}
                                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                    >
                                      <XCircle className="w-3.5 h-3.5" /> Reject
                                    </button>
                                  </div>
                                </div>

                                {rejectingId === doc.id && (
                                  <div className="mt-3 flex gap-2">
                                    <input
                                      value={rejectNotes}
                                      onChange={(e) => setRejectNotes(e.target.value)}
                                      placeholder="Reason for rejection…"
                                      autoFocus
                                      className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-shadow"
                                    />
                                    <button
                                      onClick={() => rejectMutation.mutate()}
                                      disabled={isRejectingThis}
                                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 rounded-lg transition-colors"
                                    >
                                      {isRejectingThis && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                      Confirm
                                    </button>
                                    <button
                                      onClick={() => { setRejectingId(null); setRejectNotes(''); }}
                                      className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
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