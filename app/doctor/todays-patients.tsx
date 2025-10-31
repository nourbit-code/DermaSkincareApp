import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

// Dummy data for today's patients
const patientsToday = [
  { id: 1, name: "Sara Ahmed", service: "Laser", time: "10:00 AM", status: "Pending" },
  { id: 2, name: "Mona Ali", service: "Beauty", time: "11:30 AM", status: "Confirmed" },
  { id: 3, name: "Laila Hassan", service: "Diagnosis", time: "12:15 PM", status: "Pending" },
];

export default function TodaysPatients() {
  const router = useRouter();
  const [selectedPatient, setSelectedPatient] = useState(patientsToday[0]);

  return (
    <View style={styles.container}>
      {/* Left Table */}
      <ScrollView style={styles.leftPanel} contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.header}>Today's Patients</Text>

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.cell, styles.headerCell]}>Patient</Text>
          <Text style={[styles.cell, styles.headerCell]}>Service</Text>
          <Text style={[styles.cell, styles.headerCell]}>Time</Text>
          <Text style={[styles.cell, styles.headerCell]}>Status</Text>
          <Text style={[styles.cell, styles.headerCell]}>Action</Text>
        </View>

        {/* Table Rows */}
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
              <Text style={styles.startExamText}>Start diadnosis</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Right Quick Info Panel */}
      <View style={styles.rightPanel}>
        <Text style={styles.infoHeader}>Patient Quick Info</Text>
        <Text>Name: {selectedPatient.name}</Text>
        <Text>Service: {selectedPatient.service}</Text>
        <Text>Time: {selectedPatient.time}</Text>
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

// Styles remain unchanged
const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#F9F9F9' },

  // Left panel (table)
  leftPanel: { flex: 3 },
  header: { fontSize: 22, fontWeight: 'bold', color: '#9B084D', marginBottom: 20 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#ccc', paddingVertical: 8 },
  tableRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center' },
  cell: { flex: 1, textAlign: 'center' },
  headerCell: { fontWeight: 'bold', color: '#9B084D' },
  statusConfirmed: { color: '#28A745', fontWeight: 'bold' },
  statusPending: { color: '#E6A000', fontWeight: 'bold' },
  startExamButton: { backgroundColor: '#9B084D', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  startExamText: { color: '#fff', fontWeight: 'bold' },

  // Right panel (quick info)
  rightPanel: { flex: 1, backgroundColor: '#fff', padding: 20, borderLeftWidth: 1, borderLeftColor: '#eee' },
  infoHeader: { fontWeight: 'bold', fontSize: 18, marginBottom: 10, color: '#9B084D' },
  openDiagnosisButton: { marginTop: 15, backgroundColor: '#E80A7A', padding: 10, borderRadius: 8, alignItems: 'center' },
  openDiagnosisText: { color: '#fff', fontWeight: 'bold' },
});
