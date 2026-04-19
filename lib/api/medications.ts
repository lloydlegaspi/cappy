import { getAuthenticatedUserId } from '@/lib/auth/guestSession';
import { supabase } from '@/lib/supabase';
import type { Medication } from '@/types/medication';
import type { CreateMedicationInput, MedicationRow, ReminderEventRow, UpdateMedicationInput } from '@/types/supabase';

import {
    todayMedications as fallbackMedications
} from '@/data/mock-medications';

const DEFAULT_PILL_IMAGE =
  'https://images.unsplash.com/photo-1740592756330-adb8c1f5fbe7?w=500&h=500&fit=crop';

const localDemoMedications: Medication[] = [...fallbackMedications];

function parseTimeToMinutes(timeOfDay: string | null | undefined): number {
  if (!timeOfDay) return Number.POSITIVE_INFINITY;

  const normalized = timeOfDay.trim().toLowerCase();
  const match = normalized.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/);
  if (!match) return Number.POSITIVE_INFINITY;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3];

  if (meridiem === 'am' && hours === 12) hours = 0;
  if (meridiem === 'pm' && hours !== 12) hours += 12;

  return hours * 60 + minutes;
}

function computeStatus(timeOfDay: string | null | undefined): Medication['status'] {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const scheduledMinutes = parseTimeToMinutes(timeOfDay);

  return scheduledMinutes <= currentMinutes ? 'Due Now' : 'Later';
}

function mapMedicationRow(row: MedicationRow): Medication {
  return {
    id: row.id,
    name: row.name,
    dosage: row.dosage,
    purpose: row.purpose,
    frequency: row.frequency,
    time: row.time_of_day ?? '8:00 AM',
    indication: row.purpose ?? 'Medication reminder',
    status: computeStatus(row.time_of_day),
    image: row.pill_photo_url ?? DEFAULT_PILL_IMAGE,
    pillPhotoUrl: row.pill_photo_url,
  };
}

function getStartOfDayIso(date = new Date()): string {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
}

function getEndOfDayIso(date = new Date()): string {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end.toISOString();
}

async function getLatestEventMapForToday(): Promise<Map<string, ReminderEventRow>> {
  if (!supabase) {
    return new Map<string, ReminderEventRow>();
  }

  const { data, error } = await supabase
    .from('reminder_events')
    .select('*')
    .gte('scheduled_for', getStartOfDayIso())
    .lte('scheduled_for', getEndOfDayIso())
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('Error fetching reminder events for medication status:', error);
    return new Map<string, ReminderEventRow>();
  }

  const latestByMedication = new Map<string, ReminderEventRow>();
  for (const event of data) {
    if (!latestByMedication.has(event.medication_id)) {
      latestByMedication.set(event.medication_id, event);
    }
  }

  return latestByMedication;
}

function applyEventStatus(medication: Medication, event?: ReminderEventRow): Medication {
  if (!event) {
    return medication;
  }

  if (event.action === 'taken') {
    return { ...medication, status: 'Taken' };
  }

  if (event.action === 'missed') {
    return { ...medication, status: 'Missed' };
  }

  if (event.action === 'snoozed') {
    return medication;
  }

  return medication;
}

function sortByTimeAscending(medications: Medication[]): Medication[] {
  return [...medications].sort((left, right) => parseTimeToMinutes(left.time) - parseTimeToMinutes(right.time));
}

export async function getMedications(): Promise<Medication[]> {
  if (!supabase) {
    return sortByTimeAscending(localDemoMedications);
  }

  const [medicationsResult, latestEventsByMedication] = await Promise.all([
    supabase.from('medications').select('*').order('time_of_day', { ascending: true }),
    getLatestEventMapForToday(),
  ]);

  const data = medicationsResult.data;
  const error = medicationsResult.error;

  if (error) {
    console.error('Error fetching medications:', error);
    return [];
  }

  const mapped = (data ?? []).map((row) => applyEventStatus(mapMedicationRow(row), latestEventsByMedication.get(row.id)));
  return sortByTimeAscending(mapped);
}

