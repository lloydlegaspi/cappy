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

function sanitizeScope(scope: string): string {
  return scope.replace(/[^a-zA-Z0-9_-]/g, '_');
}

async function getUserScope(): Promise<string> {
  if (!supabase) {
    return 'anonymous';
  }

  try {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user?.id) {
      return 'anonymous';
    }

    return sanitizeScope(data.user.id);
  } catch {
    return 'anonymous';
  }
}

function buildStoragePath(userScope: string, fileExtension: string): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).slice(2, 10);
  return `medications/${userScope}/${timestamp}-${randomSuffix}.${fileExtension}`;
}

export async function uploadMedicationImage(localUri: string): Promise<UploadedMedicationImage | null> {
  if (!supabase) {
    return null;
  }

  try {
    const fileExtension = extractFileExtension(localUri);
    const userScope = await getUserScope();
    const storagePath = buildStoragePath(userScope, fileExtension);

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
