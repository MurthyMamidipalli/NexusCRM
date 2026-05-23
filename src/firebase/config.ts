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
 */
export function isFirebaseConfigValid() {
  const { projectId, appId, apiKey, messagingSenderId } = firebaseConfig;
  
  if (typeof window !== 'undefined') {
    console.group('🔍 NEXUS HUB: FINAL ENVIRONMENT AUDIT');
    console.log('PROJECT_ID:', projectId || 'MISSING');
    console.log('AUTH_DOMAIN:', firebaseConfig.authDomain || 'MISSING');
    console.log('SENDER_ID:', messagingSenderId || 'MISSING');
    console.log('APP_ID:', appId || 'MISSING');
    console.log('API_KEY_PRESENT:', !!apiKey);
    
    const isPlaceholderApp = appId?.includes('1234567890') || appId?.includes('abcdef');
    const isCorrectProject = projectId === 'studio-3717134241-d7612';

    if (!isCorrectProject) {
      console.warn('❌ INCORRECT PROJECT: Expected studio-3717134241-d7612 but got', projectId);
    }
    if (isPlaceholderApp) {
      console.error('❌ PLACEHOLDER DETECTED: App ID is still using a generic placeholder value.');
    }
    if (!apiKey) {
      console.error('❌ API KEY MISSING: Authentication will fail.');
    }
    
    console.groupEnd();
  }
  
  // Return true only if key and project are present (allowing placeholder app id for boot)
  return !!(apiKey && projectId && projectId !== 'undefined');
}
