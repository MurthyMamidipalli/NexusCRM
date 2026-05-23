import { createClient } from '@supabase/supabase-js'

/**
 * @fileOverview Supabase client initialization with enhanced diagnostics.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Immediate diagnostics for deployment debugging
if (typeof window !== 'undefined') {
  console.group('📡 Supabase Bridge Status');
  console.log('URL Detected:', !!supabaseUrl);
  console.log('Key Detected:', !!supabaseAnonKey);
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Action Required: Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.');
  }
  console.groupEnd();
}

/**
 * Supabase client for high-performance Storage integration.
 */
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false // Using Firebase Auth as the primary authority
      }
    }) 
  : null;

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
    throw new Error('Supabase Configuration Missing. Verify environment variables.');
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const url = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100)
        onProgress(percent)
      }
    })

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200 || xhr.status === 201) {
          if (supabase) {
            const { data } = supabase.storage.from(bucket).getPublicUrl(path)
            resolve(data.publicUrl)
          } else {
            resolve(`${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`)
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText)
            reject(new Error(error.message || 'Upload failed'))
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`))
          }
        }
      }
    }

    xhr.open('POST', url, true)
    xhr.setRequestHeader('Authorization', `Bearer ${supabaseAnonKey}`)
    xhr.setRequestHeader('apikey', supabaseAnonKey)
    
    xhr.send(file)
  })
}
