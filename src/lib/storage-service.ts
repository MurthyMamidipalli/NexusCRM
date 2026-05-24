'use client';

import { supabase } from './supabase';
import { auth as firebaseAuth } from './firebase';

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
 * Enhanced with deep diagnostic tracing for RLS and Auth validation.
 */
export async function uploadToSupabaseStorage(
  file: File,
  pathPrefix: string,
  onProgress?: (progress: number) => void
): Promise<FileMetadata> {
  if (!supabase) {
    throw new Error('Supabase Client not initialized. Verify environment variables.');
  }

  // 1. Log Firebase Auth State
  const fbUser = firebaseAuth.currentUser;
  
  // 2. Log Supabase Auth State (Session & User)
  const { data: { session } } = await supabase.auth.getSession();
  const { data: { user: sbUser } } = await supabase.auth.getUser();

  console.group('🔍 [Supabase] PRE-UPLOAD AUTH AUDIT');
  console.log('Firebase UID:', fbUser?.uid || 'NULL');
  console.log('Supabase UID:', sbUser?.id || 'NULL');
  console.log('Supabase Session Active:', !!session);
  console.log('Supabase JWT Present:', !!session?.access_token);
  if (session?.access_token) {
    console.log('Supabase JWT Snippet:', `${session.access_token.substring(0, 10)}...`);
  }
  console.groupEnd();

  const timestamp = Date.now();
  const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
  
  // Enforce consistent path structure: {userId}/{timestamp}-{filename}
  const correctedPrefix = pathPrefix.startsWith('documents/') 
    ? pathPrefix.replace('documents/', '') 
    : pathPrefix;

  const storagePath = `${correctedPrefix}/${timestamp}-${cleanFileName}`;
  
  // 3. Log Exact Call Details
  console.group('🚀 [Supabase] STORAGE UPLOAD ATTEMPT');
  console.log('Bucket Name:', 'documents');
  console.log('Target Path:', storagePath);
  console.log('File Name:', file.name);
  console.log('File Size:', (file.size / 1024 / 1024).toFixed(2) + ' MB');
  console.log('Auth Role:', session ? 'AUTHENTICATED' : 'ANONYMOUS');
  console.groupEnd();

  if (onProgress) onProgress(10);

  const { data, error } = await supabase.storage
    .from('documents')
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    // 4. Log full error object for RLS debugging
    console.error('❌ [Supabase] StorageApiError Detected:');
    console.error(JSON.stringify(error, null, 2));
    
    if ((error as any).status === 403 || error.message.includes('row-level security')) {
      console.warn('💡 RLS TROUBLESHOOTING: Your Supabase session does not match the required UID or role for this path.');
    }
    throw error;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('documents')
    .getPublicUrl(storagePath);

  console.log('✅ [Supabase] Upload Success');
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
