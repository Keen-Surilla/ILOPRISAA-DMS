import React, { useState, useMemo } from 'react';
import { Clock, FileText, X, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../../../2-application-tier/stores/authStore';
import { listEvents, createEvent, updateEvent, deleteEvent, type CalendarEventRow } from '../../../3-data-tier/services/eventService';
import { EventCalendar } from '../../components/calendar/EventCalendar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

type UIEventType = 'event' | 'meeting' | 'deadline';

interface EventFormState {
  title: string;
  date: string;
  time: string;
  type: UIEventType;
  status: 'Pending' | 'Completed';
}

const EMPTY_FORM: EventFormState = { title: '', date: '', time: '', type: 'event', status: 'Pending' };

const EVENT_TYPE_OPTIONS: { value: UIEventType; label: string }[] = [
  { value: 'event', label: 'General Event' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'deadline', label: 'Deadline' },
];

const ACTIVE_PILL_STYLE = "bg-blue-50 text-blue-700 border-blue-600 shadow-sm ring-1 ring-blue-600";
const INACTIVE_PILL_STYLE = "bg-white text-slate-500 border-slate-200 hover:bg-slate-50";

const SIDEBAR_LIST_LIMIT = 5;


function parseLocalDate(dateStr?: string | null): Date {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return new Date(dateStr);
  return new Date(year, month - 1, day);
}

export default function ScheduleView() {
  const authStore = useAuthStore();
  const user = authStore?.user;
  const userId = user?.id;
  const queryClient = useQueryClient();


  const { data: events = [], isLoading, error: fetchError } = useQuery({
    queryKey: ['events', userId],
    queryFn: () => listEvents({ userId }),
    enabled: !!userId,   
    staleTime: 30_000,   
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState<EventFormState>(EMPTY_FORM);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [resolveDeleteConfirm, setResolveDeleteConfirm] = useState<((confirmed: boolean) => void) | null>(null);

 const saveEventMutation = useMutation({
  mutationFn: async ({ eventData, id }: { eventData: EventFormState; id: string | null }) => {
    if (!userId) {
      throw new Error('You must be signed in to save an event. Please refresh and try again.');
    }

    const payload = {
      title: eventData.title,
      event_date: eventData.date,
      event_time: eventData.time,
      type: eventData.type,
      status: eventData.status,
    };

    if (id) {
      return await updateEvent(id, userId, payload);
    }
    return await createEvent({ ...payload, user_id: userId });
  },
  onMutate: async ({ eventData, id }) => {
    await queryClient.cancelQueries({ queryKey: ['events', userId] });
    const previousEvents = queryClient.getQueryData(['events', userId]);
    queryClient.setQueryData(['events', userId], (old: any) => {
      const patch = {
        title: eventData.title,
        event_date: eventData.date,
        event_time: eventData.time,
        type: eventData.type,
        status: eventData.status,
        user_id: userId
      };
      if (id) {
        // Preserve existing fields during optimistic update
        return old?.map((e: any) => e.id === id ? { ...e, ...patch } : e);
      } else {
        return [...(old || []), { id: `temp-${Date.now()}`, ...patch }];
      }
    });
    setIsModalOpen(false);
    setEditingId(null);
    setNewEvent(EMPTY_FORM);
    return { previousEvents };
  },
  onError: (error: any, _newTodo, context) => {
    if (context?.previousEvents) {
      queryClient.setQueryData(['events', userId], context.previousEvents);
    }
    setErrorMessage(error?.message || "The database was too slow. Event didn't save.");
    setIsModalOpen(true);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['events', userId] });
  }
});

  const deleteEventMutation = useMutation({
    mutationFn: (id: string) => {
      if (!userId) {
        throw new Error('You must be signed in to delete an event.');
      }
      return deleteEvent(id, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', userId] });
    },
    onError: (error: any) => {
      setErrorMessage(error?.message || "Couldn't delete that event. Please try again.");
    }
  });

  const handleOpenNew = () => {
    if (!userId) {
      setErrorMessage('You must be signed in to add an event.');
      return;
    }
    setEditingId(null);
    setNewEvent(EMPTY_FORM);
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  function toUIEventType(value: string): UIEventType {
  return (EVENT_TYPE_OPTIONS.some(opt => opt.value === value) ? value : 'event') as UIEventType;
}

   function toUIStatus(value: string): 'Pending' | 'Completed' {
  return value === 'Completed' ? 'Completed' : 'Pending';
}

const handleEditEvent = (eventToEdit: CalendarEventRow) => {
  setEditingId(eventToEdit.id);
  setNewEvent({
    title: eventToEdit.title,
    date: eventToEdit.event_date,
    time: eventToEdit.event_time,
    type: toUIEventType(eventToEdit.type),
    status: toUIStatus(eventToEdit.status)
  });
  setErrorMessage(null);
  setIsModalOpen(true);
};


  const handleSaveEvent = (e: React.FormEvent) => {
  e.preventDefault();
  setErrorMessage(null);
  saveEventMutation.mutate({ eventData: newEvent, id: editingId });
};

  const handleDeleteFromCalendar = async (eventId: string): Promise<boolean> => {
    setPendingDeleteId(eventId);
    const confirmed = await new Promise<boolean>((resolve) => {
      setResolveDeleteConfirm(() => resolve);
    });
    setPendingDeleteId(null);
    setResolveDeleteConfirm(null);

    if (!confirmed) return false;

    try {
      await deleteEventMutation.mutateAsync(eventId);
      return true;
    } catch {
      return false;
    }
  };

  const eventPendingDelete = pendingDeleteId
    ? events.find((e: any) => e.id === pendingDeleteId)
    : null;

  const [showAllEvents, setShowAllEvents] = useState(false);
  const [showAllDeadlines, setShowAllDeadlines] = useState(false);

  const { upcomingEvents, upcomingDeadlines } = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const isUpcoming = (e: CalendarEventRow) => !!e?.event_date && parseLocalDate(e.event_date) >= startOfToday;
    const byDateAsc = (a: CalendarEventRow, b: CalendarEventRow) =>
      parseLocalDate(a?.event_date).getTime() - parseLocalDate(b?.event_date).getTime();

    return {
      upcomingEvents: events.filter((e: any) => e?.type === 'event').filter(isUpcoming).sort(byDateAsc),
      upcomingDeadlines: events.filter((e: any) => e?.type === 'deadline').filter(isUpcoming).sort(byDateAsc),
    };
  }, [events]);

  const visibleEvents = showAllEvents ? upcomingEvents : upcomingEvents.slice(0, SIDEBAR_LIST_LIMIT);
  const visibleDeadlines = showAllDeadlines ? upcomingDeadlines : upcomingDeadlines.slice(0, SIDEBAR_LIST_LIMIT);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <header className="flex justify-between items-end">
          <div className="h-8 bg-slate-200 rounded-md w-48"></div>
          <div className="h-10 w-36 bg-slate-200 rounded-md"></div>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-xl h-[500px] border border-slate-200"></div>
          <div className="lg:col-span-1 bg-white rounded-xl h-64 border border-slate-200"></div>
        </div>
      </div>
    );
  }

  const activePillStyle = ACTIVE_PILL_STYLE;
  const inactivePillStyle = INACTIVE_PILL_STYLE;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-800">Your Schedule</h2>
          <p className="text-slate-500 text-sm mt-1">Manage your events, games, and document deadlines.</p>
        </div>
        <button
          onClick={handleOpenNew}
          disabled={!userId}
         className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm"       >
          Add Event
        </button>
      </header>

      {!userId && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-lg">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Your session isn't fully loaded yet, so events can't be added or edited right now. Try refreshing the page.
        </div>
      )}

      {/* ✅ ADDED: The UI Banner that instantly shows you if the database blocks the fetch! */}
      {fetchError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-lg">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          Failed to load calendar events: {fetchError instanceof Error ? fetchError.message : String(fetchError)}
        </div>
      )}

      {errorMessage && !isModalOpen && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <EventCalendar
            events={events}
            isLoading={isLoading}
            onMonthChange={(_y, _m) => {}}
            canManage={!!userId}
            onDelete={handleDeleteFromCalendar}
            onEdit={handleEditEvent}
          />
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-800 text-sm mb-5">Upcoming Events</h3>
            <ul className="space-y-4 max-h-[250px] overflow-y-auto pr-2">
              {upcomingEvents.length === 0 && <p className="text-xs text-slate-400">No upcoming events.</p>}
              {visibleEvents.map((evt: any) => {
                const startDate = parseLocalDate(evt?.event_date);
                return (
                <li
                  key={evt.id}
                  className="flex gap-4 items-start p-2 rounded-lg -ml-2 hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => handleEditEvent(evt)}
                >
                  <div className="bg-[#0f172a] text-white rounded-md w-11 h-11 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[9px] font-semibold uppercase text-slate-300">
                      {startDate.toLocaleString('en-US', { month: 'short' })}
                    </span>
                    <span className="text-sm font-bold leading-none mt-0.5">
                      {startDate.getDate()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-slate-700">{evt?.title}</h4>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                      <Clock className="w-3 h-3" /> {evt?.event_time}
                    </div>
                  </div>
                </li>
              )})}
            </ul>
            {upcomingEvents.length > SIDEBAR_LIST_LIMIT && (
              <button
                type="button"
                onClick={() => setShowAllEvents(v => !v)}
                className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                {showAllEvents ? 'Show less' : `See all (${upcomingEvents.length})`}
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-800 text-sm mb-5">Upcoming Deadlines</h3>
            <ul className="space-y-4 max-h-[250px] overflow-y-auto pr-2">
              {upcomingDeadlines.length === 0 && <p className="text-xs text-slate-400">No deadlines.</p>}
              {visibleDeadlines.map((deadline: any) => {
                 const startDate = parseLocalDate(deadline?.event_date);
                 return (
                <li
                  key={deadline.id}
                  className="flex flex-col gap-1 p-2 rounded-lg -ml-2 hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => handleEditEvent(deadline)}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-700 truncate max-w-[120px]">{deadline?.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 ml-7">
                    Due: {startDate.toLocaleDateString()} at {deadline?.event_time}
                  </span>
                </li>
              )})}
            </ul>
            {upcomingDeadlines.length > SIDEBAR_LIST_LIMIT && (
              <button
                type="button"
                onClick={() => setShowAllDeadlines(v => !v)}
                className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                {showAllDeadlines ? 'Show less' : `See all (${upcomingDeadlines.length})`}
              </button>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">{editingId ? 'Edit Event' : 'Add New Event'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>

            <form onSubmit={handleSaveEvent} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Title</span>
                  <span className={newEvent.title.length > 100 ? 'text-amber-600' : 'text-slate-400'}>
                    {newEvent.title.length}/120
                  </span>
                </label>
                <input type="text" required maxLength={120} value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-600" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                  <input type="date" required value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-600" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Time</label>
                  <input type="time" required value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-600 bg-white" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Event Type</label>
                <div className="flex flex-wrap gap-2">
                  {EVENT_TYPE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setNewEvent({ ...newEvent, type: opt.value })}
                      className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                        newEvent.type === opt.value ? activePillStyle : inactivePillStyle
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-3 justify-end items-center border-t border-slate-100 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button
                  type="submit"
                  disabled={saveEventMutation.isPending}
                  className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-md shadow-blue-600/20"
                >
                  {saveEventMutation.isPending ? 'Saving…' : (editingId ? 'Update Schedule' : 'Save Schedule')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pendingDeleteId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Delete this event?</h3>
              </div>
              <p className="text-xs text-slate-500">
                {eventPendingDelete?.title ? `"${eventPendingDelete.title}"` : 'This event'} will be permanently removed. This can't be undone.
              </p>
            </div>
            <div className="px-6 pb-6 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => resolveDeleteConfirm?.(false)}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => resolveDeleteConfirm?.(true)}
                disabled={deleteEventMutation.isPending}
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg shadow-md shadow-red-600/20"
              >
                {deleteEventMutation.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}