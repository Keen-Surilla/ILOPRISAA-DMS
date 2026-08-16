import { useState } from 'react';
import { FileText, Lock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../2-application-tier/stores/authStore';
import { teamApi } from '../../../3-data-tier/api/teamApi';
import { documentsApi, TOTAL_REQUIRED_DOCUMENTS } from '../../../3-data-tier/api/documentsApi';
import { DocumentChecklistModal } from '../../components/ui/DocumentChecklistModal';

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

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto animate-pulse space-y-3">
        <div className="h-8 bg-slate-200 rounded-md w-40" />
        <div className="h-40 bg-white border border-slate-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">My Team</h2>
        <p className="text-slate-500 text-sm mt-1">
          You can view your team roster and your own document status. Teammates' files are private to them.
        </p>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] uppercase text-slate-400 border-b border-slate-100 bg-slate-50">
              <th className="py-3 pl-5 font-medium">Athlete</th>
              <th className="py-3 font-medium">Role</th>
              <th className="py-3 pr-5 font-medium text-right">Documents</th>
            </tr>
          </thead>
          <tbody>
            {teammates.map(member => {
              const isMe = member.id === myRow?.id;
              return (
                <tr key={member.id} className="border-b border-slate-50 last:border-0">
                  <td className="py-3 pl-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 text-xs font-bold uppercase shrink-0">
                        {member.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-slate-700">
                        {member.name} {isMe && <span className="text-[10px] text-blue-600 font-bold ml-1">(You)</span>}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 text-sm text-slate-500">{member.role}</td>
                  <td className="py-3 pr-5 text-right">
                    {isMe ? (
                      <button
                        onClick={() => setIsDocsOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg"
                      >
                        <FileText className="w-3.5 h-3.5" /> {myDocCount}/{TOTAL_REQUIRED_DOCUMENTS}
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400" title="Private to this athlete">
                        <Lock className="w-3.5 h-3.5" /> Private
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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