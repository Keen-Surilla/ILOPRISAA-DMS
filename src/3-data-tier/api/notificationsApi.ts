import { supabase } from '../config/SupabaseClient';
import type { Database } from '../types/database.types';

type NotificationsTable = Database['public']['Tables']['notifications'];
export type NotificationRow = NotificationsTable['Row'];

export interface CreateNotificationInput {
  recipientProfileId: string;
  athleteId?: string | null;
  createdByProfileId: string;
  type: string;
  message: string;
}

export async function createNotification(
  input: CreateNotificationInput
): Promise<void> {
  const notification: NotificationsTable['Insert'] = {
    recipient_profile_id: input.recipientProfileId,
    athlete_id: input.athleteId ?? null,
    created_by_profile_id: input.createdByProfileId,
    type: input.type,
    message: input.message,
  };

  const { error } = await supabase
    .from('notifications')
    .insert(notification);

  if (error) {
    console.error('Error creating notification:', error);
    throw new Error('Could not create the notification. Please try again.');
  }
}

export async function getMyNotifications(
  profileId: string
): Promise<NotificationRow[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_profile_id', profileId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading notifications:', error);
    throw new Error('Could not load notifications. Please try again.');
  }

  return data ?? [];
}

export async function markNotificationRead(
  notificationId: string
): Promise<NotificationRow> {
  const updates: Pick<NotificationsTable['Update'], 'read_at'> = {
    read_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('notifications')
    .update(updates)
    .eq('id', notificationId)
    .select('*')
    .single();

  if (error) {
    console.error('Error marking notification as read:', error);
    throw new Error('Could not mark the notification as read. Please try again.');
  }

  return data;
}

export async function markAllNotificationsRead(
  profileId: string
): Promise<void> {
  const updates: Pick<NotificationsTable['Update'], 'read_at'> = {
    read_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('notifications')
    .update(updates)
    .eq('recipient_profile_id', profileId)
    .is('read_at', null);

  if (error) {
    console.error('Error marking all notifications as read:', error);
    throw new Error('Could not mark notifications as read. Please try again.');
  }
}

export async function deleteNotification(
  notificationId: string
): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) {
    console.error('Error deleting notification:', error);
    throw new Error('Could not delete the notification. Please try again.');
  }
}
