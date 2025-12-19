import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { getPatient, updatePatient } from '../../src/api/receptionistApi';

// --- COLOR PALETTE ---
const PRIMARY_DARK = "#9B084D";
const PRIMARY_LIGHT = "#E80A7A";
const SECONDARY_BG = "#FFE4EC";

interface PatientData {
  patient_id: number;
  name: string;
  gender: string;
  age: number | null;
  phone: string;
}

export default function EditPatient() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const patientId = parseInt(params.id || "0");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");

  // Fetch patient data
  const fetchPatient = useCallback(async () => {
    if (!patientId) {
      setError('Invalid patient ID');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('[EditPatient] Fetching patient:', patientId);
      const result = await getPatient(patientId);
      console.log('[EditPatient] Response:', result);
      
      if (result.success) {
        const patient = result.data;
        setName(patient.name || "");
        setGender(patient.gender as "male" | "female" | "");
        setAge(patient.age?.toString() || "");
        setPhone(patient.phone || "");
      } else {
        setError(result.error || 'Failed to fetch patient');
      }
    } catch (err) {
      console.error('[EditPatient] Error:', err);
      setError('Failed to load patient data');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchPatient();
  }, [fetchPatient]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Patient name is required");
      return;
    }

    setSubmitting(true);

    try {
      // Build the update data object
      const updateData: any = {
        name: name.trim(),
        phone: phone.trim(),
      };
      
      // Only include gender if it's selected
      if (gender) {
        updateData.gender = gender;
      }
      
      // Only include age if it's provided
      if (age && age.trim()) {
        updateData.age = parseInt(age);
      }

      console.log('[EditPatient] Updating patient ID:', patientId);
      console.log('[EditPatient] Update data:', updateData);
      
      const result = await updatePatient(patientId, updateData);

      console.log('[EditPatient] Update result:', result);

      if (result.success) {
        // Show brief success message and go back immediately
        Alert.alert("✅ Success", `${name}'s info has been updated.`);
        router.back();
      } else {
        console.error('[EditPatient] Update failed:', result.error);
        Alert.alert("Error", result.error || "Failed to update patient");
      }
    } catch (err) {
      console.error('[EditPatient] Exception:', err);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={PRIMARY_DARK} />
        <Text style={styles.loadingText}>Loading patient data...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle-outline" size={48} color={PRIMARY_DARK} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchPatient}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Edit Patient</Text>

        <View style={styles.patientIdBadge}>
          <Ionicons name="person-circle-outline" size={20} color={PRIMARY_DARK} />
          <Text style={styles.patientIdText}>Patient ID: {patientId}</Text>
        </View>

        <Text style={styles.label}>Name *</Text>
        <TextInput 
          style={styles.input} 
          value={name} 
          onChangeText={setName}
          placeholder="Enter full name"
          editable={!submitting}
        />

        <Text style={styles.label}>Gender</Text>
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

        <Text style={styles.label}>Age</Text>
        <TextInput 
          style={styles.input} 
          value={age} 
          onChangeText={setAge} 
          keyboardType="numeric"
          placeholder="Enter age"
          editable={!submitting}
        />

        <Text style={styles.label}>Phone</Text>
        <TextInput 
          style={styles.input} 
          value={phone} 
          onChangeText={setPhone} 
          keyboardType="phone-pad"
          placeholder="Enter phone number"
          editable={!submitting}
        />

        <TouchableOpacity 
          style={[styles.saveButton, submitting && { opacity: 0.7 }]} 
          onPress={handleSave}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveText}>Save Changes</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={() => router.back()}
          disabled={submitting}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flexGrow: 1, 
    backgroundColor: "#F9F9F9", 
    padding: 20 
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 15,
    fontSize: 16,
    color: PRIMARY_DARK,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: PRIMARY_DARK,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 15,
    paddingHorizontal: 30,
    paddingVertical: 12,
  },
  backButtonText: {
    color: PRIMARY_DARK,
    fontSize: 16,
    fontWeight: '600',
  },
  header: { 
    fontSize: 24, 
    fontWeight: "bold", 
    color: PRIMARY_DARK, 
    marginBottom: 10 
  },
  patientIdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SECONDARY_BG,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  patientIdText: {
    marginLeft: 6,
    color: PRIMARY_DARK,
    fontWeight: '600',
  },
  label: { 
    fontSize: 16, 
    fontWeight: "bold", 
    color: "#333", 
    marginTop: 15 
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    marginTop: 5,
  },
  genderButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  genderButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
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
  saveButton: {
    backgroundColor: PRIMARY_LIGHT,
    marginTop: 30,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  saveText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 16 
  },
  cancelButton: {
    marginTop: 15,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: PRIMARY_DARK,
  },
  cancelText: {
    color: PRIMARY_DARK,
    fontWeight: "bold",
    fontSize: 16,
  },
});