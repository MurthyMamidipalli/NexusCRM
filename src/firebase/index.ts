
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
import { firebaseConfig } from './config';

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

/**
 * Initializes Firebase services with a robust singleton pattern.
 * Ensures offline persistence is only configured on the client side once.
 */
export function initializeFirebase() {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  if (!db) {
    // Check if we are in the browser to enable persistence
    if (typeof window !== 'undefined') {
      try {
        db = initializeFirestore(app, {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
          }),
        });
      } catch (e) {
        // Fallback if initializeFirestore was already called elsewhere
        db = getFirestore(app);
      }
    } else {
      // Server-side uses standard Firestore instance
      db = getFirestore(app);
    }
  }
  
  if (!auth) {
    auth = getAuth(app);
  }
  
  return { app, auth, db };
}

export { FirebaseProvider, useFirebase, useAuth, useFirestore, useFirebaseApp } from './provider';
export { FirebaseClientProvider } from './client-provider';
export { useUser } from './auth/use-user';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';
