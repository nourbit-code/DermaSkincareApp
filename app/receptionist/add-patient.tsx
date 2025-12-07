import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from '@expo/vector-icons'; // Added for icons

// --- COLOR PALETTE DEFINITION ---
const PRIMARY_DARK = "#9B084D";
const PRIMARY_LIGHT = "#E80A7A";
const SECONDARY_BG = "#FFE4EC"; // Light pink for banners/highlights
const INPUT_BORDER = "#DDD";

interface Patient {
  name: string;
  age: string;
  gender: "Male" | "Female";
  phone: string;
}

export default function AddPatient() {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"Male" | "Female" | "">("");
  const [phone, setPhone] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const handleAddOrUpdatePatient = () => {
    if (!name || !age || !phone || !gender) {
      Alert.alert("Missing Fields", "Please fill in all the fields.");
      return;
    }

    const newPatient = { name, age, gender: gender as "Male" | "Female", phone };

    if (editIndex !== null) {
      // Update existing
      const updatedPatients = [...patients];
      updatedPatients[editIndex] = newPatient;
      setPatients(updatedPatients);
      Alert.alert("✅ Patient Updated", `Changes saved for ${name}`);
      setEditIndex(null);
    } else {
      // Add new
      setPatients((prev) => [...prev, newPatient]);
      Alert.alert("✅ Patient Added", `Name: ${name}\nGender: ${gender}`);
    }

    // Reset
    setName("");
    setAge("");
    setPhone("");
    setGender("");
  };

  const handleEdit = (index: number) => {
    const patient = patients[index];
    setName(patient.name);
    setAge(patient.age);
    setGender(patient.gender);
    setPhone(patient.phone);
    setEditIndex(index);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>New Patient Record</Text>

        {/* Show Editing Label */}
        {editIndex !== null && (
          <View style={styles.editingBanner}>
            <Ionicons name="pencil-outline" size={20} color={PRIMARY_DARK} style={{marginRight: 8}} />
            <Text style={styles.editingText}>
              Editing: **{patients[editIndex]?.name}**
            </Text>
          </View>
        )}

        {/* Input Fields */}
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={styles.input}
          placeholder="Age"
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
        />

        {/* Gender Selection */}
        <View style={styles.genderContainer}>
          <Text style={styles.genderLabel}>Gender</Text>
          <View style={styles.genderButtons}>
            <TouchableOpacity
              style={[
                styles.genderButton,
                gender === "Male" && styles.genderSelected,
              ]}
              onPress={() => setGender("Male")}
            >
              <Text
                style={[
                  styles.genderText,
                  gender === "Male" && styles.genderTextSelected,
                ]}
              >
                ♂ Male
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.genderButton,
                gender === "Female" && styles.genderSelected,
              ]}
              onPress={() => setGender("Female")}
            >
              <Text
                style={[
                  styles.genderText,
                  gender === "Female" && styles.genderTextSelected,
                ]}
              >
                ♀ Female
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <TouchableOpacity
          style={[
            styles.addButton,
            // Use PRIMARY_LIGHT for Save Changes action
            editIndex !== null && { backgroundColor: PRIMARY_LIGHT }, 
          ]}
          onPress={handleAddOrUpdatePatient}
        >
          <Text style={styles.addButtonText}>
            {editIndex !== null ? "Save Changes" : "Add Patient"}
          </Text>
        </TouchableOpacity>

        {/* Patients List */}
        {patients.length > 0 && (
          <View style={styles.patientList}>
            <Text style={styles.listTitle}>Recently Added</Text>

            {patients.map((p, index) => (
              <View
                key={index}
                style={[
                  styles.patientCard,
                  editIndex === index && styles.patientCardEditing, // highlight edited card
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.patientName}>{p.name}</Text>
                  <Text style={styles.patientInfo}>
                    {p.gender} • Age {p.age} • {p.phone}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleEdit(index)}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#F9F9F9",
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: PRIMARY_DARK, // Use Primary Dark
    textAlign: "center",
    marginBottom: 25,
  },
  editingBanner: {
    backgroundColor: SECONDARY_BG, // Use Light Pink
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: PRIMARY_DARK,
    flexDirection: 'row', // Align icon and text
    alignItems: 'center',
  },
  editingText: {
    color: PRIMARY_DARK,
    fontWeight: "bold",
    fontSize: 16,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: INPUT_BORDER,
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  genderContainer: {
    marginBottom: 15,
  },
  genderLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: PRIMARY_DARK,
    marginBottom: 8,
  },
  genderButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  genderButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: INPUT_BORDER,
    borderRadius: 10,
    paddingVertical: 12,
    marginHorizontal: 5,
    alignItems: "center",
  },
  genderSelected: {
    backgroundColor: PRIMARY_DARK, // Primary Dark for selection
    borderColor: PRIMARY_DARK,
  },
  genderText: {
    fontSize: 16,
    color: "#333",
  },
  genderTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  addButton: {
    backgroundColor: PRIMARY_DARK, // Default Primary Dark
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  patientList: {
    marginTop: 30,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: PRIMARY_DARK,
    marginBottom: 10,
  },
  patientCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
    flexDirection: "row",
    alignItems: "center",
  },
  patientCardEditing: {
    backgroundColor: SECONDARY_BG, // Highlight with secondary color
    borderColor: PRIMARY_LIGHT,
  },
  patientName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  patientInfo: {
    color: "#666",
    marginTop: 3,
  },
  editButton: {
    backgroundColor: PRIMARY_LIGHT, // Use Primary Light for edit button
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  editButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});