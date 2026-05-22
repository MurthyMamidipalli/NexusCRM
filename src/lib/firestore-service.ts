
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
  CAREER: 'profiles',
  RESUMES: 'resumes'
};

/**
 * Creates a new record in the specified collection.
 * Automatically adds ownership and timestamps.
 */
export function createRecord(db: Firestore, collectionName: string, data: any, userId?: string) {
  if (!collectionName) throw new Error('Collection name is required');
  const colRef = collection(db, collectionName);
  
  const payload = {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  if (userId) {
    payload.ownerId = userId;
  }

  return addDoc(colRef, payload);
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
