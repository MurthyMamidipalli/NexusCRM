/**
 * @fileOverview Firebase Service Singleton Exports
 * This file serves as a simplified bridge for non-hook logic to access
 * the initialized Firebase services.
 */

import { initializeFirebase } from '@/firebase';

// Since initializeFirebase is idempotent and singleton-protected, 
// this safely ensures we use the same instances everywhere.
const { auth, db, storage } = initializeFirebase();

export { auth, db, storage };
