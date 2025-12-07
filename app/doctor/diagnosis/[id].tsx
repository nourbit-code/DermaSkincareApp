<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 0edc934 (new updates)
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
<<<<<<< HEAD
  StatusBar,
=======
>>>>>>> 0edc934 (new updates)
  Platform,
  KeyboardAvoidingView,
} from "react-native";

<<<<<<< HEAD
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker"; // NEW: For PDF and general file support
=======
// --- REQUIRED EXTERNAL LIBRARIES ---
import * as DocumentPicker from "expo-document-picker";
>>>>>>> 0edc934 (new updates)
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
<<<<<<< HEAD
  primaryLight: "#fce7f3", 
  secondary: "#0f172a", 
  accentBlue: "#0284c7", 
=======
  primaryLight: "#fce7f3",
  secondary: "#0f172a",
  accentBlue: "#0284c7",
>>>>>>> 0edc934 (new updates)
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

<<<<<<< HEAD
=======



>>>>>>> 0edc934 (new updates)
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

<<<<<<< HEAD
=======
// ⭐️ PhotoItem definition from ReusablePhotoUploader (needed for photos state)
interface PhotoItem {
    id: string;
    uri: string;
    tag: string;
    timestamp: string;
    caption: string;
}

>>>>>>> 0edc934 (new updates)
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
<<<<<<< HEAD

// --- PATIENT INFO BAR (UPDATED) ---
const PatientInfoBar = ({ patient }: { patient: PatientData }) => (
  <View style={styles.patientBar}>
    <View style={styles.patientHeader}>
      <Image source={{ uri: "https://placehold.co/100" }} style={styles.patientAvatar} />
      <View style={styles.patientHeaderText}>
        <Text style={styles.patientName}>{patient.name}</Text>
        <View style={styles.patientIdRow}>
          <Text style={styles.idText}>ID: {patient.id}</Text>
          <Text style={styles.divider}>•</Text>
          <View style={styles.statusBadge}>
            <Ionicons name="ellipse" size={8} color={THEME.success} style={{marginRight:6}} />
            <Text style={styles.statusText}>Active Session</Text>
          </View>
        </View>
      </View>
    </View>

    <View style={styles.patientDetailsGrid}>
      {/* 1. Age & Gender */}
      <View style={styles.detailCard}>
        <Ionicons name="body" size={16} color={THEME.textLight} />
        <Text style={styles.detailLabel}>Demographics</Text>
        <Text style={styles.detailValue}>{patient.age}Y / {patient.gender}</Text>
      </View>
      
      {/* 2. Last Visit */}
      <View style={styles.detailCard}>
        <Ionicons name="time" size={16} color={THEME.textLight} />
        <Text style={styles.detailLabel}>Last Visit</Text>
        <Text style={styles.detailValue}>{patient.lastVisit}</Text>
      </View>

      {/* 3. Allergies */}
      <View style={[styles.detailCard, styles.allergyCard]}>
        <Ionicons name="warning" size={16} color={THEME.danger} />
        <Text style={styles.detailLabel}>Allergies</Text>
        <View style={styles.allergyChips}>
          {patient.allergies.length > 0 ? (
            patient.allergies.map((allergy, index) => (
              <Text key={index} style={styles.allergyChipText}>{allergy}</Text>
            ))
          ) : (
            <Text style={styles.detailValueNoAllergy}>None recorded</Text>
          )}
        </View>
      </View>
    </View>
  </View>
);


