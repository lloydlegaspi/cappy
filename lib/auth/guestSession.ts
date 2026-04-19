import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

export interface EnsureAnonymousSessionResult {
  session: Session | null;
  user: User | null;
  isNewAnonymousUser: boolean;
  error: string | null;
}

export async function ensureAnonymousSession(): Promise<EnsureAnonymousSessionResult> {
  if (!supabase) {
    return {
      session: null,
      user: null,
      isNewAnonymousUser: false,
      error: null,
    };
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    return {
      session: null,
      user: null,
      isNewAnonymousUser: false,
      error: sessionError.message,
    };
  }

  if (sessionData.session?.user) {
    return {
      session: sessionData.session,
      user: sessionData.session.user,
      isNewAnonymousUser: false,
      error: null,
    };
  }

  const { data: signInData, error: signInError } = await supabase.auth.signInAnonymously();

  if (signInError) {
    return {
      session: null,
      user: null,
      isNewAnonymousUser: false,
      error: signInError.message,
    };
  }

  if (!signInData.session?.user) {
    return {
      session: null,
      user: null,
      isNewAnonymousUser: false,
      error: 'Anonymous sign-in did not return a valid session.',
    };
  }

  return {
    session: signInData.session,
    user: signInData.session.user,
    isNewAnonymousUser: true,
    error: null,
  };
}

export async function getAuthenticatedUser(): Promise<User | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error('Error reading current auth session:', error);
    return null;
  }

  return data.session?.user ?? null;
}

export async function getAuthenticatedUserId(): Promise<string | null> {
  const user = await getAuthenticatedUser();
  return user?.id ?? null;
}

export function toShortGuestId(userId: string | null | undefined): string | null {
  if (!userId) {
    return null;
  }

  if (userId.length <= 12) {
    return userId;
  }

  return `${userId.slice(0, 8)}...${userId.slice(-4)}`;
}
