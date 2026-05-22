
'use client';

import { EventEmitter } from 'events';

/**
 * A central event emitter for Firebase-related errors.
 * Primarily used to surface Security Rules violations to the UI.
 */
export const errorEmitter = new EventEmitter();
