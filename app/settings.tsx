import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from 'react-native';

import { useFeedback } from '@/components/alaga/FeedbackToast';
import { ScreenContainer } from '@/components/alaga/ScreenContainer';
import { ScreenHeader } from '@/components/alaga/ScreenHeader';
import { AlagaColors } from '@/constants/alaga-theme';
import { getUserSettings, updateUserSettings } from '@/lib/api/settings';
import { getAuthenticatedUserId, toShortGuestId } from '@/lib/auth/guestSession';
import {
    DEFAULT_USER_SETTINGS,
    LANGUAGE_OPTIONS,
    REMINDER_SOUND_OPTIONS,
    TEXT_SIZE_OPTIONS,
    type LanguageOption,
    type ReminderSoundOption,
    type TextSizeOption,
    type UserSettings,
} from '@/types/settings';

function isValidCaregiverPhone(phoneNumber: string): boolean {
  const trimmed = phoneNumber.trim();

  if (!trimmed) {
    return true;
  }

  return /^[+0-9()\-\s]{7,20}$/.test(trimmed);
}

export default function SettingsScreen() {
  const router = useRouter();
  const { showToast } = useFeedback();

  const [form, setForm] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [guestIdLabel, setGuestIdLabel] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    const [settings, userId] = await Promise.all([getUserSettings(), getAuthenticatedUserId()]);
    setForm(settings);
    setGuestIdLabel(toShortGuestId(userId));
    setIsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadSettings();
    }, [loadSettings]),
  );

  const saveSettings = useCallback(async () => {
    if (!isValidCaregiverPhone(form.caregiverPhone)) {
      showToast('Please enter a valid phone number', 'error');
      Alert.alert(
        'Invalid phone number',
        'Please use only digits and common phone symbols (+, -, spaces, parentheses).',
      );
      return;
    }

    setIsSaving(true);

    const saved = await updateUserSettings({
      displayName: form.displayName,
      caregiverName: form.caregiverName,
      caregiverPhone: form.caregiverPhone,
      textSize: form.textSize,
      reminderSound: form.reminderSound,
      highContrast: form.highContrast,
      language: form.language,
    });

    setForm(saved);
    setIsSaving(false);
    showToast('Settings saved', 'success');
    router.back();
  }, [form, router, showToast]);

  return (
    <ScreenContainer>
      <ScreenHeader title="Settings" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? <Text style={styles.loadingText}>Loading settings...</Text> : null}

        <Text style={styles.label}>Name</Text>
        <TextInput
          value={form.displayName}
          onChangeText={(value) => setForm((current) => ({ ...current, displayName: value }))}
          placeholder="Your name"
          placeholderTextColor={AlagaColors.textMuted}
          style={styles.nameInput}
          autoCapitalize="words"
          maxLength={50}
        />

        <View style={styles.caregiverCard}>
          <Text style={styles.caregiverTitle}>Caregiver Contact</Text>
          <Text style={styles.caregiverDescription}>
            Save a trusted contact for future help flows.
          </Text>

          <Text style={styles.caregiverLabel}>Caregiver Name</Text>
          <TextInput
            value={form.caregiverName}
            onChangeText={(value) =>
              setForm((current) => ({ ...current, caregiverName: value }))
            }
            placeholder="e.g. Maria Santos"
            placeholderTextColor={AlagaColors.textMuted}
            style={styles.caregiverInput}
            autoCapitalize="words"
            maxLength={80}
          />

          <Text style={styles.caregiverLabel}>Caregiver Phone</Text>
          <TextInput
            value={form.caregiverPhone}
            onChangeText={(value) =>
              setForm((current) => ({ ...current, caregiverPhone: value }))
            }
            placeholder="e.g. +63 912 345 6789"
            placeholderTextColor={AlagaColors.textMuted}
            style={styles.caregiverInput}
            keyboardType="phone-pad"
            maxLength={24}
          />
        </View>

        <SettingsRow label="Text Size">
          <SegmentedPick
            options={TEXT_SIZE_OPTIONS}
            value={form.textSize}
            onChange={(value) => setForm((current) => ({ ...current, textSize: value as TextSizeOption }))}
          />
        </SettingsRow>

        <SettingsRow label="Reminder Sound">
          <SegmentedPick
            options={REMINDER_SOUND_OPTIONS}
            value={form.reminderSound}
            onChange={(value) => setForm((current) => ({ ...current, reminderSound: value as ReminderSoundOption }))}
          />
        </SettingsRow>

        <SettingsRow
          label="High Contrast"
          description="Makes text easier to see">
          <Switch
            value={form.highContrast}
            onValueChange={(value) => setForm((current) => ({ ...current, highContrast: value }))}
            thumbColor="#FFFFFF"
            trackColor={{ false: '#D0C9C0', true: AlagaColors.accentBlue }}
          />
        </SettingsRow>

        <SettingsRow label="Language" isLast>
          <SegmentedPick
            options={LANGUAGE_OPTIONS}
            value={form.language}
            onChange={(value) => setForm((current) => ({ ...current, language: value as LanguageOption }))}
          />
        </SettingsRow>

        {guestIdLabel ? (
          <View style={styles.guestCard}>
            <Text style={styles.guestTitle}>Guest account active</Text>
            <Text style={styles.guestSubtitle}>ID: {guestIdLabel}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            style={[styles.primaryButton, isSaving && styles.buttonDisabled]}
            onPress={saveSettings}
            disabled={isSaving || isLoading}>
            <Text style={styles.primaryButtonText}>{isSaving ? 'Saving...' : 'Save'}</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function SettingsRow({
  label,
  description,
  isLast = false,
  children,
}: {
  label: string;
  description?: string;
  isLast?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.row, isLast && styles.rowLast]}>
      <View style={styles.rowTextWrap}>
        <Text style={styles.rowLabel}>{label}</Text>
        {description ? <Text style={styles.rowDescription}>{description}</Text> : null}
      </View>
      <View style={styles.rowControl}>{children}</View>
    </View>
  );
}

