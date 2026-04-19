import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MedicationCard } from '@/components/alaga/MedicationCard';
import { ScreenContainer } from '@/components/alaga/ScreenContainer';
import { SectionHeader } from '@/components/alaga/SectionHeader';
import { AlagaColors } from '@/constants/alaga-theme';
import { getMedications } from '@/lib/api/medications';
import { getUserSettings } from '@/lib/api/settings';
import type { Medication } from '@/types/medication';

const mascotImage = require('../../assets/images/cappy-mascot.png');

export default function HomeScreen() {
  const router = useRouter();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [displayName, setDisplayName] = useState('User');
  const [isLoading, setIsLoading] = useState(true);

  const loadHomeData = useCallback(async () => {
    setIsLoading(true);

    const [records, settings] = await Promise.all([
      getMedications(),
      getUserSettings(),
    ]);

    setMedications(records);
    setDisplayName(settings.displayName);
    setIsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadHomeData();
    }, [loadHomeData]),
  );

  const dueNow = medications.filter((medication) => medication.status === 'Due Now');
  const laterToday = medications.filter((medication) => medication.status === 'Later');
  const todayDateLabel = useMemo(
    () => new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()),
    [],
  );
  const helperLine = useMemo(() => {
    if (isLoading) {
      return 'Checking today\'s reminders...';
    }

    if (dueNow.length === 1) {
      return 'You have 1 medication due now';
    }

    if (dueNow.length > 1) {
      return `You have ${dueNow.length} medications due now`;
    }

    const dueTodayCount = dueNow.length + laterToday.length;

    if (dueTodayCount === 1) {
      return 'You have 1 medication due today';
    }

    if (dueTodayCount > 1) {
      return `You have ${dueTodayCount} medications due today`;
    }

    return 'No medications due right now';
  }, [dueNow.length, isLoading, laterToday.length]);
  const showSupportCard = !isLoading && dueNow.length > 0 && laterToday.length === 0;
  const showScheduleDivider = dueNow.length > 0 || laterToday.length > 0 || showSupportCard;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.logoText}>{todayDateLabel}</Text>
        <Pressable
          style={styles.settingsButton}
          onPress={() => router.push('/settings')}
          accessibilityRole="button"
          accessibilityLabel="Open settings"
          hitSlop={8}>
          <Ionicons name="settings-outline" size={17} color="#7B889A" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.greetingRow}>
          <Image source={mascotImage} style={styles.greetingMascot} resizeMode="contain" />
          <View style={styles.greetingTextWrap}>
            <Text style={styles.greeting}>Hello, {displayName}!</Text>
            <Text style={styles.helperText}>{helperLine}</Text>
          </View>
        </View>
        {isLoading ? <Text style={styles.loadingText}>Loading medications...</Text> : null}

        {dueNow.length > 0 ? (
          <View style={styles.sectionWrap}>
            <SectionHeader title={dueNow.length > 1 ? `Due Now (${dueNow.length})` : 'Due Now'} />
            <View style={styles.list}>
              {dueNow.map((medication) => (
                <MedicationCard
                  key={medication.id}
                  medication={medication}
                  variant="due-now"
                  onPress={() => router.push(`/reminder/${medication.id}`)}
                />
              ))}
            </View>
          </View>
        ) : null}

        {showScheduleDivider ? <View style={styles.divider} /> : null}

        {laterToday.length > 0 ? (
          <View>
            <SectionHeader title="Later Today" />
            <View style={styles.list}>
              {laterToday.map((medication) => (
                <MedicationCard
                  key={medication.id}
                  medication={medication}
                  variant="later"
                  onPress={() => router.push(`/reminder/${medication.id}`)}
                />
              ))}
            </View>
          </View>
        ) : null}

        {showSupportCard ? (
          <View>
            <SectionHeader title="Up Next" />
            <View style={styles.supportCard}>
              <Ionicons name="sparkles-outline" size={18} color={AlagaColors.accentBlue} style={styles.supportIcon} />
              <View style={styles.supportTextWrap}>
                <Text style={styles.supportTitle}>You are all set after this</Text>
                <Text style={styles.supportText}>Cappy will remind you if anything else is due later today.</Text>
              </View>
            </View>
          </View>
        ) : null}

        {!isLoading && dueNow.length === 0 && laterToday.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>All caught up</Text>
            <Text style={styles.emptyText}>You have no active reminders for today.</Text>
          </View>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: AlagaColors.surface,
    paddingTop: 10,
    paddingBottom: 9,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: AlagaColors.border,
  },
  logoText: {
    flex: 1,
    fontSize: 23,
    fontWeight: '700',
    color: AlagaColors.textPrimary,
    letterSpacing: 0.2,
    marginRight: 10,
  },
  settingsButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EFE7DC',
    backgroundColor: '#F8F5F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 100,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 14,
    gap: 10,
  },
  greetingTextWrap: {
    flex: 1,
  },
  greeting: {
    flex: 1,
    color: AlagaColors.textPrimary,
    fontSize: 27,
    fontWeight: '800',
  },
  helperText: {
    marginTop: 4,
    color: AlagaColors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  greetingMascot: {
    width: 76,
    height: 76,
  },
  loadingText: {
    color: AlagaColors.textMuted,
    fontSize: 14,
    marginBottom: 12,
  },
  sectionWrap: {
    marginBottom: 10,
  },
  list: {
    gap: 10,
  },
  divider: {
    height: 1,
    backgroundColor: AlagaColors.border,
    marginVertical: 12,
  },
  supportCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E6DFD6',
    backgroundColor: '#FFFCF7',
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  supportIcon: {
    marginTop: 2,
  },
  supportTextWrap: {
    flex: 1,
  },
  supportTitle: {
    color: AlagaColors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  supportText: {
    color: AlagaColors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  emptyState: {
    marginTop: 18,
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE8E1',
  },
  emptyTitle: {
    color: AlagaColors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyText: {
    color: AlagaColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
});
