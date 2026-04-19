import { getAuthenticatedUserId } from '@/lib/auth/guestSession';
import { supabase } from '@/lib/supabase';

const MEDICATION_IMAGE_BUCKET = 'pill-images';
const DEFAULT_FILE_EXTENSION = 'jpg';

interface UploadedMedicationImage {
  path: string;
  publicUrl: string;
}

function extractFileExtension(uri: string): string {
  const cleanUri = uri.split('?')[0] ?? uri;
  const match = cleanUri.match(/\.([a-zA-Z0-9]+)$/);

  if (!match) {
    return DEFAULT_FILE_EXTENSION;
  }

  return match[1].toLowerCase();
}

function resolveMimeType(fileExtension: string): string {
  switch (fileExtension) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'heic':
    case 'heif':
      return 'image/heic';
    case 'jpg':
    case 'jpeg':
    default:
      return 'image/jpeg';
  }
}

function sanitizePathSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function buildStoragePath(userId: string, medicationId: string, fileExtension: string): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).slice(2, 10);
  return `${sanitizePathSegment(userId)}/${sanitizePathSegment(medicationId)}/${timestamp}-${randomSuffix}.${fileExtension}`;
}

export async function uploadMedicationImage(localUri: string, medicationId: string): Promise<UploadedMedicationImage | null> {
  if (!supabase) {
    return null;
  }

  const normalizedMedicationId = medicationId.trim();

  if (!normalizedMedicationId) {
    return null;
  }

  try {
    const fileExtension = extractFileExtension(localUri);
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      console.error('Medication image upload skipped because no authenticated user was found.');
      return null;
    }

    const storagePath = buildStoragePath(userId, normalizedMedicationId, fileExtension);

    const imageResponse = await fetch(localUri);
    if (!imageResponse.ok) {
      return null;
    }

    const imageBytes = await imageResponse.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from(MEDICATION_IMAGE_BUCKET)
      .upload(storagePath, imageBytes, {
        contentType: resolveMimeType(fileExtension),
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading medication image:', uploadError);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from(MEDICATION_IMAGE_BUCKET)
      .getPublicUrl(storagePath);

    if (!publicUrlData.publicUrl) {
      return null;
    }

    return {
      path: storagePath,
      publicUrl: publicUrlData.publicUrl,
    };
  } catch (error) {
    console.error('Unexpected medication image upload error:', error);
    return null;
  }
}
