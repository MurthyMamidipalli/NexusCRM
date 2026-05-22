'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

/**
 * A global listener component that catches Firebase errors emitted
 * from anywhere in the application and surfaces them as toasts.
 */
export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      const msg = error.context.originalError?.message || '';
      const isIndexError = msg.toLowerCase().includes('index') || error.message.toLowerCase().includes('index');
      
      if (isIndexError) {
        toast({
          variant: 'destructive',
          title: 'Database Index Required',
          description: 'A composite index is missing for this view. Please open the browser console and follow the provided link to create it.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Access Restricted',
          description: `You do not have permission to access these records at: ${error.context.path}. Please ensure you are correctly logged in.`,
        });
      }
    };

    errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  return null;
}