'use client';

/**
 * @fileOverview Authoritative Firebase Configuration
 * Forces the correct project identifiers to prevent host-environment overrides or placeholders.
 */

const AUTH_CONFIG = {
  apiKey: "AIzaSyD1MHSiCtKTqko36dBT58Tks1e0paGmblA",
  authDomain: "studio-3717134241-d7612.firebaseapp.com",
  projectId: "studio-3717134241-d7612",
  storageBucket: "studio-3717134241-d7612.firebasestorage.app",
  messagingSenderId: "479443906344",
  appId: "1:479443906344:web:c709ce1776169302c92a1d"
};

export const firebaseConfig = {
  apiKey: AUTH_CONFIG.apiKey,
  authDomain: AUTH_CONFIG.authDomain,
  projectId: AUTH_CONFIG.projectId,
  storageBucket: AUTH_CONFIG.storageBucket,
  messagingSenderId: AUTH_CONFIG.messagingSenderId,
  appId: AUTH_CONFIG.appId
};

/**
 * Performs a runtime audit of the Firebase configuration.
 */
export function isFirebaseConfigValid() {
  if (typeof window === 'undefined') return false;

  const { projectId, appId, apiKey, storageBucket } = firebaseConfig;
  const isPlaceholderApp = appId.includes('1234567890');
  
  console.group('🔍 NEXUS HUB: RUNTIME ENVIRONMENT AUDIT');
  console.log('Project ID:', projectId);
  console.log('App ID:', appId);
  console.log('Storage Bucket:', storageBucket);
  
  if (apiKey && apiKey.length > 10) {
    const preview = `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`;
    console.log('API Key Status: ✅ VALID FORMAT (' + preview + ')');
  } else {
    console.warn('API Key Status: ❌ INVALID OR MISSING.');
  }

  if (isPlaceholderApp) {
    console.warn('⚠️ WARNING: App ID appears to be a placeholder.');
  }
  
  console.groupEnd();

  return !!apiKey && !!projectId && !isPlaceholderApp;
}
