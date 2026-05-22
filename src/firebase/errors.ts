
'use client';

export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
  originalError?: any;
};

/**
 * A specialized error class for Firestore permission denials.
 * Surfaces contextual information to help debug Security Rules.
 */
export class FirestorePermissionError extends Error {
  context: SecurityRuleContext;

  constructor(context: SecurityRuleContext) {
    const originalMsg = context.originalError?.message || '';
    const message = `Firestore Permission Denied: ${context.operation} at ${context.path}. ${originalMsg}`;
    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;

    // Log contextual information for the developer
    console.group('🔥 Firestore Security Rule Violation');
    console.error('Operation:', context.operation);
    console.error('Path:', context.path);
    console.error('Original Error:', context.originalError);
    if (context.requestResourceData) {
      console.error('Payload:', context.requestResourceData);
    }
    console.groupEnd();
  }
}
