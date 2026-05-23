
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
    console.log('[Auth] Initializing observer for Auth state changes...');
    
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        console.log('[Auth] User detected:', firebaseUser.uid, '| Email:', firebaseUser.email);
      } else {
        console.warn('[Auth] No active session found.');
      }
      setUser(firebaseUser);
      setLoading(false);
    });
    
    return () => {
      console.log('[Auth] Cleaning up observer.');
      unsubscribe();
    };
  }, [auth]);

  return { user, loading };
}
