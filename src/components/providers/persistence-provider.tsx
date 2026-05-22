
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type SyncStatus = 'idle' | 'saving' | 'saved' | 'offline' | 'error';

interface PersistenceContextType {
  status: SyncStatus;
  setStatus: (status: SyncStatus) => void;
  isOnline: boolean;
}

const PersistenceContext = createContext<PersistenceContextType | undefined>(undefined);

export function PersistenceProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? window.navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      setStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <PersistenceContext.Provider value={{ status, setStatus, isOnline }}>
      {children}
    </PersistenceContext.Provider>
  );
}

export function usePersistenceStatus() {
  const context = useContext(PersistenceContext);
  if (!context) throw new Error('usePersistenceStatus must be used within PersistenceProvider');
  return context;
}
