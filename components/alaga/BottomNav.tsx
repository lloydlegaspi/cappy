import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AlagaColors } from '@/constants/alaga-theme';

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home-outline',
  add: 'add-outline',
  meds: 'medkit-outline',
  history: 'time-outline',
};

const LABELS: Record<string, string> = {
  index: 'Today',
  add: 'Add',
  meds: 'Meds',
  history: 'History',
};

export function BottomNav({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const { options } = descriptors[route.key];

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const icon = ICONS[route.name] ?? 'ellipse-outline';
        const label = options.title ?? LABELS[route.name] ?? route.name;

        return (
          <Pressable key={route.key} onPress={onPress} style={[styles.tab, isFocused && styles.tabActive]}>
            <Ionicons
              name={icon}
              size={24}
              color={isFocused ? AlagaColors.accentBlue : '#A09688'}
              style={styles.icon}
            />
            <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    minHeight: 76,
    borderTopWidth: 1,
    borderTopColor: AlagaColors.border,
    backgroundColor: AlagaColors.surface,
    paddingTop: 8,
  },
  tab: {
    minWidth: 56,
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: AlagaColors.accentBlueSoft,
  },
  icon: {
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: '#A09688',
  },
  tabLabelActive: {
    fontWeight: '700',
    color: AlagaColors.accentBlue,
  },
});
