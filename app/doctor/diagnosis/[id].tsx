import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

// ------------------- DUMMY DATA -------------------
const dummyMedications = [
  { id: 1, name: "Paracetamol", dose: "500mg", duration: "5 days" },
  { id: 2, name: "Amoxicillin", dose: "250mg", duration: "7 days" },
  { id: 3, name: "Hydrocortisone", dose: "1%", duration: "3 days" },
  { id: 4, name: "Ibuprofen", dose: "200mg", duration: "5 days" },
  { id: 5, name: "Cetirizine", dose: "10mg", duration: "7 days" },
];

interface PatientData {
  id: string;
  name: string;
  age: number;
  gender: string;
  lastVisit: string;
  allergies: string[];
  activeService: string;
}

// ===== Disease Ontology (Standard Diagnosis) =====
const [doQuery, setDoQuery] = useState("");
const [doResults, setDoResults] = useState<any[]>([]);
const [selectedDisease, setSelectedDisease] = useState<{
  id: string;
  label: string;
} | null>(null);
const [doLoading, setDoLoading] = useState(false);

// ===== Disease Ontology Search (Frontend Only) =====
const searchDiseaseOntology = async (text: string) => {
  setDoQuery(text);

  if (text.trim().length < 3) {
    setDoResults([]);
    return;
  }

  try {
    setDoLoading(true);
    const res = await fetch(
      `https://www.disease-ontology.org/api/search?q=${encodeURIComponent(text)}`
    );
    const data = await res.json();

    setDoResults(
      (data?.response?.docs || []).map((d: any) => ({
        id: d.id,
        label: d.label,
      }))
    );
  } catch (err) {
    console.error("Disease Ontology search failed", err);
  } finally {
    setDoLoading(false);
  }
};

// ⭐️ PhotoItem definition from ReusablePhotoUploader (needed for photos state)
interface PhotoItem {
    id: string;
    uri: string;
    tag: string;
    timestamp: string;
    caption: string;
}

// --- Section Header (Helper Component) ---
const SectionHeader = ({ icon, title, action, color = THEME.primary }: any) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionHeaderLeft}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[styles.sectionTitle, { color: THEME.secondary }]}>{title}</Text>
    </View>
    {action && action}
  </View>
);

// ------------------- 3. CORE COMPONENTS (Defined before use) -------------------

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
              style={[styles.medItem, isSelected && styles.medItemSelected]}
              onPress={() => toggleMed(med)}
            >
              <Text style={styles.medText}>{med.name} ({med.dose})</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {selectedMeds.length === 0 && <Text style={styles.emptyText}>No medications selected.</Text>}

      {selectedMeds.map((med: any) => (
        <Swipeable
          key={med.id}
          renderRightActions={() => (
            <TouchableOpacity style={styles.swipeDelete} onPress={() => removeMed(med.id)}>
              <Ionicons name="trash" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        >
          <View style={styles.tableRow}>
            <TouchableOpacity onPress={() => toggleExpand(med.id)} style={styles.rowMain}>
              <View>
                <Text style={styles.rowName}>{med.name}</Text>
                <Text style={styles.rowDetail}>{med.dose || 'N/A'} • {med.duration || 'N/A'}</Text>
              </View>
              <Ionicons name={expandedMap[med.id] ? "chevron-up" : "chevron-down"} size={16} color={THEME.textLight} />
            </TouchableOpacity>
            
            {expandedMap[med.id] && (
              <View style={styles.rowExpanded}>
                <View style={styles.editableFieldGroup}>
                    {/* EDITABLE FIELDS */}
                    <View style={styles.editableField}>
                        <Ionicons name="medkit" size={14} color={THEME.primary} />
                        <TextInput 
                            style={styles.editableInput} 
                            placeholder="Dosage" 
                            value={med.dose} 
                            onChangeText={(t) => updateMedField(med.id, 'dose', t)} 
                        />
                    </View>
                    <View style={styles.editableField}>
                        <Ionicons name="calendar" size={14} color={THEME.primary} />
                        <TextInput 
                            style={styles.editableInput} 
                            placeholder="Duration" 
                            value={med.duration} 
                            onChangeText={(t) => updateMedField(med.id, 'duration', t)} 
                        />
                    </View>
                </View>
                
                {/* Modernized Notes Box */}
                <View style={styles.notesBox}>
                    <View style={styles.notesHeader}>
                          <Ionicons name="document-text" size={14} color={THEME.secondary} />
                          <Text style={styles.notesTitle}>Specific Instructions</Text>
                    </View>
                    <TextInput 
                        style={styles.notesInput} 
                        placeholder="Add specific instructions for this drug..." 
                        value={med.notes} 
                        onChangeText={(t) => updateMedField(med.id, 'notes', t)} 
                        multiline
                    />
                </View>
              </View>
            )}
          </View>
        </Swipeable>
      ))}
    </View>
  );
};


