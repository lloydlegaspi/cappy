import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ScreenContainer } from '@/components/alaga/ScreenContainer';
import { ScreenHeader } from '@/components/alaga/ScreenHeader';
import { AlagaColors } from '@/constants/alaga-theme';
import { createMedication, deleteMedicationByIdWithReason, getMedicationByIdRaw, updateMedicationById } from '@/lib/api/medications';
import { useFeedback } from '@/components/alaga/FeedbackToast';

const frequencies = ['Every day', 'Morning only', 'Afternoon only', 'Evening only'] as const;
const frequencyToSchema: Record<(typeof frequencies)[number], string> = {
  'Every day': 'Once daily',
  'Morning only': 'Morning only',
  'Afternoon only': 'Afternoon only',
  'Evening only': 'Evening only',
};
const schemaToFrequency: Record<string, (typeof frequencies)[number]> = {
  'Once daily': 'Every day',
  'Morning only': 'Morning only',
  'Afternoon only': 'Afternoon only',
  'Evening only': 'Evening only',
};

const defaultPhotoUrl = 'https://images.unsplash.com/photo-1740592756330-adb8c1f5fbe7?w=500&h=500&fit=crop';

export default function AddMedicationScreen() {
  const router = useRouter();
  const { showToast } = useFeedback();
  const params = useLocalSearchParams<{ medId?: string }>();
  const isEditMode = Boolean(params.medId);

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [purpose, setPurpose] = useState('');
  const [time, setTime] = useState('8:00 AM');
  const [frequency, setFrequency] = useState<(typeof frequencies)[number]>('Every day');
  const [photoAdded, setPhotoAdded] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formTitle = useMemo(() => (isEditMode ? 'Edit Medication' : 'Add Medication'), [isEditMode]);

  useEffect(() => {
    let isActive = true;

    async function loadMedicationForEdit() {
      if (!params.medId) {
        return;
      }

      setIsLoadingForm(true);
      const record = await getMedicationByIdRaw(params.medId);

      if (!isActive) {
        return;
      }

      if (!record) {
        Alert.alert('Not found', 'This medication could not be loaded.');
        router.back();
        return;
      }

      setName(record.name);
      setDosage(record.dosage);
      setPurpose(record.purpose ?? '');
      setTime(record.time);
      setFrequency(schemaToFrequency[record.frequency ?? 'Once daily'] ?? 'Every day');
      setPhotoUrl(record.pillPhotoUrl ?? null);
      setPhotoAdded(Boolean(record.pillPhotoUrl));
      setIsLoadingForm(false);
    }

    void loadMedicationForEdit();

    return () => {
      isActive = false;
    };
  }, [params.medId, router]);

  const saveMedication = async () => {
    if (!name.trim() || !dosage.trim() || !time.trim()) {
      Alert.alert('Missing details', 'Please enter the medication name, dosage, and time.');
      return;
    }

    setIsSaving(true);
    const payload = {
      name: name.trim(),
      dosage: dosage.trim(),
      purpose: purpose.trim() || null,
      time_of_day: time.trim(),
      frequency: frequencyToSchema[frequency],
      pill_photo_url: photoAdded ? photoUrl ?? defaultPhotoUrl : null,
    };

    const record = isEditMode && params.medId
      ? await updateMedicationById(params.medId, payload)
      : await createMedication(payload);

    setIsSaving(false);

    if (!record) {
      showToast('Could not save medication', 'error');
      Alert.alert('Save failed', 'The medication was not saved. Please verify Supabase policies and try again.');
      return;
    }

    showToast(isEditMode ? 'Medication updated' : 'Medication added', 'success');
    Alert.alert(isEditMode ? 'Medication Updated' : 'Medication Saved', isEditMode ? 'Changes have been saved.' : 'Your medication has been added to the schedule.', [
      { text: 'OK', onPress: () => router.replace('/') },
    ]);
  };

  const confirmDelete = () => {
    if (!params.medId) {
      return;
    }

    Alert.alert('Delete medication?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsDeleting(true);
            const result = await deleteMedicationByIdWithReason(params.medId as string);

            if (!result.ok) {
              showToast('Could not delete medication', 'error');
              Alert.alert(
                'Delete failed',
                result.code === '42501'
                  ? 'Supabase blocked this delete with row-level security. Run the latest schema migration to apply demo delete policies.'
                  : result.message ?? 'The medication was not deleted.',
              );
              return;
            }

            showToast('Medication deleted', 'success');
            Alert.alert('Deleted', 'Medication removed.', [
              { text: 'OK', onPress: () => router.replace('/') },
            ]);
          } catch {
            showToast('Delete failed', 'error');
            Alert.alert('Delete failed', 'Unexpected error while deleting medication.');
          } finally {
            setIsDeleting(false);
          }
        },
      },
    ]);
  };

  return (
    <ScreenContainer backgroundColor="#F0F4FB">
      <ScreenHeader title={formTitle} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {isLoadingForm ? <Text style={styles.loadingText}>Loading medication details...</Text> : null}

        <FieldLabel text="Medication Name" />
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Amlodipine"
          placeholderTextColor="#8AA0BF"
          style={[styles.input, name.length > 0 && styles.inputActive]}
        />

        <FieldLabel text="Dosage" />
        <TextInput
          value={dosage}
          onChangeText={setDosage}
          placeholder="e.g. 1 tablet"
          placeholderTextColor="#8AA0BF"
          style={[styles.input, dosage.length > 0 && styles.inputActive]}
        />

        <FieldLabel text="Purpose" />
        <TextInput
          value={purpose}
          onChangeText={setPurpose}
          placeholder="e.g. For blood pressure"
          placeholderTextColor="#8AA0BF"
          style={[styles.input, purpose.length > 0 && styles.inputActive]}
        />

        <FieldLabel text="Time" />
        <TextInput value={time} onChangeText={setTime} style={[styles.input, styles.inputActive]} />

        <FieldLabel text="Frequency" />
        <View style={styles.frequencyGrid}>
          {frequencies.map((item) => {
            const selected = item === frequency;
            return (
              <Pressable
                key={item}
                onPress={() => setFrequency(item)}
                style={[styles.frequencyButton, selected && styles.frequencyButtonActive]}>
                {selected ? (
                  <Ionicons name="checkmark" size={16} color={AlagaColors.accentBlue} style={styles.freqIcon} />
                ) : null}
                <Text style={[styles.frequencyText, selected && styles.frequencyTextActive]}>{item}</Text>
              </Pressable>
            );
          })}
        </View>

        <FieldLabel text="Pill Photo" />
        <Pressable style={[styles.photoButton, photoAdded && styles.photoButtonDone]} onPress={() => setPhotoAdded((prev) => !prev)}>
          <Ionicons
            name={photoAdded ? 'checkmark-circle' : 'camera'}
            size={22}
            color={photoAdded ? AlagaColors.success : AlagaColors.accentBlue}
          />
          <Text style={[styles.photoText, photoAdded && styles.photoTextDone]}>
            {photoAdded ? 'Photo Added' : 'Take Pill Photo'}
          </Text>
        </Pressable>

        <Text style={styles.helpText}>A photo makes it easier to recognize your medication.</Text>

        <Pressable style={styles.primaryButton} onPress={saveMedication} disabled={isSaving || isLoadingForm || isDeleting}>
          <Text style={styles.primaryButtonText}>{isSaving ? 'Saving...' : isEditMode ? 'Update Medication' : 'Save Medication'}</Text>
        </Pressable>

        {isEditMode ? (
          <Pressable
            style={styles.deleteButton}
            onPress={confirmDelete}
            hitSlop={8}
            disabled={isSaving || isLoadingForm || isDeleting}>
            <Text style={styles.deleteButtonText}>{isDeleting ? 'Deleting...' : 'Delete Medication'}</Text>
          </Pressable>
        ) : null}

        <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

function FieldLabel({ text }: { text: string }) {
  return <Text style={styles.label}>{text}</Text>;
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  loadingText: {
    color: AlagaColors.textMuted,
    fontSize: 14,
    marginBottom: 10,
  },
  label: {
    color: AlagaColors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 8,
  },
  input: {
    minHeight: 60,
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: '#D4E0F0',
    backgroundColor: '#FFFFFF',
    color: AlagaColors.textPrimary,
    fontSize: 18,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  inputActive: {
    borderColor: AlagaColors.accentBlue,
  },
  frequencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  frequencyButton: {
    width: '48.5%',
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: '#D4E0F0',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  frequencyButtonActive: {
    borderColor: AlagaColors.accentBlue,
    backgroundColor: '#EBF3FB',
  },
  freqIcon: {
    marginRight: 6,
  },
  frequencyText: {
    color: '#8A9BBB',
    fontSize: 14,
    fontWeight: '500',
  },
  frequencyTextActive: {
    color: AlagaColors.accentBlue,
    fontWeight: '700',
  },
  photoButton: {
    minHeight: 64,
    borderRadius: 18,
    borderWidth: 2.5,
    borderStyle: 'dashed',
    borderColor: AlagaColors.accentBlue,
    backgroundColor: '#EBF3FB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  photoButtonDone: {
    borderColor: '#4CAF7A',
    backgroundColor: '#E6F5EC',
  },
  photoText: {
    fontSize: 18,
    fontWeight: '700',
    color: AlagaColors.accentBlue,
  },
  photoTextDone: {
    color: AlagaColors.success,
  },
  helpText: {
    color: '#8A9BBB',
    fontSize: 15,
    marginTop: 10,
    marginBottom: 20,
    lineHeight: 22,
  },
  primaryButton: {
    minHeight: 62,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2B6CB8',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  deleteButton: {
    minHeight: 56,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FDECEA',
    borderWidth: 1,
    borderColor: '#F6CACA',
    marginBottom: 12,
  },
  deleteButtonText: {
    color: '#C0392B',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    minHeight: 58,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D4E0F0',
  },
  secondaryButtonText: {
    color: '#8A9BBB',
    fontSize: 18,
    fontWeight: '600',
  },
});