// --- SERVICE TABS ---
const ServiceTabs = ({ activeService, setActiveService }: any) => (
  <View style={styles.tabContainer}>
    {["DIAGNOSIS", "LASER"].map((service) => (
      <TouchableOpacity
        key={service}
        style={[styles.tab, activeService === service && styles.tabActive]}
        onPress={() => setActiveService(service)}
      >
        <Text style={[styles.tabText, activeService === service && styles.tabTextActive]}>
          {service === "DIAGNOSIS" ? "Clinical Diagnosis" : "Laser Session"}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);
=======
>>>>>>> 0edc934 (new updates)

// --- MEDICATION SELECTOR ---
const MedicationSelector = ({ medications, selectedMeds, setSelectedMeds }: any) => {
  const [searchText, setSearchText] = useState("");
  const filteredMeds = medications.filter((med: any) =>
    med.name.toLowerCase().includes(searchText.toLowerCase())
  );

=======
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

>>>>>>> 2af3573 (feat: enhance DoctorSidebar and Sidebar components with tooltip animations and icon buttons)
  const toggleMed = (med: any) => {
    if (selectedMeds.find((m: any) => m.id === med.id)) {
      setSelectedMeds(selectedMeds.filter((m: any) => m.id !== med.id));
    } else {
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 0edc934 (new updates)
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
<<<<<<< HEAD
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
=======
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
>>>>>>> 0edc934 (new updates)
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
<<<<<<< HEAD
                         <Ionicons name="document-text" size={14} color={THEME.secondary} />
                         <Text style={styles.notesTitle}>Specific Instructions</Text>
=======
                          <Ionicons name="document-text" size={14} color={THEME.secondary} />
                          <Text style={styles.notesTitle}>Specific Instructions</Text>
>>>>>>> 0edc934 (new updates)
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
<<<<<<< HEAD
            const updated = [...customTemplates, newTemplate.trim()];
            setCustomTemplates(updated);
            await AsyncStorage.setItem(storageKeyForTemplates, JSON.stringify(updated));
            setNewTemplate("");
=======
          const updated = [...customTemplates, newTemplate.trim()];
          setCustomTemplates(updated);
          await AsyncStorage.setItem(storageKeyForTemplates, JSON.stringify(updated));
          setNewTemplate("");
>>>>>>> 0edc934 (new updates)
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
<<<<<<< HEAD
                        {/* FIX: Using 'customTemplates' prop instead of 'customDiagnosisTemplates' */}
=======
>>>>>>> 0edc934 (new updates)
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
<<<<<<< HEAD
=======
  const [activeService, setActiveService] = useState<ServiceKey>('DIAGNOSIS');
>>>>>>> 0edc934 (new updates)
  const [diagnosis, setDiagnosis] = useState("");
  const [diagnosisSearch, setDiagnosisSearch] = useState("");
  const [rxNotes, setRxNotes] = useState(""); 
  const [selectedMeds, setSelectedMeds] = useState<any[]>([]);
<<<<<<< HEAD
  const [photos, setPhotos] = useState<any[]>([]);
  const [labs, setLabs] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [photoSortNewest, setPhotoSortNewest] = useState(true); 
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerImg, setViewerImg] = useState<string>("");
  const [viewerMime, setViewerMime] = useState<string>(""); // NEW: To handle PDF/Image preview logic
=======
  // ⭐️ UPDATED: Retaining the PhotoItem type for photos state
  const [photos, setPhotos] = useState<PhotoItem[]>([]); 
  const [labs, setLabs] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  
>>>>>>> 0edc934 (new updates)
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
      const data = { photos, labs, diagnosis, rxNotes, selectedMeds }; 
      await AsyncStorage.setItem(storageKeyForPatient(patientId), JSON.stringify(data));
      Alert.alert("Saved", "Patient visit data updated.");
  };
<<<<<<< HEAD

  // --- Media Handlers ---
  const pickPhoto = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!r.canceled && r.assets[0].uri) {
      setPendingPhotoUri(r.assets[0].uri);
      setTagModalVisible(true);
    }
  };
  const finalizePhoto = (tag: string) => {
    if (!pendingPhotoUri) return;
    const timestamp = new Date().toLocaleString('en-EG');
    setPhotos(prev => [{ id: Date.now().toString(), uri: pendingPhotoUri, tag, timestamp, caption: "" }, ...prev]); 
    setTagModalVisible(false);
  };
  const deletePhoto = (id: string) => setPhotos(p => p.filter(x => x.id !== id));
  
  // Memoized sorting for performance and reliability (Fix for point 4)
  const displayedPhotos = useMemo(() => {
    return [...photos].sort((a, b) => {
        const tA = parseInt(a.id, 10); 
        const tB = parseInt(b.id, 10);
        return photoSortNewest ? tB - tA : tA - tB;
    });
  }, [photos, photoSortNewest]);

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
=======
  
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
>>>>>>> 0edc934 (new updates)
    }
  };
  const deleteLab = (id: string) => setLabs(l => l.filter(x => x.id !== id));
  
  // --- Diagnosis Templates Filtering ---
  const filteredTemplates = useMemo(() => {
    return customDiagnosisTemplates.filter(t => 
<<<<<<< HEAD
        t.toLowerCase().includes(diagnosisSearch.toLowerCase())
    );
  }, [customDiagnosisTemplates, diagnosisSearch]);

  const handleTemplateSelection = (template: string) => {
    setDiagnosis(prev => prev ? prev + ", " + template : template);
  };

