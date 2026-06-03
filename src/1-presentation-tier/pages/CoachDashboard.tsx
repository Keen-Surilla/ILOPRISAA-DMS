import { useEffect } from 'react';
import { Calendar, ClipboardList, Users } from 'lucide-react';
import { useAuthStore } from '../../2-application-tier/stores/authStore';
import { useCoachRoster } from '../../2-application-tier/hooks/useCoachRoster';
import { useDocuments } from '../../2-application-tier/hooks/useDocuments';
import { useEvents } from '../../2-application-tier/hooks/useEvents';
import { PortalShell } from '../components/layout/PortalShell';
import { DocumentList } from '../components/DocumentComponents';
import { EventCalendar } from '../components/calendar/EventCalendar';
import type { DocumentStatus } from '../../3-data-tier/types/database.types';

export default function CoachDashboard() {
  const { user, role } = useAuthStore();
  const roster = useCoachRoster(user?.id);
  const { reviewDocument, downloadDocument, clearError, error: docError } = useDocuments();
  const events = useEvents();

  useEffect(() => {
    void roster.loadAthletes();
  }, [roster.loadAthletes]);

  useEffect(() => {
    if (roster.selectedAthleteId) void roster.loadDocuments(roster.selectedAthleteId);
  }, [roster.selectedAthleteId, roster.loadDocuments]);

  const handleStatusChange = async (documentId: string, newStatus: DocumentStatus) => {
    if (!user) return;
    const doc = roster.documents.find((d) => d.id === documentId);
    if (!doc) return;
    await reviewDocument(
      { documentId, newStatus, reviewerId: user.id },
      {
        actorRole: role ?? 'coach',
        digitalSignature: doc.digital_signature,
        reviewerId: user.id,
        hasRequiredMetadata: true,
      },
    );
    if (roster.selectedAthleteId) await roster.selectAthlete(roster.selectedAthleteId);
  };

  return (
    <PortalShell
      portalTitle="Coach Portal"
      navItems={[
        { id: 'roster', label: 'My Athletes', icon: <Users className="w-5 h-5" />, active: true, onClick: () => {} },
        { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-5 h-5" />, active: false, onClick: () => {} },
      ]}
    >
      <div className="p-8 space-y-8 max-w-6xl">
        <header>
          <h2 className="text-2xl font-bold text-slate-900">Coach Review</h2>
          <p className="text-slate-500 text-sm mt-1">Review submissions from your assigned athletes.</p>
        </header>

        {(roster.error || docError) && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex justify-between">
            <span>{roster.error || docError}</span>
            <button type="button" onClick={() => { roster.clearError(); clearError(); }}>×</button>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-4">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <ClipboardList className="w-4 h-4" /> Athletes
            </h3>
            {roster.isLoading && <p className="text-sm text-slate-400">Loading…</p>}
            <ul className="space-y-1 max-h-64 overflow-y-auto">
              {roster.athletes.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => roster.selectAthlete(a.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                      roster.selectedAthleteId === a.id ? 'bg-blue-100 text-blue-800' : 'hover:bg-slate-50'
                    }`}
                  >
                    {a.full_name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-2">
            <DocumentList
              documents={roster.documents}
              actorRole="coach"
              isLoading={roster.isLoading}
              onDownload={downloadDocument}
              onStatusChange={handleStatusChange}
            />
          </div>
        </div>

        <section>
          <h3 className="text-lg font-bold text-slate-800 mb-4">PRISAA Schedule</h3>
          <EventCalendar
            events={events.events}
            isLoading={events.isLoading}
            onMonthChange={(y, m) => void events.loadMonth(y, m)}
          />
        </section>
      </div>
    </PortalShell>
  );
}
