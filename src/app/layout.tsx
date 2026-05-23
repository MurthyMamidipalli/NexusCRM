import type {Metadata} from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Toaster } from '@/components/ui/toaster';
import { PersistenceProvider } from '@/components/providers/persistence-provider';
import { FirebaseErrorListener } from '@/components/firebase-error-listener';

export const metadata: Metadata = {
  title: 'NexusCRM | Intelligence Powered Sales',
  description: 'A modern, production-ready Customer Relationship Management platform.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // SERVER-SIDE DIAGNOSTIC LOG
  console.log('--- SERVER ENVIRONMENT START ---');
  console.log('NEXT_PUBLIC_FIREBASE_PROJECT_ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  console.log('NEXT_PUBLIC_FIREBASE_API_KEY EXISTS:', !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
  console.log('--- SERVER ENVIRONMENT END ---');

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased selection:bg-primary/30" suppressHydrationWarning>
        <FirebaseClientProvider>
          <PersistenceProvider>
            <FirebaseErrorListener />
            {children}
            <Toaster />
          </PersistenceProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
