'use client';

import { useState, useEffect } from 'react';
import { 
  Query, 
  onSnapshot, 
  QuerySnapshot, 
  DocumentData, 
  FirestoreError 
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

/**
 * Hook to listen to a collection or query.
 * Distinguishes between Security Rule violations and Database Index requirements.
 */
export function useCollection<T = DocumentData>(
  query: Query<T> | null,
  options?: { silent?: boolean }
) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      query,
      (snapshot: QuerySnapshot<T>) => {
        const items = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setData(items);
        setLoading(false);
        setError(null);
      },
      async (err) => {
        // Log original error for console diagnostics
        console.error('Firestore Query Error:', err);

        const isPermissionDenied = err.code === 'permission-denied';
        
        if (!options?.silent && isPermissionDenied) {
          const permissionError = new FirestorePermissionError({
            path: 'collection_query',
            operation: 'list',
            originalError: err
          } satisfies SecurityRuleContext);
          errorEmitter.emit('permission-error', permissionError);
        }
        
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [query, options?.silent]);

  return { data, loading, error };
}