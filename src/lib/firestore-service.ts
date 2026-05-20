
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  onSnapshot, 
  Timestamp,
  type QueryConstraint
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

// Helper to get db instance in non-hook files
const getDb = () => initializeFirebase().db;

export const collections = {
  LEADS: 'leads',
  CUSTOMERS: 'customers',
  DEALS: 'deals',
  TASKS: 'tasks',
  ACTIVITIES: 'activities',
  DOCUMENTS: 'documents'
};

export async function createRecord(collectionName: string, data: any) {
  const db = getDb();
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return { id: docRef.id, ...data };
  } catch (error) {
    console.error(`Error creating record in ${collectionName}:`, error);
    throw error;
  }
}

export async function updateRecord(collectionName: string, id: string, data: any) {
  const db = getDb();
  try {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error(`Error updating record ${id} in ${collectionName}:`, error);
    throw error;
  }
}

export async function deleteRecord(collectionName: string, id: string) {
  const db = getDb();
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting record ${id} in ${collectionName}:`, error);
    throw error;
  }
}

export function subscribeToCollection(
  collectionName: string, 
  callback: (data: any[]) => void,
  constraints: QueryConstraint[] = []
) {
  const db = getDb();
  const q = query(collection(db, collectionName), ...constraints);
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(items);
  }, (error) => {
    console.error(`Error subscribing to ${collectionName}:`, error);
  });
}
