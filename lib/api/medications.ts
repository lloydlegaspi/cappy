import { supabase } from '@/lib/supabase';
import type { Medication } from '@/types/medication';
import type { CreateMedicationInput, MedicationRow } from '@/types/supabase';

import {
  historyToday,
  todayMedications as fallbackMedications,
} from '@/data/mock-medications';

const DEFAULT_PILL_IMAGE =
  'https://images.unsplash.com/photo-1740592756330-adb8c1f5fbe7?w=500&h=500&fit=crop';

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
    time: row.time_of_day ?? '8:00 AM',
    indication: row.purpose ?? 'Medication reminder',
    status: computeStatus(row.time_of_day),
    image: row.pill_photo_url ?? DEFAULT_PILL_IMAGE,
  };
}

function sortByTimeAscending(medications: Medication[]): Medication[] {
  return [...medications].sort((left, right) => parseTimeToMinutes(left.time) - parseTimeToMinutes(right.time));
}

export async function getMedications(): Promise<Medication[]> {
  if (!supabase) {
    return sortByTimeAscending(fallbackMedications);
  }

  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .order('time_of_day', { ascending: true });

  if (error || !data) {
    console.error('Error fetching medications:', error);
    return sortByTimeAscending(fallbackMedications);
  }

  const mapped = data.map(mapMedicationRow);
  return mapped.length > 0 ? sortByTimeAscending(mapped) : sortByTimeAscending(fallbackMedications);
}

export async function getMedicationById(id?: string): Promise<Medication | null> {
  if (!id) {
    return null;
  }

  if (!supabase) {
    return fallbackMedications.find((medication) => medication.id === id) ?? null;
  }

  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    console.error('Error fetching medication:', error);
    return fallbackMedications.find((medication) => medication.id === id) ?? null;
  }

  return mapMedicationRow(data);
}

export async function createMedication(input: CreateMedicationInput): Promise<Medication | null> {
  if (!supabase) {
    console.warn('Supabase is not configured. Falling back to local demo data only.');
    return null;
  }

  const { data, error } = await supabase
    .from('medications')
    .insert({
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
    return null;
  }

  return mapMedicationRow(data);
}

export function getFallbackHistoryMedications(): Medication[] {
  return historyToday;
}
