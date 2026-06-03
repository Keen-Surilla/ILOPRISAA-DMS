import { useEffect, useState } from 'react';
import { Calendar, CheckCircle, Shield } from 'lucide-react';
import { useAuthStore } from '../../2-application-tier/stores/authStore';
import { useCommitteeQueue } from '../../2-application-tier/hooks/useCoachRoster';
import { useDocuments } from '../../2-application-tier/hooks/useDocuments';
import { useEvents } from '../../2-application-tier/hooks/useEvents';
import { PortalShell } from '../components/layout/PortalShell';
import { DocumentList } from '../components/DocumentComponents';
import { EventCalendar, type NewEventInput } from '../components/calendar/EventCalendar';
import type { DocumentStatus } from '../../3-data-tier/types/database.types';

export default function CommitteeDashboard() {
  const { user, role } = useAuthStore();
  const [tab, setTab] = useState<'calendar' | 'eligibility'>('calendar');
  const queue = useCommitteeQueue();
  const { reviewDocument, downloadDocument, clearError, error: docError } = useDocuments();
  const events = useEvents();

  useEffect(() => {
    if (tab === 'eligibility') void queue.loadQueue();
  }, [tab, queue.loadQueue]);

  const handleStatusChange = async (documentId: string, newStatus: DocumentStatus) => {
    if (!user) return;
    for (const group of queue.queue) {
      const doc = group.documents.find((d) => d.id === documentId);
      if (doc) {
        await reviewDocument(
          { documentId, newStatus, reviewerId: user.id },
          {
            actorRole: role ?? 'committee',
            digitalSignature: doc.digital_signature,
            reviewerId: user.id,
            hasRequiredMetadata: true,
          },
        );
        await queue.loadQueue();
        return;
      }
    }
  };

  const handleCreateEvent = async (input: NewEventInput) => {
    if (!user) return false;
    return events.addEvent({
      title: input.title,
      description: input.description || undefined,
      event_kind: input.event_kind,
      starts_at: new Date(input.starts_at).toISOString(),
      ends_at: input.ends_at ? new Date(input.ends_at).toISOString() : null,
      created_by: user.id,
    });
  };

  return (
    <PortalShell
      portalTitle="Committee Portal"
      navItems={[
        {
          id: 'calendar',
          label: 'Event Calendar',
          icon: <Calendar className="w-5 h-5" />,
          active: tab === 'calendar',
          onClick: () => setTab('calendar'),
        },
        {
          id: 'eligibility',
          label: 'Eligibility Review',
          icon: <CheckCircle className="w-5 h-5" />,
          active: tab === 'eligibility',
          onClick: () => setTab('eligibility'),
        },
      ]}
    >
      <div className="p-8 space-y-8 max-w-6xl">
        <header className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-purple-600" />
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Committee</h2>
            <p className="text-slate-500 text-sm">Manage deadlines and confirm athlete eligibility.</p>
          </div>
        </header>

        {(queue.error || docError || events.error) && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {queue.error || docError || events.error}
            <button type="button" className="ml-2 font-bold" onClick={() => { queue.clearError(); clearError(); events.clearError(); }}>×</button>
          </div>
        )}

        {tab === 'calendar' && (
          <EventCalendar
            events={events.events}
            isLoading={events.isLoading}
            canManage
            onMonthChange={(y, m) => void events.loadMonth(y, m)}
            onCreate={handleCreateEvent}
            onDelete={(id) => events.removeEvent(id)}
          />
        )}

        {tab === 'eligibility' && (
          <div className="space-y-6">
            <p className="text-sm text-slate-600">
              Athletes with documents reviewed by coaches awaiting committee eligibility decision.
            </p>
            {queue.isLoading && <p className="text-slate-400">Loading queue…</p>}
            {queue.queue.length === 0 && !queue.isLoading && (
              <p className="text-slate-500">No pending eligibility reviews.</p>
            )}
            {queue.queue.map(({ profile, documents }) => (
              <div key={profile.id} className="bg-white border border-slate-200 rounded-xl p-6">
                <h4 className="font-semibold text-slate-800 mb-4">{profile.full_name}</h4>
                <DocumentList
                  documents={documents}
                  actorRole="committee"
                  isLoading={false}
                  onDownload={downloadDocument}
                  onStatusChange={handleStatusChange}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalShell>
  );
}