export async function getMedicationById(id?: string): Promise<Medication | null> {
  if (!id) {
    return null;
  }

  if (!supabase) {
    return localDemoMedications.find((medication) => medication.id === id) ?? null;
  }

  const [medicationResult, latestEventsByMedication] = await Promise.all([
    supabase
      .from('medications')
      .select('*')
      .eq('id', id)
      .maybeSingle(),
    getLatestEventMapForToday(),
  ]);

  const data = medicationResult.data;
  const error = medicationResult.error;

  if (error || !data) {
    console.error('Error fetching medication:', error);
    return null;
  }

  return applyEventStatus(mapMedicationRow(data), latestEventsByMedication.get(data.id));
}

export async function getMedicationByIdRaw(id?: string): Promise<Medication | null> {
  if (!id) {
    return null;
  }

  if (!supabase) {
    return localDemoMedications.find((medication) => medication.id === id) ?? null;
  }

  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    console.error('Error fetching medication:', error);
    return null;
  }

  return mapMedicationRow(data);
}

export async function createMedication(input: CreateMedicationInput): Promise<Medication | null> {
  if (!supabase) {
    const created: Medication = {
      id: `local-${Date.now()}`,
      name: input.name,
      dosage: input.dosage,
      purpose: input.purpose ?? null,
      frequency: input.frequency ?? null,
      time: input.time_of_day,
      indication: input.purpose ?? 'Medication reminder',
      status: computeStatus(input.time_of_day),
      image: input.pill_photo_url ?? DEFAULT_PILL_IMAGE,
      pillPhotoUrl: input.pill_photo_url ?? null,
    };

    localDemoMedications.push(created);
    return created;
  }

  const userId = await getAuthenticatedUserId();

  if (!userId) {
    console.error('Medication create skipped because no authenticated user was found.');
    return null;
  }

  const { data, error } = await supabase
    .from('medications')
    .insert({
      user_id: userId,
      name: input.name,
      dosage: input.dosage,
      purpose: input.purpose ?? null,
      time_of_day: input.time_of_day,
      frequency: input.frequency ?? null,
      pill_photo_url: input.pill_photo_url ?? null,
    })
    .select('*')
    .single();

  if (error || !data) {
    console.error('Error creating medication:', error);
    if (error?.code === '42501') {
      console.warn(
        'Medication insert was blocked by Supabase RLS. Run the latest schema migration to apply per-user ownership policies.',
      );
    }
    return null;
  }

  return mapMedicationRow(data);
}

export async function updateMedicationById(id: string, input: UpdateMedicationInput): Promise<Medication | null> {
  if (!supabase) {
    const index = localDemoMedications.findIndex((medication) => medication.id === id);

    if (index < 0) {
      return null;
    }

    const current = localDemoMedications[index];
    const updated: Medication = {
      ...current,
      name: input.name,
      dosage: input.dosage,
      purpose: input.purpose ?? null,
      frequency: input.frequency ?? null,
      time: input.time_of_day,
      indication: input.purpose ?? current.indication,
      status: computeStatus(input.time_of_day),
      image: input.pill_photo_url ?? DEFAULT_PILL_IMAGE,
      pillPhotoUrl: input.pill_photo_url ?? null,
    };

    localDemoMedications[index] = updated;
    return updated;
  }

  const { data, error } = await supabase
    .from('medications')
    .update({
      name: input.name,
      dosage: input.dosage,
      purpose: input.purpose ?? null,
      time_of_day: input.time_of_day,
      frequency: input.frequency ?? null,
      pill_photo_url: input.pill_photo_url ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) {
    console.error('Error updating medication:', error);
    return null;
  }

  return mapMedicationRow(data);
}

export async function deleteMedicationByIdWithReason(id: string): Promise<{ ok: boolean; code?: string; message?: string }> {
  try {
    if (!supabase) {
      const originalLength = localDemoMedications.length;
      const next = localDemoMedications.filter((medication) => medication.id !== id);

      if (next.length === originalLength) {
        return { ok: false, code: 'NO_ROWS_DELETED', message: 'Medication not found in local demo data.' };
      }

      localDemoMedications.splice(0, localDemoMedications.length, ...next);
      return { ok: true };
    }

    const { data, error } = await supabase
      .from('medications')
      .delete({ count: 'exact' })
      .eq('id', id)
      .select('id');

    if (error) {
      return { ok: false, code: error.code, message: error.message };
    }

    if (!data || data.length === 0) {
      return {
        ok: false,
        code: 'NO_ROWS_DELETED',
        message:
          'No medication row was deleted. This usually means row-level security blocked the operation or the record no longer exists.',
      };
    }

    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected delete error.';
    return { ok: false, message };
  }
}
