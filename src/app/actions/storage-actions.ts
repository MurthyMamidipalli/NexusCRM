
'use server';

import { createClient } from '@supabase/supabase-js';

/**
 * Optimized Server Action for secure Signed URL generation.
 */
export async function getSignedUrlAction(filePath: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    if (!supabaseUrl || !serviceRoleKey) throw new Error('Missing storage credentials.');

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    let cleanPath = filePath;
    if (cleanPath.startsWith('documents/')) cleanPath = cleanPath.replace('documents/', '');

    const { data, error } = await supabaseAdmin.storage
      .from('documents')
      .createSignedUrl(cleanPath, 3600);

    if (error) throw error;
    if (!data?.signedUrl) throw new Error('Empty URL returned.');

    return { signedUrl: data.signedUrl, error: null };
  } catch (err: any) {
    console.error('🛡️ [Signed URL Action] Failure:', err.message);
    return { signedUrl: null, error: err.message || 'Access generation failed.' };
  }
}
