import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Authoritative Supabase singleton client.
 * Shared across the entire application to maintain a consistent Auth session.
 */
export const supabase = (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project')) 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }) 
  : null;

// Audit and report status to developer console
if (typeof window !== 'undefined') {
  console.group('📡 Supabase Integration Status');
  console.log('URL:', supabaseUrl);
  if (!supabase) {
    console.error('Status: OFFLINE (Missing or Placeholder keys detected)');
  } else {
    console.log('Status: ACTIVE');
  }
  console.groupEnd();
}
