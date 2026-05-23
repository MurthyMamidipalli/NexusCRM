'use client';

/**
 * @fileOverview Firebase Configuration Trace & Audit
 * Captures and logs environment variables to diagnose project ID and App ID mismatches.
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
 * Detailed audit of environment variables.
 * Uses warnings instead of errors to prevent Next.js dev-overlay crashes.
 */
export function isFirebaseConfigValid() {
  const { projectId, appId, apiKey } = firebaseConfig;
  
  if (typeof window !== 'undefined') {
    console.group('🔍 NEXUS HUB: ENVIRONMENT SYNC AUDIT');
    console.log('PROJECT_ID:', projectId || 'MISSING');
    console.log('APP_ID:', appId || 'MISSING');
    console.log('API_KEY_PRESENT:', !!apiKey);
    
    const isPlaceholderApp = appId?.includes('1234567890') || appId?.includes('abcdef');
    const isCorrectProject = projectId === 'studio-3717134241-d7612';

    if (!isCorrectProject && projectId) {
      console.warn('⚠️ PROJECT MISMATCH: Host is serving', projectId, 'but expected studio-3717134241-d7612');
    }
    if (isPlaceholderApp) {
      console.warn('⚠️ APP_ID PLACEHOLDER: The platform is still injecting a placeholder App ID. Synchronization in progress...');
    }
    if (!apiKey) {
      console.warn('⚠️ API KEY MISSING: Authentication features will be disabled.');
    }
    
    console.groupEnd();
  }
  
  // Return true if we have the bare minimum to attempt boot
  return !!(projectId && projectId !== 'undefined');
}
