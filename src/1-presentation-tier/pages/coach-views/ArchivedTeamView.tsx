import { useState, useEffect } from 'react';
import { Users, RotateCcw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../2-application-tier/stores/authStore';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { teamApi } from '../../../3-data-tier/api/teamApi';
import { supabase } from '../../../3-data-tier/config/SupabaseClient';

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

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-700 flex items-center gap-2">
            <Users className="w-4 h-4" /> {archivedAthletes.length} Archived
          </h3>
        </div>

       <div className="overflow-x-auto p-6 pt-2">
  {isLoading ? (
    <table className="w-full text-left border-collapse min-w-[600px]">
      <tbody>
        {Array.from({ length: 5 }).map((_, i) => (
          <tr key={i} className="border-b border-slate-100 animate-pulse">
            <td className="py-3 pl-2">
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 bg-slate-200 rounded-full shrink-0" />
                <div>
                  <div className="h-4 bg-slate-200 rounded w-24 mb-1.5" />
                  <div className="h-2.5 bg-slate-200 rounded w-32" />
                </div>
              </div>
            </td>
            <td className="py-3 align-middle">
              <div className="h-3.5 bg-slate-200 rounded w-20 mx-auto" />
            </td>
            <td className="py-3 pr-2 align-middle">
              <div className="w-20 h-8 bg-slate-200 rounded-lg ml-auto" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
          ) : (
            <table className="w-full text-left border-collapse min-w-[600px]">
              <caption className="sr-only">Athletes archived for exceeding the PRISAA age limit</caption>
              <thead>
                <tr className="border-b-2 border-slate-100 text-sm text-slate-800">
                  <th scope="col" className="pb-3 font-bold pl-2">Athlete</th>
                  <th scope="col" className="pb-3 font-bold text-center w-1/4">Date of Birth</th>
                  <th scope="col" className="pb-3 pr-2 w-1/5"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {archivedAthletes.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-10 text-center">
                      <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" aria-hidden="true" />
                      <p className="text-sm text-slate-400">No archived athletes. Everyone on your roster is currently active.</p>
                    </td>
                  </tr>
                ) : (
                  archivedAthletes.map((member) => (
                    <tr key={member.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
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
                      <td className="py-3 text-sm font-medium text-slate-600 text-center align-middle">
                        {member.date_of_birth ?? '—'}
                      </td>
                      <td className="py-3 pr-2 text-right align-middle">
                        <button
                          onClick={() => setRestoreTarget({ id: member.id, name: member.name })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 active:scale-[0.97] text-blue-700 text-xs font-bold rounded-lg transition-[background-color,transform] border border-blue-100"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Restore
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

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