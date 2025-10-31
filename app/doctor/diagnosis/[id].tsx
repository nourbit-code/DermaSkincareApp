import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

const dummyMedications = [
  { id: 1, name: "Paracetamol", dose: "500mg", duration: "5 days" },
  { id: 2, name: "Amoxicillin", dose: "250mg", duration: "7 days" },
  { id: 3, name: "Hydrocortisone", dose: "1%", duration: "3 days" },
  { id: 4, name: "Ibuprofen", dose: "200mg", duration: "5 days" },
  { id: 5, name: "Cetirizine", dose: "10mg", duration: "7 days" },
];

export default function DiagnosisPage() {
  const { id } = useLocalSearchParams();
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [medications] = useState(dummyMedications);
  const [selectedMeds, setSelectedMeds] = useState<any[]>([]);
  const [searchMed, setSearchMed] = useState('');

  const filteredMeds = medications.filter(m =>
    m.name.toLowerCase().includes(searchMed.toLowerCase())
  );

  const handleSelectMed = (med: any) => {
    if (!selectedMeds.find(m => m.id === med.id)) {
      setSelectedMeds([...selectedMeds, med]);
    }
  };

  const handleRemoveMed = (medId: number) => {
    setSelectedMeds(selectedMeds.filter(m => m.id !== medId));
  };

  const handleSave = () => {
    alert(`Saved for patient ${id}:\nDiagnosis: ${diagnosis}\nPrescription: ${prescription}\nMedications: ${selectedMeds.map(m => m.name).join(", ")}`);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Diagnosis Page</Text>
      <Text style={styles.subHeader}>Patient ID: {id}</Text>

      <Text style={styles.label}>Diagnosis Notes:</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter diagnosis..."
        value={diagnosis}
        onChangeText={setDiagnosis}
        multiline
      />

      <Text style={styles.label}>Prescription:</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter prescription..."
        value={prescription}
        onChangeText={setPrescription}
        multiline
      />

      {/* Medication Box with Search */}
      <Text style={styles.label}>Select Medications:</Text>
      <View style={styles.medBox}>
        <TextInput
          style={styles.medSearch}
          placeholder="Search medication..."
          value={searchMed}
          onChangeText={setSearchMed}
        />
        <ScrollView style={styles.medList}>
          {filteredMeds.map(med => (
            <TouchableOpacity
              key={med.id}
              style={[
                styles.medItem,
                selectedMeds.find(s => s.id === med.id) ? styles.medSelected : null
              ]}
              onPress={() => handleSelectMed(med)}
            >
              <Text style={styles.medText}>{med.name} ({med.dose})</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Selected Medications */}
      {selectedMeds.length > 0 && (
        <View style={styles.selectedMedsBox}>
          <Text style={styles.label}>Selected Medications:</Text>
          {selectedMeds.map(med => (
            <View key={med.id} style={styles.selectedMed}>
              <Text>{med.name} - {med.dose} ({med.duration})</Text>
              <TouchableOpacity onPress={() => handleRemoveMed(med.id)}>
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>Save</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#FAFAFA' },
  header: { fontSize: 22, fontWeight: 'bold', color: '#9B084D', marginBottom: 5 },
  subHeader: { fontSize: 16, color: '#666', marginBottom: 15 },
  label: { fontSize: 14, fontWeight: 'bold', marginBottom: 5 },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  medBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 15,
  },
  medSearch: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  medList: {
    maxHeight: 150,
  },
  medItem: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  medSelected: {
    backgroundColor: '#9B084D',
  },
  medText: {
    color: '#333',
  },
  selectedMedsBox: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
  },
  selectedMed: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  removeText: { color: '#E80A7A', fontWeight: 'bold' },
  saveButton: {
    backgroundColor: '#E80A7A',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  saveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
