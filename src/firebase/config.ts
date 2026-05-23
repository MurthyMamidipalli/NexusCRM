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
  const { projectId, appId, apiKey, authDomain } = firebaseConfig;
  
  if (typeof window !== 'undefined') {
    console.group('🔍 NEXUS HUB: RUNTIME ENVIRONMENT AUDIT');
    console.log('PROJECT_ID:', projectId || '❌ MISSING');
    console.log('AUTH_DOMAIN:', authDomain || '❌ MISSING');
    console.log('APP_ID:', appId || '❌ MISSING');
    console.log('API_KEY_PRESENT:', !!apiKey ? '✅ YES' : '❌ NO');
    
    const isPlaceholderApp = appId?.includes('1234567890') || appId?.includes('abcdef');
    const isTargetProject = projectId === 'studio-3717134241-d7612';
    const isTargetApp = appId === '1:479443906344:web:c709ce1776169302c92a1d';

    if (isPlaceholderApp) {
      console.warn('⚠️ WARNING: App ID is a generic placeholder (1:1234567890...).');
    }
    
    if (isTargetProject) {
      console.log('✅ PROJECT MATCH: Successfully targeting studio-3717134241-d7612');
    } else {
      console.warn(`⚠️ PROJECT MISMATCH: Expected studio-3717134241-d7612, got ${projectId}`);
    }

    if (isTargetApp) {
      console.log('✅ APP ID MATCH: Successfully targeting 1:479443906344...');
    } else if (!isPlaceholderApp) {
      console.warn(`⚠️ APP ID MISMATCH: Current App ID is ${appId}`);
    }
    
    console.groupEnd();
  }
  
  // We return true even with warnings to allow the app to attempt connection
  return !!(projectId && apiKey && appId);
}
