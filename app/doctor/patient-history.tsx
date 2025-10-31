import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

// Dummy patients list
const allPatients = [
  { id: 1, name: "Sara Ahmed", lastService: "Laser", lastVisit: "10/31/2025" },
  { id: 2, name: "Mona Ali", lastService: "Beauty", lastVisit: "10/30/2025" },
  { id: 3, name: "Laila Hassan", lastService: "Diagnosis", lastVisit: "10/29/2025" },
  { id: 4, name: "Ahmed Samir", lastService: "Laser", lastVisit: "10/28/2025" },
  { id: 5, name: "Nada Khaled", lastService: "Beauty", lastVisit: "10/27/2025" },
];

export default function PatientHistory() {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [patients, setPatients] = useState(allPatients);

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Patient History</Text>

      <TextInput
        style={styles.searchBar}
        placeholder="Search patients..."
        value={searchText}
        onChangeText={setSearchText}
      />

      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        {filteredPatients.map(patient => (
          <View key={patient.id} style={styles.patientCard}>
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>{patient.name}</Text>
              <Text style={styles.patientDetails}>Last Service: {patient.lastService}</Text>
              <Text style={styles.patientDetails}>Last Visit: {patient.lastVisit}</Text>
            </View>
            <View style={styles.buttonsContainer}>
              {/* Corrected navigation */}
              <TouchableOpacity
                style={styles.diagnosisButton}
                onPress={() =>
                  router.push({
                    pathname: '/doctor/diagnosis/[id]',
                    params: { id: patient.id },
                  })
                }
              >
                <Text style={styles.buttonText}>Diagnosis</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.patientPageButton}
                onPress={() =>
                  router.push({
                    pathname: '/doctor/patient-page/[id]',
                    params: { id: patient.id },
                  })
                }
              >
                <Text style={styles.buttonText}>Patient Page</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#FAFAFA' },
  header: { fontSize: 22, fontWeight: 'bold', color: '#9B084D', marginBottom: 15 },
  searchBar: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  listContainer: { flex: 1 },
  patientCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  patientInfo: { flex: 1 },
  patientName: { fontSize: 16, fontWeight: 'bold', marginBottom: 4, color: '#333' },
  patientDetails: { fontSize: 14, color: '#666' },
  buttonsContainer: { flexDirection: 'row', gap: 8 },
  diagnosisButton: {
    backgroundColor: '#E80A7A',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 5,
  },
  patientPageButton: {
    backgroundColor: '#9B084D',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});
