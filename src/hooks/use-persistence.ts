
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { usePersistenceStatus } from '@/components/providers/persistence-provider';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

/**
 * A robust hook for auto-saving form data to Firestore.
 * Ensures that the Auth UID is always used as the document ID for profiles.
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

  // Sync with incoming remote data
  useEffect(() => {
    if (initialData && Object.keys(initialData as any).length > 0) {
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
    // CRITICAL: Ensure we have a user and a target ID
    if (!db || !user || !docId) {
      console.warn('⚠️ Save aborted: Missing required context (db, user, or docId).');
      return;
    }

    setStatus('saving');
    // For profiles, docId is the UID. For others, it's the record ID.
    const docRef = doc(db, collectionName, docId);
    
    const payload = {
      ...dataToSave,
      ownerId: user.uid,
      updatedAt: serverTimestamp(),
    };

    setDoc(docRef, payload, { merge: true })
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
          requestResourceData: payload,
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
    }, 1000);
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
