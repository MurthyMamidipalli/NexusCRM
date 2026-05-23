'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useAuth } from '../provider';

/**
 * Enhanced hook to track user authentication state with diagnostic tracing.
 */
export function useUser() {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[Auth Hook] Initializing observer for Auth state changes...');
    
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.group('[Auth Hook] onAuthStateChanged Triggered');
      if (firebaseUser) {
        console.log('STATUS: Authenticated');
        console.log('UID:', firebaseUser.uid);
        console.log('EMAIL:', firebaseUser.email);
        console.log('TOKEN_REFRESH_TIME:', new Date().toLocaleTimeString());
      } else {
        console.warn('STATUS: Unauthenticated (User is null)');
      }
      console.groupEnd();

      setUser(firebaseUser);
      setLoading(false);
    });
    
    return () => {
      console.log('[Auth Hook] Cleaning up observer.');
      unsubscribe();
    };
  }, [auth]);

  return { user, loading };
}
