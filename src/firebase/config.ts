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

/**
 * Validates the configuration to prevent initialization crashes.
 * Returns true if the configuration appears valid.
 */
export function isFirebaseConfigValid() {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== 'your-api-key' &&
    firebaseConfig.projectId
  );
}

// Audit and validate configuration on startup
if (typeof window !== 'undefined') {
  console.group('📡 Firebase Configuration Audit');
  console.log('Project ID:', firebaseConfig.projectId || '❌ MISSING');
  console.log('API Key Detected:', !!firebaseConfig.apiKey);
  
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('your-api-key')) {
    console.error('Firebase Error: Invalid or missing API Key. Check your .env file and ensure NEXT_PUBLIC_FIREBASE_API_KEY is set.');
  }
  
  if (!firebaseConfig.storageBucket) {
    console.warn('Firebase Warning: Storage Bucket is not configured. Some legacy Firebase features may fail.');
  }
  console.groupEnd();
}
