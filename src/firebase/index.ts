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
 * Initializes Firebase services with singleton protection and runtime diagnostics.
 */
export function initializeFirebase() {
  // 1. Audit configuration before attempt
  if (!isFirebaseConfigValid()) {
    const errorMsg = 'Firebase initialization halted: Configuration is invalid or incomplete. Check environment variables.';
    console.error(errorMsg);
    // We throw to prevent late-stage crashes in hooks
    throw new Error(errorMsg);
  }

  // 2. Initialize App
  if (getApps().length === 0) {
    console.log('[Firebase] Initializing new instance...');
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  // 3. Initialize Firestore with persistence
  if (!db) {
    if (typeof window !== 'undefined') {
      try {
        db = initializeFirestore(app, {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
          }),
        });
      } catch (e) {
        db = getFirestore(app);
      }
    } else {
      db = getFirestore(app);
    }
  }
  
  // 4. Initialize Auth
  if (!auth) {
    auth = getAuth(app);
  }

  // 5. Initialize Storage
  if (!storage) {
    storage = getStorage(app);
  }
  
  return { app, auth, db, storage };
}

export { FirebaseProvider, useFirebase, useAuth, useFirestore, useFirebaseApp, useStorage } from './provider';
export { FirebaseClientProvider } from './client-provider';
export { useUser } from './auth/use-user';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';
