'use client';

/**
 * Firebase configuration object.
 * Uses NEXT_PUBLIC environment variables for client-side access.
 */
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Audit and validate configuration on startup
if (typeof window !== 'undefined') {
  console.group('📡 Firebase Configuration Audit');
  console.log('Project ID:', firebaseConfig.projectId);
  console.log('Storage Bucket:', firebaseConfig.storageBucket || '❌ MISSING');
  
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('your-api-key')) {
    console.error('Firebase Error: Invalid or missing API Key in .env file.');
  }
  
  if (!firebaseConfig.storageBucket) {
    console.error('Firebase Error: Storage Bucket is not configured. Uploads will fail with CORS or 404 errors.');
  }
  console.groupEnd();
}
