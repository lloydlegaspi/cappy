import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { FeedbackProvider } from '@/components/alaga/FeedbackToast';

export default function RootLayout() {
  return (
    <FeedbackProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="reminder/[medId]" />
      </Stack>
      <StatusBar style="dark" />
    </FeedbackProvider>
  );
}
