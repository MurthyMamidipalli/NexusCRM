'use client';

/**
 * @fileOverview Authoritative Firebase Configuration
 * Forces the correct project identifiers to prevent host-environment overrides
 * from injecting "n-crm-40177" or placeholder values.
 */

const TARGET_PROJECT_ID = 'studio-3717134241-d7612';
const TARGET_APP_ID = '1:479443906344:web:c709ce1776169302c92a1d';

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: `${TARGET_PROJECT_ID}.firebaseapp.com`,
  projectId: TARGET_PROJECT_ID,
  storageBucket: `${TARGET_PROJECT_ID}.firebasestorage.app`,
  messagingSenderId: "479443906344",
  appId: TARGET_APP_ID
};

/**
 * Performs a runtime audit of the Firebase configuration.
 * Logs results to the console to help identify misconfigurations.
 */
export function isFirebaseConfigValid() {
  if (typeof window === 'undefined') return false;

  const { projectId, appId, apiKey } = firebaseConfig;
  const isPlaceholderApp = appId.includes('1234567890');
  const isCorrectProject = projectId === TARGET_PROJECT_ID;

  console.group('🔍 FIREBASE RUNTIME AUDIT');
  console.log('Project ID:', projectId, isCorrectProject ? '✅' : `❌ (Expected ${TARGET_PROJECT_ID})`);
  console.log('App ID:', appId, isPlaceholderApp ? '❌ (PLACEHOLDER DETECTED)' : '✅');
  console.log('API Key Status:', !!apiKey ? '✅ PRESENT' : '❌ MISSING');
  if (apiKey) {
    console.log('API Key Preview:', `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`);
  }
  console.groupEnd();

  return !isPlaceholderApp && !!apiKey && isCorrectProject;
}
