import { supabase } from '@/lib/supabase';
import type { DayHistoryGroup, Medication } from '@/types/medication';
import type { CreateReminderEventInput, MedicationRow, ReminderEventRow } from '@/types/supabase';

import { historyYesterday, last7DaysHistory } from '@/data/mock-medications';
import { getFallbackHistoryMedications } from './medications';

function toStatus(action: ReminderEventRow['action']): Medication['status'] {
  switch (action) {
    case 'taken':
      return 'Taken';
    case 'snoozed':
      return 'Snoozed';
    case 'missed':
      return 'Missed';
    default:
      return 'Pending';
  }
}

function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function formatLabel(date: Date, relativeLabel?: string): string {
  const label = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return relativeLabel ? `${relativeLabel} - ${label}` : label;
}

function mapMedicationRow(row: MedicationRow): Medication {
  const time = row.time_of_day ?? '8:00 AM';

  return {
    id: row.id,
    name: row.name,
    dosage: row.dosage,
    time,
    indication: row.purpose ?? 'Medication reminder',
    status: 'Pending',
    image: row.pill_photo_url ?? 'https://images.unsplash.com/photo-1740592756330-adb8c1f5fbe7?w=500&h=500&fit=crop',
  };
}

function mergeEventWithMedication(event: ReminderEventRow, medication: MedicationRow | Medication | null): Medication {
  const baseMedication = medication
    ? 'time_of_day' in medication
      ? mapMedicationRow(medication)
      : medication
    : null;

  return {
    id: event.id,
    name: baseMedication?.name ?? 'Medication',
    dosage: baseMedication?.dosage ?? '1 dose',
    time: baseMedication?.time ?? new Date(event.scheduled_for).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    indication: baseMedication?.indication ?? 'Medication reminder',
    status: toStatus(event.action),
    image: baseMedication?.image ?? 'https://images.unsplash.com/photo-1740592756330-adb8c1f5fbe7?w=500&h=500&fit=crop',
  };
}

export async function createReminderEvent(input: CreateReminderEventInput) {
  if (!supabase) {
    console.warn('Supabase is not configured. Reminder event was not persisted.');
    return null;
  }

  const { data, error } = await supabase
    .from('reminder_events')
    .insert({
      medication_id: input.medicationId,
      scheduled_for: input.scheduledFor,
      action: input.action,
      emotion_state: input.emotionState ?? 'calm',
      emotion_source: input.emotionSource ?? 'none',
      rule_trigger: input.ruleTrigger ?? null,
      dwell_time_seconds: input.dwellTimeSeconds ?? 0,
      snooze_count: input.snoozeCount ?? 0,
      pill_photo_open_count: input.pillPhotoOpenCount ?? 0,
    })
    .select('*')
    .single();

  if (error || !data) {
    console.error('Error creating reminder event:', error);
    return null;
  }

  return data;
}

export async function getReminderEvents(startDate: string, endDate: string): Promise<ReminderEventRow[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('reminder_events')
    .select('*')
    .gte('scheduled_for', startDate)
    .lt('scheduled_for', endDate)
    .order('scheduled_for', { ascending: false });

  if (error || !data) {
    console.error('Error fetching reminder events:', error);
    return [];
  }

  return data;
}

export async function getReminderHistorySections(): Promise<DayHistoryGroup[]> {
  if (!supabase) {
    return last7DaysHistory;
  }

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);

  const [medicationsResult, eventsResult] = await Promise.all([
    supabase.from('medications').select('*'),
    supabase
      .from('reminder_events')
      .select('*')
      .gte('scheduled_for', startOfDay(sevenDaysAgo).toISOString())
      .lte('scheduled_for', endOfDay(today).toISOString())
      .order('scheduled_for', { ascending: false }),
  ]);

  const medications = medicationsResult.data ?? [];
  const events = eventsResult.data ?? [];

  if (medicationsResult.error) {
    console.error('Error fetching medications for history:', medicationsResult.error);
  }

  if (eventsResult.error) {
    console.error('Error fetching reminder events for history:', eventsResult.error);
  }

  const medicationMap = new Map<string, MedicationRow | Medication>();
  for (const medication of medications) {
    medicationMap.set(medication.id, medication as MedicationRow);
  }

  const todaySection: Medication[] = medications.length
    ? medications.map((medication) => {
        const latestEvent = events.find(
          (event) =>
            event.medication_id === medication.id &&
            new Date(event.scheduled_for).toDateString() === today.toDateString(),
        );

        if (latestEvent) {
          return mergeEventWithMedication(latestEvent, medicationMap.get(medication.id) ?? null);
        }

        return {
          id: medication.id,
          name: medication.name,
          dosage: medication.dosage,
          time: medication.time_of_day ?? '8:00 AM',
          indication: medication.purpose ?? 'Medication reminder',
          status: 'Pending',
          image: medication.pill_photo_url ?? 'https://images.unsplash.com/photo-1740592756330-adb8c1f5fbe7?w=500&h=500&fit=crop',
        };
      })
    : getFallbackHistoryMedications().map((medication) => medication);

  const yesterdayEvents = events.filter(
    (event) => new Date(event.scheduled_for).toDateString() === yesterday.toDateString(),
  );

  const yesterdaySection: Medication[] = yesterdayEvents.length
    ? yesterdayEvents.map((event) => mergeEventWithMedication(event, medicationMap.get(event.medication_id) ?? null))
    : historyYesterday;

  const groupedByDay = new Map<string, Medication[]>();

  for (const event of events) {
    const dateKey = formatDateKey(new Date(event.scheduled_for));
    const list = groupedByDay.get(dateKey) ?? [];
    list.push(mergeEventWithMedication(event, medicationMap.get(event.medication_id) ?? null));
    groupedByDay.set(dateKey, list);
  }

  const last7Days: DayHistoryGroup[] = [];
  for (let offset = 0; offset < 7; offset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const dateKey = formatDateKey(date);
    const relativeLabel = offset === 0 ? 'Today' : offset === 1 ? 'Yesterday' : undefined;
    const medicationsForDay = groupedByDay.get(dateKey) ?? (offset === 0 ? todaySection : offset === 1 ? yesterdaySection : []);

    if (medicationsForDay.length > 0) {
      last7Days.push({
        id: dateKey,
        label: formatLabel(date, relativeLabel),
        medications: medicationsForDay,
      });
    }
  }

  return [
    {
      id: 'today',
      label: formatLabel(today, 'Today'),
      medications: todaySection,
    },
    {
      id: 'yesterday',
      label: formatLabel(yesterday, 'Yesterday'),
      medications: yesterdaySection,
    },
    ...last7Days.filter((section) => section.id !== 'today' && section.id !== 'yesterday'),
  ];
}
