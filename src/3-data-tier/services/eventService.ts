import { supabase } from '../config/SupabaseClient';
import type { Database } from '../types/database.types';
import { withAuthRetry } from '../../2-application-tier/utils/withAuthRetry';

export class EventServiceError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'EventServiceError';
    this.code = code;
  }
}

// Derived from the single source of truth instead of a hand-duplicated interface,
// so this can never silently drift from the real DB schema.
export type CalendarEventRow = Database['public']['Tables']['events']['Row'];

const EVENT_COLUMNS = 'id, title, event_date, event_time, type, status, user_id, created_at';

const MAX_TITLE_LENGTH = 120;
const VALID_TYPES = ['event', 'deadline', 'meeting'] as const;
const VALID_STATUSES = ['Pending', 'Completed'] as const;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/;


function sanitizeTitle(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  if (!trimmed) {
    throw new EventServiceError('Title is required.', 'VALIDATION_FAILED');
  }
  if (trimmed.length > MAX_TITLE_LENGTH) {
    throw new EventServiceError(`Title must be ${MAX_TITLE_LENGTH} characters or fewer.`, 'VALIDATION_FAILED');
  }
  return trimmed;
}

function assertValidDate(value: string): void {
  if (!DATE_RE.test(value) || Number.isNaN(new Date(value).getTime())) {
    throw new EventServiceError('Invalid event date.', 'VALIDATION_FAILED');
  }
}

function assertValidTime(value: string): void {
  if (!TIME_RE.test(value)) {
    throw new EventServiceError('Invalid event time.', 'VALIDATION_FAILED');
  }
}

function assertValidType(value: string): asserts value is (typeof VALID_TYPES)[number] {
  if (!VALID_TYPES.includes(value as any)) {
    throw new EventServiceError('Invalid event type.', 'VALIDATION_FAILED');
  }
}

function assertValidStatus(value: string): asserts value is (typeof VALID_STATUSES)[number] {
  if (!VALID_STATUSES.includes(value as any)) {
    throw new EventServiceError('Invalid event status.', 'VALIDATION_FAILED');
  }
}


function handleDbError(context: string, code: string, error: unknown): never {
  console.error(`[eventService] ${context}:`, error);

  const message = (error as { message?: string })?.message ?? '';
  if (message.includes('RATE_LIMIT_EXCEEDED')) {
    throw new EventServiceError(
      "You're doing that too quickly. Please wait a moment and try again.",
      'RATE_LIMITED'
    );
  }

  throw new EventServiceError(`Could not ${context.toLowerCase()}. Please try again.`, code);
}

const QUERY_TIMEOUT_MS = 15_000;

function withTimeout<T>(operation: () => PromiseLike<T>, timeoutMessage: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new EventServiceError(timeoutMessage, 'TIMEOUT')), QUERY_TIMEOUT_MS);
  });
  return Promise.race([Promise.resolve(operation()), timeout]).finally(() => clearTimeout(timer));
}


export interface ListEventsOptions {
  userId?: string;
  limit?: number;
  offset?: number;
}

export async function listEvents(options: ListEventsOptions = {}): Promise<CalendarEventRow[]> {
  const { userId, limit = 100, offset = 0 } = options;

  let query = supabase
    .from('events')
    .select(EVENT_COLUMNS)
    .order('event_date', { ascending: true })
    .range(offset, offset + limit - 1);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await withAuthRetry(() => withTimeout(
    () => query,
    'Loading events timed out. Please check your connection and try again.'
  ));

  if (error) {
    handleDbError('load events', 'FETCH_FAILED', error);
  }
  return (data ?? []) as CalendarEventRow[];
}


export interface CreateEventPayload {
  title: string;
  event_date: string;
  event_time: string;
  type: 'event' | 'deadline' | 'meeting';
  status?: 'Pending' | 'Completed';
  user_id: string;
}

export async function createEvent(payload: CreateEventPayload): Promise<CalendarEventRow> {
  const title = sanitizeTitle(payload.title);
  assertValidDate(payload.event_date);
  assertValidTime(payload.event_time);
  assertValidType(payload.type);
  if (payload.status) assertValidStatus(payload.status);

  const row = {
    title,
    event_date: payload.event_date,
    event_time: payload.event_time,
    type: payload.type,
    status: payload.status ?? 'Pending',
    user_id: payload.user_id,
  };

  const { data, error } = await withAuthRetry(() => withTimeout(
    () => supabase.from('events').insert(row).select(EVENT_COLUMNS).single(),
    'Saving this event timed out. Please try again.'
  ));

  if (error || !data) {
    handleDbError('create event', 'INSERT_FAILED', error);
  }
  return data as CalendarEventRow;
}

export type UpdateEventPayload = Partial<Omit<CreateEventPayload, 'user_id'>>;

export async function updateEvent(
  eventId: string,
  requestingUserId: string,
  payload: UpdateEventPayload
): Promise<CalendarEventRow> {
  if (payload.title !== undefined) payload.title = sanitizeTitle(payload.title);
  if (payload.event_date !== undefined) assertValidDate(payload.event_date);
  if (payload.event_time !== undefined) assertValidTime(payload.event_time);
  if (payload.type !== undefined) assertValidType(payload.type);
  if (payload.status !== undefined) assertValidStatus(payload.status);

  const { data, error } = await withAuthRetry(() => withTimeout(
    () => supabase
      .from('events')
      .update(payload)
      .eq('id', eventId)
      .eq('user_id', requestingUserId)
      .select(EVENT_COLUMNS)
      .single(),
    'Updating this event timed out. Please try again.'
  ));

  if (error || !data) {
    handleDbError('update event', 'UPDATE_FAILED', error);
  }
  return data as CalendarEventRow;
}

export async function deleteEvent(eventId: string, requestingUserId: string): Promise<void> {
  const { error, count } = await withAuthRetry(() => withTimeout(
    () => supabase
      .from('events')
      .delete({ count: 'exact' })
      .eq('id', eventId)
      .eq('user_id', requestingUserId),
    'Deleting this event timed out. Please try again.'
  ));

  if (error) {
    handleDbError('delete event', 'DELETE_FAILED', error);
  }
  if (!count) {
    throw new EventServiceError('Event not found.', 'NOT_FOUND');
  }
}