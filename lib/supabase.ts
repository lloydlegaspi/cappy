import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import { env, isSupabaseConfigured } from './env';

const isNativeMobilePlatform = Platform.OS === 'ios' || Platform.OS === 'android';

export const supabase =
  isSupabaseConfigured && env.supabaseUrl && env.supabaseAnonKey
    ? createClient(env.supabaseUrl, env.supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
          ...(isNativeMobilePlatform ? { storage: AsyncStorage } : {}),
        },
      })
    : null;
