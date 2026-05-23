import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Supabase client for Storage integration.
 */
export const supabase = (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project')) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Audit and report status to developer console
if (typeof window !== 'undefined') {
  console.group('📡 Supabase Integration Status');
  console.log('URL:', supabaseUrl);
  if (!supabase) {
    console.error('Status: OFFLINE (Missing or Placeholder keys detected)');
  } else {
    console.log('Status: ACTIVE');
  }
  console.groupEnd();
}

/**
 * Utility to upload a file to Supabase Storage using the official SDK.
 * Handles CORS and preflights automatically.
 */
export async function uploadWithProgress(
  bucket: string,
  path: string,
  file: File,
  onProgress: (percent: number) => void
): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase Client not initialized. Verify environment variables.');
  }

  console.log(`[Supabase] Initiating SDK upload for: ${file.name}`);

  // Note: Standard Supabase SDK upload doesn't provide fine-grained progress in simple calls,
  // but it resolves CORS issues by handling headers correctly.
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('[Supabase] SDK Upload Error:', error);
    throw error;
  }

  // Simulate progress for UI feedback since SDK handles the actual transfer
  onProgress(100);

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return publicUrl;
}
