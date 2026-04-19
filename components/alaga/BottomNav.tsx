import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AlagaColors } from '@/constants/alaga-theme';

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home-outline',
  ask: 'chatbubble-ellipses-outline',
  meds: 'medkit-outline',
  history: 'time-outline',
};

const LABELS: Record<string, string> = {
  index: 'Today',
  ask: 'Ask',
  meds: 'Meds',
  history: 'History',
};

const FAB_HIDDEN_ROUTES = new Set(['ask', 'add']);

export function BottomNav({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const visibleRoutes = state.routes.filter((route) => route.name !== 'add');
  const activeRouteKey = state.routes[state.index]?.key;
  const activeRouteName = state.routes[state.index]?.name;
  const isTodayRoute = activeRouteName === 'index';
  const addRoute = state.routes.find((route) => route.name === 'add');
  const shouldShowFab = Boolean(addRoute) && !FAB_HIDDEN_ROUTES.has(activeRouteName ?? '');

  const onAddPress = () => {
    if (!addRoute) {
      return;
    }

    const event = navigation.emit({
      type: 'tabPress',
      target: addRoute.key,
      canPreventDefault: true,
    });

    if (!event.defaultPrevented) {
      navigation.navigate(addRoute.name);
    }
  };

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      {visibleRoutes.map((route) => {
        const isFocused = activeRouteKey === route.key;
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
          <Pressable
            key={route.key}
            onPress={onPress}
            style={[styles.tab, isFocused && styles.tabActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={`${label} tab`}>
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

      {shouldShowFab ? (
        <Pressable
          onPress={onAddPress}
          style={[
            styles.fab,
            isTodayRoute && styles.fabToday,
            { bottom: Math.max(insets.bottom, 6) + (isTodayRoute ? 52 : 56) },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Add medication"
          hitSlop={8}>
          <Ionicons name="add" size={isTodayRoute ? 26 : 30} color="#FFFFFF" />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    minHeight: 76,
    borderTopWidth: 1,
    borderTopColor: AlagaColors.border,
    backgroundColor: AlagaColors.surface,
    paddingTop: 8,
    paddingHorizontal: 8,
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
  fab: {
    position: 'absolute',
    right: 16,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AlagaColors.accentBlue,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  fabToday: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
});
