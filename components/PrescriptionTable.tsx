import React, { useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Printer } from "lucide-react-native";
import html2canvas from "html2canvas";

type Prescription = {
  medication: string;
  dose: string;
  frequency: string;
  duration: string;
  notes: string;
};

type PrescriptionTableProps = {
  prescriptions: Prescription[];
  doctorName: string;
  clinicName: string;
  patient: {
    name: string;
    age: number;
    gender: string;
    id: string;
  };
};

export default function PrescriptionTable({
  prescriptions,
  doctorName,
  clinicName,
  patient,
}: PrescriptionTableProps) {
  const prescriptionRef = useRef<HTMLDivElement>(null);
  const prescriptionID = "RX-" + Math.floor(100000 + Math.random() * 900000);
  const issueDate = new Date().toLocaleDateString();

  // ✅ Download as image only
  const handleDownload = async () => {
    if (!prescriptionRef.current) return;
    try {
      const canvas = await html2canvas(prescriptionRef.current);
      const image = canvas.toDataURL("image/jpeg", 1.0);

      // Download
      const link = document.createElement("a");
      link.href = image;
      link.download = `prescription-${prescriptionID}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // ❌ Print dialog removed
    } catch (error) {
      console.error("Failed to download prescription:", error);
      alert("Failed to download prescription.");
    }
  };

  return (
    <View style={styles.container}>
      <div ref={prescriptionRef as any} style={styles.prescriptionCard as any}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <Image
              source={{ uri: "https://placehold.co/80x80/9B084D/FFFFFF?text=DSC" }}
              style={styles.logo}
            />
            <View>
              <Text style={styles.clinicName}>{clinicName}</Text>
              <Text style={styles.doctorName}>{doctorName}</Text>
            </View>
          </View>
          <View style={styles.rightHeader}>
            <Text style={styles.prescriptionId}>#{prescriptionID}</Text>
            <Text style={styles.dateText}>Date: {issueDate}</Text>
          </View>
        </View>

        {/* Patient Info */}
        <View style={styles.patientInfo}>
          <Text style={styles.infoText}><Text style={styles.label}>Name:</Text> {patient.name}</Text>
          <Text style={styles.infoText}><Text style={styles.label}>Age:</Text> {patient.age}</Text>
          <Text style={styles.infoText}><Text style={styles.label}>Gender:</Text> {patient.gender}</Text>
          <Text style={styles.infoText}><Text style={styles.label}>Patient ID:</Text> {patient.id}</Text>
        </View>

        {/* Watermark */}
        <Text style={styles.watermark}>{clinicName}</Text>

        {/* Table */}
        <View style={styles.tableContainer}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, styles.headerText]}>Medication</Text>
            <Text style={[styles.tableCell, styles.headerText]}>Dose</Text>
            <Text style={[styles.tableCell, styles.headerText]}>Frequency</Text>
            <Text style={[styles.tableCell, styles.headerText]}>Duration</Text>
            <Text style={[styles.tableCell, styles.headerText]}>Notes</Text>
          </View>

          {prescriptions.map((p, i) => (
            <View key={i} style={[styles.tableRow, i % 2 === 0 ? { backgroundColor: "#FAFAFA" } : {}]}>
              <Text style={styles.tableCell}>{p.medication}</Text>
              <Text style={styles.tableCell}>{p.dose}</Text>
              <Text style={styles.tableCell}>{p.frequency}</Text>
              <Text style={styles.tableCell}>{p.duration}</Text>
              <Text style={styles.tableCell}>{p.notes}</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.signatureLabel}>Doctor's Signature: ____________________</Text>
          <Text style={styles.footerText}>Thank you for visiting {clinicName}</Text>
        </View>
      </div>

      <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload}>
        <Printer size={18} color="#fff" />
        <Text style={styles.downloadText}>Download</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 12 },
  prescriptionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    overflow: "hidden",
    position: "relative",
  },
  header: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#ccc", marginBottom: 12, paddingBottom: 6 },
  logoSection: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 50, height: 50, borderRadius: 25 },
  clinicName: { fontSize: 17, fontWeight: "700", color: "#9B084D" },
  doctorName: { fontSize: 14, color: "#444" },
  rightHeader: { alignItems: "flex-end" },
  prescriptionId: { fontSize: 13, fontWeight: "700", color: "#9B084D" },
  dateText: { fontSize: 12, color: "#666" },
  patientInfo: { marginVertical: 10, borderBottomWidth: 1, borderBottomColor: "#eee", paddingBottom: 8 },
  infoText: { fontSize: 14, marginBottom: 3 },
  label: { fontWeight: "700" },
  watermark: { position: "absolute", top: "40%", left: "10%", fontSize: 40, color: "#9B084D20", transform: [{ rotate: "-20deg" }], zIndex: -1 },
  tableContainer: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, overflow: "hidden", marginTop: 10 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#eee" },
  tableHeader: { backgroundColor: "#9B084D" },
  headerText: { color: "#fff", fontWeight: "700" },
  tableCell: { flex: 1, paddingVertical: 8, paddingHorizontal: 6, fontSize: 13, textAlign: "center", color: "#333" },
  footer: { marginTop: 14, alignItems: "flex-start" },
  signatureLabel: { fontSize: 14, marginBottom: 8 },
  footerText: { fontSize: 12, color: "#666", textAlign: "center", width: "100%" },
  downloadBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#9B084D", borderRadius: 8, paddingVertical: 10, marginTop: 12 },
  downloadText: { color: "#fff", fontWeight: "600", marginLeft: 8 },
});