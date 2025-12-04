// App.tsx — CLEAN, EXPO READY, PART 1
import React, { useState, useRef, useEffect } from "react";
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
  Pressable,
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";
import { Swipeable } from "react-native-gesture-handler";

// ------------------- DUMMY DATA -------------------
const dummyMedications = [
  { id: 1, name: "Paracetamol", dose: "500mg", duration: "5 days" },
  { id: 2, name: "Amoxicillin", dose: "250mg", duration: "7 days" },
  { id: 3, name: "Hydrocortisone Cream", dose: "1%", duration: "3 days" },
  { id: 4, name: "Ibuprofen", dose: "200mg", duration: "5 days" },
  { id: 5, name: "Cetirizine", dose: "10mg", duration: "7 days" },
];

// ------------------- UTILS -------------------
const parseNumberFromString = (s?: string) => {
  if (!s) return 0;
  const m = s.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
};

// ------------------- PATIENT INFO BAR -------------------
const PatientInfoBar = ({
  patientName,
  patientId,
  activeService,
}: {
  patientName: string;
  patientId: string;
  activeService: "DIAGNOSIS" | "LASER";
}) => (
  <View style={styles.patientInfoBar}>
    <View style={styles.patientInfoLeft}>
      <Image
        style={styles.patientAvatar}
        source={{ uri: "https://placehold.co/48x48" }}
      />
      <View>
        <Text style={styles.patientName}>{patientName}</Text>
        <Text style={styles.patientDetails}>
          ID: {patientId} · Service: {activeService}
        </Text>
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

// ------------------- SERVICE TABS -------------------
const ServiceTabs = ({
  activeService,
  setActiveService,
}: {
  activeService: "DIAGNOSIS" | "LASER";
  setActiveService: (s: "DIAGNOSIS" | "LASER") => void;
}) => (
  <View style={styles.serviceTabs}>
    {["DIAGNOSIS", "LASER"].map((service) => (
      <TouchableOpacity
        key={service}
        style={[styles.tab, activeService === service && styles.tabActive]}
        onPress={() => setActiveService(service as "DIAGNOSIS" | "LASER")}
      >
        <Text
          style={[
            styles.tabText,
            activeService === service && styles.tabTextActive,
          ]}
        >
          {service === "DIAGNOSIS" ? "Diagnosis" : "Laser"}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

// ------------------- MEDICATION SELECTOR -------------------
const MedicationSelector = ({
  medications,
  selectedMeds,
  setSelectedMeds,
}: any) => {
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
              <Text
                style={[styles.medName, isSelected && styles.medNameSelected]}
              >
                {med.name} ({med.dose})
              </Text>
              {isSelected && <Text style={styles.medDetailsSelected}>Selected</Text>}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

// ------------------- PRESCRIPTION TABLE ADVANCED -------------------
const PrescriptionTableAdvanced = ({ selectedMeds, setSelectedMeds, patient }: any) => {
  const [expandedMap, setExpandedMap] = useState<Record<number, boolean>>({});
  const animHeights = useRef<Record<number, Animated.Value>>({}).current;
  const swipeRefs: Record<number, any> = {};

  const [sortBy, setSortBy] = useState<"name" | "dose" | "duration">("name");
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    selectedMeds.forEach((m: any) => {
      if (!animHeights[m.id]) animHeights[m.id] = new Animated.Value(0);
    });
  }, [selectedMeds]);

  const toggleExpand = (id: number) => {
    const current = !!expandedMap[id];
    setExpandedMap((s) => ({ ...s, [id]: !current }));

    if (!animHeights[id]) animHeights[id] = new Animated.Value(0);

    Animated.timing(animHeights[id], {
      toValue: current ? 0 : 1,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  };

  const onRemove = (med: any) => {
    const ref = swipeRefs[med.id];
    if (ref && ref.close) try { ref.close(); } catch {}
    setSelectedMeds((s: any[]) => s.filter((x) => x.id !== med.id));
  };

  const updateNotes = (id: number, notes: string) => {
    setSelectedMeds((s: any[]) =>
      s.map((m) => (m.id === id ? { ...m, notes } : m))
    );
  };

  const renderRightActions = (med: any) => (
    <TouchableOpacity style={styles.swipeDelete} onPress={() => onRemove(med)}>
      <Ionicons name="trash" size={20} color="#fff" />
      <Text style={{ color: "#fff", marginTop: 4 }}>Delete</Text>
    </TouchableOpacity>
  );

  // Sorting logic
  const sortedMeds = [...selectedMeds].sort((a: any, b: any) => {
    let cmp = 0;
    if (sortBy === "name") cmp = a.name.localeCompare(b.name);
    if (sortBy === "dose") cmp = parseNumberFromString(a.dose) - parseNumberFromString(b.dose);
    if (sortBy === "duration") cmp = parseNumberFromString(a.duration) - parseNumberFromString(b.duration);
    return sortAsc ? cmp : -cmp;
  });

  // Export to PDF
  const exportToPDF = async () => {
    if (selectedMeds.length === 0) {
      Alert.alert("Nothing to export", "Select at least one medication.");
      return;
    }

    const rowsHtml = selectedMeds
      .map((m: any) => `<tr>
        <td style="padding:8px;border:1px solid #ddd;">${m.name}</td>
        <td style="padding:8px;border:1px solid #ddd;">${m.dose}</td>
        <td style="padding:8px;border:1px solid #ddd;">${m.duration}</td>
        <td style="padding:8px;border:1px solid #ddd;">${m.notes || ""}</td>
      </tr>`).join("");

    const html = `
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <style>
          body{ font-family: Arial, sans-serif; padding:16px; color:#111827 }
          h2{ color:#be185d }
          table{ border-collapse: collapse; width:100%; margin-top:12px }
          th{ text-align:left; padding:8px; background:#fce7f3; border:1px solid #eee }
          td{ padding:8px; border:1px solid #eee }
        </style>
      </head>
      <body>
        <h2>Prescription</h2>
        <p><strong>Patient:</strong> ${patient.name} (ID: ${patient.id})</p>
        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr>
              <th>Medication</th><th>Dose</th><th>Duration</th><th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (err: any) {
      Alert.alert("Export failed", err?.message || "Unknown error");
    }
  };

  return (
    <View style={styles.tableWrapper}>
      <View style={styles.tableHeaderRow}>
        <Text style={styles.tableTitle}>Prescription</Text>
        <View style={styles.sortControls}>
          {["name","dose","duration"].map((key) => (
            <TouchableOpacity
              key={key}
              style={[styles.sortBtn, sortBy===key && styles.sortBtnActive]}
              onPress={() => { if(sortBy===key) setSortAsc(!sortAsc); else { setSortBy(key as "name" | "dose" | "duration"); setSortAsc(true); } }}
            >
              <Text style={styles.sortBtnText}>{key.toUpperCase()} {sortBy===key?(sortAsc?"↑":"↓"):""}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.exportBtn} onPress={exportToPDF}>
            <Ionicons name="download-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {sortedMeds.length===0 && <Text style={styles.noItems}>No medications selected.</Text>}

      {sortedMeds.map((med:any)=>{
        const expanded = !!expandedMap[med.id];
        const anim = animHeights[med.id] || new Animated.Value(expanded?1:0);
        const animatedHeight = anim.interpolate({ inputRange:[0,1], outputRange:[0,110] });

        return (
          <Swipeable
            key={med.id}
            ref={r=>{if(r) swipeRefs[med.id]=r;}}
            renderRightActions={()=>renderRightActions(med)}
            overshootRight={false}
          >
            <TouchableOpacity style={styles.tableRowModern} activeOpacity={0.8} onPress={()=>toggleExpand(med.id)}>
              <View style={styles.rowLeft}>
                <View style={styles.medIconCircle}>
                  <Ionicons name="medkit" size={16} color="#be185d" />
                </View>
                <View style={{flex:1}}>
                  <View style={{flexDirection:"row", justifyContent:"space-between", alignItems:"center"}}>
                    <Text style={styles.medRowName}>{med.name}</Text>
                    <View style={{flexDirection:"row", alignItems:"center", gap:8}}>
                      <View style={styles.chipPink}><Text style={styles.chipTextPink}>{med.dose}</Text></View>
                      <View style={styles.chipGreen}><Text style={styles.chipTextGreen}>{med.duration}</Text></View>
                    </View>
                  </View>

                  <Animated.View style={{height:animatedHeight, overflow:"hidden"}}>
                    <View style={styles.expandContent}>
                      <TextInput
                        style={styles.noteInput}
                        placeholder="Doctor notes (take after meals, etc.)"
                        value={med.notes}
                        onChangeText={t=>updateNotes(med.id,t)}
                        multiline
                      />
                    </View>
                  </Animated.View>
                </View>
              </View>
            </TouchableOpacity>
          </Swipeable>
        )
      })}
    </View>
  );
};

// ------------------- NORMAL / DIAGNOSIS VIEW -------------------
const NormalView = ({ patientId }: { patientId: string }) => {
  const [diagnosis, setDiagnosis] = useState("");
  const [prescriptionNote, setPrescriptionNote] = useState("");
  const [selectedMeds, setSelectedMeds] = useState<any[]>([]);
  const [saveMessage, setSaveMessage] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const patient = { id: patientId, name: "John Doe" };

  const handleSave = () => {
    setSaveMessage("Diagnosis & Prescription saved!");
    setTimeout(() => setSaveMessage(""), 2500);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
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
            placeholder="Enter prescription notes..."
            value={prescriptionNote}
            onChangeText={setPrescriptionNote}
            multiline
          />
        </View>

        <MedicationSelector
          medications={dummyMedications}
          selectedMeds={selectedMeds}
          setSelectedMeds={setSelectedMeds}
        />

        <PrescriptionTableAdvanced
          selectedMeds={selectedMeds}
          setSelectedMeds={setSelectedMeds}
          patient={patient}
        />

        <TouchableOpacity style={styles.mainSaveButton} onPress={handleSave}>
          <Text style={styles.mainSaveText}>Save Diagnosis & Prescription</Text>
        </TouchableOpacity>

        {saveMessage ? (
          <Text style={styles.saveMessageText}>{saveMessage}</Text>
        ) : null}
      </View>

      <View style={styles.normalRight}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Patient Photos</Text>
          <TouchableOpacity onPress={pickImage}>
            <Image
              style={styles.photo}
              source={{
                uri:
                  photoUri ||
                  "https://placehold.co/300x200/F0F0F0/334155?text=Upload+Photo",
              }}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// ------------------- LASER VIEW -------------------
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

// ------------------- MAIN APP -------------------
export default function App() {
  const [activeService, setActiveService] = useState<"DIAGNOSIS" | "LASER">(
    "DIAGNOSIS"
  );
  const patientData = { id: "12345", name: "John Doe" };

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
          <ServiceTabs
            activeService={activeService}
            setActiveService={setActiveService}
          />
          {activeService === "LASER" ? (
            <LaserView />
          ) : (
            <NormalView patientId={patientData.id} />
          )}
        </ScrollView>

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
  container: { flex: 1, flexDirection: "row", backgroundColor: "#f9fafb" },
  sidebar: { width: 80, backgroundColor: "#be185d" },
  mainArea: { flex: 1, padding: 16 },
  contentScroll: { flex: 1 },

  // Patient info
  patientInfoBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: "#be185d" },
  patientInfoLeft: { flexDirection: "row", alignItems: "center" },
  patientAvatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12, backgroundColor: "#fce7f3" },
  patientName: { fontSize: 16, fontWeight: "bold", color: "#111827" },
  patientDetails: { fontSize: 12, color: "#6b7280" },
  patientInfoRight: { flexDirection: "row", alignItems: "center" },
  sessionBadge: { backgroundColor: "#fce7f3", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 8 },
  sessionText: { fontSize: 12, color: "#be185d", fontWeight: "bold" },
  completedBadge: { backgroundColor: "#dcfce7", flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 8 },
  completedText: { fontSize: 12, color: "#15803d", fontWeight: "bold", marginLeft: 4 },
  editButton: { padding: 4 },

  // Tabs
  serviceTabs: { flexDirection: "row", backgroundColor: "#f3f4f6", borderRadius: 12, marginBottom: 16 },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 12 },
  tabActive: { backgroundColor: "#be185d" },
  tabText: { fontSize: 12, fontWeight: "600", color: "#374151" },
  tabTextActive: { color: "white" },

  // Cards
  card: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: "#e5e7eb" },
  cardTitle: { fontWeight: "bold", fontSize: 14, color: "#be185d", marginBottom: 8 },

  // Laser layout
  laserContainer: { flexDirection: "row", gap: 16 },
  laserLeft: { flex: 2 },
  laserRight: { flex: 1 },
  pinkCard: { backgroundColor: "#fce7f3", borderColor: "#f9a8d4" },

  // Diagnosis layout
  normalContainer: { flexDirection: "row", gap: 16 },
  normalLeft: { flex: 2 },
  normalRight: { flex: 1 },
  patientId: { fontWeight: "bold", marginBottom: 8 },
  input: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 8, marginBottom: 12 },
  textarea: { minHeight: 80, textAlignVertical: "top" },

  // Med selector
  medSelector: { marginBottom: 16 },
  medLabel: { fontWeight: "bold", marginBottom: 8 },
  searchInput: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 8, marginBottom: 12 },
  medList: { maxHeight: 150 },
  medItem: { flexDirection: "row", justifyContent: "space-between", padding: 8, borderRadius: 8, marginBottom: 4 },
  medItemSelected: { backgroundColor: "#be185d" },
  medName: { fontWeight: "600" },
  medNameSelected: { color: "white" },
  medDetailsSelected: { color: "#fce7f3" },

  // Table + Prescription
  tableWrapper: { backgroundColor: "#fff", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#e5e7eb", marginBottom: 16 },
  tableHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  tableTitle: { fontWeight: "bold", fontSize: 16, color: "#be185d" },
  sortControls: { flexDirection: "row", alignItems: "center", gap: 8 },
  sortBtn: { backgroundColor: "#f3f4f6", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginRight: 6 },
  sortBtnActive: { backgroundColor: "#fde4ef" },
  sortBtnText: { fontSize: 12, color: "#374151", fontWeight: "600" },
  exportBtn: { backgroundColor: "#7e22ce", padding: 8, borderRadius: 8, marginLeft: 6 },

  tableRowModern: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingVertical: 12, paddingHorizontal: 6, backgroundColor: "#faf5ff", borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: "#f3e8ff" },
  rowLeft: { flexDirection: "row", alignItems: "flex-start", flex: 1, gap: 12 },
  medIconCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#fce7f3", alignItems: "center", justifyContent: "center", marginTop: 2 },
  medRowName: { fontSize: 14, fontWeight: "bold", color: "#7e22ce", marginBottom: 6 },
  chipPink: { backgroundColor: "#fdf2f8", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  chipTextPink: { color: "#be185d", fontWeight: "600", fontSize: 12 },
  chipGreen: { backgroundColor: "#ecfdf5", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  chipTextGreen: { color: "#15803d", fontWeight: "600", fontSize: 12 },

  deleteBtnInline: { paddingHorizontal: 8, paddingVertical: 4, marginLeft: 8 },
  swipeDelete: { backgroundColor: "#dc2626", justifyContent: "center", alignItems: "center", width: 88, marginVertical: 8, borderRadius: 8 },

  expandContent: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#f3f4f6" },
  noteInput: { borderWidth: 1, borderColor: "#e6e6e6", borderRadius: 8, padding: 8, minHeight: 48, backgroundColor: "#fff" },
  rowActions: { flexDirection: "row", justifyContent: "flex-end", marginTop: 8, gap: 8 },
  smallBtn: { backgroundColor: "#be185d", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  smallBtnText: { color: "#fff", fontWeight: "700" },

  noItems: { textAlign: "center", paddingVertical: 12, color: "#6b7280", fontStyle: "italic" },

  mainSaveButton: { backgroundColor: "#be185d", padding: 12, borderRadius: 8, alignItems: "center", marginBottom: 8 },
  mainSaveText: { color: "#fff", fontWeight: "bold" },
  saveMessageText: { color: "#15803d", marginBottom: 16 },

  photo: { width: "100%", height: 150, borderRadius: 8 },

  bottomBar: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#e5e7eb" },
  setAppointmentButton: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#fff", borderRadius: 8, marginRight: 12, borderWidth: 1, borderColor: "#be185d" },
  setAppointmentText: { color: "#be185d", fontWeight: "bold", marginLeft: 8 },
  completeVisitButton: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#15803d", borderRadius: 8 },
  completeVisitText: { color: "#fff", fontWeight: "bold", marginLeft: 8 },
});
