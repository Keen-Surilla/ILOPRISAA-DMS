import { useState, useEffect } from 'react';
import { calendarApi, type CalendarEvent } from '../../3-data-tier/api/calendarApi';
import { supabase } from '../../3-data-tier/config/SupabaseClient';

export function useEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvents = async () => {
    setIsLoading(true);
    const data = await calendarApi.getEvents();
    setEvents(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchEvents();

    // Make the calendar Real-Time!
    const subscription = supabase
      .channel('public:events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        fetchEvents(); // Refresh data instantly when DB changes
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return { events, isLoading, refreshEvents: fetchEvents };
}