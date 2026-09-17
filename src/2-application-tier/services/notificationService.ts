import { createNotification } from '../../3-data-tier/api/notificationsApi';

export interface SendCoachNotificationInput {
  recipientProfileId: string;
  athleteId: string;
  createdByProfileId: string;
  message: string;
}

export interface SendSchoolComplianceReminderInput {
  recipientProfileId: string;
  createdByProfileId: string;
  message: string;
}

export async function sendCoachNotification(
  input: SendCoachNotificationInput
): Promise<void> {
  await createNotification({
    ...input,
    type: 'COACH_DOCUMENT_ACTION',
  });
}

export async function sendSchoolComplianceReminder(
  input: SendSchoolComplianceReminderInput
): Promise<void> {
  await createNotification({
    ...input,
    athleteId: null,
    type: 'SCHOOL_COMPLIANCE_REMINDER',
  });
}
