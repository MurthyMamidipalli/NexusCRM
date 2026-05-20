
'use client';

import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  onSnapshot, 
  serverTimestamp,
  type QueryConstraint,
  Firestore
} from 'firebase/firestore';

export const collections = {
  LEADS: 'leads',
  CUSTOMERS: 'customers',
  DEALS: 'deals',
  TASKS: 'tasks',
  MEETINGS: 'meetings',
  ACTIVITIES: 'activities',
  DOCUMENTS: 'documents'
};

/**
 * Creates a new record in the specified collection.
 */
export function createRecord(db: Firestore, collectionName: string, data: any) {
  const colRef = collection(db, collectionName);
  return addDoc(colRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

/**
 * Updates an existing record.
 */
export function updateRecord(db: Firestore, collectionName: string, id: string, data: any) {
  const docRef = doc(db, collectionName, id);
  return updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
}

/**
 * Deletes a record.
 */
export function deleteRecord(db: Firestore, collectionName: string, id: string) {
  const docRef = doc(db, collectionName, id);
  return deleteDoc(docRef);
}
