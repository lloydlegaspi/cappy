import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Medication } from '@/types/medication';

const REMINDER_KIND = 'medication-reminder';
const REMINDER_CHANNEL_ID = 'medication-reminders';
const LOCAL_NOTIFICATIONS_AVAILABLE = Platform.OS === 'ios' || Platform.OS === 'android';

let notificationsConfigured = false;

type ReminderNotificationResult =
  | { ok: true; scheduledCount: number }
  | {
      ok: false;
      reason: 'permission-denied' | 'invalid-time' | 'schedule-error' | 'unsupported-platform';
      message: string;
    };

function parseMedicationTime(time: string): { hour: number; minute: number } | null {
  const normalized = time.trim();
  const match = normalized.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (!match) {
    return null;
  }

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3].toUpperCase();

  if (Number.isNaN(hour) || Number.isNaN(minute) || hour < 1 || hour > 12 || minute < 0 || minute > 59) {
    return null;
  }

  if (period === 'AM' && hour === 12) {
    hour = 0;
  } else if (period === 'PM' && hour < 12) {
    hour += 12;
  }

  return { hour, minute };
}

function notificationMatchesMedication(
  request: Notifications.NotificationRequest,
  medicationId: string,
): boolean {
  const requestData = request.content.data as Record<string, unknown> | undefined;

  return requestData?.kind === REMINDER_KIND && requestData?.medicationId === medicationId;
}

async function ensureNotificationPermission(): Promise<boolean> {
  if (!LOCAL_NOTIFICATIONS_AVAILABLE) {
    return false;
  }

  const current = await Notifications.getPermissionsAsync();

  if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();

  return requested.granted || requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

export async function configureLocalMedicationNotifications() {
  if (notificationsConfigured) {
    return;
  }

  if (!LOCAL_NOTIFICATIONS_AVAILABLE) {
    notificationsConfigured = true;
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: 'Medication reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 120, 200],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }

  notificationsConfigured = true;
}

export async function cancelMedicationReminderNotifications(medicationId: string) {
  if (!LOCAL_NOTIFICATIONS_AVAILABLE) {
    return;
  }

  await configureLocalMedicationNotifications();

  const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
  const matchingNotifications = allNotifications.filter((notification) =>
    notificationMatchesMedication(notification, medicationId),
  );

  await Promise.all(
    matchingNotifications.map((notification) =>
      Notifications.cancelScheduledNotificationAsync(notification.identifier),
    ),
  );
}

export async function scheduleMedicationReminderNotifications(
  medication: Pick<Medication, 'id' | 'name' | 'time'>,
): Promise<ReminderNotificationResult> {
  if (!LOCAL_NOTIFICATIONS_AVAILABLE) {
    return {
      ok: false,
      reason: 'unsupported-platform',
      message: 'Medication reminders are available on iOS and Android only.',
    };
  }

  await configureLocalMedicationNotifications();

  const hasPermission = await ensureNotificationPermission();
  if (!hasPermission) {
    return {
      ok: false,
      reason: 'permission-denied',
      message: 'Notification access was denied. You can enable it in your device settings.',
    };
  }

  const parsedTime = parseMedicationTime(medication.time);
  if (!parsedTime) {
    return {
      ok: false,
      reason: 'invalid-time',
      message: 'Reminder time must use a format like 8:00 AM.',
    };
  }

  await cancelMedicationReminderNotifications(medication.id);

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Medication reminder',
        body: `It's time to take ${medication.name}.`,
        sound: true,
        data: {
          kind: REMINDER_KIND,
          medicationId: medication.id,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: parsedTime.hour,
        minute: parsedTime.minute,
        channelId: Platform.OS === 'android' ? REMINDER_CHANNEL_ID : undefined,
      },
    });

    return { ok: true, scheduledCount: 1 };
  } catch (error) {
    console.error('Error scheduling medication reminder:', error);
    return {
      ok: false,
      reason: 'schedule-error',
      message: 'Could not schedule the medication reminder notification.',
    };
  }
}
