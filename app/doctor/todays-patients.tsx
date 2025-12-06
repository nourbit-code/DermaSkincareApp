import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';

// Dummy data for today's patients
const patientsToday = [
  { id: 1, name: "Malak Ibrahim", service: "Laser", time: "10:00 AM", status: "Pending" },
  { id: 2, name: "Sarah Ali", service: "Beauty", time: "11:30 AM", status: "Confirmed" },
  { id: 3, name: "Nour Hassan", service: "Diagnosis", time: "12:15 PM", status: "Pending" },
];

export default function TodaysPatients() {
  const router = useRouter();
  const [selectedPatient, setSelectedPatient] = useState(patientsToday[0]);
  const [selectedDate, setSelectedDate] = useState("2025-12-01");

  return (
    <View style={styles.container}>
      
      <ScrollView style={styles.leftPanel} contentContainerStyle={{ padding: 20 }}>
        
        {/* CALENDAR AT TOP */}
        <View style={styles.calendarContainer}>
          <Text style={styles.calendarHeader}>Appointments Calendar</Text>
          <Calendar
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={{
              [selectedDate]: { selected: true, selectedColor: '#9B084D' },
            }}
            theme={{
              selectedDayBackgroundColor: '#9B084D',
              todayTextColor: '#E80A7A',
              arrowColor: '#9B084D',
            }}
            style={styles.calendarStyle}
          />
        </View>

        {/* TABLE BELOW CALENDAR */}
        <Text style={styles.header}>Today's Patients</Text>

        <View style={styles.tableHeader}>
          <Text style={[styles.cell, styles.headerCell]}>Patient</Text>
          <Text style={[styles.cell, styles.headerCell]}>Service</Text>
          <Text style={[styles.cell, styles.headerCell]}>Time</Text>
          <Text style={[styles.cell, styles.headerCell]}>Status</Text>
          <Text style={[styles.cell, styles.headerCell]}>Action</Text>
        </View>

        {patientsToday.map((p) => (
          <View key={p.id} style={styles.tableRow}>
            <Text style={styles.cell}>{p.name}</Text>
            <Text style={styles.cell}>{p.service}</Text>
            <Text style={styles.cell}>{p.time}</Text>
            <Text
              style={[
                styles.cell,
                p.status === "Confirmed" ? styles.statusConfirmed : styles.statusPending,
              ]}
            >
              {p.status}
            </Text>
            <TouchableOpacity
              style={styles.startExamButton}
              onPress={() =>
                router.push({
                  pathname: '/doctor/diagnosis/[id]',
                  params: { id: p.id },
                })
              }
            >
              <Text style={styles.startExamText}>Start diagnosis</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* RIGHT QUICK INFO PANEL */}
      <View style={styles.rightPanel}>
        <Text style={styles.infoHeader}>Patient Quick Info</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Name:</Text>
          <Text style={styles.infoValue}>{selectedPatient.name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Service:</Text>
          <Text style={styles.infoValue}>{selectedPatient.service}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Time:</Text>
          <Text style={styles.infoValue}>{selectedPatient.time}</Text>
        </View>

        <TouchableOpacity
          style={styles.openDiagnosisButton}
          onPress={() =>
            router.push({
              pathname: '/doctor/diagnosis/[id]',
              params: { id: selectedPatient.id },
            })
          }
        >
          <Text style={styles.openDiagnosisText}>Open Diagnosis Page</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#F9F9F9' },

  // Left panel (table)
  leftPanel: { flex: 1, paddingRight: 10 },
  calendarContainer: { marginBottom: 20 },
  calendarHeader: { fontSize: 18, fontWeight: 'bold', color: '#9B084D', marginBottom: 10 },
  calendarStyle: { marginBottom: 15 },
  header: { fontSize: 22, fontWeight: 'bold', color: '#9B084D', marginBottom: 20 },

  // Calendar styles
  calendarContainer: { marginBottom: 16 },
  calendarHeader: { fontSize: 16, fontWeight: '700', color: '#9B084D', marginBottom: 8 },
  calendarStyle: { borderRadius: 8 },

  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#ccc', paddingVertical: 8 },
  tableRow: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center' },
  cell: { flex: 1, textAlign: 'center', fontSize: 13 },
  headerCell: { fontWeight: 'bold', color: '#9B084D' },
  statusConfirmed: { color: '#28A745', fontWeight: 'bold' },
  statusPending: { color: '#E6A000', fontWeight: 'bold' },
  startExamButton: { backgroundColor: '#9B084D', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  startExamText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  // Right panel (quick info) - now slim
  rightPanel: {
    width: 180, // fixed smaller width
    backgroundColor: '#fff',
    padding: 10,
    borderLeftWidth: 1,
    borderLeftColor: '#eee',
    borderRadius: 6,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoHeader: {
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 6,
    color: '#9B084D',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  infoLabel: {
    fontWeight: '600',
    fontSize: 12,
    color: '#555',
  },
  infoValue: {
    fontSize: 12,
    color: '#333',
    flexShrink: 1,
  },
  openDiagnosisButton: {
    marginTop: 8,
    backgroundColor: '#E80A7A',
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  openDiagnosisText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
});
