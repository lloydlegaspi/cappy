import { createClient } from '@supabase/supabase-js';

import { env, isSupabaseConfigured } from './env';

export const supabase =
  isSupabaseConfigured && env.supabaseUrl && env.supabaseAnonKey
    ? createClient(env.supabaseUrl, env.supabaseAnonKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      })
    : null;
