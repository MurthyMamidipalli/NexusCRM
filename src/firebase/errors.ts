
'use client';

export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

/**
 * A specialized error class for Firestore permission denials.
 * Surfaces contextual information to help debug Security Rules.
 */
export class FirestorePermissionError extends Error {
  context: SecurityRuleContext;

  constructor(context: SecurityRuleContext) {
    const message = `Firestore Permission Denied: ${context.operation} at ${context.path}`;
    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;

    // Log contextual information for the developer
    console.group('🔥 Firestore Security Rule Violation');
    console.error('Operation:', context.operation);
    console.error('Path:', context.path);
    if (context.requestResourceData) {
      console.error('Data:', context.requestResourceData);
    }
    console.groupEnd();
  }
}
