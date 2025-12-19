import React, { useState, useEffect, useCallback } from "react";
import {
  Alert,
  Modal,
  Pressable,
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Linking,
  Platform,
  TextInput,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import PrescriptionTable from "@/components/PrescriptionTable";
import { ChevronDown, ChevronUp, Plus, Eye, AlertCircle, RefreshCw, FileText, Download, X, Edit3, Save, PlusCircle, Trash2, Check, ArrowLeft } from "lucide-react-native";
import { 
  getPatientProfile, 
  updatePatientInfo, 
  getAllergies, 
  addAllergy,
  getMedicalConditions,
  addMedicalCondition,
  getSurgeryTypes,
  addSurgeryType 
} from "../../../src/api/doctorApi";
import { useAuth } from "../../context/AuthContext";

// Conditionally import WebView only for native platforms
let WebView: any = null;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}

// ---------------------
// Type Definitions
// ---------------------
type Prescription = {
  medication: string;
  dose: string;
  frequency: string;
  duration: string;
  notes: string;
};

type Diagnosis = {
  complaint: string;
  findings: string;
  finalDiagnosis: string;
};

type Vitals = {
  temperature?: string;
  bloodPressure?: string;
  heartRate?: string;
  respiratoryRate?: string;
  weight?: string;
  bmi?: string;
  oxygenSaturation?: string;
};

type LabResult = {
  testName: string;
  result: string;
  unit?: string;
  date: string;
};

type Procedure = {
  name: string;
  notes: string;
  date: string;
};

type Visit = {
  id: number;
  title: string;
  date: string;
  service: "Laser" | "Beauty" | "Diagnosis";
  diagnosis: Diagnosis;
  prescriptions: Prescription[];
  treatment: string;
  vitals?: Vitals;
  labs?: LabResult[];
  procedures?: Procedure[];
  nextFollowUp?: string;
  cost?: number;
  paymentStatus?: "Paid" | "Not Paid";
};

type GalleryItem = {
  id: number;
  date: string;
  label: string;
  images: string[];
};

// File type from API
type PatientFileData = {
  id: number;
  type: string;
  url: string;
  name: string;
  tag: string;
  caption: string;
  date: string;
  visit_id?: number;
};

