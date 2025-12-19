import React, { useState, useEffect, useCallback } from "react";
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
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { createPatient, getPatients, updatePatient } from '../../src/api/receptionistApi';

// --- COLOR PALETTE DEFINITION ---
const PRIMARY_DARK = "#9B084D";
const PRIMARY_LIGHT = "#E80A7A";
const SECONDARY_BG = "#FFE4EC";
const INPUT_BORDER = "#DDD";

interface Patient {
  patient_id?: number;
  name: string;
  age: string;
  gender: "male" | "female" | "";
  phone: string;
}

interface ApiPatient {
  patient_id: number;
  name: string;
  age: number | null;
  gender: string;
  phone: string;
  created_at?: string;
}

export default function AddPatient() {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [phone, setPhone] = useState("");
  const [patients, setPatients] = useState<ApiPatient[]>([]);
  const [editingPatient, setEditingPatient] = useState<ApiPatient | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch patients from backend
  const fetchPatients = useCallback(async () => {
    try {
      console.log('[AddPatient] Fetching patients...');
      const result = await getPatients();
      console.log('[AddPatient] Patients response:', result);
      
      if (result.success) {
        // Get only the 5 most recent patients
        const recentPatients = result.data.slice(0, 5);
        setPatients(recentPatients);
      }
    } catch (error) {
      console.error('[AddPatient] Error fetching patients:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    setLoading(true);
    fetchPatients().finally(() => setLoading(false));
  }, [fetchPatients]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPatients().finally(() => setRefreshing(false));
  }, [fetchPatients]);

  const handleAddOrUpdatePatient = async () => {
    if (!name || !age || !phone || !gender) {
      Alert.alert("Missing Fields", "Please fill in all the fields.");
      return;
    }

    setSubmitting(true);

    try {
      if (editingPatient) {
        // Update existing patient
        console.log('[AddPatient] Updating patient:', editingPatient.patient_id);
        const result = await updatePatient(editingPatient.patient_id, {
          name,
          age: parseInt(age),
          gender: gender.toLowerCase(),
          phone,
        });

        if (result.success) {
          Alert.alert("✅ Patient Updated", `Changes saved for ${name}`);
          setEditingPatient(null);
          fetchPatients(); // Refresh list
        } else {
          Alert.alert("Error", result.error || "Failed to update patient");
        }
      } else {
        // Add new patient
        console.log('[AddPatient] Creating new patient:', { name, age, gender, phone });
        const result = await createPatient({
          name,
          age: parseInt(age),
          gender: gender.toLowerCase(),
          phone,
        });

        console.log('[AddPatient] Create result:', result);

        if (result.success) {
          Alert.alert("✅ Patient Added", `Name: ${name}\nGender: ${gender}`);
          fetchPatients(); // Refresh list
        } else {
          Alert.alert("Error", result.error || "Failed to add patient");
        }
      }

      // Reset form
      setName("");
      setAge("");
      setPhone("");
      setGender("");
    } catch (error) {
      console.error('[AddPatient] Error:', error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (patient: ApiPatient) => {
    setName(patient.name);
    setAge(patient.age?.toString() || "");
    setGender(patient.gender as "male" | "female" | "");
    setPhone(patient.phone);
    setEditingPatient(patient);
  };

  const handleCancelEdit = () => {
    setName("");
    setAge("");
    setPhone("");
    setGender("");
    setEditingPatient(null);
  };

  const formatGender = (gender: string) => {
    return gender.charAt(0).toUpperCase() + gender.slice(1);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView 
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[PRIMARY_DARK]}
            tintColor={PRIMARY_DARK}
          />
        }
      >
        <Text style={styles.title}>New Patient Record</Text>

        {/* Show Editing Label */}
        {editingPatient && (
          <View style={styles.editingBanner}>
            <Ionicons name="pencil-outline" size={20} color={PRIMARY_DARK} style={{marginRight: 8}} />
            <Text style={styles.editingText}>
              Editing: {editingPatient.name}
            </Text>
            <TouchableOpacity onPress={handleCancelEdit} style={styles.cancelEditButton}>
              <Ionicons name="close-circle" size={24} color={PRIMARY_DARK} />
            </TouchableOpacity>
          </View>
        )}

        {/* Input Fields */}
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
          editable={!submitting}
        />

        <TextInput
          style={styles.input}
          placeholder="Age"
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
          editable={!submitting}
        />

        {/* Gender Selection */}
        <View style={styles.genderContainer}>
          <Text style={styles.genderLabel}>Gender</Text>
          <View style={styles.genderButtons}>
            <TouchableOpacity
              style={[
                styles.genderButton,
                gender === "male" && styles.genderSelected,
              ]}
              onPress={() => setGender("male")}
              disabled={submitting}
            >
              <Text
                style={[
                  styles.genderText,
                  gender === "male" && styles.genderTextSelected,
                ]}
              >
                ♂ Male
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.genderButton,
                gender === "female" && styles.genderSelected,
              ]}
              onPress={() => setGender("female")}
              disabled={submitting}
            >
              <Text
                style={[
                  styles.genderText,
                  gender === "female" && styles.genderTextSelected,
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
          editable={!submitting}
        />

        <TouchableOpacity
          style={[
            styles.addButton,
            editingPatient && { backgroundColor: PRIMARY_LIGHT },
            submitting && { opacity: 0.7 },
          ]}
          onPress={handleAddOrUpdatePatient}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.addButtonText}>
              {editingPatient ? "Save Changes" : "Add Patient"}
            </Text>
          )}
        </TouchableOpacity>

        {/* Patients List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PRIMARY_DARK} />
            <Text style={styles.loadingText}>Loading patients...</Text>
          </View>
        ) : patients.length > 0 ? (
          <View style={styles.patientList}>
            <Text style={styles.listTitle}>Recently Added</Text>

            {patients.map((p) => (
              <View
                key={p.patient_id}
                style={[
                  styles.patientCard,
                  editingPatient?.patient_id === p.patient_id && styles.patientCardEditing,
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.patientName}>{p.name}</Text>
                  <Text style={styles.patientInfo}>
                    {formatGender(p.gender || '')} • Age {p.age || 'N/A'} • {p.phone || 'No phone'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleEdit(p)}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No patients added yet</Text>
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
    color: PRIMARY_DARK,
    textAlign: "center",
    marginBottom: 25,
  },
  editingBanner: {
    backgroundColor: SECONDARY_BG,
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: PRIMARY_DARK,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editingText: {
    color: PRIMARY_DARK,
    fontWeight: "bold",
    fontSize: 16,
    flex: 1,
  },
  cancelEditButton: {
    padding: 4,
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
    backgroundColor: PRIMARY_DARK,
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
    backgroundColor: PRIMARY_DARK,
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
  loadingContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  emptyContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 10,
    color: '#999',
    fontSize: 16,
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
    backgroundColor: SECONDARY_BG,
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
    backgroundColor: PRIMARY_LIGHT,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  editButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});