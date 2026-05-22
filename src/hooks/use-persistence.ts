
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
  // We use structural comparison to prevent infinite render loops when initialData
  // is passed as a new object literal (e.g., data || {})
  useEffect(() => {
    if (initialData) {
      setLocalData((prev) => {
        const prevString = JSON.stringify(prev);
        const nextString = JSON.stringify(initialData);
        if (prevString === nextString) return prev;
        return initialData;
      });
    }
  }, [initialData]);

  const saveToFirestore = useCallback(async (dataToSave: any) => {
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
      saveToFirestore(updated);
      timeoutRef.current = null;
    }, 1500); // 1.5s debounce
  };

  const updateFields = (updates: Partial<T>) => {
    const updated = { ...localData, ...updates };
    setLocalData(updated);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      saveToFirestore(updated);
      timeoutRef.current = null;
    }, 1500);
  };

  const manualSave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    saveToFirestore(localData);
  };

  return { 
    data: localData, 
    updateField, 
    updateFields,
    setLocalData,
    save: manualSave
  };
}
