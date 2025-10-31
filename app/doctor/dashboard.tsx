import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import DoctorSidebar from '../../components/DoctorSidebar';

// Dummy data
const patientsToday = [
  { id: 1, name: "Sara Ahmed", service: "Laser", time: "10:00 AM", status: "Pending" },
  { id: 2, name: "Mona Ali", service: "Beauty", time: "11:30 AM", status: "Confirmed" },
  { id: 3, name: "Laila Hassan", service: "Diagnosis", time: "12:15 PM", status: "Pending" },
];

// ...imports remain the same

export default function DoctorDashboard() {
  const router = useRouter();
  const [selectedPatient, setSelectedPatient] = useState(patientsToday[0]);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false}>
        <View style={styles.greetingCard}>
          <Text style={styles.greeting}>Good Morning, Dr. Nour 👋</Text>
          <Text style={styles.greetingSubtitle}>Here’s your schedule for today.</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.cardShadow]}>
            <Text style={styles.statNumber}>{patientsToday.length}</Text>
            <Text style={styles.statLabel}>Sessions Today</Text>
          </View>
          <View style={[styles.statCard, styles.cardShadow]}>
            <Text style={styles.statNumber}>
              {patientsToday.filter(p => p.status === 'Pending').length}
            </Text>
            <Text style={styles.statLabel}>Pending Diagnosis</Text>
          </View>
          <View style={[styles.statCard, styles.cardShadow]}>
            <Text style={styles.statNumber}>
              {patientsToday.filter(p => p.status === 'Confirmed').length}
            </Text>
            <Text style={styles.statLabel}>Confirmed Patients</Text>
          </View>
        </View>

        <View style={[styles.tableContainer, styles.cardShadow]}>
          <Text style={styles.sectionTitle}>Today's Patients</Text>
          {patientsToday.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.tableRow,
                selectedPatient.id === p.id ? styles.selectedRow : null
              ]}
              onPress={() => setSelectedPatient(p)}
            >
              <Text style={styles.tableCell}>{p.name}</Text>
              <Text style={styles.tableCell}>{p.service}</Text>
              <Text style={styles.tableCell}>{p.time}</Text>
              <View style={styles.statusBadgeWrapper}>
                <Text style={[
                  styles.statusBadge,
                  p.status === 'Confirmed' ? styles.statusConfirmed : styles.statusPending
                ]}>
                  {p.status}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setSelectedPatient(p)}
              >
                <Text style={styles.selectButtonText}>Select</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.rightPanel, styles.cardShadow]}>
        <Text style={styles.sectionTitle}>Patient Quick Info</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Name</Text>
          <Text>{selectedPatient.name}</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Service</Text>
          <Text>{selectedPatient.service}</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Time</Text>
          <Text>{selectedPatient.time}</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Status</Text>
          <Text
            style={[
              selectedPatient.status === 'Confirmed'
                ? styles.statusConfirmed
                : styles.statusPending
            ]}
          >
            {selectedPatient.status}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.openDiagnosisButton}
          onPress={() => router.push(`/doctor/patient-history?name=${selectedPatient.name}`)}
        >
          <Text style={styles.openDiagnosisText}>Open Diagnosis Page</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#FAFAFA' },
  mainContent: { flex: 1, padding: 20 },
  greetingCard: { marginBottom: 20 },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#9B084D' },
  greetingSubtitle: { fontSize: 16, color: '#666', marginTop: 5 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statCard: { backgroundColor: '#fff', padding: 20, borderRadius: 12, flex: 1, marginHorizontal: 5, alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: 'bold', color: '#9B084D' },
  statLabel: { marginTop: 5, color: '#444', textAlign: 'center' },
  tableContainer: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#9B084D' },
  tableRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center', borderRadius: 8 },
  selectedRow: { backgroundColor: '#F3E5F5' },
  tableCell: { flex: 1, textAlign: 'center' },
  statusBadgeWrapper: { flex: 1, alignItems: 'center' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, color: '#fff', fontWeight: 'bold' },
  statusConfirmed: { backgroundColor: '#28A745', color: '#fff' },
  statusPending: { backgroundColor: '#E6A000', color: '#fff' },
  selectButton: { backgroundColor: '#9B084D', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12 },
  selectButtonText: { color: '#fff', fontWeight: 'bold' },
  rightPanel: { width: 220, backgroundColor: '#fff', padding: 15, borderLeftWidth: 1, borderLeftColor: '#eee' },
  infoCard: { padding: 10, marginVertical: 6, backgroundColor: '#FAFAFA', borderRadius: 8 },
  infoLabel: { fontWeight: '700', color: '#333', marginBottom: 4 },
  openDiagnosisButton: { marginTop: 20, backgroundColor: '#E80A7A', padding: 12, borderRadius: 8, alignItems: 'center' },
  openDiagnosisText: { color: '#fff', fontWeight: 'bold' },
  cardShadow: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 5 },
});
