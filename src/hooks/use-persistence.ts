
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { usePersistenceStatus } from '@/components/providers/persistence-provider';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

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
  const dataRef = useRef<T>(initialData);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (initialData) {
      setLocalData((prev) => {
        const prevString = JSON.stringify(prev);
        const nextString = JSON.stringify(initialData);
        if (prevString === nextString) return prev;
        return initialData;
      });
      dataRef.current = initialData;
    }
  }, [initialData]);

  const saveToFirestore = useCallback((dataToSave: any) => {
    if (!db || !user || !docId) return;

    setStatus('saving');
    const docRef = doc(db, collectionName, docId);
    
    setDoc(docRef, {
      ...dataToSave,
      ownerId: user.uid,
      updatedAt: serverTimestamp(),
    }, { merge: true })
      .then(() => {
        setStatus('saved');
        setTimeout(() => setStatus('idle'), 2000);
      })
      .catch(async (err) => {
        console.error('Persistence Error:', err);
        setStatus('error');
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'write',
          requestResourceData: dataToSave,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
  }, [db, user, docId, collectionName, setStatus]);

  const updateField = (field: keyof T, value: any) => {
    const updated = { ...localData, [field]: value };
    setLocalData(updated);
    dataRef.current = updated;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      saveToFirestore(updated);
      timeoutRef.current = null;
    }, 1500);
  };

  const manualSave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    saveToFirestore(dataRef.current);
  };

  return { 
    data: localData, 
    updateField, 
    setLocalData,
    save: manualSave
  };
}
