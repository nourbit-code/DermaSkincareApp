import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Text, TextInput, Image, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

// ------------------- DUMMY DATA -------------------
const dummyMedications = [
  { id: 1, name: "Paracetamol", dose: "500mg", duration: "5 days" },
  { id: 2, name: "Amoxicillin", dose: "250mg", duration: "7 days" },
  { id: 3, name: "Hydrocortisone Cream", dose: "1%", duration: "3 days" },
  { id: 4, name: "Ibuprofen", dose: "200mg", duration: "5 days" },
  { id: 5, name: "Cetirizine", dose: "10mg", duration: "7 days" },
];

// ------------------- COMPONENTS -------------------

// Patient Info Bar
const PatientInfoBar = ({ patientName, patientId, activeService }: { patientName: string, patientId: string, activeService: 'DIAGNOSIS' | 'LASER' }) => (
  <View style={styles.patientInfoBar}>
    <View style={styles.patientInfoLeft}>
      <Image style={styles.patientAvatar} source={{ uri: "https://placehold.co/48x48" }} />
      <View>
        <Text style={styles.patientName}>{patientName}</Text>
        <Text style={styles.patientDetails}>ID: {patientId} · Service: {activeService}</Text>
      </View>
    </View>
    <View style={styles.patientInfoRight}>
      <View style={styles.sessionBadge}>
        <Text style={styles.sessionText}>Session 1/6</Text>
      </View>
      <View style={styles.completedBadge}>
        <Ionicons name="checkmark-circle" size={16} color="#15803d" />
        <Text style={styles.completedText}>Active</Text>
      </View>
      <TouchableOpacity style={styles.editButton}>
        <Ionicons name="create-outline" size={18} color="#be185d" />
      </TouchableOpacity>
    </View>
  </View>
);

