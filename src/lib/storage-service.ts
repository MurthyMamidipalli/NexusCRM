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
 * Robust file upload utility for Supabase Storage.
 * Migrated from Firebase Storage as per system requirements.
 */
export async function uploadToSupabaseStorage(
  file: File,
  pathPrefix: string, // This will be used as part of the path, e.g., 'documents' or 'resumes'
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

  // Supabase doesn't natively support progress in the simple upload call, 
  // so we simulate the initial trigger for the UI.
  if (onProgress) onProgress(10);

  const { data, error } = await supabase.storage
    .from('documents')
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('[Supabase] Upload Error:', error);
    throw error;
  }

  if (onProgress) onProgress(100);

  const { data: { publicUrl } } = supabase.storage
    .from('documents')
    .getPublicUrl(storagePath);

  console.log('Upload Success');
  console.log('Generated URL:', publicUrl);

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
 * Client-side file validation.
 */
export function validateFile(file: File) {
  const MAX_SIZE = 20 * 1024 * 1024; // 20MB
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
    throw new Error(`File "${file.name}" is too large. Maximum size is 20MB.`);
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`File type "${file.type}" is not supported. Please upload PDF, Word, Excel, or Images.`);
  }

  return true;
}
