import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
  purple: "#7c3aed",
  purpleLight: "#ede9fe",
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
  phone?: string;
  email?: string;
  allergies?: string[];
  notes?: string;
  medicalHistory?: string[];
  surgeries?: string[];
  status?: string;
  followUpDate?: string;
  totalVisits?: number;
  lastService?: string;
}

interface PatientInfoBarProps {
  patient?: PatientData;
  onEdit?: () => void;
  onHistoryClick?: () => void;
  onPatientPageClick?: () => void;
  onReturnToHistoryClick?: () => void;
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

// Info Card Component for displaying lists
const InfoCard: React.FC<{ 
  icon: string; 
  title: string; 
  items: string[]; 
  iconColor: string;
  bgColor: string;
  borderColor: string;
  emptyText?: string;
}> = ({ icon, title, items, iconColor, bgColor, borderColor, emptyText }) => {
  const hasItems = items && items.length > 0;
  
  return (
    <View style={[styles.infoCard, { backgroundColor: bgColor, borderColor }]}>
      <View style={styles.infoCardHeader}>
        <Ionicons name={icon as any} size={14} color={iconColor} />
        <Text style={[styles.infoCardTitle, { color: iconColor }]}>{title}</Text>
      </View>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.chipScroll}
        contentContainerStyle={styles.chipContainer}
      >
        {hasItems ? (
          items.map((item, idx) => (
            <View key={idx} style={[styles.chip, { backgroundColor: iconColor + '20', borderColor: iconColor }]}>
              <Text style={[styles.chipText, { color: iconColor }]}>{item}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>{emptyText || 'None'}</Text>
        )}
      </ScrollView>
    </View>
  );
};

// --- MAIN COMPONENT ---
const PatientInfoBar: React.FC<PatientInfoBarProps> = ({ patient, onEdit, onHistoryClick, onPatientPageClick, onReturnToHistoryClick }) => {
  const hasAllergies = patient?.allergies && patient.allergies.length > 0;
  const hasMedicalHistory = patient?.medicalHistory && patient.medicalHistory.length > 0;
  const hasSurgeries = patient?.surgeries && patient.surgeries.length > 0;

  return (
    <View style={styles.outerContainer}>
      {/* TOP ROW: Avatar + Basic Info + Contact */}
      <View style={styles.topRow}>
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
              {patient?.phone && (
                <>
                  <Ionicons name="call-outline" size={13} color={THEME.textLight} />
                  <Text style={styles.detailText}>{patient.phone}</Text>
                </>
              )}
              {patient?.phone && patient?.email && <Text style={styles.separator}>|</Text>}
              {patient?.email && (
                <>
                  <Ionicons name="mail-outline" size={13} color={THEME.textLight} />
                  <Text style={styles.detailText}>{patient.email}</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* RIGHT: Buttons */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {onReturnToHistoryClick && (
            <TouchableOpacity style={styles.patientPageBtn} onPress={onReturnToHistoryClick}>
              <Ionicons name="arrow-back" size={18} color={THEME.white} />
              <Text style={styles.patientPageBtnText}>Return to Patients History</Text>
            </TouchableOpacity>
          )}
          {onPatientPageClick && (
            <TouchableOpacity style={styles.patientPageBtn} onPress={onPatientPageClick}>
              <Ionicons name="person-circle-outline" size={18} color={THEME.white} />
              <Text style={styles.patientPageBtnText}>Patient Page</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* BOTTOM ROW: Medical Info Cards */}
      <View style={styles.bottomRow}>
        {/* Allergies Card */}
        <InfoCard
          icon={hasAllergies ? "warning" : "shield-checkmark"}
          title="Allergies"
          items={patient?.allergies || []}
          iconColor={hasAllergies ? THEME.danger : THEME.success}
          bgColor={hasAllergies ? THEME.dangerLight : THEME.successLight}
          borderColor={hasAllergies ? THEME.danger : THEME.success}
          emptyText="No known allergies"
        />
        
        {/* Medical History Card */}
        <InfoCard
          icon="document-text"
          title="Medical History"
          items={patient?.medicalHistory || []}
          iconColor={THEME.accentBlue}
          bgColor={THEME.accentBlueLight}
          borderColor={THEME.accentBlue}
          emptyText="No medical history"
        />
        
        {/* Surgeries Card */}
        <InfoCard
          icon="medkit"
          title="Surgeries"
          items={patient?.surgeries || []}
          iconColor={THEME.purple}
          bgColor={THEME.purpleLight}
          borderColor={THEME.purple}
          emptyText="No previous surgeries"
        />
      </View>
    </View>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  outerContainer: {
    flexDirection: 'column',
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 12,
  },
  leftSection: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  patientPageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 6,
  },
  patientPageBtnText: {
    color: THEME.white,
    fontSize: 13,
    fontWeight: '600',
  },
  name: { fontSize: 20, fontWeight: '900', color: THEME.secondary, marginBottom: 2 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2, flexWrap: 'wrap' },
  detailText: { fontSize: 12, color: THEME.textLight, marginLeft: 4 },
  separator: { color: THEME.textLight, marginHorizontal: 6, fontSize: 12 },
  
  // Info Card Styles
  infoCard: {
    flex: 1,
    borderRadius: THEME.radius,
    borderWidth: 1.5,
    padding: 8,
    minHeight: 60,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoCardTitle: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipScroll: {
    flexGrow: 0,
  },
  chipContainer: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 11,
    color: THEME.textLight,
    fontStyle: 'italic',
  },
});

const avatarStyles = StyleSheet.create({
  avatar: { width: 45, height: 45, borderRadius: 22, backgroundColor: THEME.primaryLight, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700', color: THEME.primary },
});

export default PatientInfoBar;
