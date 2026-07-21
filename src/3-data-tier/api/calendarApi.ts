import { supabase } from '../config/SupabaseClient';

export interface CalendarEvent {
  id: string;
  title: string;
  event_date: string;
  event_time: string;
  type: 'event' | 'deadline' | 'meeting'; // Added 'meeting'
  status: 'Pending' | 'Completed';
  user_id: string;
  starts_at: string;
  event_kind: any;
  description: string | null;
}

const transformEvent = (dbEvent: any): CalendarEvent => {
  // Format the date strictly in local time
  const startsAt = `${dbEvent.event_date}T${dbEvent.event_time || '00:00'}:00`;
  
  // REAL-TIME CHECK: Is this event in the past?
  const isPast = new Date(startsAt) < new Date();

  return {
    ...dbEvent,
    starts_at: startsAt,
    // Automatically force to 'Completed' if the time has passed!
    status: isPast ? 'Completed' : (dbEvent.status || 'Pending'),
    event_kind: dbEvent.type,
    description: dbEvent.description || null
  };
};

export const calendarApi = {
  async getEvents(): Promise<CalendarEvent[]> {
    const { data, error } = await (supabase as any)
      .from('events')
      .select('*')
      .order('event_date', { ascending: true });

    if (error) {
      console.error("API Error fetching events:", error);
      return [];
    }
    return (data || []).map(transformEvent);
  },

  async addEvent(eventData: Omit<CalendarEvent, 'id' | 'starts_at' | 'event_kind' | 'description'>): Promise<CalendarEvent | null> {
    const { data, error } = await (supabase as any)
      .from('events')
      .insert([eventData])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return transformEvent(data);
  },

  async updateEvent(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
    const { data, error } = await (supabase as any)
      .from('events')
      .update({
        title: updates.title,
        event_date: updates.event_date,
        event_time: updates.event_time,
        type: updates.type,
        status: updates.status,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return transformEvent(data);
  },

  async deleteEvent(id: string): Promise<void> {
    const { error } = await (supabase as any).from('events').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
};