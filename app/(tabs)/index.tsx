import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { MedicationCard } from '@/components/alaga/MedicationCard';
import { ScreenContainer } from '@/components/alaga/ScreenContainer';
import { SectionHeader } from '@/components/alaga/SectionHeader';
import { AlagaColors } from '@/constants/alaga-theme';
import { todayMedications } from '@/data/mock-medications';

export default function HomeScreen() {
  const router = useRouter();
  const dueNow = todayMedications.filter((medication) => medication.status === 'Due Now');
  const laterToday = todayMedications.filter((medication) => medication.status === 'Later');

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
