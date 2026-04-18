import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MedicationCard } from '@/components/alaga/MedicationCard';
import { ScreenContainer } from '@/components/alaga/ScreenContainer';
import { SectionHeader } from '@/components/alaga/SectionHeader';
import { AlagaColors } from '@/constants/alaga-theme';
import { getReminderHistorySections } from '@/lib/api/reminderEvents';
import type { DayHistoryGroup, Medication } from '@/types/medication';

type HistoryFilter = 'today' | 'yesterday' | 'last7';

const filters: { key: HistoryFilter; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'last7', label: 'Last 7 Days' },
];

export default function HistoryScreen() {
  const [filter, setFilter] = useState<HistoryFilter>('today');
  const [sections, setSections] = useState<DayHistoryGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    const records = await getReminderHistorySections();
    setSections(records);
    setIsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadHistory();
    }, [loadHistory]),
  );

  const todaySection = sections.find((section) => section.id === 'today');
  const yesterdaySection = sections.find((section) => section.id === 'yesterday');
  const last7Sections = sections.filter((section) => section.id !== 'today' && section.id !== 'yesterday');

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>

        <View style={styles.filterWrap}>
          {filters.map((item) => {
            const active = item.key === filter;
            return (
              <Pressable
                key={item.key}
                onPress={() => setFilter(item.key)}
                style={[styles.filterButton, active && styles.filterButtonActive]}>
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? <Text style={styles.loadingText}>Loading history...</Text> : null}

        {!isLoading && sections.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No reminder history yet</Text>
            <Text style={styles.emptyText}>Take or snooze a medication to start building history.</Text>
          </View>
        ) : null}

        {filter === 'today' && todaySection ? <HistoryGroup label={todaySection.label} medications={todaySection.medications} /> : null}

        {filter === 'yesterday' && yesterdaySection ? <HistoryGroup label={yesterdaySection.label} medications={yesterdaySection.medications} /> : null}

        {filter === 'last7'
          ? last7Sections.map((group, index) => (
              <View key={group.id}>
                <HistoryGroup label={group.label} medications={group.medications} />
                {index < last7Sections.length - 1 ? <View style={styles.divider} /> : null}
              </View>
            ))
          : null}
      </ScrollView>
    </ScreenContainer>
  );
}

function HistoryGroup({ label, medications }: { label: string; medications: Medication[] }) {
  return (
    <View>
      <SectionHeader title={label} />
      <View style={styles.list}>
        {medications.map((medication) => (
          <MedicationCard key={medication.id} medication={medication} variant="history" />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: AlagaColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: AlagaColors.border,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: AlagaColors.textPrimary,
    marginBottom: 14,
  },
  filterWrap: {
    flexDirection: 'row',
    backgroundColor: '#EDE8E1',
    borderRadius: 14,
    padding: 3,
  },
  filterButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: AlagaColors.textMuted,
  },
  filterTextActive: {
    color: AlagaColors.textPrimary,
    fontWeight: '700',
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingText: {
    color: AlagaColors.textMuted,
    fontSize: 14,
    marginBottom: 12,
  },
  emptyState: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  emptyTitle: {
    color: AlagaColors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyText: {
    color: AlagaColors.textMuted,
    fontSize: 14,
  },
  list: {
    gap: 10,
  },
  divider: {
    height: 1,
    backgroundColor: AlagaColors.border,
    marginVertical: 18,
  },
});
