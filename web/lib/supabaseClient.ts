import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let anonClient: SupabaseClient | null = null;
export function getAnonClient() {
  if (!anonClient) anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return anonClient;
}

let serviceClient: SupabaseClient | null = null;
export function getServiceRoleClient() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is missing. Add it to .env.local from Supabase Dashboard → Project Settings → API → Secret key'
    );
  }
  if (!serviceClient) serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  return serviceClient;
}

