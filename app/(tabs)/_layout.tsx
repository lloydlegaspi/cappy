import { Tabs } from 'expo-router';
import React from 'react';

import { BottomNav } from '@/components/alaga/BottomNav';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <BottomNav {...props} />}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
        }}
      />
      <Tabs.Screen
        name="meds"
        options={{
          title: 'Meds',
        }}
      />
      <Tabs.Screen
        name="ask"
        options={{
          title: 'Ask',
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
