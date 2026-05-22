
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
          description: 'This view requires a specific database index. Please open your browser console and click the provided setup link.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Access Restricted',
          description: `Security violation at: ${error.context.path}. Ensure you are logged in and have permission to perform this action.`,
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
