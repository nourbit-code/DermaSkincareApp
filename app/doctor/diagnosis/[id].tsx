// FULL (Expo) — FIXED SCROLLING, SORTING, NOTES & LABS
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  TextInput,
  Image,
  StyleSheet,
  Alert,
  Animated,
  Easing,
  Platform,
  Modal,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  KeyboardAvoidingView,
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { Swipeable } from "react-native-gesture-handler";

// ------------------- 1. DESIGN SYSTEM -------------------
const THEME = {
  primary: "#be185d", // Pink-700
  primaryLight: "#fce7f3", 
  secondary: "#0f172a", // Slate-900
  accentBlue: "#0284c7", // Sky-600 (For Labs)
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

// ------------------- 2. DATA (Egyptian Context) -------------------
const DIAGNOSIS_TEMPLATES = [
  "Acne Vulgaris", "Melasma", "Alopecia Areata", "Tinea Capitis", "Psoriasis", "Eczema", "Vitiligo"
];

const dummyMedications = [
  { id: 1, name: "Panadol (Paracetamol)", dose: "500mg", duration: "5 days" },
  { id: 2, name: "Augmentin", dose: "1g", duration: "7 days" },
  { id: 3, name: "Fucidin Cream", dose: "2%", duration: "3 days" },
  { id: 4, name: "Brufen", dose: "400mg", duration: "As needed" },
  { id: 5, name: "Zyrtec", dose: "10mg", duration: "7 days" },
  { id: 6, name: "Roaccutane", dose: "20mg", duration: "30 days" },
  { id: 7, name: "Doxycycline", dose: "100mg", duration: "14 days" },
  { id: 8, name: "Differin Gel", dose: "0.1%", duration: "Nightly" },
];

const storageKeyForPatient = (patientId: string) => `patient_${patientId}_v4_data`;

// ------------------- 3. UTILS -------------------
const SectionHeader = ({ icon, title, action, color = THEME.primary }: any) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[styles.sectionTitle, { color: THEME.secondary }]}>{title}</Text>
    </View>
    {action && action}
  </View>
);

// ------------------- 4. CORE COMPONENTS -------------------

