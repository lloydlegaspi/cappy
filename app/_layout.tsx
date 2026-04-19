import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import 'react-native-reanimated';

import { FeedbackProvider } from '@/components/alaga/FeedbackToast';
import { AlagaColors } from '@/constants/alaga-theme';
import { ensureAnonymousSession } from '@/lib/auth/guestSession';
import { configureLocalMedicationNotifications } from '@/lib/notifications/medicationReminders';
import { supabase } from '@/lib/supabase';

export default function RootLayout() {
  const [isAuthReady, setIsAuthReady] = useState(!supabase);
  const [authError, setAuthError] = useState<string | null>(null);

  const bootstrapAuth = useCallback(async () => {
    if (!supabase) {
      setAuthError(null);
      setIsAuthReady(true);
      return;
    }

    setIsAuthReady(false);
    setAuthError(null);

    const result = await ensureAnonymousSession();

    if (result.error) {
      setAuthError(result.error);
      return;
    }

    setIsAuthReady(true);
  }, []);

  useEffect(() => {
    void configureLocalMedicationNotifications();
  }, []);

  useEffect(() => {
    void bootstrapAuth();
  }, [bootstrapAuth]);

  if (!isAuthReady) {
    return (
      <FeedbackProvider>
        <View style={styles.bootstrapWrap}>
          <ActivityIndicator size="large" color={AlagaColors.accentBlue} />
          <Text style={styles.bootstrapTitle}>Preparing your private guest space...</Text>
          <Text style={styles.bootstrapSubtitle}>
            {authError ? 'Could not connect to secure guest auth yet.' : 'Connecting securely...'}
          </Text>

          {authError ? (
            <Pressable style={styles.retryButton} onPress={() => void bootstrapAuth()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          ) : null}
        </View>
        <StatusBar style="dark" />
      </FeedbackProvider>
    );
  }

  return (
    <FeedbackProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="reminder/[medId]" />
      </Stack>
      <StatusBar style="dark" />
    </FeedbackProvider>
  );
}

const styles = StyleSheet.create({
  bootstrapWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: AlagaColors.pageBackground,
  },
  bootstrapTitle: {
    marginTop: 14,
    color: AlagaColors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  bootstrapSubtitle: {
    marginTop: 6,
    color: AlagaColors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D8E6F4',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    marginTop: 14,
  },
  retryButtonText: {
    color: AlagaColors.accentBlue,
    fontSize: 15,
    fontWeight: '700',
  },
});
