import React, { useState, useContext } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { PatientsContext, Patient } from "../context/PatientContext";


export default function EditPatient() {
  const router = useRouter();
  const  params  = useLocalSearchParams<{ index: string }>();
  const { patients, updatePatient } = useContext(PatientsContext);

  const patientIndex = parseInt(params.index || "0");
  const patientData = patients[patientIndex];

  const [name, setName] = useState(patientData.name);
  const [gender, setGender] = useState(patientData.gender);
  const [age, setAge] = useState(patientData.age.toString());
  const [phone, setPhone] = useState(patientData.phone);

  const handleSave = () => {
    const updated: Patient = {
      name,
      gender,
      age: parseInt(age),
      phone,
    };
    updatePatient(patientIndex, updated);
    Alert.alert("Success", `${name}'s info has been updated.`);
    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Edit Patient</Text>

      <Text style={styles.label}>Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>Gender</Text>
      <TextInput style={styles.input} value={gender} onChangeText={setGender} />

      <Text style={styles.label}>Age</Text>
      <TextInput style={styles.input} value={age} onChangeText={setAge} keyboardType="numeric" />

      <Text style={styles.label}>Phone</Text>
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}

// Add the same styles as before

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9F9F9", padding: 20 },
  header: { fontSize: 24, fontWeight: "bold", color: "#9B084D", marginBottom: 20 },
  label: { fontSize: 16, fontWeight: "bold", color: "#333", marginTop: 15 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    backgroundColor: "#fff",
    marginTop: 5,
  },
  saveButton: {
    backgroundColor: "#E80A7A",
    marginTop: 30,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});