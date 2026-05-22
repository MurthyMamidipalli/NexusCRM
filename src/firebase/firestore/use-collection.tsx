
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
 * @param query - The Firestore query.
 * @param options - Configuration options.
 * @param options.silent - If true, prevents emitting global permission errors.
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
      },
      async (err) => {
        // ONLY emit a permission error if the code matches. 
        // Other errors (like missing indexes) should be handled by the component.
        if (!options?.silent && err.code === 'permission-denied') {
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
