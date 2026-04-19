import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { FeedbackProvider } from '@/components/alaga/FeedbackToast';
import { configureLocalMedicationNotifications } from '@/lib/notifications/medicationReminders';

export default function RootLayout() {
  useEffect(() => {
    void configureLocalMedicationNotifications();
  }, []);

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
