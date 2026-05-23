import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fwjghfbipemaiytojczk.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

/**
 * Supabase client for Storage integration.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
          // Success: Get the public URL
          const { data } = supabase.storage.from(bucket).getPublicUrl(path)
          resolve(data.publicUrl)
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
    
    const formData = new FormData()
    formData.append('file', file)
    
    xhr.send(file) // Supabase storage accepts raw file body for binary uploads
  })
}