// --- DIAGNOSIS TEMPLATE MODAL (NEW) ---
const DiagnosisTemplateModal = ({ visible, onClose, onSelect, customTemplates, setCustomTemplates }: any) => {
    const [newTemplate, setNewTemplate] = useState("");

    const addTemplate = async () => {
        if (newTemplate.trim() && !customTemplates.includes(newTemplate.trim())) {
          const updated = [...customTemplates, newTemplate.trim()];
          setCustomTemplates(updated);
          await AsyncStorage.setItem(storageKeyForTemplates, JSON.stringify(updated));
          setNewTemplate("");
        }
    };

    const removeTemplate = async (template: string) => {
        const updated = customTemplates.filter((t: string) => t !== template);
        setCustomTemplates(updated);
        await AsyncStorage.setItem(storageKeyForTemplates, JSON.stringify(updated));
    };

    return (
        <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Manage Diagnosis Templates</Text>
                    
                    <View style={styles.templateInputGroup}>
                        <TextInput
                            style={[styles.input, {flex: 1, height: 40, marginTop: 0}]}
                            placeholder="Type new common diagnosis..."
                            value={newTemplate}
                            onChangeText={setNewTemplate}
                        />
                        <TouchableOpacity onPress={addTemplate} style={styles.templateAddBtn}>
                            <Ionicons name="add" size={20} color={THEME.white} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{maxHeight: 200, marginTop: 15}}>
                        {customTemplates.map((template: string) => (
                            <View key={template} style={styles.templateListItem}>
                                <TouchableOpacity onPress={() => { onSelect(template); onClose(); }}>
                                    <Text style={styles.templateItemText}>{template}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => removeTemplate(template)}>
                                    <Ionicons name="close-circle-outline" size={20} color={THEME.danger} />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                    <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
                        <Text style={styles.modalCloseText}>Done</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};


// ------------------- 4. MAIN LOGIC -------------------

const NormalView = ({ patientId }: { patientId: string }) => {
  const [activeService, setActiveService] = useState<ServiceKey>('DIAGNOSIS');
  const [diagnosis, setDiagnosis] = useState("");
  const [diagnosisSearch, setDiagnosisSearch] = useState("");
  const [rxNotes, setRxNotes] = useState(""); 
  const [selectedMeds, setSelectedMeds] = useState<any[]>([]);
  // ⭐️ UPDATED: Retaining the PhotoItem type for photos state
  const [photos, setPhotos] = useState<PhotoItem[]>([]); 
  const [labs, setLabs] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [customDiagnosisTemplates, setCustomDiagnosisTemplates] = useState<string[]>(DEFAULT_DIAGNOSIS_TEMPLATES);


  // UPDATED PATIENT MOCK DATA WITH NEW DETAILS
  const patient: PatientData = { 
      id: patientId, 
      name: "Ahmed Mohamed", 
      age: 34, 
      gender: "Male",
      lastVisit: "2024-10-15",
      allergies: ["Penicillin", "Dust Mites"],
      activeService: "DIAGNOSIS" // Placeholder, unused here
  };

  // --- Load Data ---
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKeyForPatient(patientId));
        if (raw) {
            const data = JSON.parse(raw);
            if(data.photos) setPhotos(data.photos);
            if(data.labs) setLabs(data.labs);
            if(data.diagnosis) setDiagnosis(data.diagnosis);
            if(data.rxNotes) setRxNotes(data.rxNotes);
            if(data.selectedMeds) setSelectedMeds(data.selectedMeds);
        }
        const templateRaw = await AsyncStorage.getItem(storageKeyForTemplates);
        if (templateRaw) {
            setCustomDiagnosisTemplates(JSON.parse(templateRaw));
        } else {
            // Save defaults if not present
            await AsyncStorage.setItem(storageKeyForTemplates, JSON.stringify(DEFAULT_DIAGNOSIS_TEMPLATES));
        }
      } catch (e) {
          console.error("Error loading data:", e);
      } finally { setLoading(false); }
    })();
  }, [patientId]);

  // --- Save Data ---
  const saveData = async () => {
     const data = {
  photos,
  labs,
  diagnosis,
  diagnosis_doid: selectedDisease?.id || null,
  rxNotes,
  selectedMeds,
};

      await AsyncStorage.setItem(storageKeyForPatient(patientId), JSON.stringify(data));
      Alert.alert("Saved", "Patient visit data updated.");
  };
  
  // UPDATED: Use DocumentPicker to support PDF and Image files
  const pickLab = async () => {
    const r = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true, 
    });

    if (r.canceled === false && r.assets && r.assets.length > 0) {
      const file = r.assets[0];
      const timestamp = new Date().toLocaleString('en-EG');
      setLabs(prev => [
        ...prev, 
        { 
          id: Date.now().toString(), 
          uri: file.uri, 
          name: file.name, 
          mimeType: file.mimeType || 'application/octet-stream', 
          timestamp 
        }
      ]);
    }
  };
  const deleteLab = (id: string) => setLabs(l => l.filter(x => x.id !== id));
  
  // --- Diagnosis Templates Filtering ---
  const filteredTemplates = useMemo(() => {
    return customDiagnosisTemplates.filter(t => 
      t.toLowerCase().includes(diagnosisSearch.toLowerCase())
    );
  }, [customDiagnosisTemplates, diagnosisSearch]);

  const handleTemplateSelection = (template: string) => {
    setDiagnosis(prev => prev ? prev + ", " + template : template);
  };