=======
      t.toLowerCase().includes(diagnosisSearch.toLowerCase())
    );
  }, [customDiagnosisTemplates, diagnosisSearch]);
>>>>>>> 0edc934 (new updates)

  const handleTemplateSelection = (template: string) => {
    setDiagnosis(prev => prev ? prev + ", " + template : template);
  };



if (loading) return <ActivityIndicator color={THEME.primary} size="large" style={{flex:1}} />;

  
  return (
<<<<<<< HEAD
    <KeyboardAvoidingView 
        style={styles.splitViewContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
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
=======
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
>>>>>>> 2af3573 (feat: enhance DoctorSidebar and Sidebar components with tooltip animations and icon buttons)
            value={diagnosis}
            onChangeText={setDiagnosis}
            multiline
          />
<<<<<<< HEAD
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
        {/* PHOTOS SECTION */}
        <View style={styles.card}>
            <View style={styles.headerRow}>
                 <SectionHeader icon="images" title={`Patient Photos (${photos.length})`} />
                 <View style={{flexDirection:'row', gap:8}}>
                     <TouchableOpacity 
                        style={styles.outlineBtn}
                        onPress={() => setPhotoSortNewest(!photoSortNewest)}
                     >
                        <Ionicons name="swap-vertical" size={14} color={THEME.text} />
                        <Text style={styles.outlineBtnText}>Sort: {photoSortNewest ? "Newest" : "Oldest"}</Text>
                     </TouchableOpacity>
                     
                     <TouchableOpacity onPress={pickPhoto} style={styles.iconBtn}>
                         <Ionicons name="add" size={20} color={THEME.white} />
                     </TouchableOpacity>
                 </View>
            </View>

            <View style={styles.photoGrid}>
                {displayedPhotos.length === 0 && (<View style={styles.emptyState}><Text style={styles.emptyText}>No clinical photos uploaded.</Text></View>)}
                {displayedPhotos.map((p) => (
                    <View key={p.id} style={styles.photoCard}>
                         <TouchableOpacity onPress={() => { setViewerImg(p.uri); setViewerMime("image/jpeg"); setViewerVisible(true); }}>
                             <Image source={{ uri: p.uri }} style={styles.photoImg} />
                         </TouchableOpacity>
                         <View style={[styles.tagBadge, p.tag === "Before" ? {backgroundColor:'#fee2e2'} : p.tag==="After"?{backgroundColor:'#dcfce7'}:{}]}>
                             <Text style={[styles.tagText, p.tag==="Before"?{color:'#b91c1c'}:p.tag==="After"?{color:'#15803d'}:{}]}>{p.tag}</Text>
                         </View>
                         <TouchableOpacity style={styles.deleteMini} onPress={() => deletePhoto(p.id)}>
                             <Ionicons name="close" size={10} color="#fff" />
                         </TouchableOpacity>
                         <View style={styles.photoFooter}>
                             <Text style={styles.timestampText}>{p.timestamp}</Text>
                         </View>
                    </View>
                ))}
            </View>
        </View>

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
                                    setViewerImg(l.uri); 
                                    setViewerMime(l.mimeType); 
                                    setViewerVisible(true); 
                                }}
                            >
                                {isImage ? (
                                    <Image 
                                        source={{ uri: l.uri }} 
                                        style={[styles.photoImg, {resizeMode:'contain', backgroundColor:'#f0f9ff'}]} 
                                    />
                                ) : (
                                    <View style={[styles.photoImg, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f9ff' }]}>
                                        <Ionicons name="document-text" size={40} color={THEME.accentBlue} />
                                        <Text style={{ fontSize: 10, color: THEME.text, textAlign: 'center', marginTop: 5 }}>{l.name}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.deleteMini, {backgroundColor: THEME.accentBlue}]} onPress={() => deleteLab(l.id)}>
                                <Ionicons name="close" size={10} color="#fff" />
                            </TouchableOpacity>
                            <View style={styles.photoFooter}>
                                <Text style={styles.timestampText}>{isImage ? 'Image' : 'PDF/File'} • {l.timestamp}</Text>
                            </View>
                        </View>
                    );
                 })}
