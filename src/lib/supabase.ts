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
 * Utility to upload a file to Supabase Storage with progress tracking.
 */
export async function uploadWithProgress(
  bucket: string,
  path: string,
  file: File,
  onProgress: (percent: number) => void
): Promise<string> {
  const cleanUrl = supabaseUrl?.replace(/\/$/, '');
  const url = `${cleanUrl}/storage/v1/object/${bucket}/${path}`;
  
  // REQUIRED DIAGNOSTIC LOGS
  console.log("--- SUPABASE UPLOAD TRACE ---");
  console.log("SUPABASE URL:", supabaseUrl);
  console.log("UPLOAD URL:", url);
  console.log("FILE NAME:", file.name);

  if (!cleanUrl || !supabaseAnonKey || cleanUrl.includes('your-project')) {
    throw new Error('Supabase Configuration Missing. Ensure NEXT_PUBLIC_SUPABASE_URL and ANON_KEY are set correctly in .env.');
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    });

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        console.log(`[Supabase] XHR COMPLETE - Status: ${xhr.status}`);
        
        if (xhr.status === 200 || xhr.status === 201) {
          const publicUrl = `${cleanUrl}/storage/v1/object/public/${bucket}/${path}`;
          resolve(publicUrl);
        } else {
          let errorMessage = `Upload failed (HTTP ${xhr.status})`;
          try {
            const errorObj = JSON.parse(xhr.responseText);
            errorMessage = errorObj.message || errorObj.error || errorMessage;
          } catch (e) {
            errorMessage = xhr.statusText || errorMessage;
          }
          reject(new Error(errorMessage));
        }
      }
    };

    xhr.onerror = () => {
      console.error('[Supabase] NETWORK ERROR detected at URL:', url);
      reject(new Error('Network error. Likely causes: 1. Invalid URL in .env 2. CORS policy block 3. No internet connection.'));
    };

    xhr.open('POST', url, true);
    
    // Auth Headers
    xhr.setRequestHeader('Authorization', `Bearer ${supabaseAnonKey}`);
    xhr.setRequestHeader('apikey', supabaseAnonKey);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    
    xhr.send(file);
  });
}
