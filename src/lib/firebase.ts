
import { initializeFirebase } from '@/firebase';

/**
 * Re-exporting initialized services from the central Firebase index.
 * This ensures consistency and prevents multiple initializations.
 */
const { auth, db } = initializeFirebase();
const storage = null; // Storage will be initialized when needed

export { auth, db, storage };
