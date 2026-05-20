
'use client';

/**
 * Firebase configuration object.
 * Uses NEXT_PUBLIC environment variables for client-side access.
 */
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Log a warning if the API key is missing or is a placeholder
if (typeof window !== 'undefined') {
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('your-api-key')) {
    console.error('Firebase Error: Invalid or missing API Key in .env file. Please check your NEXT_PUBLIC_FIREBASE_API_KEY.');
  }
}
