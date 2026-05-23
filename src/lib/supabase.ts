import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Immediate diagnostics for Vercel/Studio debugging
if (typeof window !== 'undefined') {
  console.log('[Supabase] Env Check - URL:', !!supabaseUrl);
  console.log('[Supabase] Env Check - Key:', !!supabaseAnonKey);
}

/**
 * Supabase client for Storage integration.
 * Initialized exactly with NEXT_PUBLIC environment variables.
 */
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Audit and report status to developer console
if (typeof window !== 'undefined') {
  if (!supabase) {
    console.group('📡 Supabase Integration Status');
    console.error('Status: OFFLINE');
    console.error('URL:', !!supabaseUrl ? '✅ DETECTED' : '❌ MISSING (NEXT_PUBLIC_SUPABASE_URL)');
    console.error('KEY:', !!supabaseAnonKey ? '✅ DETECTED' : '❌ MISSING (NEXT_PUBLIC_SUPABASE_ANON_KEY)');
    console.groupEnd();
  } else {
    console.log('🚀 Supabase Client Initialized Successfully');
  }
}

/**
 * Utility to upload a file to Supabase Storage with progress tracking.
 */
export async function uploadWithProgress(
  bucket: string,
  path: string,
  file: File,
  onProgress: (percent: number) => void
): Promise<string> {
  console.log(`[Supabase] Starting upload: ${file.name} to ${bucket}/${path}`);
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Supabase] Upload failed: Missing credentials');
    throw new Error('Supabase Configuration Missing. Ensure NEXT_PUBLIC variables are set.');
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    });

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        console.log(`[Supabase] XHR Complete - Status: ${xhr.status}`);
        if (xhr.status === 200 || xhr.status === 201) {
          const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
          console.log(`[Supabase] Success! URL: ${publicUrl}`);
          resolve(publicUrl);
        } else {
          let errorMessage = `Upload failed with status ${xhr.status}`;
          try {
            const error = JSON.parse(xhr.responseText);
            errorMessage = error.message || error.error || errorMessage;
          } catch (e) {
            errorMessage = xhr.statusText || errorMessage;
          }
          console.error(`[Supabase] Error: ${errorMessage}`);
          reject(new Error(errorMessage));
        }
      }
    };

    xhr.onerror = () => reject(new Error('Network error. Check CORS settings or bucket policies in Supabase.'));
    xhr.onabort = () => reject(new Error('Upload aborted.'));

    xhr.open('POST', url, true);
    xhr.setRequestHeader('Authorization', `Bearer ${supabaseAnonKey}`);
    xhr.setRequestHeader('apikey', supabaseAnonKey);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    
    xhr.send(file);
  });
}
