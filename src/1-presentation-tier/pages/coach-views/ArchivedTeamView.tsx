import { useEffect, useMemo, useState } from 'react';
import { Users, RotateCcw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../2-application-tier/stores/authStore';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { teamApi, type TeamMember } from '../../../3-data-tier/api/teamApi';
import { supabase } from '../../../3-data-tier/config/SupabaseClient';

const DIVISION_ORDER = ['elementary', 'highschool', 'tertiary'] as const;
const DIVISION_LABELS: Record<string, string> = {
  elementary: 'Elementary',
  highschool: 'High School',
  tertiary: 'Tertiary',
};

function DivisionCard({
  label,
  athletes,
  onRestore,
}: {
  label: string;
  athletes: TeamMember[];
  onRestore: (target: { id: string; name: string }) => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-bold text-slate-700 text-sm flex items-center justify-between">
          <span>{label}</span>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{athletes.length}</span>
        </h3>
      </div>

      <div className="p-4 space-y-2 flex-1">
        {athletes.length === 0 ? (
          <div className="py-8 text-center">
            <Users className="w-6 h-6 text-slate-300 mx-auto mb-2" aria-hidden="true" />
            <p className="text-xs text-slate-400">No archived {label.toLowerCase()} athletes.</p>
          </div>
        ) : (
          athletes.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between gap-2 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 bg-slate-200 rounded-full shrink-0 flex items-center justify-center text-slate-500 text-xs font-bold uppercase">
                  {member.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{member.name}</p>
                  <p className="text-[11px] text-slate-400">{member.date_of_birth ?? '—'}</p>
                </div>
              </div>
              <button
                onClick={() => onRestore({ id: member.id, name: member.name })}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 active:scale-[0.97] text-blue-700 text-[11px] font-bold rounded-lg transition-[background-color,transform] border border-blue-100 shrink-0"
              >
                <RotateCcw className="w-3 h-3" /> Restore
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function DivisionCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <div className="h-4 bg-slate-200 rounded w-24 animate-pulse" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
            <div className="w-9 h-9 bg-slate-200 rounded-full shrink-0" />
            <div className="flex-1">
              <div className="h-3.5 bg-slate-200 rounded w-20 mb-1.5" />
              <div className="h-2.5 bg-slate-200 rounded w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ArchivedTeamView() {
  const { user } = useAuthStore();
  const currentUserId = user?.id || '';
  const queryClient = useQueryClient();

  const [restoreTarget, setRestoreTarget] = useState<{ id: string; name: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const { data: archivedAthletes = [], isLoading } = useQuery({
    queryKey: ['archivedTeamMembers', currentUserId],
    queryFn: () => teamApi.getArchivedTeamMembers(currentUserId),
    enabled: !!currentUserId,
  });

  const byDivision = useMemo(() => {
    const map: Record<string, TeamMember[]> = { elementary: [], highschool: [], tertiary: [] };
    for (const member of archivedAthletes) {
      if (member.division && map[member.division]) {
        map[member.division].push(member);
      }
    }
    return map;
  }, [archivedAthletes]);

  const restoreMutation = useMutation({
    mutationFn: (athleteId: string) => teamApi.restoreAthlete(athleteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archivedTeamMembers', currentUserId] });
      queryClient.invalidateQueries({ queryKey: ['teamMembers', currentUserId] });
      setRestoreTarget(null);
    },
    onError: (error: any) => {
      setErrorMessage(error?.message || 'Could not restore this athlete.');
      setRestoreTarget(null);
    },
  });

  return (
    <div className="animate-in fade-in duration-300 motion-reduce:animate-none">
      <header className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-slate-800">Archived Athletes</h2>
        <p className="text-slate-500 text-sm mt-1">
          Athletes automatically archived for exceeding the PRISAA age limit. Restore any that were archived by mistake.
        </p>
      </header>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
          {errorMessage}
        </div>
      )}

      {isLoading ? (
        <div className="grid md:grid-cols-3 gap-4">
          {DIVISION_ORDER.map((key) => (
            <DivisionCardSkeleton key={key} />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {DIVISION_ORDER.map((key) => (
            <DivisionCard
              key={key}
              label={DIVISION_LABELS[key]}
              athletes={byDivision[key]}
              onRestore={setRestoreTarget}
            />
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={restoreTarget !== null}
        title="Restore Athlete"
        message={restoreTarget ? `Restore ${restoreTarget.name} to the active roster? This is typically done when the archival was a data-entry mistake.` : ''}
        confirmText="Restore"
        isDestructive={false}
        onConfirm={() => restoreTarget && restoreMutation.mutate(restoreTarget.id)}
        onCancel={() => setRestoreTarget(null)}
      />
    </div>
  );
}