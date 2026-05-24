'use client';

import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  FirebaseStorage 
} from 'firebase/storage';

export interface FileMetadata {
  fileName: string;
  originalName: string;
  downloadURL: string;
  storagePath: string;
  fileSize: number;
  fileType: string;
}

/**
 * Robust file upload utility for Firebase Storage.
 * Features: Retries, Progress Tracking, Unique Naming, and Metadata Extraction.
 */
export async function uploadToFirebaseStorage(
  storage: FirebaseStorage,
  file: File,
  pathPrefix: string,
  onProgress?: (progress: number) => void,
  maxRetries = 3
): Promise<FileMetadata> {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
  const uniqueName = `${timestamp}_${randomStr}_${cleanFileName}`;
  const storagePath = `${pathPrefix}/${uniqueName}`;
  const storageRef = ref(storage, storagePath);

  let attempt = 0;
  
  const performUpload = async (): Promise<FileMetadata> => {
    return new Promise((resolve, reject) => {
      console.log(`[Storage] Uploading ${file.name} to ${storagePath} (Attempt ${attempt + 1})`);
      
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
          console.log(`[Storage] ${file.name} progress: ${Math.round(progress)}%`);
        },
        (error) => {
          console.error(`[Storage] Task error for ${file.name}:`, error.code, error.message);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log(`[Storage] ${file.name} upload complete!`);
            resolve({
              fileName: uniqueName,
              originalName: file.name,
              downloadURL,
              storagePath,
              fileSize: file.size,
              fileType: file.type,
            });
          } catch (urlErr) {
            reject(urlErr);
          }
        }
      );
    });
  };

  while (attempt < maxRetries) {
    try {
      return await performUpload();
    } catch (err: any) {
      attempt++;
      const isCORS = err.message?.toLowerCase().includes('cors') || err.code === 'storage/retry-limit-exceeded';
      const isPermission = err.code === 'storage/unauthorized';

      if (isCORS) {
        console.warn('⚠️ [Storage] CORS Block detected. Ensure bucket configuration allows this origin.');
      }
      
      if (isPermission) {
        console.error('❌ [Storage] Permission Denied. Check Security Rules.');
        throw new Error('Access Denied: You do not have permission to upload to this folder.');
      }

      if (attempt >= maxRetries) {
        console.error(`❌ [Storage] Upload failed after ${maxRetries} attempts.`);
        throw err;
      }

      const delay = Math.pow(2, attempt) * 1000;
      console.log(`[Storage] Retrying in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }

  throw new Error('Upload process terminated unexpectedly.');
}

/**
 * Client-side file validation.
 */
export function validateFile(file: File) {
  const MAX_SIZE = 20 * 1024 * 1024; // 20MB
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
    throw new Error(`File "${file.name}" is too large. Maximum size is 20MB.`);
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`File type "${file.type}" is not supported. Please upload PDF, Word, Excel, or Images.`);
  }

  return true;
}
