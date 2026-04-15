import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/alaga/ScreenContainer';
import { AlagaColors } from '@/constants/alaga-theme';
import { deleteMedicationById, getMedications } from '@/lib/api/medications';
import type { Medication } from '@/types/medication';

export default function MedicationsScreen() {
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

  const onEdit = (medicationId: string) => {
    router.push(`/add?medId=${medicationId}`);
  };

  const onDelete = (medicationId: string) => {
    Alert.alert('Delete medication?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const ok = await deleteMedicationById(medicationId);
          if (!ok) {
            Alert.alert(
              'Delete failed',
              'Unable to delete this medication. If RLS is enabled, apply the medications_delete_all policy migration first.',
            );
            return;
          }

          await loadMedications();
        },
      },
    ]);
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Medications</Text>
        <Pressable style={styles.addButton} onPress={() => router.push('/add')}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? <Text style={styles.loadingText}>Loading medications...</Text> : null}

        {!isLoading && medications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No medications yet</Text>
            <Text style={styles.emptyText}>Add your first medication to start reminders.</Text>
          </View>
        ) : null}

        {medications.map((medication) => (
          <View key={medication.id} style={styles.card}>
            <View style={styles.cardTopRow}>
              <Text style={styles.name}>{medication.name}</Text>
              <Text style={styles.time}>{medication.time}</Text>
            </View>
            <Text style={styles.meta}>{medication.dosage}</Text>
            <Text style={styles.meta}>{medication.purpose ?? 'No purpose provided'}</Text>
            <Text style={styles.meta}>{medication.frequency ?? 'No frequency provided'}</Text>

            <View style={styles.actionsRow}>
              <Pressable style={styles.editButton} onPress={() => onEdit(medication.id)}>
                <Text style={styles.editButtonText}>Edit</Text>
              </Pressable>
              <Pressable style={styles.deleteButton} onPress={() => onDelete(medication.id)}>
                <Text style={styles.deleteButtonText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: AlagaColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: AlagaColors.border,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: AlagaColors.textPrimary,
  },
  addButton: {
    minHeight: 40,
    minWidth: 72,
    borderRadius: 14,
    backgroundColor: '#EBF3FB',
    borderWidth: 1,
    borderColor: '#D8E6F4',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  addButtonText: {
    color: AlagaColors.accentBlue,
    fontSize: 15,
    fontWeight: '700',
  },
  content: {
    padding: 20,
    paddingBottom: 100,
    gap: 10,
  },
  loadingText: {
    color: AlagaColors.textMuted,
    fontSize: 14,
    marginBottom: 8,
  },
  emptyState: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    backgroundColor: '#FFFFFF',
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
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    backgroundColor: '#FFFFFF',
    padding: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  name: {
    color: AlagaColors.textPrimary,
    fontSize: 19,
    fontWeight: '800',
    flex: 1,
    marginRight: 8,
  },
  time: {
    color: AlagaColors.accentBlue,
    fontSize: 13,
    fontWeight: '700',
  },
  meta: {
    color: AlagaColors.textMuted,
    fontSize: 13,
    marginBottom: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  editButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8E6F4',
    backgroundColor: '#EBF3FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    color: AlagaColors.accentBlue,
    fontSize: 15,
    fontWeight: '700',
  },
  deleteButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F6CACA',
    backgroundColor: '#FDECEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#C0392B',
    fontSize: 15,
    fontWeight: '700',
  },
});
