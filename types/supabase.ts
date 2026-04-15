export type ReminderAction = 'taken' | 'snoozed' | 'missed';
export type EmotionState = 'calm' | 'confused' | 'stressed';
export type EmotionSource = 'none' | 'self_report' | 'behavior_rule';

export interface MedicationRow {
  id: string;
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
