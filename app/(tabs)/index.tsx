import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { MedicationCard } from '@/components/alaga/MedicationCard';
import { ScreenContainer } from '@/components/alaga/ScreenContainer';
import { SectionHeader } from '@/components/alaga/SectionHeader';
import { AlagaColors } from '@/constants/alaga-theme';
import { getMedications } from '@/lib/api/medications';
import type { Medication } from '@/types/medication';

export default function HomeScreen() {
  const router = useRouter();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadMedications = useCallback(async () => {
    setIsLoading(true);
    const records = await getMedications();
    setMedications(records);
    setIsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadMedications();
    }, [loadMedications]),
  );

  const dueNow = medications.filter((medication) => medication.status === 'Due Now');
  const laterToday = medications.filter((medication) => medication.status === 'Later');

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.logoText}>Today</Text>
        <View style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={21} color="#5A6B8A" />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.greeting}>Hello, User!</Text>
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

        <View style={styles.divider} />

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
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: AlagaColors.surface,
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: AlagaColors.border,
  },
  logoText: {
    fontSize: 30,
    fontWeight: '800',
    color: AlagaColors.textPrimary,
    letterSpacing: 0.4,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EEE9E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  greeting: {
    color: AlagaColors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 20,
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
    marginVertical: 16,
  },
});
