'use client';

import { supabase } from './supabase';

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
 * Exclusively uses the 'documents' bucket for all professional assets.
 */
export async function uploadToSupabaseStorage(
  file: File,
  pathPrefix: string,
  onProgress?: (progress: number) => void
): Promise<FileMetadata> {
  if (!supabase) {
    throw new Error('Supabase Client not initialized. Verify environment variables.');
  }

  // 1. Log Session (Requirement 1 & 10)
  const { data: { session } } = await supabase.auth.getSession();
  console.log('📡 [Supabase] Session:', session);

  // 2. Log User (Requirement 2)
  const { data: { user: sbUser } } = await supabase.auth.getUser();
  console.log('👤 [Supabase] User:', sbUser);

  const timestamp = Date.now();
  const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
  
  // Requirement: Upload path format documents/{userId}/{timestamp}-{filename}
  // If pathPrefix already contains 'documents/', we strip it because we are inside the 'documents' bucket.
  const correctedPrefix = pathPrefix.startsWith('documents/') 
    ? pathPrefix.replace('documents/', '') 
    : pathPrefix;

  const storagePath = `${correctedPrefix}/${timestamp}-${cleanFileName}`;
  
  // 3. Log Exact Call Details (Requirement 3 & 9)
  console.group('🚀 Supabase Storage Upload Attempt');
  console.log('Bucket Name:', 'documents');
  console.log('Target Path:', storagePath);
  console.log('Options:', { cacheControl: '3600', upsert: false });
  console.log('Auth State:', session ? 'AUTHENTICATED' : 'ANONYMOUS (Firebase Auth active, but Supabase Auth null)');
  console.groupEnd();

  if (onProgress) onProgress(10);

  const { data, error } = await supabase.storage
    .from('documents')
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    // 4. Log full error object (Requirement 4)
    console.error('❌ [Supabase] StorageApiError Detected:');
    console.error(JSON.stringify(error, null, 2));
    throw error;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('documents')
    .getPublicUrl(storagePath);

  console.log('✅ Upload Success');
  console.log('Generated URL:', publicUrl);

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