=======
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
>>>>>>> 0edc934 (new updates)
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

<<<<<<< HEAD
      {/* MODALS (Tagging and Viewing) */}
      <Modal transparent visible={tagModalVisible} animationType="fade">
         <View style={styles.modalOverlay}>
             <View style={styles.modalContent}>
                 <Text style={styles.modalTitle}>Tag Photo</Text>
                 <View style={styles.modalBtns}>
                     <TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#fee2e2'}]} onPress={() => finalizePhoto("Before")}>
                         <Text style={{color:'#b91c1c', fontWeight:'bold'}}>Before</Text>
                     </TouchableOpacity>
                     <TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#dcfce7'}]} onPress={() => finalizePhoto("After")}>
                         <Text style={{color:'#15803d', fontWeight:'bold'}}>After</Text>
                     </TouchableOpacity>
                 </View>
             </View>
         </View>
      </Modal>

      {/* UPDATED: Viewer Modal for Image/PDF handling */}
      <Modal visible={viewerVisible} transparent={true} onRequestClose={() => setViewerVisible(false)}>
         <View style={styles.viewerContainer}>
             <TouchableOpacity style={styles.viewerClose} onPress={() => setViewerVisible(false)}>
                 <Ionicons name="close-circle" size={40} color="#fff" />
             </TouchableOpacity>
             
             {viewerMime && viewerMime.startsWith('image/') ? (
                 <Image source={{ uri: viewerImg }} style={styles.viewerImage} resizeMode="contain" />
             ) : (
                 <View style={styles.viewerPdfPlaceholder}>
                     <Ionicons name="document-text-sharp" size={60} color="#fff" />
                     <Text style={styles.viewerPdfText}>
                         File Preview Unavailable
                     </Text>
                     <Text style={styles.viewerPdfSubText}>
                         This simple viewer only supports images. File type: {viewerMime}.
                     </Text>
                 </View>
             )}
         </View>
      </Modal>

      {/* Diagnosis Template Modal */}
      <DiagnosisTemplateModal
        visible={templateModalVisible}
        onClose={() => setTemplateModalVisible(false)}
        onSelect={handleTemplateSelection}
        customTemplates={customDiagnosisTemplates}
        setCustomTemplates={setCustomDiagnosisTemplates}
      />

    </KeyboardAvoidingView>
  );
};

// ------------------- 5. MAIN APP ENTRY -------------------
export default function App() {
  const [activeService, setActiveService] = useState("DIAGNOSIS");
  
  // Define patient data once here
  const patientData: PatientData = { 
      id: "EG-9921", 
      name: "Ahmed Mohamed", 
      age: 34, 
      gender: "Male",
      lastVisit: "2024-10-15",
      allergies: ["Penicillin", "Dust Mites"],
      activeService: activeService
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.mainContent}>
        {/* Pass the full patient object to the info bar */}
        <PatientInfoBar patient={patientData} />
        <ServiceTabs activeService={activeService} setActiveService={setActiveService} />
        {activeService === "LASER" ? (
             <View style={[styles.card, {flex:1, justifyContent:'center', alignItems:'center'}]}><Text>Laser Module (WIP)</Text></View>
        ) : (
             <NormalView patientId={patientData.id} />
        )}
=======
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
>>>>>>> 2af3573 (feat: enhance DoctorSidebar and Sidebar components with tooltip animations and icon buttons)
      </View>
    </View>
  );
}

<<<<<<< HEAD
// ------------------- 6. STYLES -------------------
=======
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
>>>>>>> 0edc934 (new updates)
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

