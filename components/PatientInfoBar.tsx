import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// --- THEME ---
export const THEME = {
  primary: "#be185d",
  primaryLight: "#fce7f3",
  secondary: "#0f172a",
  accentBlue: "#0284c7",
  accentBlueLight: "#e0f2fe",
  text: "#334155",
  textLight: "#94a3b8",
  white: "#ffffff",
  border: "#e2e8f0",
  danger: "#ef4444",
  dangerLight: "#fee2e2",
  success: "#10b981",
  successLight: "#d1fae5",
  radius: 8,
};

// --- TYPES ---
export type ServiceKey = 'DIAGNOSIS' | 'LASER'; // SURGERY removed

export interface PatientData {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other' | string;
  lastVisit: string;
  allergies?: string[];
  status?: string;
  followUpDate?: string;
  totalVisits?: number;
  lastService?: string;
}

interface PatientInfoBarProps {
  patient?: PatientData;
  onEdit?: () => void;
  onHistoryClick?: () => void;
}

// --- COMPONENTS ---
const GenderIcon: React.FC<{ gender: string }> = React.memo(({ gender }) => {
  const isMale = gender.toLowerCase() === 'male';
  const iconName = isMale ? 'gender-male' : 'gender-female';
  const iconColor = isMale ? THEME.accentBlue : THEME.primary;
  return <MaterialCommunityIcons name={iconName} size={14} color={iconColor} style={{ marginRight: 2 }} />;
});

const PatientAvatar: React.FC<{ name?: string }> = ({ name }) => {
  const initials = useMemo(() => {
    if (!name) return "?";
    const split = name.trim().split(' ');
    return split.length === 1 ? split[0][0] : split[0][0] + split[1][0];
  }, [name]);

  return (
    <View style={avatarStyles.avatar}>
      <Text style={avatarStyles.avatarText}>{initials.toUpperCase()}</Text>
    </View>
  );
};

// --- MAIN COMPONENT ---
const PatientInfoBar: React.FC<PatientInfoBarProps> = ({ patient, onEdit, onHistoryClick }) => {
  const isEmpty = !patient || !patient.id;
  const hasAllergies = patient?.allergies?.length ? true : false;

  const handleViewHistory = () => {
    if (onHistoryClick) return onHistoryClick();
    Alert.alert("Patient History", `Viewing history for ${patient?.name || 'patient'}.`, [{ text: "OK" }]);
  };

  const handleEdit = () => {
    if (onEdit) return onEdit();
    Alert.alert("Edit Patient", `Editing ${patient?.name || 'patient'}.`, [{ text: "OK" }]);
  };

  return (
    <View style={styles.outerContainer}>
      {/* LEFT: Avatar + Patient Info */}
      <View style={styles.leftSection}>
        <PatientAvatar name={patient?.name} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={styles.name}>{patient?.name || 'Loading...'}</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailText}>{patient?.age ?? '--'} Y/O</Text>
            <Text style={styles.separator}>|</Text>
            {patient?.gender && <GenderIcon gender={patient.gender} />}
            <Text style={styles.detailText}>{patient?.gender ?? '--'}</Text>
            <Text style={styles.separator}>|</Text>
            <Text style={styles.detailText}>ID: {patient?.id ?? '--'}</Text>
          </View>
          <View style={styles.detailRow}>
            {patient?.status && (
              <>
                <Text style={[styles.detailText, { fontWeight: '700' }]}>{patient.status}</Text>
                <Text style={styles.separator}>|</Text>
              </>
            )}
            {patient?.followUpDate && (
              <>
                <Ionicons name="calendar-outline" size={14} color={THEME.textLight} />
                <Text style={[styles.detailText, { marginLeft: 2 }]}>Next Follow-up: {patient.followUpDate}</Text>
              </>
            )}
          </View>
        </View>
      </View>

      {/* RIGHT: Actions + Allergies */}
      <View style={styles.rightSection}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable style={styles.actionButton} onPress={handleViewHistory}>
            <Ionicons name="documents-outline" size={18} color={THEME.accentBlue} />
          </Pressable>
          <Pressable style={styles.actionButton} onPress={handleEdit}>
            <Ionicons name="pencil-outline" size={18} color={THEME.primary} />
          </Pressable>
        </View>

        {hasAllergies ? (
          <Pressable
            style={styles.allergyBadge}
            onPress={() =>
              Alert.alert(
                "Allergy Details",
                `Known Allergies: ${patient!.allergies?.join(', ') || 'None'}`,
                [{ text: "OK" }]
              )
            }
          >
            <Ionicons name="warning" size={18} color={THEME.danger} />
            <Text style={styles.allergyText}>Allergies Present!</Text>
          </Pressable>
        ) : (
          <View style={styles.noAllergyBadge}>
            <Ionicons name="shield-checkmark" size={18} color={THEME.success} />
            <Text style={styles.noAllergyText}>No Allergies</Text>
          </View>
        )}
      </View>
    </View>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  outerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: THEME.white,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    shadowColor: THEME.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  leftSection: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  name: { fontSize: 22, fontWeight: '900', color: THEME.secondary, marginBottom: 2 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' },
  detailText: { fontSize: 13, color: THEME.textLight, marginLeft: 4 },
  separator: { color: THEME.textLight, marginHorizontal: 6, fontSize: 13 },
  rightSection: { justifyContent: 'center', alignItems: 'flex-end', minWidth: 140 },
  actionButton: { backgroundColor: THEME.border, padding: 8, borderRadius: THEME.radius },
  allergyBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.dangerLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: THEME.radius, marginTop: 8 },
  allergyText: { color: THEME.danger, fontSize: 14, fontWeight: '700', marginLeft: 6 },
  noAllergyBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.successLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: THEME.radius, marginTop: 8 },
  noAllergyText: { color: THEME.success, fontSize: 14, fontWeight: '700', marginLeft: 6 },
});

const avatarStyles = StyleSheet.create({
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: THEME.primaryLight, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700', color: THEME.primary },
});

export default PatientInfoBar;
