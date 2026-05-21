
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
  CAREER: 'profiles' // Store current job info in profile
};

/**
 * Creates a new record in the specified collection.
 */
export function createRecord(db: Firestore, collectionName: string, data: any) {
  if (!collectionName) throw new Error('Collection name is required');
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
  if (!collectionName || !id) throw new Error('Collection name and ID are required');
  const docRef = doc(db, collectionName, id);
  return deleteDoc(docRef);
}
