import React, { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import {
  Modal,
  Pressable,
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import PrescriptionTable from "@/components/PrescriptionTable";
import {
  ChevronDown,
  ChevronUp,
  Edit,
  Printer,
  Plus,
  Eye,
  Upload,
} from "lucide-react-native";

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

// ---------------------
// Main Component
// ---------------------
export default function DoctorPatientPage() {
  const router = useRouter();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryItem[]>([
    { id: 1, date: "October 26, 2023", label: "Face Acne", images: [] },
    { id: 2, date: "July 15, 2023", label: "Initial Photos", images: [] },
  ]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const patient = {
    name: "Jane Doe",
    id: "P-123456",
    age: 34,
    gender: "Female",
    phone: "01012345678",
    email: "janedoe@email.com",
    image: "https://placehold.co/100x100/A855F7/FFFFFF?text=JD",
    allergies: ["Penicillin", "Sulfa Drugs"],
    notes: "Prefers morning appointments",
    medicalHistory: ["Asthma", "Eczema"],
    surgeries: ["Appendectomy (2018)"],
  };

  const visits: Visit[] = [
    {
      id: 1,
      title: "Visit with Dr. Emily Carter",
      date: "October 26, 2023",
      service: "Laser",
      diagnosis: {
        complaint: "Persistent acne on cheeks and forehead.",
        findings: "Multiple closed comedones and inflammatory papules observed. No scarring.",
        finalDiagnosis: "Acne vulgaris.",
      },
      prescriptions: [
        {
          medication: "Tretinoin Cream 0.025%",
          dose: "Nightly",
          frequency: "1×/day",
          duration: "6 weeks",
          notes: "Apply thin layer before bed",
        },
        {
          medication: "SPF 30 Sunscreen",
          dose: "Topical",
          frequency: "Morning",
          duration: "Daily",
          notes: "Avoid sun exposure post-laser",
        },
      ],
      treatment: "Blue light therapy and extraction session.",
      vitals: {
        temperature: "36.8°C",
        bloodPressure: "120/78",
        heartRate: "76 bpm",
        respiratoryRate: "18/min",
        weight: "65 kg",
        bmi: "22.5",
        oxygenSaturation: "98%",
      },
      labs: [
        { testName: "CBC", result: "Normal", date: "2023-10-26" },
        { testName: "Vitamin D", result: "Low", unit: "ng/mL", date: "2023-10-26" },
      ],
      procedures: [
        { name: "Blue Light Therapy", notes: "20 minutes session", date: "2023-10-26" },
      ],
      nextFollowUp: "2023-11-15",
      cost: 150,
      paymentStatus: "Paid",
    },
    {
      id: 2,
      title: "Initial Consultation with Dr. Emily Carter",
      date: "July 15, 2023",
      service: "Diagnosis",
      diagnosis: {
        complaint: "General consultation for skin health.",
        findings: "Mild redness and dryness, otherwise normal.",
        finalDiagnosis: "Healthy skin with minor irritation.",
      },
      prescriptions: [
        {
          medication: "Cerave Moisturizer",
          dose: "Topical",
          frequency: "Twice/day",
          duration: "2 months",
          notes: "Use after cleansing",
        },
      ],
      treatment: "Skin health advice and mild hydration protocol.",
      vitals: {
        temperature: "36.7°C",
        bloodPressure: "118/76",
        heartRate: "72 bpm",
        respiratoryRate: "16/min",
        weight: "64 kg",
        bmi: "22.0",
        oxygenSaturation: "98%",
      },
      nextFollowUp: "2023-08-01",
      cost: 50,
      paymentStatus: "Not Paid",
    },
  ];

  const pickImage = async (galleryId: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newImages = result.assets.map((a) => a.uri);
      setGalleryImages((prev) =>
        prev.map((g) =>
          g.id === galleryId ? { ...g, images: [...g.images, ...newImages] } : g
        )
      );
    }
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

  const togglePayment = (id: number) => {
    const index = visits.findIndex((v) => v.id === id);
    if (index > -1) {
      visits[index].paymentStatus = visits[index].paymentStatus === "Paid" ? "Not Paid" : "Paid";
    }
  };

  return (
  <ScrollView style={styles.container}>
    {/* Patient Header */}
    <View style={styles.header}>
      <View style={styles.patientRow}>
        <Image source={{ uri: patient.image }} style={styles.profileImage} />
        <View>
          <Text style={styles.patientName}>{patient.name}</Text>
          <Text style={styles.patientInfo}>
            <Text style={styles.bold}>ID:</Text> {patient.id} | {patient.age} y/o | {patient.gender}
          </Text>
          <Text style={styles.patientInfo}>{patient.phone} • {patient.email}</Text>
          <Text style={styles.patientInfo}><Text style={styles.bold}>Allergies:</Text> {patient.allergies.join(", ")}</Text>
          <Text style={styles.patientInfo}><Text style={styles.bold}>Notes:</Text> {patient.notes}</Text>
          <Text style={styles.patientInfo}><Text style={styles.bold}>Medical History:</Text> {patient.medicalHistory.join(", ")}</Text>
          <Text style={styles.patientInfo}><Text style={styles.bold}>Surgeries:</Text> {patient.surgeries.join(", ")}</Text>
        </View>
      </View>
     
    </View>

    {/* Visits */}
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>Patient Visit History</Text>
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() =>
          router.push({
            pathname: "/doctor/diagnosis/[id]",
            params: { id: "new", patientId: patient.id },
          })
        }
      >
        <Plus size={18} color="#fff" />
        <Text style={styles.addText}>New Visit</Text>
      </TouchableOpacity>
    </View>

    {visits.map((v, i) => (
      <View key={v.id} style={[styles.card, { backgroundColor: serviceColor(v.service) }]}>
        <TouchableOpacity
          onPress={() => setExpanded(expanded === i ? null : i)}
          style={styles.cardHeader}
        >
          <View>
            <Text style={styles.cardTitle}>{v.title}</Text>
            <Text style={styles.cardDate}>{v.date} • {v.service}</Text>
          </View>
          {expanded === i ? (
            <ChevronUp size={20} color="#555" />
          ) : (
            <ChevronDown size={20} color="#555" />
          )}
        </TouchableOpacity>

        {expanded === i && (
          <View style={styles.cardBody}>
            {/* Diagnosis */}
            <Text style={styles.subTitle}>Diagnosis & Notes</Text>
            <Text><Text style={styles.bold}>Complaint:</Text> {v.diagnosis.complaint}</Text>
            <Text><Text style={styles.bold}>Findings:</Text> {v.diagnosis.findings}</Text>
            <Text style={styles.finalDiagnosis}>Final Diagnosis: {v.diagnosis.finalDiagnosis}</Text>

            {/* Vitals */}
            {v.vitals && (
              <View style={styles.vitalsSection}>
                <Text style={styles.subTitle}>Vital Signs</Text>
                {Object.entries(v.vitals).map(([key, value]) => (
                  <Text key={key}>
                    <Text style={styles.bold}>
                      {key.charAt(0).toUpperCase() + key.slice(1)}:
                    </Text>{" "}
                    {value}
                  </Text>
                ))}
              </View>
            )}

            {/* Lab Results */}
            {v.labs && v.labs.length > 0 && (
              <View style={styles.labSection}>
                <Text style={styles.subTitle}>Lab Results</Text>
                {v.labs.map((lab, idx) => (
                  <Text key={idx}>
                    <Text style={styles.bold}>{lab.testName}:</Text> {lab.result}{" "}
                    {lab.unit || ""} ({lab.date})
                  </Text>
                ))}
              </View>
            )}

            {/* Procedures */}
            {v.procedures && v.procedures.length > 0 && (
              <View style={styles.procedureSection}>
                <Text style={styles.subTitle}>Procedures</Text>
                {v.procedures.map((proc, idx) => (
                  <Text key={idx}>
                    <Text style={styles.bold}>{proc.name}:</Text> {proc.notes} ({proc.date})
                  </Text>
                ))}
              </View>
            )}

            {/* Prescriptions */}
            <Text style={styles.subTitle}>Prescriptions</Text>
            <PrescriptionTable
              prescriptions={v.prescriptions}
              doctorName="Dr. Emily Carter"
              clinicName="Derma Skincare Clinic"
              patient={{
                name: patient.name,
                age: patient.age,
                gender: patient.gender,
                id: patient.id,
              }}
            />

            {/* 🔥 Download Prescription Button ADDED HERE */}

            {/* Treatment */}
            <Text style={styles.subTitle}>Treatment</Text>
            <Text>{v.treatment}</Text>

            {/* Follow-up */}
            {v.nextFollowUp && (
              <Text style={styles.followUp}>
                <Text style={styles.bold}>Next Follow-up:</Text> {v.nextFollowUp}
              </Text>
            )}

            {/* Payment */}
            <View style={styles.paymentSection}>
              <Text style={styles.subTitle}>Payment Status</Text>
              <Text>
                Status: <Text style={{ fontWeight: "600" }}>{v.paymentStatus}</Text>
              </Text>
              <Text>Amount: {v.cost ? `$${v.cost}` : "N/A"}</Text>

              {v.paymentStatus !== "Paid" && (
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => togglePayment(v.id)}
                >
                  <Text style={styles.primaryText}>Mark as Paid</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>
    ))}
      {/* Gallery */}
      <View style={styles.galleryContainer}>
        <Text style={styles.sectionTitle}>Before & After Gallery</Text>
        {galleryImages.map((g) => (
          <View key={g.id} style={styles.album}>
            <Text style={styles.albumLabel}>{g.date} • {g.label}</Text>

            <View style={{ flexDirection: "row", marginBottom: 8, gap: 10 }}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => {
                  if (g.images.length > 0) {
                    setSelectedImage(g.images[0]);
                    setModalVisible(true);
                  }
                }}
              >
                <Eye size={18} color="#333" />
                <Text style={styles.secondaryText}>View</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.primaryBtn} onPress={() => pickImage(g.id)}>
                <Upload size={18} color="#fff" />
                <Text style={styles.primaryText}>Upload</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              horizontal
              data={g.images}
              keyExtractor={(item, idx) => idx.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => { setSelectedImage(item); setModalVisible(true); }}>
                  <Image source={{ uri: item }} style={styles.albumImage} />
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
            />
          </View>
        ))}

        {/* Modal */}
        <Modal visible={modalVisible} transparent={true} onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <Image source={{ uri: selectedImage || "" }} style={styles.modalImage} resizeMode="contain" />
            <Pressable onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
              <Text style={{ fontWeight: "600" }}>Close</Text>
            </Pressable>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA", padding: 16 },
  header: { backgroundColor: "#fff", padding: 16, borderRadius: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  patientRow: { flexDirection: "row", alignItems: "center" },
  profileImage: { width: 70, height: 70, borderRadius: 35, marginRight: 15, borderWidth: 2, borderColor: "#E5E5E5" },
  patientName: { fontSize: 20, fontWeight: "bold", color: "#222" },
  patientInfo: { color: "#666", fontSize: 13 },
  actionRow: { flexDirection: "row", gap: 10 },
  primaryBtn: { flexDirection: "row", backgroundColor: "#9B084D", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  primaryText: { color: "#fff", fontWeight: "600", marginLeft: 6 },
  secondaryBtn: { flexDirection: "row", borderWidth: 1, borderColor: "#ddd", backgroundColor: "#F9F9F9", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, alignItems: "center", marginRight: 8 },
  secondaryText: { color: "#333", fontWeight: "600", marginLeft: 6 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#9B084D" },
  addBtn: { flexDirection: "row", backgroundColor: "#E91E63", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  addText: { color: "#fff", fontWeight: "600", marginLeft: 6 },
  card: { borderRadius: 12, marginBottom: 12, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", padding: 14, backgroundColor: "#fdfdfd", borderBottomWidth: 1, borderBottomColor: "#eee" },
  cardTitle: { fontWeight: "600", color: "#222", fontSize: 15 },
  cardDate: { color: "#888", fontSize: 13 },
  cardBody: { padding: 14, backgroundColor: "#fff" },
  subTitle: { marginTop: 10, marginBottom: 4, color: "#9B084D", fontWeight: "700" },
  finalDiagnosis: { color: "#333", fontWeight: "600", backgroundColor: "#FCE4EC", padding: 8, borderRadius: 6, marginTop: 8 },
  galleryContainer: { marginTop: 24, backgroundColor: "#fff", borderRadius: 12, padding: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 3, elevation: 3 },
  album: { marginBottom: 16 },
  albumLabel: { fontWeight: "600", marginBottom: 8, color: "#444" },
  albumRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  albumImage: { width: 90, height: 90, borderRadius: 8, borderWidth: 1, borderColor: "#eee" },
  bold: { fontWeight: "600", color: "#333" },
  paymentSection: { marginTop: 12, padding: 10, borderRadius: 8, backgroundColor: "#FFF0F5" },
  vitalsSection: { marginTop: 12, padding: 10, borderRadius: 8, backgroundColor: "#FFF8F0" },
  labSection: { marginTop: 12, padding: 10, borderRadius: 8, backgroundColor: "#F0F8FF" },
  procedureSection: { marginTop: 12, padding: 10, borderRadius: 8, backgroundColor: "#F9F0FF" },
  followUp: { marginTop: 10, fontWeight: "600", color: "#9B084D" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center" },
  modalImage: { width: 320, height: 320, borderRadius: 12 },
  modalCloseBtn: { marginTop: 20, padding: 12, backgroundColor: "#fff", borderRadius: 8 },
});