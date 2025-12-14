import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  TextInput,
  Image,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";

// --- REQUIRED EXTERNAL LIBRARIES ---
import * as DocumentPicker from "expo-document-picker";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { Swipeable } from "react-native-gesture-handler";

// --- EXTERNAL COMPONENTS (AS PER YOUR IMPORTS) ---
import ReusablePhotoUploader from '../../../components/ReusablePhotoUploader'; 
import PatientInfoBar, { ServiceKey } from '../../../components/PatientInfoBar';
import ServiceTabs from '../../../components/ServiceTabs';


// ------------------- 1. DESIGN SYSTEM -------------------
const THEME = {
  primary: "#be185d", // Pink-700
  primaryLight: "#fce7f3",
  secondary: "#0f172a",
  accentBlue: "#0284c7",
  accentBlueLight: "#e0f2fe",
  text: "#334155",
  textLight: "#94a3b8",
  bg: "#f1f5f9",
  white: "#ffffff",
  border: "#e2e8f0",
  success: "#10b981",
  danger: "#ef4444",
  radius: 12,
  shadow: {
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
};




// ------------------- 2. DATA & UTILS -------------------
const DEFAULT_DIAGNOSIS_TEMPLATES = [
  "Acne Vulgaris", "Melasma", "Alopecia Areata", "Tinea Capitis", "Psoriasis", "Eczema", "Vitiligo"
];

const storageKeyForPatient = (patientId: string) => `patient_${patientId}_v6_data`;
const storageKeyForTemplates = "custom_diagnosis_templates_v1";

const dummyMedications = [
  { id: 1, name: "Panadol (Paracetamol)", dose: "500mg", duration: "5 days", notes: "" },
  { id: 2, name: "Augmentin", dose: "1g", duration: "7 days", notes: "" },
  { id: 3, name: "Fucidin Cream", dose: "2%", duration: "3 days", notes: "" },
  { id: 4, name: "Brufen", dose: "400mg", duration: "As needed", notes: "" },
  { id: 5, name: "Zyrtec", dose: "10mg", duration: "7 days", notes: "" },
  { id: 6, name: "Roaccutane", dose: "20mg", duration: "30 days", notes: "" },
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

// --- MEDICATION SELECTOR ---
const MedicationSelector = ({ medications, selectedMeds, setSelectedMeds }: any) => {
  const [searchText, setSearchText] = useState("");
  const filteredMeds = medications.filter((med: any) =>
    med.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const toggleMed = (med: any) => {
    if (selectedMeds.find((m: any) => m.id === med.id)) {
      setSelectedMeds(selectedMeds.filter((m: any) => m.id !== med.id));
    } else {
      setSelectedMeds([...selectedMeds, { ...med, notes: med.notes || "" }]);
    }
  };

  return (
    <View style={styles.card}>
      <SectionHeader icon="search" title="Medication Database" />
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={THEME.textLight} style={{marginRight: 8}} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search meds (e.g. Panadol)..."
          placeholderTextColor={THEME.textLight}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>
      <ScrollView style={styles.medList} nestedScrollEnabled={true}>
        {filteredMeds.map((med: any) => {
          const isSelected = selectedMeds.find((m: any) => m.id === med.id);
          return (
            <TouchableOpacity
              key={med.id}
              style={[styles.medItem, isSelected && styles.medItemSelected]}
              onPress={() => toggleMed(med)}
            >
              <View>
                  <Text style={[styles.medName, isSelected && styles.medNameSelected]}>{med.name}</Text>
                  <Text style={[styles.medDose, isSelected && styles.medDoseSelected]}>{med.dose} • {med.duration}</Text>
              </View>
              <Ionicons name={isSelected ? "checkmark-circle" : "add-circle-outline"} size={22} color={isSelected ? THEME.primary : THEME.textLight} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

// --- CUSTOM MEDICATION ADDER ---
const CustomMedicationAdder = ({ setSelectedMeds }: any) => {
    const [name, setName] = useState("");
    const [dose, setDose] = useState("");
    const [duration, setDuration] = useState("");

    const addCustomMed = () => {
      if (!name || !dose || !duration) {
        Alert.alert("Missing Info", "Please fill in Name, Dosage, and Duration.");
        return;
      }
      
      const newMed = {
        id: Date.now(),
        name,
        dose,
        duration,
        notes: "Custom medication added by doctor."
      };

      setSelectedMeds((prev: any) => [newMed, ...prev]);
      setName("");
      setDose("");
      setDuration("");
    };

    return (
      <View style={[styles.card, { marginTop: 12 }]}>
          <SectionHeader icon="color-wand" title="Add Custom Medication" color={THEME.accentBlue} />
          <View style={styles.customInputRow}>
            <TextInput style={[styles.customInput, {flex: 2}]} placeholder="Medication Name" value={name} onChangeText={setName} />
            <TextInput style={styles.customInput} placeholder="Dose (e.g., 500mg)" value={dose} onChangeText={setDose} />
            <TextInput style={styles.customInput} placeholder="Duration" value={duration} onChangeText={setDuration} />
          </View>
          <TouchableOpacity onPress={addCustomMed} style={styles.addCustomBtn}>
            <Ionicons name="add-circle" size={18} color={THEME.white} />
            <Text style={styles.addCustomText}>Add to Prescription</Text>
          </TouchableOpacity>
      </View>
    );
};

// --- PRESCRIPTION TABLE (MODIFIED FOR PRESCRIPTION-ONLY PDF) ---
const PrescriptionTableAdvanced = ({ selectedMeds, setSelectedMeds, patient, diagnosis, rxNotes }: any) => {
  const [expandedMap, setExpandedMap] = useState<Record<number, boolean>>({});
  const [exporting, setExporting] = useState(false);

  const toggleExpand = (id: number) => setExpandedMap((s) => ({ ...s, [id]: !s[id] }));
  const removeMed = (id: number) => setSelectedMeds((s: any[]) => s.filter((x) => x.id !== id));
  
  const updateMedField = (id: number, key: 'dose' | 'duration' | 'notes', value: string) => {
    setSelectedMeds((s: any[]) => s.map((m) => (m.id === id ? { ...m, [key]: value } : m)));
  };

  // PDF EXPORT - ONLY PRESCRIPTION CONTENT
  const exportToPDF = async () => {
    setExporting(true);

    const rowsHtml = selectedMeds.map((m: any) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding:10px;"><strong>${m.name}</strong></td>
        <td style="padding:10px;">${m.dose || '-'}</td>
        <td style="padding:10px;">${m.duration || '-'}</td>
        <td style="padding:10px; color:#666; font-style:italic;">${m.notes || ""}</td>
      </tr>`).join("");

    const html = `
      <html>
      <body style="font-family: Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b;">
        <div style="border-bottom: 2px solid #be185d; padding-bottom: 20px; margin-bottom: 20px; display:flex; justify-content:space-between;">
          <div>
            <h1 style="color: #be185d; margin:0;">Prescription Report</h1>
            <p style="margin:5px 0; color:#64748b;">Dr. Dermatology Clinic</p>
          </div>
          <div style="text-align:right;">
            <p><strong>Patient:</strong> ${patient.name}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-EG')}</p>
          </div>
        </div>
        
        <div style="background:#f8fafc; padding:15px; border-left:4px solid #0284c7; border-radius:4px; margin-bottom:20px;">
            <h4 style="margin:0 0 10px 0; color:#0284c7;">Clinical Diagnosis</h4>
            <p style="margin:0; font-weight:bold;">${diagnosis || 'No formal diagnosis recorded.'}</p>
        </div>

        ${rxNotes ? `<div style="background:#f8fafc; padding:15px; border-left:4px solid #be185d; border-radius:4px; margin-bottom:20px;"><strong>General Instructions:</strong><br/>${rxNotes}</div>` : ''}

        <h3>Prescription Details</h3>
        <table style="width:100%; border-collapse: collapse; margin-bottom:20px;">
          <thead style="background:#fce7f3; color:#831843;"><tr><th style="padding:10px; text-align:left;">Drug</th><th style="padding:10px; text-align:left;">Dose</th><th style="padding:10px; text-align:left;">Duration</th><th style="padding:10px; text-align:left;">Note</th></tr></thead>
          <tbody>${rowsHtml || '<tr><td colspan="4" style="padding:10px; color:#94a3b8; font-style:italic;">No medications prescribed.</td></tr>'}</tbody>
        </table>
        
        <p style="text-align:center; margin-top:40px; font-size:12px; color:#94a3b8;">End of Prescription Report.</p>
      </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share Prescription Report' });
    } catch (err) { 
        console.error("PDF Export Error:", err);
        Alert.alert("Error", "PDF Generation failed. Check permissions or file data.");
    } 
    finally { setExporting(false); }
  };

  return (
    <View style={styles.card}>
      <View style={styles.tableHeaderRow}>
        <SectionHeader icon="clipboard" title={`Prescription (${selectedMeds.length})`} />
        <TouchableOpacity onPress={exportToPDF} style={styles.exportBtn} disabled={exporting}>
          {exporting ? <ActivityIndicator color="#fff" size="small"/> : <Ionicons name="print" size={16} color="#fff" />}
          <Text style={styles.exportText}>{exporting ? "Exporting..." : "Print PDF"}</Text>
        </TouchableOpacity>
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
            
            {/* Filtered Templates */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {filteredTemplates.length > 0 ? filteredTemplates.map(t => (
                  <TouchableOpacity key={t} style={styles.templateChip} onPress={() => handleTemplateSelection(t)}>
                    <Text style={styles.templateChipText}>+ {t}</Text>
                  </TouchableOpacity>
              )) : <Text style={[styles.emptyText, {textAlign: 'left'}]}>No matching templates found.</Text>}
            </ScrollView>
            
            {/* Main Diagnosis Input */}
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Type diagnosis..."
              value={diagnosis}
              onChangeText={setDiagnosis}
              multiline
            />
          </View>

          {/* Prescription Notes */}
          <View style={styles.card}>
              <SectionHeader icon="create" title="Prescription / General Instructions" />
              <TextInput
                  style={[styles.input, styles.textarea, {height: 60}]}
                  placeholder="e.g., Avoid sun exposure, drink water, follow-up in 2 weeks..."
                  value={rxNotes}
                  onChangeText={setRxNotes}
                  multiline
              />
          </View>

          {/* Meds Search */}
          <MedicationSelector 
              medications={dummyMedications} 
              selectedMeds={selectedMeds} 
              setSelectedMeds={setSelectedMeds} 
          />
          
          {/* Custom Med Adder */}
          <CustomMedicationAdder setSelectedMeds={setSelectedMeds} />
          
          <PrescriptionTableAdvanced
              selectedMeds={selectedMeds}
              setSelectedMeds={setSelectedMeds}
              patient={patient}
              diagnosis={diagnosis} // Pass diagnosis for PDF
              rxNotes={rxNotes}
          />
          <TouchableOpacity style={styles.saveBtn} onPress={saveData}>
              <Text style={styles.saveBtnText}>Save Visit</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* RIGHT COLUMN: Media (SCROLLABLE) */}
        <ScrollView 
          style={[styles.columnScroll, { borderLeftWidth: 1, borderLeftColor: '#e2e8f0', paddingLeft: 16 }]} 
          contentContainerStyle={{paddingBottom: 40}}
          showsVerticalScrollIndicator={false}
        >
          
          {/* ⭐️ REPLACED PHOTO SECTION WITH REUSABLE COMPONENT */}
          <ReusablePhotoUploader
              photos={photos}
              setPhotos={setPhotos}
              patientId={patientId}
          />

          {/* LAB TESTS & SCANS SECTION (Updated to support PDF) */}
          <View style={[styles.card, { borderColor: THEME.accentBlueLight, borderWidth:1 }]}>
              <View style={styles.headerRow}>
                     <SectionHeader icon="cloud-upload" title={`Lab Tests & Scans (${labs.length})`} color={THEME.accentBlue} />
                     <TouchableOpacity onPress={pickLab} style={[styles.iconBtn, {backgroundColor: THEME.accentBlue}]}>
                        <Ionicons name="add" size={18} color={THEME.white} />
                     </TouchableOpacity>
              </View>
              
              <View style={styles.photoGrid}>
                    {labs.length === 0 && <View style={styles.emptyState}><Text style={styles.emptyText}>No labs/scans uploaded. (Supports Images/PDFs)</Text></View>}
                    {labs.map((l) => {
                        const isImage = l.mimeType && l.mimeType.startsWith('image/');
                        return (
                            <View key={l.id} style={[styles.photoCard, { borderColor: THEME.accentBlueLight }]}>
                                <TouchableOpacity 
                                    onPress={() => { 
                                        Alert.alert("View File", `Attempting to open ${l.name}. Viewer is currently simplified.`);
                                    }}
                                >
                                    {isImage ? (
                                        <Image 
                                            source={{ uri: l.uri }} 
                                            style={[styles.photoImg, {opacity: 0.8}]} // Reduced opacity for Labs 
                                        />
                                    ) : (
                                        <View style={styles.pdfPlaceholder}>
                                            <Ionicons name="document-text" size={40} color={THEME.accentBlue} />
                                            <Text style={styles.pdfText} numberOfLines={2}>{l.name}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.deleteMini} onPress={() => deleteLab(l.id)}>
                                    <Ionicons name="close" size={10} color="#fff" />
                                </TouchableOpacity>
                                <View style={styles.photoFooter}>
                                    <Text style={styles.timestampText}>{l.timestamp}</Text>
                                </View>
                            </View>
                        );
                    })}
              </View>
          </View>
        </ScrollView>
        
        {/* Modals */}
        <DiagnosisTemplateModal
            visible={templateModalVisible}
            onClose={() => setTemplateModalVisible(false)}
            onSelect={handleTemplateSelection}
            customTemplates={customDiagnosisTemplates}
            setCustomTemplates={setCustomDiagnosisTemplates}
        />
      </KeyboardAvoidingView>
    </View>
  );
};


// ------------------- 5. STYLES -------------------
const styles = StyleSheet.create({
  container: {
      flex: 1,
      backgroundColor: THEME.bg,
  },
  splitViewContainer: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    paddingTop: 0, // Removed padding from top as PatientInfoBar is outside
  },
  columnScroll: {
    flex: 1,
    paddingRight: 16,
  },
  card: {
    backgroundColor: THEME.white,
    borderRadius: THEME.radius,
    padding: 16,
    marginBottom: 16,
    ...THEME.shadow,
  },

  // Section Header Styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.secondary,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.radius / 2,
  },
  manageBtnText: {
    fontSize: 12,
    color: THEME.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
  
  // Input/Search Styles
  input: {
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: THEME.radius,
    padding: 10,
    fontSize: 14,
    color: THEME.text,
    marginTop: 12,
    backgroundColor: THEME.white,
  },
  textarea: {
    height: 100,
    textAlignVertical: 'top',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.white,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: THEME.radius,
    paddingHorizontal: 10,
    height: 40,
    marginTop: 12,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: THEME.text,
  },

  // Template Chip Styles
  templateChip: {
    backgroundColor: THEME.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginRight: 8,
  },
  templateChipText: {
    color: THEME.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Medication List Styles
  medList: {
    maxHeight: 200, 
    marginTop: 10,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: THEME.radius,
    backgroundColor: THEME.white,
  },
  medItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    backgroundColor: THEME.white,
  },
  medItemSelected: {
    backgroundColor: THEME.primaryLight,
  },
  medName: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.secondary,
  },
  medNameSelected: {
    color: THEME.primary,
  },
  medDose: {
    fontSize: 12,
    color: THEME.textLight,
  },
  medDoseSelected: {
    color: THEME.text,
  },

  // Custom Med Adder Styles
  customInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  customInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: THEME.radius,
    padding: 10,
    fontSize: 14,
    backgroundColor: THEME.white,
  },
  addCustomBtn: {
    backgroundColor: THEME.accentBlue,
    borderRadius: THEME.radius,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addCustomText: {
    color: THEME.white,
    fontWeight: '700',
    fontSize: 14,
  },
  
  // Prescription Table Styles
  tableHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exportBtn: {
    backgroundColor: THEME.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.radius / 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  exportText: {
    color: THEME.white,
    fontWeight: '600',
    fontSize: 13,
  },
  emptyText: {
    color: THEME.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  tableRow: {
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: THEME.radius,
    marginBottom: 8,
    backgroundColor: THEME.white,
    overflow: 'hidden',
  },
  rowMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent', // Initially transparent
  },
  rowName: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.secondary,
  },
  rowDetail: {
    fontSize: 12,
    color: THEME.textLight,
    marginTop: 2,
  },
  rowExpanded: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    backgroundColor: THEME.bg, // Subtle background for expanded area
  },
  swipeDelete: {
    backgroundColor: THEME.danger,
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    height: '100%',
    borderRadius: THEME.radius,
    marginLeft: 8,
  },
  editableFieldGroup: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  editableField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: THEME.radius,
    paddingHorizontal: 8,
    backgroundColor: THEME.white,
    height: 40,
  },
  editableInput: {
    flex: 1,
    fontSize: 13,
    color: THEME.text,
    paddingLeft: 8,
  },
  notesBox: {
    backgroundColor: THEME.white,
    borderWidth: 1,
    borderColor: THEME.primaryLight,
    borderRadius: THEME.radius,
    padding: 10,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 5,
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.secondary,
  },
  notesInput: {
    fontSize: 13,
    color: THEME.text,
    minHeight: 40,
    textAlignVertical: 'top',
  },
  saveBtn: {
    backgroundColor: THEME.primary,
    padding: 15,
    borderRadius: THEME.radius,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveBtnText: {
    color: THEME.white,
    fontWeight: '700',
    fontSize: 16,
  },

  // Photo & Lab Styles
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  photoCard: {
    width: '47%', // Adjusted for gap
    aspectRatio: 1,
    borderRadius: THEME.radius,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: THEME.border,
    backgroundColor: THEME.bg,
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
  photoFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 5,
  },
  timestampText: {
    color: THEME.white,
    fontSize: 10,
  },
  deleteMini: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: THEME.danger,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  emptyState: {
    width: '100%',
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: THEME.textLight,
    borderRadius: THEME.radius,
    marginTop: 10,
  },
  iconBtn: {
    padding: 8,
    borderRadius: THEME.radius,
    marginLeft: 10,
  },
  pdfPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  pdfText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.accentBlue,
    marginTop: 5,
    textAlign: 'center',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    maxWidth: 400,
    backgroundColor: THEME.white,
    borderRadius: THEME.radius,
    padding: 20,
    ...THEME.shadow,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.secondary,
    marginBottom: 15,
  },
  templateInputGroup: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  templateAddBtn: {
    backgroundColor: THEME.primary,
    padding: 10,
    borderRadius: THEME.radius,
  },
  templateListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  templateItemText: {
    fontSize: 14,
    color: THEME.text,
  },
  modalCloseBtn: {
    backgroundColor: THEME.secondary,
    padding: 12,
    borderRadius: THEME.radius,
    marginTop: 20,
    alignItems: 'center',
  },
  modalCloseText: {
    color: THEME.white,
    fontWeight: '700',
  },

  // Service Tabs (used by PatientInfoBarComponent if it handles them)
  tabContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: THEME.white,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  tab: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: THEME.bg,
  },
  tabActive: {
    backgroundColor: THEME.primary,
  },
  tabText: {
    color: THEME.text,
    fontWeight: '600',
    fontSize: 13,
  },
  tabTextActive: {
    color: THEME.white,
  }
});


export default NormalView;