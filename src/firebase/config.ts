
'use client';

/**
 * Firebase configuration object.
 * We prioritize environment variables but provide structure to ensure the app handles missing keys gracefully.
 */
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Log warning if config is incomplete
if (typeof window !== 'undefined' && !config.apiKey) {
  console.warn('Firebase configuration is missing. Authentication and Firestore will not function until .env variables are populated.');
}

export const firebaseConfig = config as any;
