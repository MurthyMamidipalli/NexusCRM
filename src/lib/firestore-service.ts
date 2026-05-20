import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  onSnapshot, 
  orderBy,
  Timestamp,
  type DocumentData,
  type QueryConstraint
} from 'firebase/firestore';
import { db } from './firebase';

export const collections = {
  LEADS: 'leads',
  CUSTOMERS: 'customers',
  DEALS: 'deals',
  TASKS: 'tasks',
  ACTIVITIES: 'activities',
  DOCUMENTS: 'documents'
};

export async function createRecord(collectionName: string, data: any) {
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