<<<<<<< HEAD
  // Patient Bar (UPDATED STYLES)
  patientBar: { 
    backgroundColor: THEME.white, 
    borderRadius: THEME.radius, 
    padding: 16, 
    marginBottom: 16, 
    ...THEME.shadow 
  },
  patientHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingBottom: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: THEME.border,
    marginBottom: 12,
  },
  patientHeaderText: { flex: 1 },
  patientAvatar: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    backgroundColor: THEME.primaryLight, 
    marginRight: 12 
  },
  patientName: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: THEME.secondary 
  },
  patientIdRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  idText: { fontSize: 13, color: THEME.textLight, fontWeight: '500' },
  divider: { marginHorizontal: 8, color: THEME.border },
  statusBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#dcfce7', 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    borderRadius: 20 
  },
  statusText: { fontSize: 11, color: '#166534', fontWeight: 'bold' },

  // Patient Details Grid
  patientDetailsGrid: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    gap: 10 
  },
  detailCard: { 
    flex: 1, 
    padding: 10, 
    backgroundColor: THEME.bg, 
    borderRadius: 8, 
    borderWidth: 1,
    borderColor: THEME.border,
    justifyContent: 'center',
    minHeight: 60,
  },
  detailLabel: { 
    fontSize: 10, 
    color: THEME.textLight, 
    fontWeight: '600', 
    marginTop: 4,
    marginBottom: 2
  },
  detailValue: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: THEME.secondary 
  },
  detailValueNoAllergy: {
      fontSize: 14,
      fontWeight: '700',
      color: THEME.success,
  },
  // Allergy specific styles
  allergyCard: {
    flex: 1.5, // Wider card for allergies
    backgroundColor: '#fee2e2', // Light red background for warning
    borderColor: THEME.danger,
  },
  allergyChips: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    marginTop: 2, 
    gap: 4 
  },
  allergyChipText: { 
    backgroundColor: THEME.danger, 
    color: THEME.white, 
    fontSize: 11, 
    fontWeight: 'bold',
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 4 
  },

  // Tabs
  tabContainer: { flexDirection: 'row', backgroundColor: '#e2e8f0', padding: 4, borderRadius: THEME.radius, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: THEME.white, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2 },
  tabText: { fontSize: 13, fontWeight: '600', color: THEME.textLight },
  tabTextActive: { color: THEME.primary },

  // SPLIT VIEW & SCROLLING 
  splitViewContainer: { flex: 1, flexDirection: 'row', gap: 0 }, 
  columnScroll: { flex: 1, paddingRight: 8 }, 

  // Cards & Inputs
  card: { backgroundColor: THEME.white, borderRadius: THEME.radius, padding: 12, marginBottom: 12, ...THEME.shadow },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  headerRow: { flexDirection: 'row', justifyContent:'space-between', alignItems:'center', marginBottom: 10 },
=======
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
>>>>>>> 0edc934 (new updates)
  
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
  
