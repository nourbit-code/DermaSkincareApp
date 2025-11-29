import React, { useState, useContext } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { PatientsContext } from "../context/PatientContext";

export default function PatientsDirectory() {
  const router = useRouter();
  const { patients } = useContext(PatientsContext);
  const [search, setSearch] = useState("");

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Patients Directory</Text>
      <TextInput
        style={styles.searchBar}
        placeholder="Search by name..."
        placeholderTextColor="#999"
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.tableHeader}>
        <Text style={[styles.cell, styles.headerText]}>Name</Text>
        <Text style={[styles.cell, styles.headerText]}>Gender</Text>
        <Text style={[styles.cell, styles.headerText]}>Age</Text>
        <Text style={[styles.cell, styles.headerText]}>Phone</Text>
        <Text style={[styles.cell, styles.headerText]}>Action</Text>
      </View>

      <ScrollView style={styles.tableBody}>
        {filteredPatients.map((patient, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.cell}>{patient.name}</Text>
            <Text style={styles.cell}>{patient.gender}</Text>
            <Text style={styles.cell}>{patient.age}</Text>
            <Text style={styles.cell}>{patient.phone}</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() =>
                router.push({
                  pathname: "/receptionist/edit-patient",
                  params: { index: index.toString() },
                })
              }
            >
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>
        ))}

        {filteredPatients.length === 0 && (
          <Text style={styles.noResults}>No patients found.</Text>
        )}
      </ScrollView>
    </View>
  );
}

// (Keep the same styles as before)


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9F9",
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#9B084D",
    marginBottom: 15,
  },
  searchBar: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: "#fff",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#9B084D",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingVertical: 10,
  },
  tableBody: {
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 10,
    alignItems: "center",
  },
  cell: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    color: "#333",
  },
  headerText: {
    color: "#fff",
    fontWeight: "bold",
  },
  editButton: {
    backgroundColor: "#E80A7A",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  editText: {
    color: "#fff",
    fontWeight: "bold",
  },
  noResults: {
    textAlign: "center",
    color: "#777",
    marginTop: 20,
    fontStyle: "italic",
  },
});