if (loading) return <ActivityIndicator color={THEME.primary} size="large" style={{flex:1}} />;

  
  return (
    <View style={styles.container}>
      {/* 1. PATIENT INFO BAR (Using Imported Component) */}
      {/* Passing service props in case the bar component needs to handle tabs */}
 <PatientInfoBar 
  patient={patient} 
  onEdit={() => console.log("Edit patient")} 
  onHistoryClick={() => console.log("View history")} 
/>

<ServiceTabs
  activeService={activeService}
  setActiveService={setActiveService}
/>


      {/* 2. MAIN CONTENT (Wrapped in KeyboardAvoidingView) */}
      <KeyboardAvoidingView 
          style={styles.splitViewContainer} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0} 
      >
        
        {/* LEFT COLUMN: Clinical (SCROLLABLE) */}
        <ScrollView 
          style={styles.columnScroll} 
          contentContainerStyle={{paddingBottom: 40}}
          showsVerticalScrollIndicator={false}
        >
          {/* Diagnosis */}
          <View style={styles.card}>
            <View style={styles.headerRow}>
                <SectionHeader icon="medical" title="Clinical Diagnosis" />
                {/* ===== Standard Disease (Ontology) Search ===== */}
<View style={{ marginBottom: 12 }}>
  <View style={styles.searchContainer}>
    <Ionicons
      name="search"
      size={18}
      color={THEME.textLight}
      style={{ marginRight: 8 }}
    />
    <TextInput
      style={styles.searchInput}
      placeholder="Search standardized disease (optional)"
      placeholderTextColor={THEME.textLight}
      value={doQuery}
      onChangeText={searchDiseaseOntology}
    />
    {doLoading && <ActivityIndicator size="small" color={THEME.primary} />}
  </View>

  {/* Results Dropdown */}
  {doResults.length > 0 && (
    <View
      style={{
        borderWidth: 1,
        borderColor: THEME.border,
        borderRadius: THEME.radius,
        marginTop: 6,
        backgroundColor: THEME.white,
        maxHeight: 180,
      }}
    >
      <ScrollView nestedScrollEnabled>
        {doResults.map((d) => (
          <TouchableOpacity
            key={d.id}
            style={{
              padding: 10,
              borderBottomWidth: 1,
              borderBottomColor: THEME.border,
            }}
            onPress={() => {
              setSelectedDisease(d);
              setDiagnosis((prev) =>
                prev ? `${prev}, ${d.label}` : d.label
              );
              setDoResults([]);
              setDoQuery("");
            }}
          >
            <Text style={{ fontWeight: "700", color: THEME.secondary }}>
              {d.label}
            </Text>
            <Text style={{ fontSize: 11, color: THEME.textLight }}>
              {d.id}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )}

  {/* Selected Disease Badge */}
  {selectedDisease && (
    <View
      style={{
        marginTop: 8,
        padding: 8,
        borderRadius: THEME.radius,
        backgroundColor: THEME.primaryLight,
        borderLeftWidth: 4,
        borderLeftColor: THEME.primary,
      }}
    >
      <Text style={{ fontWeight: "700", color: THEME.secondary }}>
        🧬 {selectedDisease.label}
      </Text>
      <Text style={{ fontSize: 12, color: THEME.textLight }}>
        {selectedDisease.id}
      </Text>
    </View>
  )}
</View>

                <TouchableOpacity style={styles.manageBtn} onPress={() => setTemplateModalVisible(true)}>
                  <Ionicons name="options-outline" size={14} color={THEME.primary} />
                  <Text style={styles.manageBtnText}>Manage Templates</Text>
                </TouchableOpacity>
            </View>
            
            {/* Search Bar for Templates */}
            <View style={[styles.searchContainer, {marginBottom: 10, marginTop: 0}]}>
              <Ionicons name="search" size={18} color={THEME.textLight} style={{marginRight: 8}} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search or filter templates..."
                placeholderTextColor={THEME.textLight}
                value={diagnosisSearch}
                onChangeText={setDiagnosisSearch}
              />
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
