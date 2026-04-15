import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AlagaColors } from '@/constants/alaga-theme';
import type { Medication } from '@/types/medication';
import { StatusBadge } from './StatusBadge';

type MedicationCardVariant = 'due-now' | 'later' | 'history';

interface MedicationCardProps {
  medication: Medication;
  variant: MedicationCardVariant;
  onPress?: () => void;
}

function statusIconName(status: Medication['status']): keyof typeof Ionicons.glyphMap {
  switch (status) {
    case 'Taken':
      return 'checkmark-circle';
    case 'Snoozed':
      return 'pause-circle';
    case 'Pending':
      return 'ellipse-outline';
    case 'Missed':
      return 'close-circle';
    case 'Not Yet':
      return 'alert-circle';
    case 'Later':
      return 'time';
    default:
      return 'ellipse';
  }
}

function statusIconColor(status: Medication['status']) {
  switch (status) {
    case 'Taken':
      return AlagaColors.success;
    case 'Snoozed':
      return AlagaColors.accentBlue;
    case 'Pending':
      return '#667085';
    case 'Missed':
      return AlagaColors.danger;
    case 'Not Yet':
      return AlagaColors.warning;
    case 'Later':
      return '#4E93DA';
    default:
      return '#A8C0DC';
  }
}

export function MedicationCard({ medication, variant, onPress }: MedicationCardProps) {
  if (variant === 'due-now') {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.dueCard, pressed && styles.pressed, !onPress && styles.notInteractive]}>
        <Image source={{ uri: medication.image }} style={styles.dueImage} contentFit="cover" />
        <View style={styles.mainTextWrap}>
          <Text style={styles.time}>{medication.time}</Text>
          <Text style={styles.dueTitle}>{medication.name}</Text>
          <Text style={styles.subtitle}>{medication.dosage}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#A8C0DC" />
      </Pressable>
    );
  }

  if (variant === 'later') {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.laterCard, pressed && styles.pressed, !onPress && styles.notInteractive]}>
        <Image source={{ uri: medication.image }} style={styles.smallImage} contentFit="cover" />
        <View style={styles.mainTextWrap}>
          <Text style={styles.timeSmall}>{medication.time}</Text>
          <Text style={styles.laterTitle}>{medication.name}</Text>
          <Text style={styles.subtitleMuted}>{medication.dosage}</Text>
        </View>
        <View style={styles.rightInline}>
          <StatusBadge status={medication.status} />
          <Ionicons name="chevron-forward" size={16} color="#BDB5AA" />
        </View>
      </Pressable>
    );
  }

  return (
    <View style={styles.historyCard}>
      <Image source={{ uri: medication.image }} style={styles.smallImage} contentFit="cover" />
      <View style={styles.mainTextWrap}>
        <Text style={styles.historyTitle}>{medication.name}</Text>
        <Text style={styles.time}>{medication.time}</Text>
        <Text style={styles.subtitleMuted}>{medication.dosage}</Text>
      </View>
      <View style={styles.rightStack}>
        <Ionicons name={statusIconName(medication.status)} size={22} color={statusIconColor(medication.status)} />
        <StatusBadge status={medication.status} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: AlagaColors.surface,
    borderWidth: 1.5,
    borderColor: '#E0ECF9',
    padding: 14,
    shadowColor: '#3B7EC8',
    shadowOpacity: 0.11,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 14,
    elevation: 2,
  },
  laterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: AlagaColors.surface,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    padding: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 8,
    elevation: 1,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: AlagaColors.surface,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    padding: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 8,
    elevation: 1,
  },
  dueImage: {
    width: 72,
    height: 72,
    borderRadius: 14,
    marginRight: 14,
    borderWidth: 1.5,
    borderColor: '#DCEDFB',
    backgroundColor: '#F0F6FF',
  },
  smallImage: {
    width: 50,
    height: 50,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: '#EBF3FB',
    backgroundColor: '#F0F6FF',
  },
  mainTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  rightInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rightStack: {
    alignItems: 'center',
    gap: 5,
  },
  time: {
    color: AlagaColors.accentBlue,
    fontSize: 14,
    fontWeight: '700',
  },
  timeSmall: {
    color: AlagaColors.accentBlue,
    fontSize: 13,
    fontWeight: '700',
  },
  dueTitle: {
    color: AlagaColors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 24,
  },
  laterTitle: {
    color: AlagaColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  historyTitle: {
    color: AlagaColors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    color: AlagaColors.textSecondary,
    fontSize: 14,
  },
  subtitleMuted: {
    color: AlagaColors.textMuted,
    fontSize: 13,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  notInteractive: {
    opacity: 1,
  },
});
