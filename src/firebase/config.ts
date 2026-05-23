'use client';

/**
 * @fileOverview Firebase Configuration Diagnostics
 * This file maps environment variables to the Firebase SDK.
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
 * Performs a deep audit of the current Firebase configuration.
 * Logs status to console to identify 'auth/api-key-not-valid' issues.
 */
export function isFirebaseConfigValid() {
  const key = firebaseConfig.apiKey;
  const pId = firebaseConfig.projectId;
  
  const hasKey = !!(key && key !== 'undefined' && key.length > 10);
  const hasProjectId = !!(pId && pId !== 'undefined');
  
  if (typeof window !== 'undefined') {
    console.group('🔥 Firebase Configuration Audit');
    console.log('API Key Status:', hasKey ? '✅ DETECTED' : '❌ MISSING/INVALID');
    console.log('Project ID Status:', hasProjectId ? `✅ (${pId})` : '❌ MISSING');
    console.log('Auth Domain:', firebaseConfig.authDomain || '❌ MISSING');
    
    if (!hasKey) {
      console.error('CRITICAL: NEXT_PUBLIC_FIREBASE_API_KEY is not being read correctly.');
      console.log('Current value starts with:', key ? key.substring(0, 5) + '...' : 'null');
    }
    console.groupEnd();
  }
  
  return hasKey && hasProjectId;
}
