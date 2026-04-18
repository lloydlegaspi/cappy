import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/alaga/ScreenContainer';
import { ScreenHeader } from '@/components/alaga/ScreenHeader';
import { AlagaColors } from '@/constants/alaga-theme';
import { useFeedback } from '@/components/alaga/FeedbackToast';
import { createReminderEvent } from '@/lib/api/reminderEvents';
import { getMedicationById } from '@/lib/api/medications';
import type { Medication } from '@/types/medication';

export default function ReminderScreen() {
  const router = useRouter();
  const { showToast } = useFeedback();
  const params = useLocalSearchParams<{ medId?: string }>();
  const [medication, setMedication] = useState<Medication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [taken, setTaken] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadMedication() {
      setIsLoading(true);
      const record = await getMedicationById(params.medId);

      if (isActive) {
        setMedication(record);
        setTaken(record?.status === 'Taken');
        setIsLoading(false);
      }
    }

    void loadMedication();

    return () => {
      isActive = false;
    };
  }, [params.medId]);

  const onTakeNow = async () => {
    if (!medication || isSubmitting) return;

    setIsSubmitting(true);
    const event = await createReminderEvent({
      medicationId: medication.id,
      scheduledFor: new Date().toISOString(),
      action: 'taken',
    });

    if (!event) {
      showToast('Could not mark as taken', 'error');
      Alert.alert('Action failed', 'Could not record this reminder action.');
      setIsSubmitting(false);
      return;
    }

    setTaken(true);
    showToast('Marked as taken', 'success');
    setIsSubmitting(false);
  };

  const onSnooze = async () => {
    if (!medication || isSubmitting) return;

    setIsSubmitting(true);
    const event = await createReminderEvent({
      medicationId: medication.id,
      scheduledFor: new Date().toISOString(),
      action: 'snoozed',
    });

    if (!event) {
      showToast('Could not snooze reminder', 'error');
      Alert.alert('Action failed', 'Could not snooze this reminder.');
      setIsSubmitting(false);
      return;
    }

    Alert.alert('Snoozed', 'Reminder moved by 10 minutes.');
    showToast('Reminder snoozed', 'success');
    setIsSubmitting(false);
  };

  const editMedication = () => {
    if (!medication) return;
    router.push(`/add?medId=${medication.id}`);
  };

  if (isLoading || !medication) {
    return (
      <ScreenContainer>
        <ScreenHeader onBack={() => router.back()} backLabel="Back" />
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Loading reminder...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScreenHeader onBack={() => router.back()} backLabel="Back" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>Medication Reminder</Text>
          <Text style={styles.time}>{medication.time}</Text>
        </View>

        <View style={styles.card}>
          <Image source={{ uri: medication.image }} style={styles.image} contentFit="cover" />

          <View style={styles.details}>
            <Text style={styles.detailTime}>{medication.time}</Text>
            <Text style={styles.name}>{medication.name}</Text>
            <Text style={styles.dosage}>{medication.dosage}</Text>
            <Text style={styles.indication}>{medication.indication}</Text>
          </View>
        </View>

        <Text style={styles.helperText}>Take your medicine now, or snooze to be reminded again shortly.</Text>

        <Pressable style={styles.editButton} onPress={editMedication}>
          <Ionicons name="create-outline" size={18} color={AlagaColors.accentBlue} />
          <Text style={styles.editButtonText}>Edit Medication</Text>
        </Pressable>

        {!taken ? (
          <View style={styles.actionWrap}>
            <Pressable style={styles.takeButton} onPress={onTakeNow} disabled={isSubmitting}>
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
              <Text style={styles.takeButtonText}>{isSubmitting ? 'Recording...' : 'Take Now'}</Text>
            </Pressable>

            <Pressable style={styles.snoozeButton} onPress={onSnooze} disabled={isSubmitting}>
              <Ionicons name="notifications-off-outline" size={20} color="#8A9BBB" />
              <Text style={styles.snoozeText}>Snooze</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.actionWrap}>
            <View style={styles.recordedCard}>
              <Text style={styles.recordedTitle}>Recorded</Text>
              <Text style={styles.recordedSubtitle}>Great job taking your medication.</Text>
            </View>

            <Pressable style={styles.snoozeButton} onPress={() => setTaken(false)}>
              <Ionicons name="arrow-undo-outline" size={19} color="#8A9BBB" />
              <Text style={styles.snoozeText}>Undo</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 24,
  },
  titleWrap: {
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    color: AlagaColors.textMuted,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  time: {
    color: AlagaColors.accentBlue,
    fontSize: 24,
    fontWeight: '800',
  },
  card: {
    borderRadius: 24,
    backgroundColor: AlagaColors.surface,
    borderWidth: 1,
    borderColor: '#E8EEF8',
    overflow: 'hidden',
    shadowColor: '#3B7EC8',
    shadowOpacity: 0.13,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 28,
    elevation: 2,
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 170,
    backgroundColor: '#F0F6FF',
  },
  details: {
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  detailTime: {
    color: AlagaColors.accentBlue,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  name: {
    color: AlagaColors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    marginBottom: 6,
  },
  dosage: {
    color: '#4A5568',
    fontSize: 19,
    fontWeight: '600',
    marginBottom: 4,
  },
  indication: {
    color: AlagaColors.textMuted,
    fontSize: 15,
  },
  helperText: {
    color: AlagaColors.textMuted,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 22,
    paddingHorizontal: 6,
  },
  editButton: {
    minHeight: 46,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D8E6F4',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  editButtonText: {
    color: AlagaColors.accentBlue,
    fontSize: 15,
    fontWeight: '700',
  },
  actionWrap: {
    gap: 12,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: AlagaColors.textMuted,
    fontSize: 15,
  },
  takeButton: {
    minHeight: 66,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#38A169',
    flexDirection: 'row',
    gap: 8,
  },
  takeButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  snoozeButton: {
    minHeight: 58,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: AlagaColors.borderBlue,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  snoozeText: {
    color: '#8A9BBB',
    fontSize: 18,
    fontWeight: '600',
  },
  recordedCard: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
    minHeight: 84,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordedTitle: {
    color: '#22C55E',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  recordedSubtitle: {
    color: '#86EFAC',
    fontSize: 13,
  },
});
