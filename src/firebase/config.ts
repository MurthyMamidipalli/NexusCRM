'use client';

/**
 * @fileOverview Firebase Configuration Trace & Audit
 * This file captures and logs all environment variables to diagnose 
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
 * Exhaustive diagnostic audit of injected workspace environment variables.
 */
export function isFirebaseConfigValid() {
  if (typeof window !== 'undefined') {
    console.group('🔍 NEXUS HUB: ENVIRONMENT TRACE');
    console.log('--- FIREBASE IDENTITY ---');
    console.log('PROJECT_ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
    console.log('AUTH_DOMAIN:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
    console.log('APP_ID:', process.env.NEXT_PUBLIC_FIREBASE_APP_ID);
    
    console.log('--- AUTHENTICATION ---');
    console.log('API_KEY (RAW):', process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
    console.log('API_KEY EXISTS:', !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
    console.log('API_KEY VALID FORMAT:', !!(process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY.startsWith('AIza')));

    console.log('--- INFRASTRUCTURE ---');
    console.log('STORAGE_BUCKET:', process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
    console.log('MESSAGING_SENDER_ID:', process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID);
    
    console.log('--- SUPABASE (CROSS-CLOUD) ---');
    console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.groupEnd();
  }
  
  const hasKey = !!(firebaseConfig.apiKey && firebaseConfig.apiKey !== 'undefined');
  const hasProjectId = !!(firebaseConfig.projectId && firebaseConfig.projectId !== 'undefined');
  
  return hasKey && hasProjectId;
}
