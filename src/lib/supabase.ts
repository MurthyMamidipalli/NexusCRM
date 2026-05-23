import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Immediate diagnostics for Vercel/Studio debugging
if (typeof window !== 'undefined') {
  console.log('[Supabase] URL detected:', !!supabaseUrl);
  console.log('[Supabase] Anon Key detected:', !!supabaseAnonKey);
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
  const isUrlSet = !!supabaseUrl;
  const isKeySet = !!supabaseAnonKey;
  
  if (!isUrlSet || !isKeySet) {
    console.group('📡 Supabase Integration Status');
    console.error('URL:', isUrlSet ? '✅ CONFIGURED' : '❌ MISSING (NEXT_PUBLIC_SUPABASE_URL)');
    console.error('KEY:', isKeySet ? '✅ CONFIGURED' : '❌ MISSING (NEXT_PUBLIC_SUPABASE_ANON_KEY)');
    console.info('Reason: Environment variables not found. Check your .env file.');
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
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase Configuration Missing. Ensure NEXT_PUBLIC variables are set.');
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;

    console.log(`[Supabase] Initiating upload to: ${url}`);

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    });

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        console.log(`[Supabase] XHR Status: ${xhr.status}`);
        if (xhr.status === 200 || xhr.status === 201) {
          const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
          console.log(`[Supabase] Upload successful. Public URL: ${publicUrl}`);
          resolve(publicUrl);
        } else {
          let errorMessage = `Upload failed with status ${xhr.status}`;
          try {
            const error = JSON.parse(xhr.responseText);
            errorMessage = error.message || error.error || errorMessage;
          } catch (e) {
            // If response is not JSON (e.g. HTML error page)
            errorMessage = xhr.statusText || errorMessage;
          }
          console.error(`[Supabase] Upload Error: ${errorMessage}`, xhr.responseText);
          reject(new Error(errorMessage));
        }
      }
    };

    xhr.onerror = () => {
      console.error('[Supabase] Network Error during XHR');
      reject(new Error('Network error. Check CORS settings or bucket policies in Supabase.'));
    };

    xhr.onabort = () => reject(new Error('Upload aborted by user or browser.'));

    xhr.open('POST', url, true);
    xhr.setRequestHeader('Authorization', `Bearer ${supabaseAnonKey}`);
    xhr.setRequestHeader('apikey', supabaseAnonKey);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    
    xhr.send(file);
  });
}
