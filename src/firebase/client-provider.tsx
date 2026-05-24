'use client';

import React, { useMemo } from 'react';
import { initializeFirebase, FirebaseProvider } from './index';

export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const { app, auth, db } = useMemo(() => initializeFirebase(), []);

  return (
    <FirebaseProvider app={app} auth={auth} db={db}>
      {children}
    </FirebaseProvider>
  );
}
