import { useQuery } from '@tanstack/react-query';
import { listEvents } from '../../../3-data-tier/services/eventService';
import { EventCalendar } from '../../components/calendar/EventCalendar';

export default function AthleteScheduleView() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['visibleEvents'],
    queryFn: () => listEvents(),
    staleTime: 30_000,
  });

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Team Schedule</h2>
        <p className="text-slate-500 text-sm mt-1">
          View-only — your coach manages events, meetings, and deadlines.
        </p>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <EventCalendar
          events={events}
          isLoading={isLoading}
          canManage={false}
          onMonthChange={() => {}}
        />
      </div>
    </div>
  );
}