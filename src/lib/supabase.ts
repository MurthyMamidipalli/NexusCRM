import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Immediate diagnostics for Vercel deployment debugging
if (typeof window !== 'undefined') {
  console.log('SUPABASE_URL detected:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('SUPABASE_ANON_KEY detected:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/**
 * Supabase client for Storage integration.
 * Initialized exactly with NEXT_PUBLIC environment variables.
 */
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ) 
  : null;

// Audit and report status to developer console
if (typeof window !== 'undefined') {
  const isUrlSet = !!supabaseUrl;
  const isKeySet = !!supabaseAnonKey;
  
  if (!isUrlSet || !isKeySet) {
    console.group('📡 Supabase Integration Status');
    console.error('URL:', isUrlSet ? '✅ CONFIGURED' : '❌ MISSING (NEXT_PUBLIC_SUPABASE_URL)');
    console.error('KEY:', isKeySet ? '✅ CONFIGURED' : '❌ MISSING (NEXT_PUBLIC_SUPABASE_ANON_KEY)');
    console.info('Reason: URL or Key returned falsy from process.env. Check your .env file and restart the dev server.');
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
            reject(new Error(error.message || `Upload failed with status ${xhr.status}`))
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`))
          }
        }
      }
    }

    xhr.open('POST', url, true)
    xhr.setRequestHeader('Authorization', `Bearer ${supabaseAnonKey}`)
    xhr.setRequestHeader('apikey', supabaseAnonKey)
    // Important: Help Supabase identify the file type
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
    
    xhr.send(file)
  })
}
