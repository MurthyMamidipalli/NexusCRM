
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
      // Check if it's a common "index" error or a standard permission denied
      const isIndexError = error.message.toLowerCase().includes('index');
      
      toast({
        variant: 'destructive',
        title: isIndexError ? 'Database Index Required' : 'Access Restricted',
        description: isIndexError 
          ? 'This view requires a database index. Please check your browser console for the setup link.' 
          : `Security violation at: ${error.context.path}. You may not have permission to ${error.context.operation} this record.`,
      });
    };

    errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  return null;
}
