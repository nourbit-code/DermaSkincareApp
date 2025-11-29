import React, { useState, useContext } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { PatientsContext, Patient } from "../context/PatientContext";
import * as Print from "expo-print";
import * as FileSystem from "expo-file-system";

type ServiceItem = {
  description: string;
  qty: number;
  unitPrice: number;
};

export default function Payments() {
  const { patients } = useContext(PatientsContext);
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentStatus, setPaymentStatus] = useState("Not Paid");

  const defaultServices: ServiceItem[] = [
    { description: "Laser Session", qty: 1, unitPrice: 450 },
    { description: "Post-Treatment Cream", qty: 1, unitPrice: 75 },
  ];
  const [services, setServices] = useState<ServiceItem[]>(defaultServices);

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search)
  );

  const subtotal = services.reduce(
    (sum, item) => sum + item.qty * item.unitPrice,
    0
  );
  const discount = 0;
  const total = subtotal - discount;

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setPaymentStatus("Not Paid");
    setPaymentMethod("Cash");
    setServices(defaultServices);
    setSearch(""); // clear search
  };

  const handleMarkPaid = () => setPaymentStatus("Paid");

  const generateInvoiceHTML = () => {
    if (!selectedPatient) return "";

    const servicesRows = services
      .map(
        (s) =>
          `<tr>
            <td>${s.description}</td>
            <td>${s.qty}</td>
            <td>L.E ${s.unitPrice.toFixed(2)}</td>
            <td>L.E ${(s.qty * s.unitPrice).toFixed(2)}</td>
          </tr>`
      )
      .join("");

    return `
      <html>
        <body>
          <h2>Invoice for ${selectedPatient.name}</h2>
          <p>Phone: ${selectedPatient.phone}</p>
          <table border="1" cellspacing="0" cellpadding="5">
            <tr>
              <th>Description</th><th>Qty</th><th>Unit Price</th><th>Amount</th>
            </tr>
            ${servicesRows}
          </table>
          <p>Subtotal: L.E ${subtotal}</p>
          <p>Total: L.E ${total}</p>
        </body>
      </html>
    `;
  };

  const handlePrint = async () => {
    if (!selectedPatient) return;
    const html = generateInvoiceHTML();
    await Print.printAsync({ html });
  };

  const handleDownloadPDF = async () => {
    if (!selectedPatient) return;

    const html = generateInvoiceHTML();
    const { uri } = await Print.printToFileAsync({ html });

    // TypeScript-safe access to documentDirectory
    const fileUri = `${(FileSystem as any).documentDirectory}${selectedPatient.name}_invoice.pdf`;
    await FileSystem.copyAsync({ from: uri, to: fileUri });
    alert(`PDF saved to ${fileUri}`);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.pageTitle}>Payments & Invoice Management</Text>
      <Text style={styles.subtitle}>
        Search for patients, view invoice details, and process payments.
      </Text>

      {/* Search Section */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#888" />
          <TextInput
            placeholder="Search by Name or Phone..."
            style={styles.input}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Patient Search Results */}
      {search.length > 0 && !selectedPatient && (
        <View style={styles.resultsContainer}>
          {filteredPatients.map((patient, index) => (
            <TouchableOpacity
              key={index}
              style={styles.resultItem}
              onPress={() => handleSelectPatient(patient)}
            >
              <Text>{patient.name} - {patient.phone}</Text>
            </TouchableOpacity>
          ))}
          {filteredPatients.length === 0 && <Text>No patients found.</Text>}
        </View>
      )}

      {/* Invoice & Payment Section */}
      {selectedPatient && (
        <View style={styles.sectionContainer}>
          <View style={styles.invoiceCard}>
            <Text style={styles.sectionTitle}>Invoice Information</Text>
            <Text style={styles.infoLabel}>Patient Info</Text>
            <Text style={styles.infoText}>Name: {selectedPatient.name}</Text>
            <Text style={styles.infoText}>Gender: {selectedPatient.gender}</Text>
            <Text style={styles.infoText}>Age: {selectedPatient.age}</Text>
            <Text style={styles.infoText}>Phone: {selectedPatient.phone}</Text>

            <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Services</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableText, { flex: 2 }]}>Service Description</Text>
              <Text style={styles.tableText}>Qty</Text>
              <Text style={styles.tableText}>Unit Price</Text>
              <Text style={styles.tableText}>Amount</Text>
            </View>

            {services.map((item, index) => (
              <View style={styles.tableRow} key={index}>
                <Text style={[styles.rowText, { flex: 2 }]}>{item.description}</Text>
                <Text style={styles.rowText}>{item.qty}</Text>
                <Text style={styles.rowText}>L.E {item.unitPrice.toFixed(2)}</Text>
                <Text style={styles.rowText}>L.E {(item.qty * item.unitPrice).toFixed(2)}</Text>
              </View>
            ))}

            <View style={styles.summary}>
              <Text style={styles.summaryText}>Subtotal: L.E {subtotal}</Text>
              <Text style={styles.summaryText}>Discount: NO DISCOUNTS</Text>
              <Text style={styles.summaryTotal}>Total: L.E {total}</Text>
            </View>
          </View>

          <View style={styles.paymentCard}>
            <Text style={styles.sectionTitle}>Payment Details</Text>

            <Text style={styles.infoLabel}>Payment Status</Text>
            <Text style={paymentStatus === "Paid" ? styles.paid : styles.notPaid}>
              {paymentStatus === "Paid" ? "✅ Paid" : "❌ Not Paid"}
            </Text>

            <Text style={styles.infoLabel}>Payment Method</Text>
            <View style={styles.dropdownBox}>
              <Picker
                selectedValue={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value)}
                style={styles.picker}
                dropdownIconColor="#9B084D"
              >
                <Picker.Item label="Cash" value="Cash" />
                <Picker.Item label="Visa" value="Visa" />
                <Picker.Item label="InstaPay" value="InstaPay" />
              </Picker>
            </View>

            <TouchableOpacity style={styles.payButton} onPress={handleMarkPaid}>
              <Text style={styles.payButtonText}>Mark as Paid</Text>
            </TouchableOpacity>

            {/* Print / Download Buttons */}
            <View style={styles.bottomButtons}>
              <TouchableOpacity style={styles.iconButton} onPress={handlePrint}>
                <Ionicons name="print-outline" size={18} color="#9B084D" />
                <Text style={styles.iconText}>Print Invoice</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.iconButton} onPress={handleDownloadPDF}>
                <Ionicons name="download-outline" size={18} color="#9B084D" />
                <Text style={styles.iconText}>Download PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F7F9", padding: 20 },
  pageTitle: { fontSize: 22, fontWeight: "bold", color: "#1E1E1E" },
  subtitle: { fontSize: 13, color: "#555", marginBottom: 20 },
  searchContainer: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    height: 40,
  },
  input: { marginLeft: 8, flex: 1 },
  resultsContainer: { backgroundColor: "#fff", borderRadius: 10, padding: 10, marginBottom: 15 },
  resultItem: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#eee" },
  sectionContainer: { flexDirection: "row", justifyContent: "space-between" },
  invoiceCard: { backgroundColor: "#fff", borderRadius: 12, padding: 15, flex: 2, marginRight: 10 },
  paymentCard: { backgroundColor: "#fff", borderRadius: 12, padding: 15, flex: 1 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#333", marginBottom: 10 },
  infoLabel: { fontSize: 13, fontWeight: "bold", color: "#555", marginTop: 10 },
  infoText: { fontSize: 13, color: "#444" },
  tableHeader: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#ddd", paddingVertical: 8, marginTop: 10 },
  tableText: { flex: 1, fontWeight: "bold", color: "#444", fontSize: 13 },
  tableRow: { flexDirection: "row", paddingVertical: 6 },
  rowText: { flex: 1, fontSize: 13, color: "#555" },
  summary: { marginTop: 10, borderTopWidth: 1, borderColor: "#eee", paddingTop: 8 },
  summaryText: { fontSize: 13, color: "#555" },
  summaryTotal: { fontSize: 14, fontWeight: "bold", color: "#9B084D", marginTop: 5 },
  notPaid: { backgroundColor: "#FCE8EF", color: "#9B084D", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, marginTop: 5, alignSelf: "flex-start" },
  paid: { backgroundColor: "#E8F9EC", color: "#0A7A3F", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, marginTop: 5, alignSelf: "flex-start" },
  dropdownBox: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, backgroundColor: "#fff", marginTop: 5 },
  picker: { height: 40, color: "#333" },
  payButton: { backgroundColor: "#9B084D", borderRadius: 10, paddingVertical: 10, alignItems: "center", marginTop: 15 },
  payButtonText: { color: "#fff", fontWeight: "bold" },
  bottomButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 15 },
  iconButton: { flexDirection: "row", alignItems: "center" },
  iconText: { marginLeft: 5, color: "#9B084D", fontSize: 13 },
});
