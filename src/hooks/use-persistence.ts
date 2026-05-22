
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, setDoc, serverTimestamp, Firestore } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { usePersistenceStatus } from '@/components/providers/persistence-provider';

/**
 * A robust hook for auto-saving form data to Firestore.
 * Handles debouncing, user-scoping, and global status reporting.
 */
export function usePersistentDocument<T>(
  collectionName: string, 
  docId: string | undefined, 
  initialData: T
) {
  const db = useFirestore();
  const { user } = useUser();
  const { setStatus } = usePersistenceStatus();
  const [localData, setLocalData] = useState<T>(initialData);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local state when external initialData (from useDoc/useCollection) changes
  useEffect(() => {
    if (initialData) {
      setLocalData(initialData);
    }
  }, [initialData]);

  const save = useCallback(async (dataToSave: any) => {
    if (!db || !user || !docId) return;

    setStatus('saving');
    try {
      const docRef = doc(db, collectionName, docId);
      await setDoc(docRef, {
        ...dataToSave,
        ownerId: user.uid,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      setStatus('saved');
      // Reset back to idle after a short delay
      setTimeout(() => setStatus('idle'), 2000);
    } catch (error) {
      console.error('Persistence Error:', error);
      setStatus('error');
    }
  }, [db, user, docId, collectionName, setStatus]);

  const updateField = (field: keyof T, value: any) => {
    const updated = { ...localData, [field]: value };
    setLocalData(updated);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      save(updated);
    }, 1500); // 1.5s debounce
  };

  const updateFields = (updates: Partial<T>) => {
    const updated = { ...localData, ...updates };
    setLocalData(updated);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      save(updated);
    }, 1500);
  };

  return { 
    data: localData, 
    updateField, 
    updateFields,
    setLocalData 
  };
}
