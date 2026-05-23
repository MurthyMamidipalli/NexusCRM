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
  console.log(`[Supabase] STARTING UPLOAD: ${file.name} to ${bucket}/${path}`);
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Supabase] CRITICAL: Missing configuration variables.');
    throw new Error('Supabase Configuration Missing. Ensure NEXT_PUBLIC_SUPABASE_URL and ANON_KEY are set.');
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    // Supabase Storage API endpoint
    const url = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/${bucket}/${path}`;
    
    console.log(`[Supabase] TARGET URL: ${url}`);

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        console.log(`[Supabase] PROGRESS: ${percent}%`);
        onProgress(percent);
      }
    });

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        console.log(`[Supabase] XHR COMPLETE - Status: ${xhr.status}`);
        console.log(`[Supabase] RAW RESPONSE:`, xhr.responseText);
        
        if (xhr.status === 200 || xhr.status === 201) {
          // Success: Use public URL format
          const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
          console.log(`[Supabase] UPLOAD SUCCESS! Public URL: ${publicUrl}`);
          resolve(publicUrl);
        } else if (xhr.status === 0) {
          const corsMsg = 'Network Error (Status 0). Possible causes: 1. CORS policy violation in Supabase Dashboard. 2. Bucket "documents" does not exist. 3. Target URL is unreachable.';
          console.error(`[Supabase] ${corsMsg}`);
          reject(new Error(corsMsg));
        } else {
          let errorMessage = `Upload failed (HTTP ${xhr.status})`;
          try {
            const errorObj = JSON.parse(xhr.responseText);
            errorMessage = errorObj.message || errorObj.error || errorMessage;
          } catch (e) {
            errorMessage = xhr.statusText || errorMessage;
          }
          console.error(`[Supabase] SERVER ERROR: ${errorMessage}`);
          reject(new Error(errorMessage));
        }
      }
    };

    xhr.onerror = () => {
      console.error('[Supabase] NETWORK ERROR: The request could not be sent.');
      reject(new Error('Network error. Check CORS settings or bucket existence in Supabase.'));
    };

    xhr.onabort = () => {
      console.warn('[Supabase] UPLOAD ABORTED.');
      reject(new Error('Upload aborted by user or system.'));
    };

    xhr.open('POST', url, true);
    
    // Required headers for Supabase REST API
    xhr.setRequestHeader('Authorization', `Bearer ${supabaseAnonKey}`);
    xhr.setRequestHeader('apikey', supabaseAnonKey);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    
    console.log('[Supabase] XHR SENDING...');
    xhr.send(file);
  });
}
