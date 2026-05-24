
'use client';

import { supabase } from './supabase';

const SUPABASE_BUCKET_ID = 'documents';

export interface FileMetadata {
  fileName: string;
  originalName: string;
  downloadURL: string;
  storagePath: string;
  fileSize: number;
  fileType: string;
}

/**
 * Stabilized and optimized Supabase upload service.
 */
export async function uploadToSupabaseStorage(
  file: File,
  pathPrefix: string,
  onProgress?: (progress: number) => void
): Promise<FileMetadata> {
  if (!supabase) throw new Error('Supabase Client not active.');

  const timestamp = Date.now();
  const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
  const correctedPrefix = pathPrefix.startsWith(`${SUPABASE_BUCKET_ID}/`) 
    ? pathPrefix.replace(`${SUPABASE_BUCKET_ID}/`, '') 
    : pathPrefix;

  const storagePath = `${correctedPrefix}/${timestamp}-${cleanFileName}`;
  
  if (onProgress) onProgress(10);

  const { error } = await supabase.storage
    .from(SUPABASE_BUCKET_ID)
    .upload(storagePath, file, { cacheControl: '3600', upsert: false });

  if (error) throw error;
  if (onProgress) onProgress(100);

  return {
    fileName: `${timestamp}-${cleanFileName}`,
    originalName: file.name,
    downloadURL: '',
    storagePath: storagePath,
    fileSize: file.size,
    fileType: file.type,
  };
}

export function validateFile(file: File) {
  const MAX_SIZE = 20 * 1024 * 1024;
  const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
  if (file.size > MAX_SIZE) throw new Error(`File "${file.name}" exceeds 20MB.`);
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error(`File type "${file.type}" not supported.`);
  return true;
}
