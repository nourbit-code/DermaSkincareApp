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
        <Text style={styles.title}>Add or Edit Patient</Text>

        {/* Show Editing Label */}
        {editIndex !== null && (
          <View style={styles.editingBanner}>
            <Text style={styles.editingText}>
              ✏️ Editing: {patients[editIndex]?.name}
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
                Male
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
                Female
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
            editIndex !== null && { backgroundColor: "#E80A7A" },
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
            <Text style={styles.listTitle}>Added Patients</Text>

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
    color: "#9B084D",
    textAlign: "center",
    marginBottom: 25,
  },
  editingBanner: {
    backgroundColor: "#FFE4EC",
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#9B084D",
  },
  editingText: {
    color: "#9B084D",
    fontWeight: "bold",
    fontSize: 16,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
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
    color: "#9B084D",
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
    borderColor: "#ddd",
    borderRadius: 10,
    paddingVertical: 12,
    marginHorizontal: 5,
    alignItems: "center",
  },
  genderSelected: {
    backgroundColor: "#9B084D",
    borderColor: "#9B084D",
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
    backgroundColor: "#9B084D",
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
    color: "#9B084D",
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
    backgroundColor: "#FFE4EC", // highlight edited card
    borderColor: "#E80A7A",
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
    backgroundColor: "#E80A7A",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  editButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
