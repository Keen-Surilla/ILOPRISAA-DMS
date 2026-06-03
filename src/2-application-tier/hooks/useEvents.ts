import { useCallback, useState } from 'react';
import {
  createEvent,
  deleteEvent,
  listEventsInRange,
  type CreateEventPayload,
} from '../../3-data-tier/services/eventService';
import type { CalendarEvent } from '../../3-data-tier/types/database.types';
import { monthRangeIso } from '../utils/calendarBounds';

export function useEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMonth = useCallback(async (year: number, monthIndex: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const range = monthRangeIso(year, monthIndex);
      const data = await listEventsInRange(range);
      setEvents(data);
    } catch (err) {
      setEvents([]);
      setError(err instanceof Error ? err.message : 'Failed to load events.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addEvent = useCallback(async (payload: CreateEventPayload) => {
    setError(null);
    try {
      const created = await createEvent(payload);
      setEvents((prev) => [...prev, created].sort((a, b) => a.starts_at.localeCompare(b.starts_at)));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event.');
      return false;
    }
  }, []);

  const removeEvent = useCallback(async (eventId: string) => {
    setError(null);
    try {
      await deleteEvent(eventId);
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event.');
      return false;
    }
  }, []);

  return { events, isLoading, error, loadMonth, addEvent, removeEvent, clearError: () => setError(null) };
}