// ---------------------
// Main Component
// ---------------------
export default function DoctorPatientPage() {
  const router = useRouter();
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const { user, isLoading: authLoading } = useAuth();
  
  const [expanded, setExpanded] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Document viewer state
  const [docModalVisible, setDocModalVisible] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<PatientFileData | null>(null);
  
  // API state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patient, setPatient] = useState<any>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  
  // Files from backend
  const [patientPhotos, setPatientPhotos] = useState<PatientFileData[]>([]);
  const [patientLabs, setPatientLabs] = useState<PatientFileData[]>([]);
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editEmail, setEditEmail] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editAllergies, setEditAllergies] = useState<string[]>([]);
  const [editMedicalHistory, setEditMedicalHistory] = useState<string[]>([]);
  const [editSurgeries, setEditSurgeries] = useState<string[]>([]);
  
  // Dropdown state
  const [allAllergies, setAllAllergies] = useState<string[]>([]);
  const [showAllergyDropdown, setShowAllergyDropdown] = useState(false);
  const [newAllergyInput, setNewAllergyInput] = useState('');
  
  // Medical conditions dropdown state
  const [allMedicalConditions, setAllMedicalConditions] = useState<string[]>([]);
  const [showMedHistoryDropdown, setShowMedHistoryDropdown] = useState(false);
  const [newMedHistoryInput, setNewMedHistoryInput] = useState('');
  
  // Surgery types dropdown state
  const [allSurgeryTypes, setAllSurgeryTypes] = useState<string[]>([]);
  const [showSurgeryDropdown, setShowSurgeryDropdown] = useState(false);
  const [newSurgeryInput, setNewSurgeryInput] = useState('');
  
  // Sort state for visits
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [photoSortOrder, setPhotoSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [labSortOrder, setLabSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Load patient data
  const loadPatientData = useCallback(async () => {
    if (!patientId) return;
    
    console.log('[PatientPage] Loading patient data for ID:', patientId);
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await getPatientProfile(patientId);
      
      console.log('[PatientPage] API Response for patient', patientId, ':', {
        name: result.data?.name,
        id: result.data?.id,
        visitCount: result.data?.visits?.length,
        firstVisitMeds: result.data?.visits?.[0]?.prescriptions?.map((p: any) => p.medication)
      });
      
      if (result.success && result.data) {
        setPatient({
          name: result.data.name,
          id: `P-${result.data.id}`,
          age: result.data.age || 'N/A',
          gender: result.data.gender || 'Unknown',
          phone: result.data.phone || 'N/A',
          email: result.data.email || 'N/A',
          image: `https://placehold.co/200x200/9B084D/FFFFFF?text=${result.data.name?.charAt(0) || 'P'}`,
          allergies: result.data.allergies || [],
          notes: result.data.notes || 'No notes',
          medicalHistory: result.data.medicalHistory || [],
          surgeries: result.data.surgeries || [],
        });
        
        // Map visits from API
        const apiVisits: Visit[] = (result.data.visits || []).map((v: any) => ({
          id: v.id,
          title: v.title,
          date: v.date,
          service: v.service === 'Laser' ? 'Laser' : v.service === 'Beauty' ? 'Beauty' : 'Diagnosis',
          diagnosis: {
            complaint: v.diagnosis?.complaint || '',
            findings: v.diagnosis?.findings || '',
            finalDiagnosis: v.diagnosis?.finalDiagnosis || 'No diagnosis recorded',
          },
          prescriptions: v.prescriptions || [],
          treatment: v.treatment || '',
          files: v.files || [],
          cost: v.cost || 0,
          paymentStatus: v.paymentStatus || 'Paid',
        }));
        
        setVisits(apiVisits);
        
        // Set photos and labs from API
        setPatientPhotos(result.data.photos || []);
        setPatientLabs(result.data.labs || []);
        
        // Initialize edit fields
        setEditEmail(result.data.email || '');
        setEditNotes(result.data.notes || '');
        setEditAllergies(result.data.allergies || []);
        setEditMedicalHistory(result.data.medicalHistory || []);
        setEditSurgeries(result.data.surgeries || []);
      } else {
        setError(result.error || 'Failed to load patient data');
      }
    } catch (e) {
      console.error('Error loading patient:', e);
      setError('Failed to load patient data');
    } finally {
      setLoading(false);
    }
  }, [patientId]);
  
  // Load all allergies for dropdown
  const loadAllergies = useCallback(async () => {
    try {
      const result = await getAllergies();
      if (result.success && result.data) {
        const allergyNames = result.data.map((a: any) => a.name);
        setAllAllergies(allergyNames);
      }
    } catch (e) {
      console.error('Error loading allergies:', e);
    }
  }, []);

  // Load all medical conditions for dropdown
  const loadMedicalConditions = useCallback(async () => {
    try {
      const result = await getMedicalConditions();
      if (result.success && result.data) {
        const conditionNames = result.data.map((c: any) => c.name);
        setAllMedicalConditions(conditionNames);
      }
    } catch (e) {
      console.error('Error loading medical conditions:', e);
    }
  }, []);

  // Load all surgery types for dropdown
  const loadSurgeryTypes = useCallback(async () => {
    try {
      const result = await getSurgeryTypes();
      if (result.success && result.data) {
        const surgeryNames = result.data.map((s: any) => s.name);
        setAllSurgeryTypes(surgeryNames);
      }
    } catch (e) {
      console.error('Error loading surgery types:', e);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && patientId) {
      loadPatientData();
      loadAllergies();
      loadMedicalConditions();
      loadSurgeryTypes();
    }
  }, [authLoading, patientId, loadPatientData, loadAllergies]);
  
  // Start editing
  const handleStartEdit = () => {
    setEditEmail(patient?.email === 'N/A' ? '' : patient?.email || '');
    setEditNotes(patient?.notes === 'No notes' ? '' : patient?.notes || '');
    setEditAllergies(patient?.allergies || []);
    setEditMedicalHistory(patient?.medicalHistory || []);
    setEditSurgeries(patient?.surgeries || []);
    setIsEditing(true);
  };
  
  // Save changes
  const handleSaveChanges = async () => {
    if (!patientId) return;
    
    setSaving(true);
    try {
      const result = await updatePatientInfo(patientId, {
        email: editEmail,
        notes: editNotes,
        allergies: editAllergies,
        medical_history: editMedicalHistory,
        surgeries: editSurgeries,
      });
      
      if (result.success) {
        // Update local patient state
        setPatient((prev: any) => ({
          ...prev,
          email: editEmail || 'N/A',
          notes: editNotes || 'No notes',
          allergies: editAllergies,
          medicalHistory: editMedicalHistory,
          surgeries: editSurgeries,
        }));
        setIsEditing(false);
        Alert.alert('Success', 'Patient info updated successfully');
      } else {
        Alert.alert('Error', result.error || 'Failed to update patient info');
      }
    } catch (e) {
      console.error('Error saving patient info:', e);
      Alert.alert('Error', 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };
  
  // Add/remove items from arrays
  const addAllergy = (allergy: string) => {
    if (allergy && !editAllergies.includes(allergy)) {
      setEditAllergies([...editAllergies, allergy]);
    }
    setNewAllergyInput('');
    setShowAllergyDropdown(false);
  };
  
  const removeAllergy = (allergy: string) => {
    setEditAllergies(editAllergies.filter(a => a !== allergy));
  };
  
  // Add allergy and save to database for future use
  const handleAddAllergy = async (allergy: string) => {
    if (allergy && !editAllergies.includes(allergy)) {
      setEditAllergies([...editAllergies, allergy]);
      
      // If it's a new allergy not in the dropdown list, save it to the database
      if (!allAllergies.includes(allergy)) {
        try {
          await addAllergy(allergy);
          setAllAllergies([...allAllergies, allergy].sort());
        } catch (e) {
          console.error('Error saving new allergy:', e);
        }
      }
    }
    setNewAllergyInput('');
    setShowAllergyDropdown(false);
  };
  
  // Add medical condition and save to database for future use
  const handleAddMedicalCondition = async (condition: string) => {
    if (condition && !editMedicalHistory.includes(condition)) {
      setEditMedicalHistory([...editMedicalHistory, condition]);
      
      // If it's a new condition not in the dropdown list, save it to the database
      if (!allMedicalConditions.includes(condition)) {
        try {
          await addMedicalCondition(condition);
          setAllMedicalConditions([...allMedicalConditions, condition].sort());
        } catch (e) {
          console.error('Error saving new medical condition:', e);
        }
      }
    }
    setNewMedHistoryInput('');
    setShowMedHistoryDropdown(false);
  };
  
  const removeMedicalHistory = (item: string) => {
    setEditMedicalHistory(editMedicalHistory.filter(h => h !== item));
  };
  
  // Add surgery type and save to database for future use
  const handleAddSurgeryType = async (surgery: string) => {
    if (surgery && !editSurgeries.includes(surgery)) {
      setEditSurgeries([...editSurgeries, surgery]);
      
      // If it's a new surgery type not in the dropdown list, save it to the database
      if (!allSurgeryTypes.includes(surgery)) {
        try {
          await addSurgeryType(surgery);
          setAllSurgeryTypes([...allSurgeryTypes, surgery].sort());
        } catch (e) {
          console.error('Error saving new surgery type:', e);
        }
      }
    }
    setNewSurgeryInput('');
    setShowSurgeryDropdown(false);
  };
  
  const removeSurgery = (item: string) => {
    setEditSurgeries(editSurgeries.filter(s => s !== item));
  };

  const serviceColor = (service: Visit["service"]) => {
    switch (service) {
      case "Laser":
        return "#FCE4EC";
      case "Beauty":
        return "#F8BBD0";
      case "Diagnosis":
        return "#E1BEE7";
      default:
        return "#FFF";
    }
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <View style={[styles.mainPage, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#9B084D" />
        <Text style={{ marginTop: 16, color: '#666' }}>Loading patient profile...</Text>
      </View>
    );
  }

  // Error state
  if (error || !patient) {
    return (
      <View style={[styles.mainPage, { justifyContent: 'center', alignItems: 'center' }]}>
        <AlertCircle size={48} color="#dc3545" />
        <Text style={{ marginTop: 16, color: '#dc3545', fontSize: 16 }}>{error || 'Patient not found'}</Text>
        <TouchableOpacity
          style={[styles.addBtn, { marginTop: 16 }]}
          onPress={loadPatientData}
        >
          <RefreshCw size={18} color="#fff" />
          <Text style={styles.addText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.mainPage}>
      {/* LEFT PANEL — Patient Profile */}
      <View style={styles.leftPanel}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.profileCard}>
            <Image source={{ uri: patient.image }} style={styles.profileImage} />

            <View style={styles.profileDivider} />
            
            {/* Edit/Save Button */}
            <View style={styles.editButtonContainer}>
              {isEditing ? (
                <View style={styles.editButtonRow}>
                  <TouchableOpacity 
                    style={[styles.editButton, styles.cancelButton]}
                    onPress={() => setIsEditing(false)}
                    disabled={saving}
                  >
                    <X size={16} color="#666" />
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.editButton, styles.saveButton]}
                    onPress={handleSaveChanges}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Save size={16} color="#fff" />
                        <Text style={styles.saveButtonText}>Save</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={[styles.editButton, styles.editModeButton]}
                  onPress={handleStartEdit}
                >
                  <Edit3 size={16} color="#9B084D" />
                  <Text style={styles.editModeButtonText}>Edit Info</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Non-editable fields */}
            {[
              ["Name", patient.name],
              ["Patient ID", patient.id],
              ["Age", patient.age],
              ["Gender", patient.gender],
              ["Phone", patient.phone],
            ].map(([label, value], index) => (
              <View key={index} style={styles.infoRowBox}>
                <Text style={styles.infoKey}>{label}</Text>
                <Text style={styles.infoValue}>{value}</Text>
              </View>
            ))}
            
            {/* Email - Editable */}
            <View style={styles.infoRowBox}>
              <Text style={styles.infoKey}>Email</Text>
              {isEditing ? (
                <TextInput
                  style={styles.editInput}
                  value={editEmail}
                  onChangeText={setEditEmail}
                  placeholder="Enter email..."
                  keyboardType="email-address"
                />
              ) : (
                <Text style={styles.infoValue}>{patient.email || 'N/A'}</Text>
              )}
            </View>
            
            {/* Allergies - Editable with dropdown */}
            <View style={[styles.infoRowBox, { flexDirection: 'column', alignItems: 'flex-start' }]}>
              <Text style={styles.infoKey}>Allergies</Text>
              {isEditing ? (
                <View style={styles.editableList}>
                  {/* Current allergies as chips */}
                  <View style={styles.chipContainer}>
                    {editAllergies.map((allergy, idx) => (
                      <View key={idx} style={styles.chip}>
                        <Text style={styles.chipText}>{allergy}</Text>
                        <TouchableOpacity onPress={() => removeAllergy(allergy)}>
                          <X size={14} color="#9B084D" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                  
                  {/* Add new allergy */}
                  <View style={styles.addItemContainer}>
                    <TextInput
                      style={styles.addItemInput}
                      value={newAllergyInput}
                      onChangeText={(text) => {
                        setNewAllergyInput(text);
                        setShowAllergyDropdown(text.length > 0);
                      }}
                      placeholder="Type or select allergy..."
                      onFocus={() => setShowAllergyDropdown(true)}
                    />
                    <TouchableOpacity 
                      style={styles.addItemButton}
                      onPress={() => {
                        if (newAllergyInput.trim()) {
                          handleAddAllergy(newAllergyInput.trim());
                        }
                      }}
                    >
                      <PlusCircle size={20} color="#9B084D" />
                    </TouchableOpacity>
                  </View>
                  
                  {/* Dropdown suggestions */}
                  {showAllergyDropdown && (
                    <View style={styles.dropdown}>
                      {allAllergies
                        .filter(a => 
                          a.toLowerCase().includes(newAllergyInput.toLowerCase()) &&
                          !editAllergies.includes(a)
                        )
                        .slice(0, 5)
                        .map((allergy, idx) => (
                          <TouchableOpacity 
                            key={idx}
                            style={styles.dropdownItem}
                            onPress={() => handleAddAllergy(allergy)}
                          >
                            <Text style={styles.dropdownText}>{allergy}</Text>
                          </TouchableOpacity>
                        ))
                      }
                      {newAllergyInput.trim() && 
                       !allAllergies.some(a => a.toLowerCase() === newAllergyInput.toLowerCase()) && (
                        <TouchableOpacity 
                          style={[styles.dropdownItem, styles.dropdownItemNew]}
                          onPress={() => handleAddAllergy(newAllergyInput.trim())}
                        >
                          <PlusCircle size={14} color="#9B084D" />
                          <Text style={styles.dropdownTextNew}>Add "{newAllergyInput.trim()}"</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              ) : (
                <Text style={[styles.infoValue, { textAlign: 'left', flex: 0 }]}>
                  {patient.allergies?.length > 0 ? patient.allergies.join(", ") : "None"}
                </Text>
              )}
            </View>
            
            {/* Notes - Editable */}
            <View style={[styles.infoRowBox, { flexDirection: 'column', alignItems: 'flex-start' }]}>
              <Text style={styles.infoKey}>Notes</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.editInput, styles.editTextArea]}
                  value={editNotes}
                  onChangeText={setEditNotes}
                  placeholder="Enter notes..."
                  multiline
                  numberOfLines={3}
                />
              ) : (
                <Text style={[styles.infoValue, { textAlign: 'left', flex: 0 }]}>
                  {patient.notes || 'No notes'}
                </Text>
              )}
            </View>
            
            {/* Medical History - Editable with dropdown */}
            <View style={[styles.infoRowBox, { flexDirection: 'column', alignItems: 'flex-start' }]}>
              <Text style={styles.infoKey}>Medical History</Text>
              {isEditing ? (
                <View style={styles.editableList}>
                  <View style={styles.chipContainer}>
                    {editMedicalHistory.map((item, idx) => (
                      <View key={idx} style={styles.chip}>
                        <Text style={styles.chipText}>{item}</Text>
                        <TouchableOpacity onPress={() => removeMedicalHistory(item)}>
                          <X size={14} color="#9B084D" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                  <View style={styles.addItemContainer}>
                    <TextInput
                      style={styles.addItemInput}
                      value={newMedHistoryInput}
                      onChangeText={(text) => {
                        setNewMedHistoryInput(text);
                        setShowMedHistoryDropdown(text.length > 0);
                      }}
                      placeholder="Type or select condition..."
                      onFocus={() => setShowMedHistoryDropdown(true)}
                    />
                    <TouchableOpacity 
                      style={styles.addItemButton} 
                      onPress={() => {
                        if (newMedHistoryInput.trim()) {
                          handleAddMedicalCondition(newMedHistoryInput.trim());
                        }
                      }}
                    >
                      <PlusCircle size={20} color="#9B084D" />
                    </TouchableOpacity>
                  </View>
                  
                  {/* Dropdown suggestions for medical history */}
                  {showMedHistoryDropdown && (
                    <View style={styles.dropdown}>
                      {allMedicalConditions
                        .filter(c => 
                          c.toLowerCase().includes(newMedHistoryInput.toLowerCase()) &&
                          !editMedicalHistory.includes(c)
                        )
                        .slice(0, 5)
                        .map((condition, idx) => (
                          <TouchableOpacity 
                            key={idx}
                            style={styles.dropdownItem}
                            onPress={() => handleAddMedicalCondition(condition)}
                          >
                            <Text style={styles.dropdownText}>{condition}</Text>
                          </TouchableOpacity>
                        ))
                      }
                      {newMedHistoryInput.trim() && 
                       !allMedicalConditions.some(c => c.toLowerCase() === newMedHistoryInput.toLowerCase()) && (
                        <TouchableOpacity 
                          style={[styles.dropdownItem, styles.dropdownItemNew]}
                          onPress={() => handleAddMedicalCondition(newMedHistoryInput.trim())}
                        >
                          <PlusCircle size={14} color="#9B084D" />
                          <Text style={styles.dropdownTextNew}>Add "{newMedHistoryInput.trim()}"</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              ) : (
                <Text style={[styles.infoValue, { textAlign: 'left', flex: 0 }]}>
                  {patient.medicalHistory?.length > 0 ? patient.medicalHistory.join(", ") : "None"}
                </Text>
              )}
            </View>
            
            {/* Surgeries - Editable with dropdown */}
            <View style={[styles.infoRowBox, { flexDirection: 'column', alignItems: 'flex-start' }]}>
              <Text style={styles.infoKey}>Surgeries</Text>
              {isEditing ? (
                <View style={styles.editableList}>
                  <View style={styles.chipContainer}>
                    {editSurgeries.map((item, idx) => (
                      <View key={idx} style={styles.chip}>
                        <Text style={styles.chipText}>{item}</Text>
                        <TouchableOpacity onPress={() => removeSurgery(item)}>
                          <X size={14} color="#9B084D" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                  <View style={styles.addItemContainer}>
                    <TextInput
                      style={styles.addItemInput}
                      value={newSurgeryInput}
                      onChangeText={(text) => {
                        setNewSurgeryInput(text);
                        setShowSurgeryDropdown(text.length > 0);
                      }}
                      placeholder="Type or select surgery..."
                      onFocus={() => setShowSurgeryDropdown(true)}
                    />
                    <TouchableOpacity 
                      style={styles.addItemButton} 
                      onPress={() => {
                        if (newSurgeryInput.trim()) {
                          handleAddSurgeryType(newSurgeryInput.trim());
                        }
                      }}
                    >
                      <PlusCircle size={20} color="#9B084D" />
                    </TouchableOpacity>
                  </View>
                  
                  {/* Dropdown suggestions for surgeries */}
                  {showSurgeryDropdown && (
                    <View style={styles.dropdown}>
                      {allSurgeryTypes
                        .filter(s => 
                          s.toLowerCase().includes(newSurgeryInput.toLowerCase()) &&
                          !editSurgeries.includes(s)
                        )
                        .slice(0, 5)
                        .map((surgery, idx) => (
                          <TouchableOpacity 
                            key={idx}
                            style={styles.dropdownItem}
                            onPress={() => handleAddSurgeryType(surgery)}
                          >
                            <Text style={styles.dropdownText}>{surgery}</Text>
                          </TouchableOpacity>
                        ))
                      }
                      {newSurgeryInput.trim() && 
                       !allSurgeryTypes.some(s => s.toLowerCase() === newSurgeryInput.toLowerCase()) && (
                        <TouchableOpacity 
                          style={[styles.dropdownItem, styles.dropdownItemNew]}
                          onPress={() => handleAddSurgeryType(newSurgeryInput.trim())}
                        >
                          <PlusCircle size={14} color="#9B084D" />
                          <Text style={styles.dropdownTextNew}>Add "{newSurgeryInput.trim()}"</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              ) : (
                <Text style={[styles.infoValue, { textAlign: 'left', flex: 0 }]}>
                  {patient.surgeries?.length > 0 ? patient.surgeries.join(", ") : "None"}
                </Text>
              )}
            </View>
          </View>
        </ScrollView>
      </View>

      {/* RIGHT PANEL — Visits + Gallery */}
      <View style={styles.rightPanel}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Visit History */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Patient Visit History</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() =>
                  router.push({
                    pathname: "/doctor/diagnosis/[id]",
                    params: { id: patientId },
                  })
                }
              >
                <Plus size={18} color="#fff" />
                <Text style={styles.addText}>New Visit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => router.push('/doctor/patient-history')}
              >
                <ArrowLeft size={18} color="#fff" />
                <Text style={styles.addText}>Return to Patients History</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sort Buttons */}
          {visits.length > 0 && (
            <View style={styles.sortContainer}>
              <Text style={styles.sortLabel}>Sort by:</Text>
              <TouchableOpacity
                style={[styles.sortBtn, sortOrder === 'newest' && styles.sortBtnActive]}
                onPress={() => setSortOrder('newest')}
              >
                <ChevronDown size={14} color={sortOrder === 'newest' ? '#fff' : '#9B084D'} />
                <Text style={[styles.sortBtnText, sortOrder === 'newest' && styles.sortBtnTextActive]}>Newest</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortBtn, sortOrder === 'oldest' && styles.sortBtnActive]}
                onPress={() => setSortOrder('oldest')}
              >
                <ChevronUp size={14} color={sortOrder === 'oldest' ? '#fff' : '#9B084D'} />
                <Text style={[styles.sortBtnText, sortOrder === 'oldest' && styles.sortBtnTextActive]}>Oldest</Text>
              </TouchableOpacity>
            </View>
          )}

          {visits.length === 0 ? (
            <View style={[styles.card, { backgroundColor: '#f5f5f5', padding: 20, alignItems: 'center' }]}>
              <Text style={{ color: '#666', fontStyle: 'italic' }}>No visit history found for this patient.</Text>
            </View>
          ) : (
            [...visits]
              .sort((a, b) => {
                return sortOrder === 'newest' ? b.id - a.id : a.id - b.id;
              })
              .map((v, i, arr) => {
                // Calculate visit number (1-based, oldest first)
                const visitNumber = sortOrder === 'newest' 
                  ? arr.length - i 
                  : i + 1;
                return (
              <View key={v.id} style={[styles.card, { backgroundColor: serviceColor(v.service) }]}>
                <TouchableOpacity
                  onPress={() => setExpanded(expanded === v.id ? null : v.id)}
                  style={styles.cardHeader}
              >
                <View>
                  <Text style={styles.cardTitle}>Visit #{visitNumber} - {v.title}</Text>
                  <Text style={styles.cardDate}>{v.date} • {v.service}</Text>
                </View>

                {expanded === v.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </TouchableOpacity>

              {expanded === v.id && (
                <View style={styles.cardBody}>
                  <Text style={styles.subTitle}>Diagnosis</Text>
                  <Text><Text style={styles.bold}>Complaint:</Text> {v.diagnosis.complaint}</Text>
                  <Text><Text style={styles.bold}>Findings:</Text> {v.diagnosis.findings}</Text>
                  <Text style={styles.finalDiagnosis}>
                    Final Diagnosis: {v.diagnosis.finalDiagnosis}
                  </Text>

                  <Text style={styles.subTitle}>Prescriptions</Text>
                  <PrescriptionTable
                    prescriptions={v.prescriptions}
                    doctorName="Dr. Emily Carter"
                    clinicName="Derma Clinic"
                    patient={{
                      name: patient.name,
                      age: patient.age,
                      gender: patient.gender,
                      id: patient.id,
                    }}
                  />

                  <Text style={styles.subTitle}>Treatment</Text>
                  <Text>{v.treatment}</Text>
                </View>
              )}
            </View>
              );
            })
          )}

          {/* PHOTOS GALLERY */}
          <View style={styles.galleryContainer}>
            <Text style={styles.sectionTitle}>Patient Photos</Text>
            
            {/* Sort Buttons for Photos */}
            {patientPhotos.length > 0 && (
              <View style={styles.sortContainer}>
                <Text style={styles.sortLabel}>Sort by:</Text>
                <TouchableOpacity
                  style={[styles.sortBtn, photoSortOrder === 'newest' && styles.sortBtnActive]}
                  onPress={() => setPhotoSortOrder('newest')}
                >
                  <ChevronDown size={14} color={photoSortOrder === 'newest' ? '#fff' : '#9B084D'} />
                  <Text style={[styles.sortBtnText, photoSortOrder === 'newest' && styles.sortBtnTextActive]}>Newest</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sortBtn, photoSortOrder === 'oldest' && styles.sortBtnActive]}
                  onPress={() => setPhotoSortOrder('oldest')}
                >
                  <ChevronUp size={14} color={photoSortOrder === 'oldest' ? '#fff' : '#9B084D'} />
                  <Text style={[styles.sortBtnText, photoSortOrder === 'oldest' && styles.sortBtnTextActive]}>Oldest</Text>
                </TouchableOpacity>
              </View>
            )}

            {patientPhotos.length === 0 ? (
              <View style={styles.emptyGallery}>
                <Text style={styles.emptyText}>No photos uploaded yet.</Text>
                <Text style={styles.emptySubText}>Photos uploaded during diagnosis visits will appear here.</Text>
              </View>
            ) : (
              <View style={styles.photoGrid}>
                {[...patientPhotos]
                  .sort((a, b) => {
                    // Sort by visit_id first
                    const visitA = a.visit_id || 0;
                    const visitB = b.visit_id || 0;
                    return photoSortOrder === 'newest' ? visitB - visitA : visitA - visitB;
                  })
                  .map((photo) => {
                    // Find the visit number based on visit_id
                    const visitIndex = visits.findIndex(v => v.id === photo.visit_id);
                    const visitNumber = visitIndex !== -1 ? visitIndex + 1 : null;
                    return (
                  <TouchableOpacity
                    key={photo.id}
                    onPress={() => {
                      setSelectedImage(photo.url);
                      setModalVisible(true);
                    }}
                    style={styles.photoCard}
                  >
                    <Image source={{ uri: photo.url }} style={styles.albumImage} />
                    <View style={styles.photoInfo}>
                      {photo.tag ? <Text style={styles.photoTag}>{photo.tag}</Text> : null}
                      <Text style={styles.photoDate}>{photo.date}</Text>
                      {visitNumber && <Text style={styles.photoVisit}>Visit #{visitNumber}</Text>}
                    </View>
                  </TouchableOpacity>
                    );
                  })
                }
              </View>
            )}
          </View>

          {/* LABS & DOCUMENTS */}
          <View style={styles.galleryContainer}>
            <Text style={styles.sectionTitle}>Lab Tests & Documents</Text>
            
            {/* Sort Buttons for Labs */}
            {patientLabs.length > 0 && (
              <View style={styles.sortContainer}>
                <Text style={styles.sortLabel}>Sort by:</Text>
                <TouchableOpacity
                  style={[styles.sortBtn, labSortOrder === 'newest' && styles.sortBtnActive]}
                  onPress={() => setLabSortOrder('newest')}
                >
                  <ChevronDown size={14} color={labSortOrder === 'newest' ? '#fff' : '#9B084D'} />
                  <Text style={[styles.sortBtnText, labSortOrder === 'newest' && styles.sortBtnTextActive]}>Newest</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sortBtn, labSortOrder === 'oldest' && styles.sortBtnActive]}
                  onPress={() => setLabSortOrder('oldest')}
                >
                  <ChevronUp size={14} color={labSortOrder === 'oldest' ? '#fff' : '#9B084D'} />
                  <Text style={[styles.sortBtnText, labSortOrder === 'oldest' && styles.sortBtnTextActive]}>Oldest</Text>
                </TouchableOpacity>
              </View>
            )}

            {patientLabs.length === 0 ? (
              <View style={styles.emptyGallery}>
                <Text style={styles.emptyText}>No lab tests or documents uploaded yet.</Text>
                <Text style={styles.emptySubText}>Lab results uploaded during diagnosis visits will appear here.</Text>
              </View>
            ) : (
              <View style={styles.labsList}>
                {[...patientLabs]
                  .sort((a, b) => {
                    // Sort by visit_id first
                    const visitA = a.visit_id || 0;
                    const visitB = b.visit_id || 0;
                    return labSortOrder === 'newest' ? visitB - visitA : visitA - visitB;
                  })
                  .map((lab) => {
                    // Find the visit number based on visit_id
                    const visitIndex = visits.findIndex(v => v.id === lab.visit_id);
                    const visitNumber = visitIndex !== -1 ? visitIndex + 1 : null;
                    return (
                  <TouchableOpacity
                    key={lab.id}
                    style={styles.labItem}
                    onPress={() => {
                      // Check if it's an image
                      const isImage = lab.url.startsWith('data:image') || 
                                      lab.type === 'photo' || 
                                      /\.(jpg|jpeg|png|gif|webp)$/i.test(lab.name || '');
                      
                      if (isImage) {
                        setSelectedImage(lab.url);
                        setModalVisible(true);
                      } else {
                        // For PDFs and other documents - open in document viewer
                        setSelectedDoc(lab);
                        setDocModalVisible(true);
                      }
                    }}
                  >
                    <View style={styles.labIcon}>
                      {lab.type === 'document' || /\.pdf$/i.test(lab.name || '') ? (
                        <FileText size={20} color="#9B084D" />
                      ) : (
                        <Eye size={20} color="#0284c7" />
                      )}
                    </View>
                    <View style={styles.labInfo}>
                      <Text style={styles.labName}>{lab.name || 'Lab Result'}</Text>
                      <Text style={styles.labDate}>
                        {lab.date}{visitNumber ? ` • Visit #${visitNumber}` : ''}
                      </Text>
                    </View>
                    <View style={styles.labAction}>
                      <Eye size={18} color="#666" />
                    </View>
                  </TouchableOpacity>
                    );
                  })}
              </View>
            )}
          </View>

            {/* Image Modal */}
            <Modal visible={modalVisible} transparent onRequestClose={() => setModalVisible(false)}>
              <View style={styles.modalBackdrop}>
                <Image
                  source={{ uri: selectedImage || "" }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
                <Pressable onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                  <Text>Close</Text>
                </Pressable>
              </View>
            </Modal>
            
            {/* Document Viewer Modal */}
            <Modal 
              visible={docModalVisible} 
              animationType="slide"
              onRequestClose={() => setDocModalVisible(false)}
            >
              <View style={styles.docModalContainer}>
                {/* Header */}
                <View style={styles.docModalHeader}>
                  <View style={styles.docModalHeaderLeft}>
                    <FileText size={24} color="#9B084D" />
                    <Text style={styles.docModalTitle} numberOfLines={1}>
                      {selectedDoc?.name || 'Document'}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => setDocModalVisible(false)}
                    style={styles.docModalCloseBtn}
                  >
                    <X size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                
                {/* Document Content */}
                <View style={styles.docModalContent}>
                  {selectedDoc?.url ? (
                    // Use iframe for web platform
                    Platform.OS === 'web' ? (
                      <iframe
                        src={selectedDoc.url}
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        title={selectedDoc.name || 'Document'}
                      />
                    ) : (
                      // Use WebView for native platforms
                      selectedDoc.url.startsWith('data:') ? (
                        // For base64 PDFs/images
                        selectedDoc.url.includes('application/pdf') ? (
                          WebView ? (
                            <WebView
                              source={{ 
                                html: `
                                  <!DOCTYPE html>
                                  <html>
                                  <head>
                                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                    <style>
                                      body { margin: 0; padding: 0; background: #f5f5f5; }
                                      .container { width: 100vw; height: 100vh; }
                                    </style>
                                  </head>
                                  <body>
                                    <div class="container">
                                      <embed src="${selectedDoc.url}" type="application/pdf" width="100%" height="100%" />
                                    </div>
                                  </body>
                                  </html>
                                `
                              }}
                              style={styles.webView}
                              javaScriptEnabled={true}
                              originWhitelist={['*']}
                            />
                          ) : (
                            <View style={styles.docError}>
                              <FileText size={48} color="#9B084D" />
                              <Text style={styles.docErrorText}>Use "Open in Browser" to view this document</Text>
                            </View>
                          )
                        ) : (
                          // For base64 images
                          <Image 
                            source={{ uri: selectedDoc.url }} 
                            style={styles.docImage}
                            resizeMode="contain"
                          />
                        )
                      ) : (
                        // For regular URLs on native
                        WebView ? (
                          <WebView
                            source={{ uri: selectedDoc.url }}
                            style={styles.webView}
                            javaScriptEnabled={true}
                          />
                        ) : (
                          <View style={styles.docError}>
                            <FileText size={48} color="#9B084D" />
                            <Text style={styles.docErrorText}>Use "Open in Browser" to view this document</Text>
                          </View>
                        )
                      )
                    )
                  ) : (
                    <View style={styles.docError}>
                      <AlertCircle size={48} color="#dc3545" />
                      <Text style={styles.docErrorText}>Unable to load document</Text>
                    </View>
                  )}
                </View>
                
                {/* Footer with info */}
                <View style={styles.docModalFooter}>
                  <Text style={styles.docModalFooterText}>
                    Uploaded: {selectedDoc?.date || 'Unknown'}
                  </Text>
                  <TouchableOpacity 
                    style={styles.openExternalBtn}
                    onPress={() => {
                      if (selectedDoc?.url) {
                        // For data URLs, we need to handle them differently
                        if (selectedDoc.url.startsWith('data:')) {
                          // Create a link element to download
                          if (Platform.OS === 'web') {
                            const link = document.createElement('a');
                            link.href = selectedDoc.url;
                            link.download = selectedDoc.name || 'document';
                            link.click();
                          } else {
                            Alert.alert('Info', 'Document is embedded in the app');
                          }
                        } else {
                          Linking.openURL(selectedDoc.url);
                        }
                      }
                    }}
                  >
                    <Download size={16} color="#fff" />
                    <Text style={styles.openExternalText}>
                      {selectedDoc?.url?.startsWith('data:') ? 'Download' : 'Open in Browser'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
        </ScrollView>
      </View>
    </View>
  );
}

// -----------------------------
// STYLES
// -----------------------------
const styles = StyleSheet.create({
  mainPage: {
    flex: 1,
    flexDirection: "row",
    padding: 16,
    gap: 20,
    backgroundColor: "#FAFAFA",
  },

  leftPanel: {
    width: "30%",
  },
  rightPanel: {
    width: "70%",
  },

  /* PROFILE CARD */
  profileCard: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EEE",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 80,
    alignSelf: "center",
    borderWidth: 2,
    borderColor: "#9B084D",
  },
  profileDivider: {
    marginVertical: 14,
    height: 1,
    backgroundColor: "#EEE",
  },
  infoRowBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F3F3",
  },
  infoKey: {
    fontWeight: "700",
    fontSize: 14,
    color: "#9B084D",
    flex: 1,
  },
  infoValue: {
    fontWeight: "500",
    fontSize: 14,
    color: "#333",
    flex: 1,
    textAlign: "right",
  },

  /* RIGHT PANEL */
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    marginRight: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#9B084D",
  },
  addBtn: {
    flexDirection: "row",
    backgroundColor: "#9B084D",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    gap: 8,
  },
  addText: { 
    color: "#fff", 
    fontWeight: "600",
    fontSize: 14,
  },

  // Sort buttons
  sortContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 10,
  },
  sortLabel: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#9B084D",
    backgroundColor: "#fff",
    gap: 4,
  },
  sortBtnActive: {
    backgroundColor: "#9B084D",
  },
  sortBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9B084D",
  },
  sortBtnTextActive: {
    color: "#fff",
  },

  card: {
    overflow: "hidden",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  cardTitle: { fontWeight: "700", fontSize: 16 },
  cardDate: { color: "#777", fontSize: 13 },
  cardBody: { padding: 14, backgroundColor: "#fff" },

  subTitle: {
    marginTop: 10,
    marginBottom: 4,
    color: "#9B084D",
    fontWeight: "700",
    fontSize: 15,
  },
  bold: { fontWeight: "700" },

  finalDiagnosis: {
    backgroundColor: "#FFE4EF",
    padding: 8,
    marginTop: 6,
    borderRadius: 6,
    fontWeight: "700",
  },

  galleryContainer: {
    marginTop: 20,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  photoCard: {
    width: 110,
    marginBottom: 8,
  },
  photoInfo: {
    marginTop: 4,
  },
  photoTag: {
    fontSize: 11,
    color: "#9B084D",
    fontWeight: "600",
  },
  photoDate: {
    fontSize: 10,
    color: "#666",
  },
  photoVisit: {
    fontSize: 10,
    color: "#9B084D",
    fontWeight: "600",
  },
  emptyGallery: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    color: "#666",
    fontStyle: "italic",
    fontSize: 14,
  },
  emptySubText: {
    color: "#999",
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
  labsList: {
    gap: 8,
  },
  labItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  labIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#fce7f3",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  labInfo: {
    flex: 1,
  },
  labName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  labDate: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  album: { marginBottom: 20 },
  albumLabel: { fontWeight: "700", marginBottom: 8, fontSize: 15 },
  albumImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EEE",
  },

  primaryBtn: {
    flexDirection: "row",
    backgroundColor: "#9B084D",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryText: { color: "#fff", marginLeft: 6 },
  secondaryBtn: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#DDD",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  secondaryText: { marginLeft: 6, color: "#444" },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: 320,
    height: 320,
    borderRadius: 12,
  },
  modalCloseBtn: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
  },  
  // Lab item action button
  labAction: {
    padding: 8,
  },
  
  // Document Modal styles
  docModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  docModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fafafa',
  },
  docModalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  docModalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  docModalCloseBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  docModalContent: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  webView: {
    flex: 1,
  },
  docImage: {
    flex: 1,
    width: '100%',
  },
  docError: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  docErrorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  docModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fafafa',
  },
  docModalFooterText: {
    fontSize: 13,
    color: '#666',
  },
  openExternalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9B084D',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  openExternalText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
  
  // Edit mode styles
  editButtonContainer: {
    marginBottom: 12,
  },
  editButtonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  editModeButton: {
    backgroundColor: '#fce7f3',
    borderWidth: 1,
    borderColor: '#9B084D',
  },
  editModeButtonText: {
    color: '#9B084D',
    fontWeight: '600',
    marginLeft: 6,
  },
  saveButton: {
    backgroundColor: '#9B084D',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '500',
    marginLeft: 6,
  },
  
  // Edit input styles
  editInput: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    color: '#333',
  },
  editTextArea: {
    width: '100%',
    minHeight: 60,
    textAlignVertical: 'top',
    marginTop: 6,
  },
  
  // Editable list styles
  editableList: {
    width: '100%',
    marginTop: 6,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fce7f3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  chipText: {
    fontSize: 13,
    color: '#9B084D',
  },
  
  // Add item container
  addItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addItemInput: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
  },
  addItemButton: {
    padding: 4,
  },
  
  // Dropdown styles
  dropdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemNew: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fce7f3',
  },
  dropdownText: {
    fontSize: 14,
    color: '#333',
  },
  dropdownTextNew: {
    fontSize: 14,
    color: '#9B084D',
    fontWeight: '500',
  },
});