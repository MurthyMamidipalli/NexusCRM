'use client';

/**
 * @fileOverview Authoritative Firebase Configuration
 * Ensures that environment variables are mapped correctly and provides
 * a validation layer to detect placeholders.
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
 * Performs a runtime audit of the Firebase configuration.
 * Logs results to the console to help identify misconfigurations.
 */
export function auditFirebaseConfig() {
  if (typeof window === 'undefined') return;

  const { projectId, appId, apiKey } = firebaseConfig;
  const isPlaceholderApp = appId?.includes('1234567890') || appId?.includes('abcdef');
  const isCorrectProject = projectId === 'studio-3717134241-d7612';

  console.group('🔍 FIREBASE RUNTIME AUDIT');
  console.log('Project ID:', projectId, isCorrectProject ? '✅' : '❌ (Expected studio-3717134241-d7612)');
  console.log('App ID:', appId, isPlaceholderApp ? '❌ (PLACEHOLDER DETECTED)' : '✅');
  console.log('API Key Present:', !!apiKey ? '✅' : '❌ (MISSING)');
  console.groupEnd();

  return !isPlaceholderApp && !!apiKey && !!projectId;
}