// --- PATIENT INFO BAR ---
const PatientInfoBar = ({ patientName, patientId, activeService }: any) => (
  <View style={styles.patientBar}>
    <View style={styles.patientLeft}>
      <Image source={{ uri: "https://placehold.co/100" }} style={styles.patientAvatar} />
      <View>
        <Text style={styles.patientName}>{patientName}</Text>
        <View style={styles.idBadge}>
            <Text style={styles.idText}>ID: {patientId}</Text>
            <Text style={styles.divider}>•</Text>
            <Text style={styles.idText}>{activeService}</Text>
        </View>
      </View>
    </View>
    <View style={styles.patientRight}>
      <View style={styles.statusBadge}>
        <Ionicons name="ellipse" size={8} color={THEME.success} style={{marginRight:6}} />
        <Text style={styles.statusText}>Active Session</Text>
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
      setSelectedMeds([...selectedMeds, { ...med, notes: "" }]);
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
              <Ionicons name={isSelected ? "checkmark-circle" : "add-circle-outline"} size={22} color={isSelected ? THEME.white : THEME.textLight} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

// --- PRESCRIPTION TABLE ---
const PrescriptionTableAdvanced = ({ selectedMeds, setSelectedMeds, patient, photos, labs, rxNotes }: any) => {
  const [expandedMap, setExpandedMap] = useState<Record<number, boolean>>({});
  const [exporting, setExporting] = useState(false);

  const toggleExpand = (id: number) => setExpandedMap((s) => ({ ...s, [id]: !s[id] }));
  const updateNotes = (id: number, notes: string) => setSelectedMeds((s: any[]) => s.map((m) => (m.id === id ? { ...m, notes } : m)));
  const removeMed = (id: number) => setSelectedMeds((s: any[]) => s.filter((x) => x.id !== id));

  // PDF EXPORT
  const exportToPDF = async () => {
    setExporting(true);
    // 1. Build Med Rows
    const rowsHtml = selectedMeds.map((m: any) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding:10px;"><strong>${m.name}</strong></td>
        <td style="padding:10px;">${m.dose}</td>
        <td style="padding:10px;">${m.duration}</td>
        <td style="padding:10px; color:#666; font-style:italic;">${m.notes || ""}</td>
      </tr>`).join("");

    // 2. Build Photo Grid
    let photoHtml = "";
    if (photos && photos.length > 0) {
        photoHtml = `<h3>Clinical Photos</h3><div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">`;
        for (let p of photos) {
            const b64 = await FileSystem.readAsStringAsync(p.uri, { encoding: "base64" });
            photoHtml += `<div style="border:1px solid #ddd; padding:5px; border-radius:8px;"><img src="data:image/jpeg;base64,${b64}" style="width:100%; height:180px; object-fit:cover;" /><div style="font-size:10px; margin-top:5px;">${p.tag} • ${p.timestamp}</div></div>`;
        }
        photoHtml += `</div>`;
    }

    // 3. Build Labs Grid
    let labHtml = "";
    if (labs && labs.length > 0) {
        labHtml = `<h3>Lab Tests & Scans</h3><div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">`;
        for (let l of labs) {
            const b64 = await FileSystem.readAsStringAsync(l.uri, { encoding: "base64" });
            labHtml += `<div style="border:1px solid #bae6fd; padding:5px; border-radius:8px;"><img src="data:image/jpeg;base64,${b64}" style="width:100%; height:180px; object-fit:contain;" /><div style="font-size:10px; margin-top:5px;">${l.name} • ${l.timestamp}</div></div>`;
        }
        labHtml += `</div>`;
    }

    const html = `
      <html>
      <body style="font-family: Helvetica; padding: 40px; color: #1e293b;">
        <div style="border-bottom: 2px solid #be185d; padding-bottom: 20px; margin-bottom: 20px; display:flex; justify-content:space-between;">
          <div><h1 style="color: #be185d; margin:0;">Medical Report</h1><p style="margin:5px 0; color:#64748b;">Dr. Dermatology Clinic</p></div>
          <div style="text-align:right;"><p><strong>Patient:</strong> ${patient.name}</p><p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p></div>
        </div>
        
        ${rxNotes ? `<div style="background:#f8fafc; padding:15px; border-radius:8px; margin-bottom:20px;"><strong>General Notes:</strong><br/>${rxNotes}</div>` : ''}

        <h3>Prescription</h3>
        <table style="width:100%; border-collapse: collapse; margin-bottom:20px;">
          <thead style="background:#fce7f3; color:#831843;"><tr><th style="padding:10px; text-align:left;">Drug</th><th style="padding:10px; text-align:left;">Dose</th><th style="padding:10px; text-align:left;">Duration</th><th style="padding:10px; text-align:left;">Note</th></tr></thead>
          <tbody>${rowsHtml || '<tr><td colspan="4" style="padding:10px;">No medications</td></tr>'}</tbody>
        </table>
        
        ${photoHtml}
        ${labHtml}
      </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (err) { Alert.alert("Error", "PDF Generation failed"); } 
    finally { setExporting(false); }
  };

  return (
    <View style={styles.card}>
      <View style={styles.tableHeaderRow}>
        <SectionHeader icon="clipboard" title={`Prescription (${selectedMeds.length})`} />
        <TouchableOpacity onPress={exportToPDF} style={styles.exportBtn} disabled={exporting}>
          {exporting ? <ActivityIndicator color="#fff" size="small"/> : <Ionicons name="print" size={16} color="#fff" />}
          <Text style={styles.exportText}>Print PDF</Text>
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
                <Text style={styles.rowDetail}>{med.dose} • {med.duration}</Text>
              </View>
              <Ionicons name={expandedMap[med.id] ? "chevron-up" : "chevron-down"} size={16} color={THEME.textLight} />
            </TouchableOpacity>
            {expandedMap[med.id] && (
              <View style={styles.rowExpanded}>
                <TextInput style={styles.notesInput} placeholder="Specific instructions for this drug..." value={med.notes} onChangeText={(t) => updateNotes(med.id, t)} />
              </View>
            )}
          </View>
        </Swipeable>
      ))}
    </View>
  );
};

// ------------------- 5. MAIN LOGIC -------------------

const NormalView = ({ patientId }: { patientId: string }) => {
  // Clinical Data
  const [diagnosis, setDiagnosis] = useState("");
  const [rxNotes, setRxNotes] = useState(""); // Prescription Notes (Restored)
  const [selectedMeds, setSelectedMeds] = useState<any[]>([]);
  
  // Media Data
  const [photos, setPhotos] = useState<any[]>([]);
  const [labs, setLabs] = useState<any[]>([]); // New Feature: Lab Tests
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [photoSortNewest, setPhotoSortNewest] = useState(true); // Sort Restored
  
  // Modals
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);
  
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerImg, setViewerImg] = useState<string>("");

  const patient = { id: patientId, name: "Nada Ali" };

  // Load/Save
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
        }
      } catch (e) {} finally { setLoading(false); }
    })();
  }, [patientId]);

  const saveData = async () => {
      const data = { photos, labs, diagnosis, rxNotes }; // Save everything
      await AsyncStorage.setItem(storageKeyForPatient(patientId), JSON.stringify(data));
      Alert.alert("Saved", "Patient visit data updated.");
  };

  // --- PHOTO LOGIC ---
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
    setPhotos(prev => [...prev, { id: Date.now().toString(), uri: pendingPhotoUri, tag, timestamp, caption: "" }]);
    setTagModalVisible(false);
  };
  const deletePhoto = (id: string) => setPhotos(p => p.filter(x => x.id !== id));
  
  // Sorting Photos
  const displayedPhotos = [...photos].sort((a, b) => {
      const tA = new Date(a.id).getTime(); // using ID as rough timestamp for sort
      const tB = new Date(b.id).getTime();
      return photoSortNewest ? tB - tA : tA - tB;
  });

  // --- LABS LOGIC (New Feature) ---
  const pickLab = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1 });
    if (!r.canceled && r.assets[0].uri) {
        const timestamp = new Date().toLocaleString('en-EG');
        setLabs(prev => [...prev, { id: Date.now().toString(), uri: r.assets[0].uri, name: "Lab/Scan", timestamp }]);
    }
  };
  const deleteLab = (id: string) => setLabs(l => l.filter(x => x.id !== id));

  if (loading) return <ActivityIndicator color={THEME.primary} size="large" style={{flex:1}} />;

  return (
    <View style={styles.splitViewContainer}>
      
      {/* LEFT COLUMN: Clinical (SCROLLABLE) */}
      <ScrollView 
        style={styles.columnScroll} 
        contentContainerStyle={{paddingBottom: 40}}
        showsVerticalScrollIndicator={false}
      >
        {/* Diagnosis */}
        <View style={styles.card}>
          <SectionHeader icon="medical" title="Clinical Diagnosis" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {DIAGNOSIS_TEMPLATES.map(t => (
                <TouchableOpacity key={t} style={styles.templateChip} onPress={() => setDiagnosis(prev => prev ? prev + ", " + t : t)}>
                    <Text style={styles.templateChipText}>+ {t}</Text>
                </TouchableOpacity>
            ))}
          </ScrollView>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Type diagnosis..."
            value={diagnosis}
            onChangeText={setDiagnosis}
            multiline
          />
        </View>

        {/* Prescription Notes (RESTORED) */}
        <View style={styles.card}>
            <SectionHeader icon="create" title="Prescription Notes & Instructions" />
            <TextInput
                style={[styles.input, styles.textarea, {height: 60}]}
                placeholder="e.g., Avoid sun exposure, drink water, apply cream at night..."
                value={rxNotes}
                onChangeText={setRxNotes}
                multiline
            />
        </View>

        {/* Meds */}
        <MedicationSelector 
            medications={dummyMedications} 
            selectedMeds={selectedMeds} 
            setSelectedMeds={setSelectedMeds} 
        />
        <PrescriptionTableAdvanced
            selectedMeds={selectedMeds}
            setSelectedMeds={setSelectedMeds}
            patient={patient}
            photos={photos}
            labs={labs}
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
                     {/* Sort Button (RESTORED) */}
                     <TouchableOpacity 
                        style={styles.outlineBtn}
                        onPress={() => setPhotoSortNewest(!photoSortNewest)}
                     >
                        <Ionicons name="swap-vertical" size={14} color={THEME.text} />
                        <Text style={styles.outlineBtnText}>{photoSortNewest ? "Newest" : "Oldest"}</Text>
                     </TouchableOpacity>
                     
                     <TouchableOpacity onPress={pickPhoto} style={styles.iconBtn}>
                         <Ionicons name="add" size={20} color={THEME.white} />
                     </TouchableOpacity>
                 </View>
            </View>

            <View style={styles.photoGrid}>
                {displayedPhotos.length === 0 && (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No photos.</Text>
                    </View>
                )}
                {displayedPhotos.map((p) => (
                    <View key={p.id} style={styles.photoCard}>
                         <TouchableOpacity onPress={() => { setViewerImg(p.uri); setViewerVisible(true); }}>
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

        {/* LAB TESTS SECTION (NEW FEATURE) */}
        <View style={[styles.card, { borderColor: THEME.accentBlueLight, borderWidth:1 }]}>
            <View style={styles.headerRow}>
                 <SectionHeader icon="document-text" title={`Lab Tests & Scans (${labs.length})`} color={THEME.accentBlue} />
                 <TouchableOpacity onPress={pickLab} style={[styles.iconBtn, {backgroundColor: THEME.accentBlue}]}>
                     <Ionicons name="cloud-upload" size={18} color={THEME.white} />
                 </TouchableOpacity>
            </View>
            
            <View style={styles.photoGrid}>
                 {labs.length === 0 && <Text style={styles.emptyText}>No labs uploaded.</Text>}
                 {labs.map((l) => (
                    <View key={l.id} style={[styles.photoCard, { borderColor: THEME.accentBlueLight }]}>
                         <TouchableOpacity onPress={() => { setViewerImg(l.uri); setViewerVisible(true); }}>
                             <Image source={{ uri: l.uri }} style={[styles.photoImg, {resizeMode:'contain', backgroundColor:'#f0f9ff'}]} />
                         </TouchableOpacity>
                         <TouchableOpacity style={[styles.deleteMini, {backgroundColor: THEME.accentBlue}]} onPress={() => deleteLab(l.id)}>
                             <Ionicons name="close" size={10} color="#fff" />
                         </TouchableOpacity>
                         <View style={styles.photoFooter}>
                             <Text style={styles.timestampText}>Scan • {l.timestamp}</Text>
                         </View>
                    </View>
                 ))}
            </View>
        </View>
      </ScrollView>

      {/* MODALS */}
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

      <Modal visible={viewerVisible} transparent={true} onRequestClose={() => setViewerVisible(false)}>
         <View style={styles.viewerContainer}>
             <TouchableOpacity style={styles.viewerClose} onPress={() => setViewerVisible(false)}>
                 <Ionicons name="close-circle" size={40} color="#fff" />
             </TouchableOpacity>
             <Image source={{ uri: viewerImg }} style={styles.viewerImage} resizeMode="contain" />
         </View>
      </Modal>

    </View>
  );
};

// ------------------- 6. MAIN APP ENTRY -------------------
export default function App() {
  const [activeService, setActiveService] = useState("DIAGNOSIS");
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.mainContent}>
        <PatientInfoBar patientName="Nada Ali" patientId="EG-9921" activeService={activeService} />
        <ServiceTabs activeService={activeService} setActiveService={setActiveService} />
        {activeService === "LASER" ? (
             <View style={[styles.card, {flex:1, justifyContent:'center', alignItems:'center'}]}><Text>Laser Module</Text></View>
        ) : (
             <NormalView patientId="EG-9921" />
        )}
      </View>
    </View>
  );
}

// ------------------- 7. STYLES -------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  mainContent: { flex: 1, padding: 16 },

  // Patient & Tabs
  patientBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: THEME.white, padding: 12, borderRadius: THEME.radius, marginBottom: 12, ...THEME.shadow },
  patientLeft: { flexDirection: 'row', alignItems: 'center' },
  patientRight: { flexDirection: 'row', alignItems: 'center' }, // <-- Added missing style
  patientAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: THEME.primaryLight, marginRight: 10 },
  patientName: { fontSize: 16, fontWeight: 'bold', color: THEME.secondary },
  idBadge: { flexDirection: 'row', alignItems: 'center' },
  idText: { fontSize: 12, color: THEME.textLight },
  divider: { marginHorizontal: 6, color: THEME.border },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, color: '#166534', fontWeight: 'bold' },
  
  tabContainer: { flexDirection: 'row', backgroundColor: '#e2e8f0', padding: 4, borderRadius: THEME.radius, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: THEME.white, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2 },
  tabText: { fontSize: 13, fontWeight: '600', color: THEME.textLight },
  tabTextActive: { color: THEME.primary },

  // SPLIT VIEW & SCROLLING (Fixed)
  splitViewContainer: { flex: 1, flexDirection: 'row', gap: 0 }, 
  columnScroll: { flex: 1, paddingRight: 8 }, // Split 50/50 approx, scroll independently

  // Cards & Inputs
  card: { backgroundColor: THEME.white, borderRadius: THEME.radius, padding: 12, marginBottom: 12, ...THEME.shadow },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  headerRow: { flexDirection: 'row', justifyContent:'space-between', alignItems:'center', marginBottom: 10 },
  
  input: { borderWidth: 1, borderColor: THEME.border, borderRadius: 8, padding: 10, fontSize: 14, color: THEME.text, backgroundColor: '#f8fafc', marginTop: 8 },
  textarea: { height: 80, textAlignVertical: 'top' },
  
  // Chips
  templateChip: { backgroundColor: THEME.primaryLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginRight: 6 },
  templateChipText: { color: THEME.primary, fontSize: 11, fontWeight: '600' },

  // Meds & Table
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: THEME.border, borderRadius: 8, paddingHorizontal: 10, marginBottom: 8, marginTop: 8 },
  searchInput: { flex: 1, height: 36 },
  medList: { maxHeight: 120 },
  medItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  medItemSelected: { backgroundColor: THEME.primaryLight },
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
  rowExpanded: { padding: 8, backgroundColor: '#f8fafc' },
  notesInput: { fontSize: 12, color: THEME.text, borderBottomWidth: 1, borderBottomColor: '#cbd5e1' },
  swipeDelete: { backgroundColor: THEME.danger, justifyContent: 'center', alignItems: 'center', width: 60 },
  emptyText: { color: THEME.textLight, fontStyle: 'italic', textAlign: 'center', padding: 10, fontSize: 12 },

  // Photos & Labs
  iconBtn: { backgroundColor: THEME.primary, borderRadius: 20, width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
  outlineBtn: { flexDirection: 'row', alignItems: 'center', padding: 4, borderRadius: 4, borderWidth: 1, borderColor: THEME.border },
  outlineBtnText: { fontSize: 10, marginLeft: 4, color: THEME.text },
  
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoCard: { width: '48%', backgroundColor: '#f8fafc', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: THEME.border, marginBottom: 8 },
  photoImg: { width: '100%', height: 120, resizeMode: 'cover' },
  tagBadge: { position: 'absolute', top: 4, left: 4, backgroundColor: '#f1f5f9', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 },
  tagText: { fontSize: 9, fontWeight: 'bold', color: THEME.text },
  deleteMini: { position: 'absolute', top: 4, right: 4, backgroundColor: THEME.danger, width:18, height:18, borderRadius: 9, justifyContent:'center', alignItems:'center' },
  photoFooter: { padding: 6 },
  timestampText: { fontSize: 9, color: THEME.textLight },

  // empty state for photo grid
  emptyState: { padding: 16, alignItems: 'center', justifyContent: 'center' },

  // Save Btn
  saveBtn: { backgroundColor: THEME.primary, padding: 12, borderRadius: THEME.radius, alignItems: 'center', marginTop: 10, marginBottom: 20, ...THEME.shadow },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', width: 280, padding: 20, borderRadius: 12 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  modalBtns: { flexDirection: 'row', gap: 10 },
  modalBtn: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center' },
  viewerContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center' },
  viewerImage: { width: '100%', height: '80%' },
  viewerClose: { position: 'absolute', top: 40, right: 20, zIndex: 10 },
});