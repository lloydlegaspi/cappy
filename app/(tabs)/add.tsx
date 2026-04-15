import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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
import { createMedication } from '@/lib/api/medications';

const frequencies = ['Every day', 'Morning only', 'Afternoon only', 'Evening only'] as const;
const frequencyToSchema: Record<(typeof frequencies)[number], string> = {
  'Every day': 'Once daily',
  'Morning only': 'Morning only',
  'Afternoon only': 'Afternoon only',
  'Evening only': 'Evening only',
};

export default function AddMedicationScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [time, setTime] = useState('8:00 AM');
  const [frequency, setFrequency] = useState<(typeof frequencies)[number]>('Every day');
  const [photoAdded, setPhotoAdded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const saveMedication = async () => {
    if (!name.trim() || !dosage.trim() || !time.trim()) {
      Alert.alert('Missing details', 'Please enter the medication name, dosage, and time.');
      return;
    }

    setIsSaving(true);
    const record = await createMedication({
      name: name.trim(),
      dosage: dosage.trim(),
      purpose: null,
      time_of_day: time.trim(),
      frequency: frequencyToSchema[frequency],
      pill_photo_url: photoAdded
        ? 'https://images.unsplash.com/photo-1740592756330-adb8c1f5fbe7?w=500&h=500&fit=crop'
        : null,
    });

    setIsSaving(false);

    if (!record) {
      Alert.alert('Save failed', 'The medication was not saved. Please try again.');
      return;
    }

    Alert.alert('Medication Saved', 'Your medication has been added to the schedule.', [
      { text: 'OK', onPress: () => router.replace('/') },
    ]);
  };

  return (
    <ScreenContainer backgroundColor="#F0F4FB">
      <ScreenHeader title="Add Medication" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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

        <Pressable style={styles.primaryButton} onPress={saveMedication}>
          <Text style={styles.primaryButtonText}>{isSaving ? 'Saving...' : 'Save Medication'}</Text>
        </Pressable>

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
