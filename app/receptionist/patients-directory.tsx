import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { getPatients, deletePatient } from '../../src/api/receptionistApi';

// --- COLOR PALETTE ---
const PRIMARY_DARK = "#9B084D";
const PRIMARY_LIGHT = "#E80A7A";
const SUCCESS_COLOR = "#28A745";
const DANGER_COLOR = "#DC3545";

interface Patient {
  patient_id: number;
  name: string;
  gender: string;
  age: number | null;
  phone: string;
  created_at?: string;
}

export default function PatientsDirectory() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Fetch patients from backend
  const fetchPatients = useCallback(async () => {
    try {
      setError(null);
      console.log('[PatientsDirectory] Fetching patients...');
      const result = await getPatients();
      console.log('[PatientsDirectory] Response:', result);
      
      if (result.success) {
        setPatients(result.data);
        // Auto-select first patient if none selected
        if (result.data.length > 0 && !selectedPatient) {
          setSelectedPatient(result.data[0]);
        }
      } else {
        setError(result.error || 'Failed to fetch patients');
      }
    } catch (err) {
      console.error('[PatientsDirectory] Error:', err);
      setError('Failed to load patients. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedPatient]);

  // Refresh data when screen comes into focus (e.g., after editing a patient)
  useFocusEffect(
    useCallback(() => {
      console.log('[PatientsDirectory] Screen focused, refreshing data...');
      fetchPatients();
    }, [fetchPatients])
  );

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPatients();
  }, [fetchPatients]);

  // Filter patients by search
  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.phone?.toLowerCase().includes(search.toLowerCase())
  );

  // Format gender for display
  const formatGender = (gender: string) => {
    if (!gender) return 'N/A';
    return gender.charAt(0).toUpperCase() + gender.slice(1);
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Handle delete patient
  const handleDeletePatient = (patient: Patient) => {
    Alert.alert(
      'Delete Patient',
      `Are you sure you want to delete ${patient.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deletePatient(patient.patient_id);
              if (result.success) {
                Alert.alert('Success', 'Patient deleted successfully');
                if (selectedPatient?.patient_id === patient.patient_id) {
                  setSelectedPatient(null);
                }
                fetchPatients();
              } else {
                Alert.alert('Error', result.error || 'Failed to delete patient');
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to delete patient');
            }
          }
        }
      ]
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={PRIMARY_DARK} />
        <Text style={styles.loadingText}>Loading patients...</Text>
      </View>
    );
  }

  // Error state
  if (error && patients.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle-outline" size={48} color={PRIMARY_DARK} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchPatients}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Left Panel - Patients List */}
      <View style={styles.leftPanel}>
        <View style={styles.headerRow}>
          <Text style={styles.header}>Patients Directory</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push('/receptionist/add-patient')}
          >
            <Ionicons name="person-add" size={18} color="#fff" />
            <Text style={styles.addButtonText}>Add Patient</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchBar}
            placeholder="Search by name or phone..."
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.countText}>
          {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''} found
        </Text>

        <View style={styles.tableHeader}>
          <Text style={[styles.cell, styles.headerText, { flex: 1.5 }]}>Name</Text>
          <Text style={[styles.cell, styles.headerText]}>Gender</Text>
          <Text style={[styles.cell, styles.headerText]}>Age</Text>
          <Text style={[styles.cell, styles.headerText, { flex: 1.2 }]}>Phone</Text>
        </View>

        <ScrollView 
          style={styles.tableBody}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[PRIMARY_DARK]}
              tintColor={PRIMARY_DARK}
            />
          }
        >
          {filteredPatients.map((patient) => (
            <TouchableOpacity 
              key={patient.patient_id} 
              style={[
                styles.tableRow,
                selectedPatient?.patient_id === patient.patient_id && styles.selectedRow
              ]}
              onPress={() => setSelectedPatient(patient)}
            >
              <Text style={[styles.cell, styles.nameCell, { flex: 1.5 }]}>{patient.name}</Text>
              <Text style={styles.cell}>{formatGender(patient.gender)}</Text>
              <Text style={styles.cell}>{patient.age || 'N/A'}</Text>
              <Text style={[styles.cell, { flex: 1.2 }]}>{patient.phone || 'N/A'}</Text>
            </TouchableOpacity>
          ))}

          {filteredPatients.length === 0 && (
            <View style={styles.noResultsContainer}>
              <Ionicons name="people-outline" size={48} color="#ccc" />
              <Text style={styles.noResults}>
                {search ? 'No patients match your search.' : 'No patients found.'}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Right Panel - Patient Details */}
      <View style={styles.rightPanel}>
        <View style={styles.panelHeader}>
          <Ionicons name="person-circle-outline" size={20} color={PRIMARY_DARK} />
          <Text style={styles.panelTitle}>Patient Details</Text>
        </View>

        {selectedPatient ? (
          <>
            {/* Patient Avatar */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {selectedPatient.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.patientName}>{selectedPatient.name}</Text>
              <View style={styles.genderBadge}>
                <Ionicons 
                  name={selectedPatient.gender === 'male' ? 'male' : 'female'} 
                  size={14} 
                  color={selectedPatient.gender === 'male' ? '#2196F3' : '#E91E63'} 
                />
                <Text style={styles.genderText}>{formatGender(selectedPatient.gender)}</Text>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Info Cards */}
            <View style={styles.infoCard}>
              <View style={styles.infoIconRow}>
                <Ionicons name="calendar-outline" size={16} color={PRIMARY_DARK} />
                <Text style={styles.infoLabel}>Age</Text>
              </View>
              <Text style={styles.infoValue}>{selectedPatient.age || 'N/A'} years</Text>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoIconRow}>
                <Ionicons name="call-outline" size={16} color={PRIMARY_DARK} />
                <Text style={styles.infoLabel}>Phone</Text>
              </View>
              <Text style={styles.infoValue}>{selectedPatient.phone || 'N/A'}</Text>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoIconRow}>
                <Ionicons name="time-outline" size={16} color={PRIMARY_DARK} />
                <Text style={styles.infoLabel}>Registered</Text>
              </View>
              <Text style={styles.infoValue}>{formatDate(selectedPatient.created_at || '')}</Text>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Action Buttons */}
            <Text style={styles.actionsTitle}>Quick Actions</Text>

            <TouchableOpacity
              style={styles.bookButton}
              onPress={() => router.push({
                pathname: '/receptionist/book-appointment',
                params: { patientId: selectedPatient.patient_id }
              })}
            >
              <Ionicons name="calendar" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.buttonText}>Book Appointment</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.editButton}
              onPress={() => router.push({
                pathname: '/receptionist/edit-patient',
                params: { id: selectedPatient.patient_id.toString() }
              })}
            >
              <Ionicons name="create-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.buttonText}>Edit Patient</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeletePatient(selectedPatient)}
            >
              <Ionicons name="trash-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.buttonText}>Delete Patient</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.noPatientContainer}>
            <Ionicons name="person-outline" size={48} color="#ddd" />
            <Text style={styles.noPatientText}>Select a patient from the list to view their details</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: "#F9F9F9",
  },
  leftPanel: {
    flex: 1,
    padding: 20,
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: PRIMARY_DARK,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SUCCESS_COLOR,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchBar: {
    flex: 1,
    padding: 10,
    fontSize: 16,
  },
  countText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: PRIMARY_DARK,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  tableBody: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    flex: 1,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  selectedRow: {
    backgroundColor: '#F3E5F5',
  },
  cell: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    color: "#333",
  },
  nameCell: {
    fontWeight: '500',
    color: PRIMARY_DARK,
  },
  headerText: {
    color: "#fff",
    fontWeight: "bold",
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResults: {
    textAlign: "center",
    color: "#777",
    marginTop: 15,
    fontSize: 16,
  },

  // Right Panel Styles
  rightPanel: {
    width: 280,
    backgroundColor: '#fff',
    padding: 20,
    margin: 12,
    borderRadius: 12,
    shadowColor: PRIMARY_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  panelTitle: {
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 8,
    color: PRIMARY_DARK,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F3E5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: PRIMARY_LIGHT,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: PRIMARY_DARK,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  genderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  genderText: {
    marginLeft: 4,
    fontSize: 13,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0E6F0',
    marginVertical: 16,
  },
  infoCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  infoIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoLabel: {
    fontWeight: '600',
    fontSize: 11,
    color: '#888',
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
    marginLeft: 22,
  },
  actionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  bookButton: {
    flexDirection: 'row',
    backgroundColor: SUCCESS_COLOR,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  editButton: {
    flexDirection: 'row',
    backgroundColor: PRIMARY_LIGHT,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  deleteButton: {
    flexDirection: 'row',
    backgroundColor: DANGER_COLOR,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  noPatientContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noPatientText: {
    color: '#aaa',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },
});
