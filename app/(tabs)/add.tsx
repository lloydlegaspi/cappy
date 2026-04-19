import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
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

import { useFeedback } from '@/components/alaga/FeedbackToast';
import { ScreenContainer } from '@/components/alaga/ScreenContainer';
import { ScreenHeader } from '@/components/alaga/ScreenHeader';
import { AlagaColors } from '@/constants/alaga-theme';
import {
    createMedication,
    deleteMedicationByIdWithReason,
    getMedicationByIdRaw,
    updateMedicationById,
} from '@/lib/api/medications';
import {
    chooseMedicationPhotoFromLibrary,
    takeMedicationPhoto,
} from '@/lib/media/medicationImagePicker';
import {
    cancelMedicationReminderNotifications,
    scheduleMedicationReminderNotifications,
} from '@/lib/notifications/medicationReminders';
import { uploadMedicationImage } from '@/lib/storage/medicationImageUpload';
import type { Medication } from '@/types/medication';

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
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const [photoPreviewUri, setPhotoPreviewUri] = useState<string | null>(null);
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const formTitle = useMemo(
    () => (isEditMode ? 'Edit Medication' : 'Add Medication'),
    [isEditMode],
  );
  const isFormLocked = isSaving || isLoadingForm || isDeleting || isUploadingPhoto;

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

      const loadedPhoto = record.pillPhotoUrl ?? null;
      setExistingPhotoUrl(loadedPhoto);
      setPhotoPreviewUri(loadedPhoto);
      setPendingPhotoUri(null);
      setPhotoRemoved(false);
      setIsLoadingForm(false);
    }

    void loadMedicationForEdit();

    return () => {
      isActive = false;
    };
  }, [params.medId, router]);

  const applySelectedPhoto = (uri: string) => {
    setPhotoPreviewUri(uri);
    setPendingPhotoUri(uri);
    setPhotoRemoved(false);
  };

  const handleTakePhoto = async () => {
    const result = await takeMedicationPhoto();

    if (result.type === 'success') {
      applySelectedPhoto(result.uri);
      return;
    }

    if (result.type === 'permission-denied') {
      showToast('Camera permission needed', 'error');
      Alert.alert('Permission needed', result.message);
      return;
    }

    if (result.type === 'error') {
      showToast('Could not open camera', 'error');
      Alert.alert('Camera error', result.message);
    }
  };

  const handleChooseFromGallery = async () => {
    const result = await chooseMedicationPhotoFromLibrary();

    if (result.type === 'success') {
      applySelectedPhoto(result.uri);
      return;
    }

    if (result.type === 'permission-denied') {
      showToast('Photo permission needed', 'error');
      Alert.alert('Permission needed', result.message);
      return;
    }

    if (result.type === 'error') {
      showToast('Could not open photo library', 'error');
      Alert.alert('Photo picker error', result.message);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreviewUri(null);
    setPendingPhotoUri(null);
    setPhotoRemoved(true);
  };

  const saveMedication = async () => {
    if (!name.trim() || !dosage.trim() || !time.trim()) {
      Alert.alert(
        'Missing details',
        'Please enter the medication name, dosage, and time.',
      );
      return;
    }

    setIsSaving(true);

    const medicationPayload = {
      name: name.trim(),
      dosage: dosage.trim(),
      purpose: purpose.trim() || null,
      time_of_day: time.trim(),
      frequency: frequencyToSchema[frequency],
    };

    let finalPhotoUrl = existingPhotoUrl;
    let record: Medication | null = null;

    if (isEditMode && params.medId) {
      if (pendingPhotoUri) {
        setIsUploadingPhoto(true);
        const uploadedImage = await uploadMedicationImage(pendingPhotoUri, params.medId);
        setIsUploadingPhoto(false);

        if (!uploadedImage) {
          setIsSaving(false);
          showToast('Could not upload photo', 'error');
          Alert.alert(
            'Upload failed',
            'The photo could not be uploaded. Please try again.',
          );
          return;
        }

        finalPhotoUrl = uploadedImage.publicUrl;
      } else if (photoRemoved) {
        finalPhotoUrl = null;
      }

      record = await updateMedicationById(params.medId, {
        ...medicationPayload,
        pill_photo_url: finalPhotoUrl,
      });
    } else {
      if (!pendingPhotoUri) {
        record = await createMedication({
          ...medicationPayload,
          pill_photo_url: null,
        });
      } else {
        const createdRecord = await createMedication({
          ...medicationPayload,
          pill_photo_url: null,
        });

        if (!createdRecord) {
          record = null;
        } else {
          setIsUploadingPhoto(true);
          const uploadedImage = await uploadMedicationImage(pendingPhotoUri, createdRecord.id);
          setIsUploadingPhoto(false);

          if (!uploadedImage) {
            const rollbackResult = await deleteMedicationByIdWithReason(createdRecord.id);

            if (!rollbackResult.ok) {
              console.warn('Rollback after upload failure did not delete medication:', rollbackResult);
            }

            setIsSaving(false);
            showToast('Could not upload photo', 'error');
            Alert.alert(
              'Upload failed',
              'The photo could not be uploaded. Please try again.',
            );
            return;
          }

          finalPhotoUrl = uploadedImage.publicUrl;

          const updatedRecord = await updateMedicationById(createdRecord.id, {
            ...medicationPayload,
            pill_photo_url: finalPhotoUrl,
          });

          if (!updatedRecord) {
            finalPhotoUrl = createdRecord.pillPhotoUrl ?? null;
          }

          record = updatedRecord ?? createdRecord;
        }
      }
    }

    if (!record) {
      setIsSaving(false);
      showToast('Could not save medication', 'error');
      Alert.alert(
        'Save failed',
        'The medication was not saved. Please verify Supabase policies and try again.',
      );
      return;
    }

    const notificationResult = await scheduleMedicationReminderNotifications({
      id: record.id,
      name: record.name,
      time: record.time,
    });

    if (!notificationResult.ok) {
      showToast(
        notificationResult.reason === 'permission-denied'
          ? 'Medication saved, reminders are off'
          : notificationResult.reason === 'unsupported-platform'
            ? 'Medication saved, reminders are available on mobile'
          : 'Medication saved but reminder was not scheduled',
        notificationResult.reason === 'schedule-error' ? 'error' : 'info',
      );
    }

    setIsSaving(false);
    setExistingPhotoUrl(finalPhotoUrl);
    setPhotoPreviewUri(finalPhotoUrl);
    setPendingPhotoUri(null);
    setPhotoRemoved(false);

    showToast(isEditMode ? 'Medication updated' : 'Medication added', 'success');
    Alert.alert(
      isEditMode ? 'Medication Updated' : 'Medication Saved',
      isEditMode
        ? 'Changes have been saved.'
        : 'Your medication has been added to the schedule.',
      [{ text: 'OK', onPress: () => router.replace('/') }],
    );
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
                  ? 'Supabase blocked this delete with row-level security. Run the latest schema migration to apply per-user ownership policies.'
                  : result.message ?? 'The medication was not deleted.',
              );
              return;
            }

            try {
              await cancelMedicationReminderNotifications(params.medId as string);
            } catch (error) {
              console.warn('Reminder cleanup failed after delete:', error);
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
      <ScreenHeader title={formTitle} onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {isLoadingForm ? (
          <Text style={styles.loadingText}>Loading medication details...</Text>
        ) : null}

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
        <TextInput
          value={time}
          onChangeText={setTime}
          style={[styles.input, styles.inputActive]}
        />

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
                  <Ionicons
                    name="checkmark"
                    size={16}
                    color={AlagaColors.accentBlue}
                    style={styles.freqIcon}
                  />
                ) : null}
                <Text style={[styles.frequencyText, selected && styles.frequencyTextActive]}>
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <FieldLabel text="Pill Photo" />
        <View style={styles.photoSection}>
          <View style={styles.photoPreviewWrap}>
            {photoPreviewUri ? (
              <Image
                source={{ uri: photoPreviewUri }}
                style={styles.photoPreviewImage}
                contentFit="cover"
              />
            ) : (
              <View style={styles.photoPlaceholderWrap}>
                <Ionicons name="image-outline" size={28} color="#8AA0BF" />
                <Text style={styles.photoPlaceholderText}>No photo selected</Text>
              </View>
            )}
          </View>

          <View style={styles.photoActionsRow}>
            <Pressable
              style={[styles.photoActionButton, isFormLocked && styles.photoActionButtonDisabled]}
              onPress={handleTakePhoto}
              disabled={isFormLocked}>
              <Ionicons name="camera-outline" size={18} color={AlagaColors.accentBlue} />
              <Text style={styles.photoActionButtonText}>Take Photo</Text>
            </Pressable>

            <Pressable
              style={[styles.photoActionButton, isFormLocked && styles.photoActionButtonDisabled]}
              onPress={handleChooseFromGallery}
              disabled={isFormLocked}>
              <Ionicons name="images-outline" size={18} color={AlagaColors.accentBlue} />
              <Text style={styles.photoActionButtonText}>Choose from Gallery</Text>
            </Pressable>
          </View>

          {photoPreviewUri ? (
            <Pressable
              style={[styles.photoRemoveButton, isFormLocked && styles.photoActionButtonDisabled]}
              onPress={handleRemovePhoto}
              disabled={isFormLocked}>
              <Ionicons name="trash-outline" size={17} color="#C0392B" />
              <Text style={styles.photoRemoveButtonText}>Remove Photo</Text>
            </Pressable>
          ) : null}
        </View>

        <Text style={styles.helpText}>
          {isUploadingPhoto
            ? 'Uploading photo...'
            : 'A photo makes it easier to recognize your medication.'}
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={saveMedication}
          disabled={isFormLocked}>
          <Text style={styles.primaryButtonText}>
            {isSaving || isUploadingPhoto
              ? 'Saving...'
              : isEditMode
                ? 'Update Medication'
                : 'Save Medication'}
          </Text>
        </Pressable>

        {isEditMode ? (
          <Pressable
            style={styles.deleteButton}
            onPress={confirmDelete}
            hitSlop={8}
            disabled={isFormLocked}>
            <Text style={styles.deleteButtonText}>
              {isDeleting ? 'Deleting...' : 'Delete Medication'}
            </Text>
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
  photoSection: {
    marginBottom: 2,
  },
  photoPreviewWrap: {
    minHeight: 170,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#D4E0F0',
    overflow: 'hidden',
    backgroundColor: '#F8FBFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPreviewImage: {
    width: '100%',
    height: 170,
  },
  photoPlaceholderWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  photoPlaceholderText: {
    color: '#8AA0BF',
    fontSize: 14,
    fontWeight: '600',
  },
  photoActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  photoActionButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#D8E6F4',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
  },
  photoActionButtonDisabled: {
    opacity: 0.6,
  },
  photoActionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: AlagaColors.accentBlue,
  },
  photoRemoveButton: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F6CACA',
    backgroundColor: '#FDECEA',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  photoRemoveButtonText: {
    color: '#C0392B',
    fontSize: 14,
    fontWeight: '700',
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
