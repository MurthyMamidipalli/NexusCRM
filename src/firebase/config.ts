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
 * Exhaustive audit of environment variables at runtime.
 */
export function isFirebaseConfigValid() {
  const { projectId, appId, apiKey, authDomain, messagingSenderId } = firebaseConfig;
  
  if (typeof window !== 'undefined') {
    console.group('🔍 NEXUS HUB: RUNTIME ENVIRONMENT AUDIT');
    console.log('PROJECT_ID:', projectId || '❌ MISSING');
    console.log('AUTH_DOMAIN:', authDomain || '❌ MISSING');
    console.log('SENDER_ID:', messagingSenderId || '❌ MISSING');
    console.log('APP_ID:', appId || '❌ MISSING');
    console.log('API_KEY_PRESENT:', !!apiKey ? '✅ YES' : '❌ NO');
    
    const isPlaceholderApp = appId?.includes('1234567890') || appId?.includes('abcdef');
    const isDefaultProject = projectId === 'studio-3717134241-d7612';

    if (isPlaceholderApp) {
      console.warn('⚠️ APP_ID IS A PLACEHOLDER: 1:1234567890:web:abcdef1234567890 detected.');
    }
    if (!isDefaultProject && projectId) {
      console.warn(`⚠️ PROJECT ID MISMATCH: Running on ${projectId} instead of studio-3717134241-d7612`);
    }
    if (apiKey && apiKey.length < 20) {
      console.error('❌ API KEY INVALID: Key is too short or appears to be a placeholder.');
    }
    
    console.groupEnd();
  }
  
  return !!(projectId && apiKey && appId && !appId.includes('1234567890'));
}
