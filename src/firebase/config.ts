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
 */
export function isFirebaseConfigValid() {
  const key = firebaseConfig.apiKey;
  const isValid = !!(
    key && 
    key !== 'AIzaSyA_placeholder_key' &&
    key !== 'undefined' &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== 'undefined'
  );
  
  if (!isValid && typeof window !== 'undefined') {
    console.error('❌ Firebase Config Invalid or Missing. Current state:', {
      hasApiKey: !!key,
      keyPrefix: key ? key.substring(0, 5) + '...' : 'none',
      projectId: firebaseConfig.projectId
    });
  }
  
  return isValid;
}
