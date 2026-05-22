
'use client';

import { useState, useEffect } from 'react';
import { 
  DocumentReference, 
  onSnapshot, 
  DocumentSnapshot, 
  DocumentData, 
  FirestoreError 
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

/**
 * Hook to listen to a single document.
 * @param ref - The document reference.
 * @param options - Configuration options.
 * @param options.silent - If true, prevents emitting global permission errors (useful for public pages).
 */
export function useDoc<T = DocumentData>(
  ref: DocumentReference<T> | null, 
  options?: { silent?: boolean }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!ref) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      ref,
      (snapshot: DocumentSnapshot<T>) => {
        setData(snapshot.exists() ? { ...snapshot.data()!, id: snapshot.id } : null);
        setLoading(false);
      },
      async (err) => {
        // Emit the error unless silent mode is requested
        if (!options?.silent) {
          const permissionError = new FirestorePermissionError({
            path: ref.path,
            operation: 'get',
          } satisfies SecurityRuleContext);
          errorEmitter.emit('permission-error', permissionError);
        }

        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [ref, options?.silent]);

  return { data, loading, error };
}
