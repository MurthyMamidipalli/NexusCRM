
'use server';

import { createClient } from '@supabase/supabase-js';

/**
 * Server Action to generate a secure signed URL using the Supabase Service Role Key.
 * Bypasses RLS to allow verified Firebase users to see their private vault files.
 */
export async function getSignedUrlAction(filePath: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.group('🛡️ [Server Action] Signed URL Generator');
  console.log('Target Path:', filePath);
  console.log('Supabase URL Configured:', !!supabaseUrl);
  console.log('Service Role Key Configured:', !!serviceRoleKey);

  try {
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Storage service credentials missing on server (SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL).');
    }

    // Initialize the Admin client
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Clean the path: ensure no redundant bucket names
    let cleanPath = filePath;
    if (cleanPath.startsWith('documents/')) {
      cleanPath = cleanPath.replace('documents/', '');
    }

    console.log('Sanitized Path:', cleanPath);
    console.log('Bucket:', 'documents');

    const { data, error } = await supabaseAdmin.storage
      .from('documents')
      .createSignedUrl(cleanPath, 3600); // 1 hour expiry

    if (error) {
      console.error('Supabase Storage Error:', error);
      return { 
        signedUrl: null, 
        error: `Supabase Error: ${error.message} (Status: ${error.name})` 
      };
    }

    if (!data?.signedUrl) {
      console.error('Logic Error: Supabase returned no URL and no error object.');
      return { signedUrl: null, error: 'Storage server returned an empty link.' };
    }

    console.log('✅ Signed URL Generated Successfully');
    console.groupEnd();
    
    return { signedUrl: data.signedUrl, error: null };

  } catch (err: any) {
    console.error('🔥 CRITICAL ACTION FAILURE:');
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);
    console.groupEnd();
    
    return { 
      signedUrl: null, 
      error: err.message || 'Internal server error while generating access link.' 
    };
  }
}