<<<<<<< HEAD
  // Diagnosis Templates 
  manageBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: THEME.primary },
  manageBtnText: { color: THEME.primary, fontSize: 11, fontWeight: '600', marginLeft: 4 },
  templateChip: { backgroundColor: THEME.primaryLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginRight: 6 },
  templateChipText: { color: THEME.primary, fontSize: 11, fontWeight: '600' },
  
  // Custom Medication
  customInputRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  customInput: { borderWidth: 1, borderColor: THEME.border, borderRadius: 6, padding: 8, fontSize: 13, flex: 1 },
  addCustomBtn: { backgroundColor: THEME.accentBlue, padding: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  addCustomText: { color: THEME.white, fontWeight: 'bold', fontSize: 13 },

  // Meds & Table
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: THEME.border, borderRadius: 8, paddingHorizontal: 10, marginBottom: 8, marginTop: 8 },
  searchInput: { flex: 1, height: 36 },
  medList: { maxHeight: 120 },
  medItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  medItemSelected: { backgroundColor: THEME.primaryLight, borderRadius: 8 },
  medName: { fontSize: 13, fontWeight: '600', color: THEME.text },
  medNameSelected: { color: THEME.primary },
  medDose: { fontSize: 11, color: THEME.textLight },
  medDoseSelected: { color: THEME.primary },

  tableHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  exportBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.secondary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  exportText: { color: '#fff', fontSize: 11, marginLeft: 4, fontWeight: 'bold' },
  tableRow: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  rowMain: { padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowName: { fontSize: 13, fontWeight: '600', color: THEME.text },
  rowDetail: { fontSize: 11, color: THEME.textLight },
  emptyState: { padding: 10, justifyContent: 'center', alignItems: 'center' },

  rowExpanded: { padding: 10, backgroundColor: '#f8fafc', borderTopWidth: 1, borderTopColor: THEME.border },
  swipeDelete: { backgroundColor: THEME.danger, justifyContent: 'center', alignItems: 'center', width: 60 },
  emptyText: { color: THEME.textLight, fontStyle: 'italic', textAlign: 'center', padding: 10, fontSize: 12 },

  // Editable Fields
  editableFieldGroup: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  editableField: { flexDirection: 'row', alignItems: 'center', flex: 1, backgroundColor: THEME.white, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1, borderColor: THEME.border },
  editableInput: { flex: 1, height: 36, paddingLeft: 8, fontSize: 13, color: THEME.text },
  
  // Modernized Notes
  notesBox: { backgroundColor: THEME.white, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: THEME.primaryLight },
  notesHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  notesTitle: { fontSize: 12, fontWeight: 'bold', color: THEME.secondary },
  notesInput: { fontSize: 13, color: THEME.text, textAlignVertical: 'top', height: 60 },

  // Photos & Labs
  outlineBtn: { flexDirection: 'row', alignItems: 'center', padding: 4, borderRadius: 4, borderWidth: 1, borderColor: THEME.border },
  outlineBtnText: { fontSize: 10, marginLeft: 4, color: THEME.text },
  iconBtn: { backgroundColor: THEME.primary, borderRadius: 20, width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoCard: { width: '48%', backgroundColor: '#f8fafc', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: THEME.border, marginBottom: 8 },
  photoImg: { width: '100%', height: 120, resizeMode: 'cover' },
  tagBadge: { position: 'absolute', top: 4, left: 4, backgroundColor: '#f1f5f9', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 },
  tagText: { fontSize: 9, fontWeight: 'bold', color: THEME.text },
  deleteMini: { position: 'absolute', top: 4, right: 4, backgroundColor: THEME.danger, width:18, height:18, borderRadius: 9, justifyContent:'center', alignItems:'center' },
  photoFooter: { padding: 6 },
  timestampText: { fontSize: 9, color: THEME.textLight },

  // Save Btn
  saveBtn: { backgroundColor: THEME.primary, padding: 12, borderRadius: THEME.radius, alignItems: 'center', marginTop: 10, marginBottom: 20, ...THEME.shadow },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', width: 320, padding: 20, borderRadius: 12 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 15, color: THEME.secondary },
  modalBtns: { flexDirection: 'row', gap: 10 },
  modalBtn: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center' },
  modalCloseBtn: { marginTop: 20, padding: 10, backgroundColor: THEME.primary, borderRadius: 8 },
  modalCloseText: { color: THEME.white, fontWeight: 'bold', textAlign: 'center' },
  
  templateInputGroup: { flexDirection: 'row', gap: 8 },
  templateAddBtn: { backgroundColor: THEME.primary, width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  templateListItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: THEME.border },
  templateItemText: { fontSize: 14, color: THEME.text },
  
  viewerContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  viewerImage: { width: '100%', height: '80%' },
  viewerClose: { position: 'absolute', top: 40, right: 20, zIndex: 10 },
  viewerPdfPlaceholder: { padding: 20, backgroundColor: THEME.secondary, borderRadius: 12, alignItems: 'center' },
  viewerPdfText: { color: THEME.white, fontSize: 18, fontWeight: 'bold', marginTop: 10 },
  viewerPdfSubText: { color: THEME.textLight, fontSize: 12, marginTop: 5, textAlign: 'center', maxWidth: 250 },
=======
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
>>>>>>> 2af3573 (feat: enhance DoctorSidebar and Sidebar components with tooltip animations and icon buttons)
});
=======
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
>>>>>>> 0edc934 (new updates)