function SegmentedPick({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.segmentedWrap}>
      {options.map((option) => {
        const selected = option === value;

        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            style={[styles.segmentButton, selected && styles.segmentButtonActive]}>
            <Text style={[styles.segmentText, selected && styles.segmentTextActive]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
  },
  loadingText: {
    color: AlagaColors.textMuted,
    fontSize: 14,
    marginBottom: 12,
  },
  label: {
    color: AlagaColors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
  },
  nameInput: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#D4E0F0',
    backgroundColor: '#FFFFFF',
    color: AlagaColors.textPrimary,
    fontSize: 17,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  caregiverCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
  },
  caregiverTitle: {
    color: AlagaColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  caregiverDescription: {
    color: AlagaColors.textMuted,
    fontSize: 13,
    marginBottom: 10,
  },
  caregiverLabel: {
    color: AlagaColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  caregiverInput: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D4E0F0',
    backgroundColor: '#FFFFFF',
    color: AlagaColors.textPrimary,
    fontSize: 16,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  row: {
    borderBottomWidth: 1,
    borderBottomColor: '#EDE8E1',
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowTextWrap: {
    flex: 1,
  },
  rowLabel: {
    color: AlagaColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  rowDescription: {
    marginTop: 3,
    color: AlagaColors.textMuted,
    fontSize: 13,
  },
  rowControl: {
    alignItems: 'flex-end',
  },
  segmentedWrap: {
    flexDirection: 'row',
    backgroundColor: '#EDE8E1',
    borderRadius: 10,
    padding: 3,
    gap: 3,
  },
  segmentButton: {
    minHeight: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  segmentButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  segmentText: {
    color: AlagaColors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: AlagaColors.textPrimary,
    fontWeight: '700',
  },
  actions: {
    borderTopWidth: 1,
    borderTopColor: '#EDE8E1',
    paddingTop: 14,
    marginTop: 6,
    gap: 10,
  },
  guestCard: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8EEF8',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  guestTitle: {
    color: AlagaColors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  guestSubtitle: {
    color: AlagaColors.textMuted,
    fontSize: 12,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: AlagaColors.accentBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#D0C9C0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: AlagaColors.textMuted,
    fontSize: 16,
    fontWeight: '700',
  },
});