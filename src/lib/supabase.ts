import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Supabase client for Storage integration.
 * Initialized safely to prevent runtime crashes if environment variables are missing.
 */
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Diagnostics for the developer in the browser console
if (typeof window !== 'undefined') {
  const isUrlSet = !!supabaseUrl;
  const isKeySet = !!supabaseAnonKey;
  
  if (!isUrlSet || !isKeySet) {
    console.group('📡 Supabase Integration Status');
    console.warn('URL:', isUrlSet ? '✅ CONFIGURED' : '❌ MISSING (NEXT_PUBLIC_SUPABASE_URL)');
    console.warn('KEY:', isKeySet ? '✅ CONFIGURED' : '❌ MISSING (NEXT_PUBLIC_SUPABASE_ANON_KEY)');
    console.info('Verify these variables are set in your Vercel/Hosting environment settings.');
    console.groupEnd();
  } else {
    console.log('🚀 Supabase Client Initialized Successfully');
  }
}

/**
 * Utility to upload a file to Supabase Storage with progress tracking.
 * @param bucket Name of the storage bucket
 * @param path Destination path in the bucket
 * @param file File object to upload
 * @param onProgress Callback for percentage tracking
 */
export async function uploadWithProgress(
  bucket: string,
  path: string,
  file: File,
  onProgress: (percent: number) => void
): Promise<string> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(`Supabase Configuration Missing: ${!supabaseUrl ? 'URL ' : ''}${!supabaseAnonKey ? 'Anon Key' : ''}`);
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
          // Success: Use the Supabase client to get the public URL if initialized
          if (supabase) {
            const { data } = supabase.storage.from(bucket).getPublicUrl(path)
            resolve(data.publicUrl)
          } else {
            // Fallback URL generation
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
