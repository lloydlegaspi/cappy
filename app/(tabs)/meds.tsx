import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ConfirmDialog } from '@/components/alaga/ConfirmDialog';
import { useFeedback } from '@/components/alaga/FeedbackToast';
import { ScreenContainer } from '@/components/alaga/ScreenContainer';
import { AlagaColors } from '@/constants/alaga-theme';
import { deleteMedicationByIdWithReason, getMedications } from '@/lib/api/medications';
import { cancelMedicationReminderNotifications } from '@/lib/notifications/medicationReminders';
import type { Medication } from '@/types/medication';

export default function MedicationsScreen() {
  const router = useRouter();
  const { showToast } = useFeedback();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteMedicationId, setPendingDeleteMedicationId] = useState<string | null>(null);

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
    router.push({
      pathname: '/(tabs)/add',
      params: { medId: medicationId },
    });
  };

  const runDelete = useCallback(
    async (medicationId: string) => {
      try {
        setDeletingId(medicationId);
        const result = await deleteMedicationByIdWithReason(medicationId);

        if (!result.ok) {
          showToast(
            result.code === '42501'
              ? 'Could not delete medication'
              : 'Delete failed',
            'error',
          );
          Alert.alert(
            'Delete failed',
            result.code === '42501'
              ? 'Supabase blocked this delete with row-level security. Run the latest schema migration to apply per-user ownership policies.'
              : result.code === 'NO_ROWS_DELETED'
                ? 'Delete did not affect any row. This usually means RLS is filtering the row in Supabase.'
                : result.message ?? 'Unable to delete this medication.',
          );
          return;
        }

        try {
          await cancelMedicationReminderNotifications(medicationId);
        } catch (error) {
          console.warn('Reminder cleanup failed after delete:', error);
        }

        setMedications((current) => current.filter((item) => item.id !== medicationId));
        showToast('Medication deleted', 'success');
      } catch {
        showToast('Delete failed', 'error');
        Alert.alert('Delete failed', 'Unexpected error while deleting medication.');
      } finally {
        setDeletingId(null);
      }
    },
    [showToast],
  );

  const onDelete = useCallback(
    (medicationId: string) => {
      setPendingDeleteMedicationId(medicationId);
    },
    [],
  );

  const closeDeleteDialog = useCallback(() => {
    if (!deletingId) {
      setPendingDeleteMedicationId(null);
    }
  }, [deletingId]);

  const confirmDelete = useCallback(() => {
    if (!pendingDeleteMedicationId || deletingId) {
      return;
    }

    const targetId = pendingDeleteMedicationId;
    setPendingDeleteMedicationId(null);
    void runDelete(targetId);
  }, [deletingId, pendingDeleteMedicationId, runDelete]);

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Medications</Text>
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
              <Pressable
                style={[styles.deleteButton, deletingId === medication.id && styles.deleteButtonDisabled]}
                onPress={() => onDelete(medication.id)}
                hitSlop={8}
                disabled={deletingId === medication.id}>
                <Text style={styles.deleteButtonText}>{deletingId === medication.id ? 'Deleting...' : 'Delete'}</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>

      <ConfirmDialog
        visible={Boolean(pendingDeleteMedicationId)}
        title="Delete medication?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isConfirming={Boolean(deletingId && deletingId === pendingDeleteMedicationId)}
        onCancel={closeDeleteDialog}
        onConfirm={confirmDelete}
      />
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
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: AlagaColors.textPrimary,
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
  deleteButtonDisabled: {
    opacity: 0.65,
  },
});
