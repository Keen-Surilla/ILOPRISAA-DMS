import { useState } from 'react';
import { FileText, Lock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../2-application-tier/stores/authStore';
import { teamApi } from '../../../3-data-tier/api/teamApi';
import { documentsApi, TOTAL_REQUIRED_DOCUMENTS } from '../../../3-data-tier/api/documentsApi';
import { DocumentChecklistModal } from '../../components/ui/DocumentChecklistModal';

// Circular completion ring around the athlete's own avatar — the one visual
// element in this list that's actually earned by data (their document
// progress), rather than decoration for its own sake.
function RosterAvatar({ initial, percent }: { initial: string; percent: number | null }) {
  if (percent === null) {
    return (
      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-bold uppercase shrink-0">
        {initial}
      </div>
    );
  }

  const radius = 19;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference;
  const ringColor = percent >= 100 ? '#059669' : '#2563eb';

  return (
    <div className="relative w-11 h-11 shrink-0">
      <svg className="w-11 h-11 -rotate-90" viewBox="0 0 44 44" aria-hidden="true">
        <circle cx="22" cy="22" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="2.5" />
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-8 h-8 bg-[#0f172a] rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-[10px] uppercase">{initial}</span>
        </div>
      </div>
    </div>
  );
}

export default function AthleteTeamView() {
  const { user } = useAuthStore();
  // The athlete's own auth id — RLS on team_members only returns rows where
  // this matches user_id (their own) or shares the same coach_id (teammates).
  const myUserId = user?.id;

  const { data: teammates = [], isLoading } = useQuery({
    queryKey: ['myRoster', myUserId],
    queryFn: () => teamApi.getTeamMembersForViewer(),
    enabled: !!myUserId,
  });

  // Identify which roster row is "me" so only that one gets a working
  // documents button — everyone else's stays visibly locked.
  const myRow = teammates.find(t => t.user_id === myUserId);

  const { data: myDocCount = 0 } = useQuery({
    queryKey: ['documentCounts', 'self', myRow?.id],
    queryFn: async () => {
      if (!myRow) return 0;
      const counts = await documentsApi.getDocumentCountsForAthletes([myRow.id]);
      return counts[myRow.id] ?? 0;
    },
    enabled: !!myRow,
  });

  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const myPercent = TOTAL_REQUIRED_DOCUMENTS > 0 ? Math.round((myDocCount / TOTAL_REQUIRED_DOCUMENTS) * 100) : 0;

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto animate-pulse space-y-3">
        <div className="h-8 bg-slate-200 rounded-md w-40" />
        <div className="h-40 bg-white border border-slate-200 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="flex items-end justify-between gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">My Team</h2>
          <p className="text-slate-500 text-sm mt-1 max-w-md">
            Your roster and your own document status. Teammates' files stay private to them.
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-400 whitespace-nowrap pb-1">
          {teammates.length} {teammates.length === 1 ? 'athlete' : 'athletes'}
        </span>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
        {teammates.map(member => {
          const isMe = member.id === myRow?.id;
          return (
            <div
              key={member.id}
              className={`flex items-center justify-between gap-4 px-4 py-2.5 transition-colors ${isMe ? 'bg-blue-50/40' : 'hover:bg-slate-50/80'}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <RosterAvatar initial={member.name.charAt(0)} percent={isMe ? myPercent : null} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate flex items-center gap-1.5">
                    {member.name}
                    {isMe && (
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full shrink-0">You</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{member.role}</p>
                </div>
              </div>

              {isMe ? (
                <button
                  onClick={() => setIsDocsOpen(true)}
                  className="group flex items-center gap-3 pl-3 pr-3.5 py-2 rounded-xl border border-blue-100 bg-white hover:border-blue-200 hover:shadow-sm transition-all shrink-0"
                >
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs font-bold text-blue-700">{myDocCount}/{TOTAL_REQUIRED_DOCUMENTS} documents</span>
                    <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${myPercent >= 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                        style={{ width: `${myPercent}%` }}
                      />
                    </div>
                  </div>
                  <FileText className="w-4 h-4 text-blue-500 group-hover:text-blue-700 transition-colors shrink-0" />
                </button>
              ) : (
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 text-slate-400 text-xs font-medium shrink-0"
                  title="Private to this athlete"
                >
                  <Lock className="w-3 h-3" /> Private
                </span>
              )}
            </div>
          );
        })}
      </div>

      <DocumentChecklistModal
        isOpen={isDocsOpen}
        athleteId={myRow?.id ?? null}
        athleteName="My Documents"
        readOnly
        onClose={() => setIsDocsOpen(false)}
      />
    </div>
  );
}