import React, { useState } from "react";
import * as ImagePicker from "expo-image-picker";
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
import { ChevronDown, ChevronUp, Plus, Eye, Upload } from "lucide-react-native";

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
    image: "https://placehold.co/200x200/A855F7/FFFFFF?text=JD",
    allergies: ["Penicillin", "Sulfa Drugs"],
    notes: "Prefers morning appointments",
    medicalHistory: ["Asthma", "Eczema"],
    surgeries: ["Appendectomy (2018)"],
  };

  // ⭐⭐⭐ UPDATED VISITS INCLUDING SECOND PRESCRIPTION ⭐⭐⭐
  const visits: Visit[] = [
    {
      id: 1,
      title: "Visit with Dr. Emily Carter",
      date: "October 26, 2023",
      service: "Laser",
      diagnosis: {
        complaint: "Persistent acne on cheeks and forehead.",
        findings: "Multiple closed comedones and inflammatory papules.",
        finalDiagnosis: "Acne vulgaris.",
      },
      prescriptions: [
        {
          medication: "Tretinoin 0.025%",
          dose: "Night",
          frequency: "1×/day",
          duration: "6 weeks",
          notes: "Use thin layer",
        },
      ],
      treatment: "Blue light therapy.",
      vitals: {
        temperature: "36.8°C",
        bloodPressure: "120/78",
        heartRate: "76 bpm",
        oxygenSaturation: "98%",
      },
      labs: [{ testName: "CBC", result: "Normal", date: "2023-10-26" }],
      procedures: [{ name: "Blue Light Therapy", notes: "20 minutes", date: "2023-10-26" }],
      nextFollowUp: "2023-11-15",
      cost: 150,
      paymentStatus: "Paid",
    },

    // ⭐ NEW FOLLOW-UP VISIT ⭐
    {
      id: 2,
      title: "Follow-up Visit with Dr. Emily Carter",
      date: "November 10, 2023",
      service: "Diagnosis",
      diagnosis: {
        complaint: "Mild dryness after starting Retinoid treatment.",
        findings: "Slight peeling around cheeks. No inflammation.",
        finalDiagnosis: "Retinoid-induced irritation.",
      },
      prescriptions: [
        {
          medication: "Cerave Moisturizing Cream",
          dose: "Topical",
          frequency: "Twice/day",
          duration: "14 days",
          notes: "Apply morning and night to reduce dryness",
        },
      ],
      treatment: "Skin barrier repair protocol.",
      vitals: {
        temperature: "36.7°C",
        bloodPressure: "118/76",
        heartRate: "72 bpm",
        oxygenSaturation: "98%",
      },
      labs: [],
      procedures: [],
      nextFollowUp: "2023-11-25",
      cost: 80,
      paymentStatus: "Not Paid",
    },
  ];

  const pickImage = async (galleryId: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
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

  return (
    <View style={styles.mainPage}>
      {/* LEFT PANEL — Patient Profile */}
      <View style={styles.leftPanel}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.profileCard}>
            <Image source={{ uri: patient.image }} style={styles.profileImage} />

            <View style={styles.profileDivider} />

            {[
              ["Name", patient.name],
              ["Patient ID", patient.id],
              ["Age", patient.age],
              ["Gender", patient.gender],
              ["Phone", patient.phone],
              ["Email", patient.email],
              ["Allergies", patient.allergies.join(", ")],
              ["Notes", patient.notes],
              ["Medical History", patient.medicalHistory.join(", ")],
              ["Surgeries", patient.surgeries.join(", ")],
            ].map(([label, value], index) => (
              <View key={index} style={styles.infoRowBox}>
                <Text style={styles.infoKey}>{label}</Text>
                <Text style={styles.infoValue}>{value}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* RIGHT PANEL — Visits + Gallery */}
      <View style={styles.rightPanel}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Visit History */}
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

                {expanded === i ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </TouchableOpacity>

              {expanded === i && (
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
          ))}

          {/* GALLERY */}
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
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedImage(item);
                        setModalVisible(true);
                      }}
                    >
                      <Image source={{ uri: item }} style={styles.albumImage} />
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
                />
              </View>
            ))}

            {/* Modal */}
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
          </View>
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
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#9B084D",
  },
  addBtn: {
    flexDirection: "row",
    backgroundColor: "#E91E63",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  addText: { color: "#fff", marginLeft: 6 },

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
});