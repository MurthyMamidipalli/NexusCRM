
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
 * Initializes Firebase services with singleton protection and diagnostic logging.
 */
export function initializeFirebase() {
  const isValid = isFirebaseConfigValid();

  if (!isValid) {
    console.warn('[Firebase] Initialization proceeding with configuration warnings.');
  }

  try {
    if (getApps().length === 0) {
      console.log('[Firebase] Initializing new app instance...');
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
          console.log('[Firestore] Persistent cache enabled.');
        } catch (e) {
          db = getFirestore(app);
          console.warn('[Firestore] Falling back to default initialization.');
        }
      } else {
        db = getFirestore(app);
      }
    }
    
    if (!auth) {
      auth = getAuth(app);
      console.log('[Auth] Service instance initialized.');
    }

    if (!storage) {
      storage = getStorage(app);
      console.log('[Storage] Service instance initialized.');
    }
  } catch (err) {
    console.error('[Firebase] Fatal initialization error:', err);
  }
  
  return { app, auth, db, storage };
}

export { FirebaseProvider, useFirebase, useAuth, useFirestore, useFirebaseApp, useStorage } from './provider';
export { FirebaseClientProvider } from './client-provider';
export { useUser } from './auth/use-user';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';
