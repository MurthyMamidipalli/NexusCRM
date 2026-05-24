'use client';

import { supabase } from './supabase';
import { auth as firebaseAuth } from './firebase';

// CONFIGURATION: Set this to match your exact Supabase Bucket ID (usually lowercase)
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
 * Authoritative upload service for Supabase Storage.
 */
export async function uploadToSupabaseStorage(
  file: File,
  pathPrefix: string,
  onProgress?: (progress: number) => void
): Promise<FileMetadata> {
  if (!supabase) {
    throw new Error('Supabase Client not initialized. Verify environment variables.');
  }

  const fbUser = firebaseAuth.currentUser;
  const { data: { session } } = await supabase.auth.getSession();

  const timestamp = Date.now();
  const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
  
  // Enforce consistent path structure: {userId}/{timestamp}-{filename}
  const correctedPrefix = pathPrefix.startsWith(`${SUPABASE_BUCKET_ID}/`) 
    ? pathPrefix.replace(`${SUPABASE_BUCKET_ID}/`, '') 
    : pathPrefix;

  const storagePath = `${correctedPrefix}/${timestamp}-${cleanFileName}`;
  
  console.group('🚀 [Supabase] STORAGE UPLOAD ATTEMPT');
  console.log('Bucket ID:', SUPABASE_BUCKET_ID);
  console.log('Target Path:', storagePath);
  console.log('Auth State:', session ? 'AUTHENTICATED' : 'ANONYMOUS');
  console.groupEnd();

  if (onProgress) onProgress(10);

  // Perform the upload
  const { data, error } = await supabase.storage
    .from(SUPABASE_BUCKET_ID)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('❌ [Supabase] Upload Error:', JSON.stringify(error, null, 2));
    if (error.message.includes('not found')) {
      console.warn(`💡 TROUBLESHOOTING: Ensure you have created a bucket named exactly "${SUPABASE_BUCKET_ID}" in your Supabase Dashboard.`);
    }
    throw error;
  }

  // Generate URL
  const { data: { publicUrl } } = supabase.storage
    .from(SUPABASE_BUCKET_ID)
    .getPublicUrl(storagePath);

  console.log('✅ [Supabase] Upload Success. URL:', publicUrl);

  if (onProgress) onProgress(100);

  return {
    fileName: `${timestamp}-${cleanFileName}`,
    originalName: file.name,
    downloadURL: publicUrl,
    storagePath: storagePath,
    fileSize: file.size,
    fileType: file.type,
  };
}

export function validateFile(file: File) {
  const MAX_SIZE = 20 * 1024 * 1024;
  const ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/png',
    'image/jpeg',
    'image/jpg'
  ];

  if (file.size > MAX_SIZE) {
    throw new Error(`File "${file.name}" exceeds the 20MB limit.`);
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`File type "${file.type}" is not supported.`);
  }

  return true;
}
