'use client';

import { initializeApp, getApps, FirebaseApp, getApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { 
  initializeFirestore, 
  Firestore, 
  getFirestore,
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';
import { firebaseConfig, isFirebaseConfigValid } from './config';

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

/**
 * Initializes Firebase services with a robust singleton pattern.
 * Note: Storage has been migrated to Supabase.
 */
export function initializeFirebase() {
  // Perform diagnostic audit
  isFirebaseConfigValid();

  try {
    if (getApps().length === 0) {
      console.log('🚀 [Firebase] Initializing primary app instance...');
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
      console.log('♻️ [Firebase] Reusing existing app instance.');
    }

    if (!db) {
      try {
        db = initializeFirestore(app, {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
          }),
        });
      } catch (e) {
        db = getFirestore(app);
      }
    }
    
    if (!auth) {
      auth = getAuth(app);
    }
  } catch (err) {
    console.error('❌ [Firebase] Critical initialization error:', err);
  }
  
  return { app, auth, db };
}

export { FirebaseProvider, useFirebase, useAuth, useFirestore, useFirebaseApp } from './provider';
export { FirebaseClientProvider } from './client-provider';
export { useUser } from './auth/use-user';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';
