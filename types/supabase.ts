export type ReminderAction = 'taken' | 'snoozed' | 'missed';
export type EmotionState = 'calm' | 'confused' | 'stressed';
export type EmotionSource = 'none' | 'self_report' | 'behavior_rule';
export type UserTextSize = 'Standard' | 'Large';
export type UserReminderSound = 'On' | 'Off';
export type UserLanguage = 'English' | 'Filipino';

export interface MedicationRow {
  id: string;
  user_id: string | null;
  name: string;
  dosage: string;
  purpose: string | null;
  time_of_day: string | null;
  frequency: string | null;
  pill_photo_url: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ReminderEventRow {
  id: string;
  user_id: string | null;
  medication_id: string;
  scheduled_for: string;
  action: ReminderAction;
  emotion_state: EmotionState;
  emotion_source: EmotionSource;
  rule_trigger: string | null;
  dwell_time_seconds: number | null;
  snooze_count: number | null;
  pill_photo_open_count: number | null;
  created_at: string;
}

export interface UserSettingsRow {
  id: string;
  user_id: string | null;
  display_name: string | null;
  caregiver_name: string | null;
  caregiver_phone: string | null;
  text_size: UserTextSize;
  reminder_sound: UserReminderSound;
  high_contrast: boolean;
  language: UserLanguage;
  created_at?: string;
  updated_at?: string;
}

export interface CreateMedicationInput {
  name: string;
  dosage: string;
  purpose?: string | null;
  time_of_day: string;
  frequency?: string | null;
  pill_photo_url?: string | null;
}

export interface UpdateMedicationInput {
  name: string;
  dosage: string;
  purpose?: string | null;
  time_of_day: string;
  frequency?: string | null;
  pill_photo_url?: string | null;
}

export interface CreateReminderEventInput {
  medicationId: string;
  scheduledFor: string;
  action: ReminderAction;
  emotionState?: EmotionState;
  emotionSource?: EmotionSource;
  ruleTrigger?: string | null;
  dwellTimeSeconds?: number;
  snoozeCount?: number;
  pillPhotoOpenCount?: number;
}
