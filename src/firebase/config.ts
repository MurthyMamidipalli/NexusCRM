'use client';

/**
 * @fileOverview Firebase Configuration Trace & Audit
 * This file captures and logs environment variables to diagnose 
 * project ID mismatches and invalid API keys.
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
 * Audit of injected workspace environment variables.
 * Relaxed to prevent boot crashes while allowing diagnostics.
 */
export function isFirebaseConfigValid() {
  const activeProjectId = firebaseConfig.projectId;
  const activeAppId = firebaseConfig.appId;
  
  if (typeof window !== 'undefined') {
    const isIncorrectProject = activeProjectId === 'n-crm-40177';
    const isPlaceholderApp = activeAppId?.includes('1234567890');
    
    console.group('🔍 NEXUS HUB: CLIENT ENVIRONMENT TRACE');
    console.log('PROJECT_ID:', activeProjectId || 'MISSING');
    console.log('APP_ID:', activeAppId || 'MISSING');
    
    if (isIncorrectProject) {
      console.warn('⚠️ WARNING: Environment is serving the default project (n-crm-40177). Synchronization may be in progress.');
    }
    if (isPlaceholderApp) {
      console.warn('⚠️ WARNING: App ID appears to be a placeholder value.');
    }
    console.groupEnd();
  }
  
  const hasKey = !!(firebaseConfig.apiKey && firebaseConfig.apiKey !== 'undefined' && !firebaseConfig.apiKey.includes('placeholder'));
  const hasProjectId = !!(activeProjectId && activeProjectId !== 'undefined');
  
  return hasKey && hasProjectId;
}
