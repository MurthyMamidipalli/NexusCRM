import { initializeFirebase } from '@/firebase';

/**
 * Re-exporting initialized services from the central Firebase index.
 * This ensures consistency and prevents multiple initializations.
 */
const { auth, db, storage } = initializeFirebase();

export { auth, db, storage };
