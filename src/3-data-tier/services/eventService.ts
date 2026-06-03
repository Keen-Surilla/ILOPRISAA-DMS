import { supabase } from '../config/SupabaseClient';
import type { CalendarEvent, CalendarEventInsert, EventKind } from '../types/database.types';

export class EventServiceError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'EventServiceError';
    this.code = code;
  }
}

export interface EventDateRange {
  from: string;
  to: string;
}

export async function listEventsInRange(range: EventDateRange): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .gte('starts_at', range.from)
    .lte('starts_at', range.to)
    .order('starts_at', { ascending: true });

  if (error) {
    throw new EventServiceError('Could not load calendar events.', 'FETCH_FAILED');
  }
  return data ?? [];
}

export interface CreateEventPayload {
  title: string;
  description?: string;
  event_kind: EventKind;
  starts_at: string;
  ends_at?: string | null;
  created_by: string;
}

export async function createEvent(payload: CreateEventPayload): Promise<CalendarEvent> {
  const row: CalendarEventInsert = {
    title: payload.title,
    description: payload.description ?? null,
    event_kind: payload.event_kind,
    starts_at: payload.starts_at,
    ends_at: payload.ends_at ?? null,
    created_by: payload.created_by,
  };

  const { data, error } = await supabase.from('calendar_events').insert(row).select().single();
  if (error || !data) {
    throw new EventServiceError('Could not create event.', 'INSERT_FAILED');
  }
  return data;
}

export async function deleteEvent(eventId: string): Promise<void> {
  const { error } = await supabase.from('calendar_events').delete().eq('id', eventId);
  if (error) {
    throw new EventServiceError('Could not delete event.', 'DELETE_FAILED');
  }
}
