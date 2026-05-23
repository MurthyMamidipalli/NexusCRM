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
import { firebaseConfig, auditFirebaseConfig } from './config';

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

/**
 * Initializes Firebase services with a robust singleton pattern.
 * This is the ONLY place initializeApp should be called.
 */
export function initializeFirebase() {
  // Perform diagnostic audit on every initialization attempt
  auditFirebaseConfig();

  try {
    // 1. Initialize or Retrieve App Instance
    if (getApps().length === 0) {
      console.log('[Firebase] 🚀 Initializing primary app instance...');
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
      console.log('[Firebase] ♻️ Reusing existing app instance.');
    }

    // 2. Initialize Firestore with Persistent Cache
    if (!db) {
      try {
        db = initializeFirestore(app, {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
          }),
        });
        console.log('[Firestore] ✅ Persistent cache active.');
      } catch (e) {
        db = getFirestore(app);
        console.warn('[Firestore] ⚠️ Initialized with default settings (no cache).');
      }
    }
    
    // 3. Initialize Auth Service
    if (!auth) {
      auth = getAuth(app);
      console.log('[Auth] ✅ Service instance ready.');
    }

    // 4. Initialize Storage Service
    if (!storage) {
      storage = getStorage(app);
      console.log('[Storage] ✅ Service instance ready.');
    }
  } catch (err) {
    console.error('[Firebase] ❌ Fatal initialization error:', err);
    // We do not throw here to avoid crashing the entire Next.js rendering pipeline
  }
  
  return { app, auth, db, storage };
}

export { FirebaseProvider, useFirebase, useAuth, useFirestore, useFirebaseApp, useStorage } from './provider';
export { FirebaseClientProvider } from './client-provider';
export { useUser } from './auth/use-user';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';
