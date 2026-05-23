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
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { firebaseConfig, isFirebaseConfigValid } from './config';

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

/**
 * Initializes Firebase services with a robust singleton pattern.
 */
export function initializeFirebase() {
  // Perform diagnostic audit
  isFirebaseConfigValid();

  try {
    if (getApps().length === 0) {
      console.log('[Firebase] 🚀 Initializing primary app instance...');
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
      console.log('[Firebase] ♻️ Reusing existing app instance.');
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

    if (!storage) {
      storage = getStorage(app);
    }
  } catch (err) {
    console.error('[Firebase] ❌ Critical initialization error:', err);
  }
  
  return { app, auth, db, storage };
}

export { FirebaseProvider, useFirebase, useAuth, useFirestore, useFirebaseApp, useStorage } from './provider';
export { FirebaseClientProvider } from './client-provider';
export { useUser } from './auth/use-user';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';
