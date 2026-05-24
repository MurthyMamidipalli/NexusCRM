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

  const timestamp = Date.now();
  const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
  // Format: {pathPrefix}/{timestamp}-{filename}
  const storagePath = `${pathPrefix}/${timestamp}-${cleanFileName}`;
  
  console.log('Uploading to Supabase...');
  console.log('Bucket:', 'documents');
  console.log('Path:', storagePath);

  // Initial trigger for UI progress bar
  if (onProgress) onProgress(10);

  const { data, error } = await supabase.storage
    .from('documents')
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('[Supabase] SDK Upload Error:', error);
    throw error;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('documents')
    .getPublicUrl(storagePath);

  console.log('Upload Success');
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

/**
 * Client-side file validation for production security.
 */
export function validateFile(file: File) {
  const MAX_SIZE = 20 * 1024 * 1024; // 20MB Limit
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
    throw new Error(`File type "${file.type}" is not supported. Please upload PDF, Word, Excel, or Images.`);
  }

  return true;
}
