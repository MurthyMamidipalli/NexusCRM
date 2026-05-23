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
 * Initializes Firebase services with singleton protection.
 * Error handling is graceful to prevent SSR crashes.
 */
export function initializeFirebase() {
  const isValid = isFirebaseConfigValid();

  if (!isValid) {
    console.error('Firebase configuration is incomplete. Auth and Firestore features may fail.');
    // We proceed to initialize if possible, or return existing instances to avoid breaking the UI tree
  }

  try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }

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
    
    if (!auth) {
      auth = getAuth(app);
    }

    if (!storage) {
      storage = getStorage(app);
    }
  } catch (err) {
    console.error('Firebase initialization failed critical check:', err);
  }
  
  return { app, auth, db, storage };
}

export { FirebaseProvider, useFirebase, useAuth, useFirestore, useFirebaseApp, useStorage } from './provider';
export { FirebaseClientProvider } from './client-provider';
export { useUser } from './auth/use-user';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';
