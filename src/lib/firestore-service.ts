'use client';

import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  Firestore
} from 'firebase/firestore';

export const collections = {
  PROFILES: 'profiles',
  SKILLS: 'skills',
  EXPERIENCE: 'experience',
  EDUCATION: 'education',
  PROJECTS: 'projects',
  ACHIEVEMENTS: 'achievements',
  TESTIMONIALS: 'testimonials',
  CONTACTS: 'contacts',
  CUSTOMERS: 'contacts', 
  DOCUMENTS: 'documents',
  TASKS: 'tasks',
  MEETINGS: 'meetings',
  LEADS: 'leads',
  CERTIFICATIONS: 'certifications',
  LINKS: 'links',
  RESUMES: 'resumes'
};

/**
 * Creates a new record in the specified collection.
 * Automatically adds ownership and timestamps.
 */
export function createRecord(db: Firestore, collectionName: string, data: any, userId?: string) {
  console.log(`[Firestore] Attempting to create record in ${collectionName}`);
  
  if (!collectionName) throw new Error('Collection name is required');
  const colRef = collection(db, collectionName);
  
  const finalUserId = userId || data.ownerId;
  if (!finalUserId) {
    throw new Error(`Record creation failed: Auth UID is required to save data to ${collectionName}.`);
  }

  const payload = {
    ...data,
    ownerId: finalUserId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  // NON-BLOCKING: Return promise but allow UI to continue
  return addDoc(colRef, payload);
}

/**
 * Updates an existing record.
 */
export function updateRecord(db: Firestore, collectionName: string, id: string, data: any) {
  console.log(`[Firestore] Attempting to update record ${id} in ${collectionName}`);
  if (!collectionName || !id) throw new Error('Collection name and ID are required');
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
  console.log(`[Firestore] Attempting to delete record ${id} in ${collectionName}`);
  if (!collectionName || !id) throw new Error('Collection name and ID are required');
  const docRef = doc(db, collectionName, id);
  return deleteDoc(docRef);
}
