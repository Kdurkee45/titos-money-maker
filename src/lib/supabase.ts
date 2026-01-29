import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Validate required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
    'Please add it to your .env.local file.'
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. ' +
    'Please add it to your .env.local file.'
  );
}

// Client-side Supabase client (uses anon key, respects RLS)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

/**
 * Server-side client with service role (bypasses RLS)
 * 
 * WARNING: This client bypasses Row Level Security.
 * Only use in server components, API routes, or server actions.
 * Never import this in client components.
 */
export function createServiceClient() {
  // Runtime check to prevent client-side usage
  if (typeof window !== 'undefined') {
    throw new Error(
      'createServiceClient() cannot be called from client-side code. ' +
      'This function bypasses RLS and should only be used in server components or API routes.'
    );
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY environment variable. ' +
      'This is required for server-side operations.'
    );
  }

  return createClient<Database>(supabaseUrl!, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Re-export types for convenience
export type { Database } from '@/types/database';