// Service Tabs
const ServiceTabs = ({ activeService, setActiveService }: { activeService: 'DIAGNOSIS' | 'LASER', setActiveService: (s: 'DIAGNOSIS' | 'LASER') => void }) => (
  <View style={styles.serviceTabs}>
    {['DIAGNOSIS', 'LASER'].map(service => (
      <TouchableOpacity
        key={service}
        style={[styles.tab, activeService === service && styles.tabActive]}
        onPress={() => setActiveService(service as 'DIAGNOSIS' | 'LASER')}
      >
        <Text style={[styles.tabText, activeService === service && styles.tabTextActive]}>
          {service === 'DIAGNOSIS' ? 'Diagnosis' : 'Laser'}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

// Medication Selector
const MedicationSelector = ({ medications, selectedMeds, setSelectedMeds }: any) => {
  const [searchText, setSearchText] = useState('');
  const filteredMeds = medications.filter((med: any) => med.name.toLowerCase().includes(searchText.toLowerCase()));

  const toggleMed = (med: any) => {
    if (selectedMeds.find((m: any) => m.id === med.id)) {
      setSelectedMeds(selectedMeds.filter((m: any) => m.id !== med.id));
    } else {
      setSelectedMeds([...selectedMeds, med]);
    }
  };

  return (
    <View style={styles.medSelector}>
      <Text style={styles.medLabel}>Select Medications</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Search medication..."
        value={searchText}
        onChangeText={setSearchText}
      />
      <ScrollView style={styles.medList}>
        {filteredMeds.map((med: any) => {
          const isSelected = selectedMeds.find((m: any) => m.id === med.id);
          return (
            <TouchableOpacity
              key={med.id}
              style={[styles.medItem, isSelected && styles.medItemSelected]}
              onPress={() => toggleMed(med)}
            >
              <Text style={[styles.medName, isSelected && styles.medNameSelected]}>
                {med.name} ({med.dose})
              </Text>
              {isSelected && <Text style={styles.medDetailsSelected}>Selected</Text>}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {selectedMeds.length > 0 && (
        <View style={styles.selectedMeds}>
          <Text style={styles.selectedLabel}>Selected Medications:</Text>
          {selectedMeds.map((med: any) => (
            <View key={med.id} style={styles.selectedItem}>
              <Text style={styles.selectedText}>
                {med.name} - {med.dose} ({med.duration})
              </Text>
              <TouchableOpacity onPress={() => toggleMed(med)}>
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// Laser View
const LaserView = () => (
  <View style={styles.laserContainer}>
    <View style={styles.laserLeft}>
      <View style={[styles.card, styles.pinkCard]}>
        <Text style={styles.cardTitle}>Laser - Left Panel</Text>
        <Text>Professional placeholder for laser controls/settings</Text>
      </View>
    </View>
    <View style={styles.laserRight}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Laser - Right Panel</Text>
        <Text>Professional placeholder for session details/actions</Text>
      </View>
    </View>
  </View>
);

// Normal/Diagnosis View
const NormalView = ({ patientId }: { patientId: string }) => {
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [selectedMeds, setSelectedMeds] = useState<any[]>([]);
  const [saveMessage, setSaveMessage] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const handleSave = () => {
    setSaveMessage('Diagnosis & Prescription saved!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.normalContainer}>
      <View style={styles.normalLeft}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Diagnosis & Prescription</Text>
          <Text style={styles.patientId}>Patient ID: {patientId}</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Enter diagnosis..."
            value={diagnosis}
            onChangeText={setDiagnosis}
            multiline
          />
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Enter prescription..."
            value={prescription}
            onChangeText={setPrescription}
            multiline
          />
        </View>
        <MedicationSelector
          medications={dummyMedications}
          selectedMeds={selectedMeds}
          setSelectedMeds={setSelectedMeds}
        />
        <TouchableOpacity style={styles.mainSaveButton} onPress={handleSave}>
          <Text style={styles.mainSaveText}>Save Diagnosis & Prescription</Text>
        </TouchableOpacity>
        {saveMessage ? <Text style={styles.saveMessageText}>{saveMessage}</Text> : null}
      </View>
      <View style={styles.normalRight}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Patient Photos</Text>
          <TouchableOpacity onPress={pickImage}>
            <Image
              style={styles.photo}
              source={{ uri: photoUri || 'https://placehold.co/300x200/F0F0F0/334155?text=Upload+Photo' }}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// ------------------- MAIN APP -------------------
export default function App() {
  const [activeService, setActiveService] = useState<'DIAGNOSIS' | 'LASER'>('DIAGNOSIS');
  const patientData = { id: '12345', name: 'John Doe' };

  return (
    <View style={styles.container}>
      <View style={styles.sidebar} />
      <View style={styles.mainArea}>
        <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
          <PatientInfoBar
            patientName={patientData.name}
            patientId={patientData.id}
            activeService={activeService}
          />
          <ServiceTabs activeService={activeService} setActiveService={setActiveService} />
          {activeService === 'LASER' ? <LaserView /> : <NormalView patientId={patientData.id} />}
        </ScrollView>

        {/* ---------- Bottom Buttons ---------- */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.setAppointmentButton}>
            <Ionicons name="calendar" size={16} color="#be185d" />
            <Text style={styles.setAppointmentText}>Set Next Appointment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.completeVisitButton}>
            <Ionicons name="checkmark-circle" size={18} color="#fff" />
            <Text style={styles.completeVisitText}>Mark Visit as Completed</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ------------------- STYLES -------------------
const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#f9fafb' },
  sidebar: { width: 80, backgroundColor: '#be185d' },
  mainArea: { flex: 1, padding: 16 },
  contentScroll: { flex: 1 },
  patientInfoBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#be185d' },
  patientInfoLeft: { flexDirection: 'row', alignItems: 'center' },
  patientAvatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12, backgroundColor: '#fce7f3' },
  patientName: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  patientDetails: { fontSize: 12, color: '#6b7280' },
  patientInfoRight: { flexDirection: 'row', alignItems: 'center' },
  sessionBadge: { backgroundColor: '#fce7f3', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 8 },
  sessionText: { fontSize: 12, color: '#be185d', fontWeight: 'bold' },
  completedBadge: { backgroundColor: '#dcfce7', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 8 },
  completedText: { fontSize: 12, color: '#15803d', fontWeight: 'bold', marginLeft: 4 },
  editButton: { padding: 4 },
  serviceTabs: { flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 12, marginBottom: 16 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  tabActive: { backgroundColor: '#be185d' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  tabTextActive: { color: 'white' },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  cardTitle: { fontWeight: 'bold', fontSize: 14, color: '#be185d', marginBottom: 8 },
  laserContainer: { flexDirection: 'row', gap: 16 },
  laserLeft: { flex: 2 },
  laserRight: { flex: 1 },
  pinkCard: { backgroundColor: '#fce7f3', borderColor: '#f9a8d4' },
  normalContainer: { flexDirection: 'row', gap: 16 },
  normalLeft: { flex: 2 },
  normalRight: { flex: 1 },
  patientId: { fontWeight: 'bold', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 8, marginBottom: 12 },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  medSelector: { marginBottom: 16 },
  medLabel: { fontWeight: 'bold', marginBottom: 8 },
  searchInput: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 8, marginBottom: 12 },
  medList: { maxHeight: 150 },
  medItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 8, borderRadius: 8, marginBottom: 4 },
  medItemSelected: { backgroundColor: '#be185d' },
  medName: { fontWeight: '600' },
  medNameSelected: { color: 'white' },
  medDetailsSelected: { color: '#fce7f3' },
  selectedMeds: { backgroundColor: '#fff', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 16 },
  selectedLabel: { fontWeight: 'bold', marginBottom: 8 },
  selectedItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  selectedText: {},
  removeText: { color: '#dc2626', fontWeight: 'bold' },
  mainSaveButton: { backgroundColor: '#be185d', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 8 },
  mainSaveText: { color: '#fff', fontWeight: 'bold' },
  saveMessageText: { color: '#15803d', marginBottom: 16 },
  photo: { width: '100%', height: 150, borderRadius: 8 },
  bottomBar: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  setAppointmentButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff', borderRadius: 8, marginRight: 12, borderWidth: 1, borderColor: '#be185d' },
  setAppointmentText: { color: '#be185d', fontWeight: 'bold', marginLeft: 8 },
  completeVisitButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#15803d', borderRadius: 8 },
  completeVisitText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
});
