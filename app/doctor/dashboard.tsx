import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';

// Dummy data for today’s patients
const patientsToday = [
  { id: 1, name: "Mohamed Ahmed", service: "Laser", time: "10:00 AM", status: "Pending" },
  { id: 2, name: "Mona Ali", service: "Beauty", time: "11:30 AM", status: "Confirmed" },
  { id: 3, name: "Laila Hassan", service: "Diagnosis", time: "12:15 PM", status: "Pending" },
];

// Example appointments by date
const appointmentsByDate: Record<string, Array<{ id: number; name: string; service: string; time: string }>> = {
  "2025-12-01": [
    { id: 1, name: "Sara Ahmed", service: "Laser", time: "10:00 AM" },
    { id: 2, name: "Mona Ali", service: "Beauty", time: "11:30 AM" },
  ],
  "2025-12-02": [
    { id: 3, name: "Laila Hassan", service: "Diagnosis", time: "12:15 PM" },
  ],
};

export default function DoctorDashboard() {
  const router = useRouter();
  const [selectedPatient, setSelectedPatient] = useState(patientsToday[0]);
  const [selectedDate, setSelectedDate] = useState("2025-12-01");

  return (
    <View style={styles.container}>
      {/* LEFT PANEL */}
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

      {/* RIGHT PANEL - CALENDAR */}
      <View style={[styles.rightPanel, styles.cardShadow]}>
        <Text style={styles.sectionTitle}>Appointments Calendar</Text>

        <Calendar
          onDayPress={(day) => setSelectedDate(day.dateString)}
          markedDates={{
            [selectedDate]: { selected: true, selectedColor: '#9B084D' },
            ...Object.keys(appointmentsByDate).reduce<Record<string, { marked?: boolean; dotColor?: string }>>((acc, date) => {
              acc[date] = { marked: true, dotColor: '#E80A7A' };
              return acc;
            }, {}),
          }}
          theme={{
            selectedDayBackgroundColor: '#9B084D',
            todayTextColor: '#E80A7A',
            arrowColor: '#9B084D',
          }}
          style={{ borderRadius: 10 }}
        />

        <Text style={[styles.sectionTitle, { marginTop: 12, fontSize: 14 }]}>
          Appointments on {selectedDate}
        </Text>

        <ScrollView style={{ maxHeight: 220 }}>
          {appointmentsByDate[selectedDate]?.map((app) => (
            <View key={app.id} style={styles.infoCard}>
              <Text style={styles.infoLabel}>{app.name}</Text>
              <Text>{app.service}</Text>
              <Text>{app.time}</Text>

              <TouchableOpacity
                style={styles.selectButton}
                onPress={() =>
                  router.push(`/doctor/patient-history?name=${app.name}`)
                }
              >
                <Text style={styles.selectButtonText}>Open</Text>
              </TouchableOpacity>
            </View>
          )) || (
            <Text style={{ color: '#555', marginTop: 10 }}>No appointments.</Text>
          )}
        </ScrollView>
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
  selectButton: { backgroundColor: '#9B084D', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, alignItems: 'center', marginTop: 6 },
  selectButtonText: { color: '#fff', fontWeight: 'bold' },
  rightPanel: { width: 260, backgroundColor: '#fff', padding: 15, borderLeftWidth: 1, borderLeftColor: '#eee' },
  infoCard: { padding: 10, marginVertical: 6, backgroundColor: '#FAFAFA', borderRadius: 8 },
  infoLabel: { fontWeight: '700', color: '#333', marginBottom: 4 },
  openDiagnosisButton: { marginTop: 20, backgroundColor: '#E80A7A', padding: 12, borderRadius: 8, alignItems: 'center' },
  openDiagnosisText: { color: '#fff', fontWeight: 'bold' },
  cardShadow: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 5 },
});
