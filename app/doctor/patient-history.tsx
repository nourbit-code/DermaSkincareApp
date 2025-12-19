import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getDoctorPatients } from '../../src/api/doctorApi';

// --- COLOR PALETTE ---
const PRIMARY_DARK = '#9B084D';
const PRIMARY_LIGHT = '#E80A7A';

interface PatientData {
  patient_id: number;
  name: string;
  age: number | null;
  gender: string;
  phone: string;
  last_service: string;
  last_visit: string | null;
}

export default function PatientHistory() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const doctorId = user?.id || 2;

  const [patients, setPatients] = useState<PatientData[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);

  // Fetch patients from backend
  const fetchPatients = useCallback(async () => {
    try {
      setError(null);
      console.log('[PatientHistory] Fetching patients for doctor:', doctorId);
      const result = await getDoctorPatients(doctorId);
      console.log('[PatientHistory] Response:', result);

      if (result.success) {
        setPatients(result.data);
        if (result.data.length > 0 && !selectedPatient) {
          setSelectedPatient(result.data[0]);
        }
      } else {
        setError(result.error || 'Failed to fetch patients');
      }
    } catch (err) {
      console.error('[PatientHistory] Error:', err);
      setError('Failed to load patients. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [doctorId, selectedPatient]);

  // Initial fetch - wait for auth
  useEffect(() => {
    if (!authLoading) {
      console.log('[PatientHistory] Auth loaded, fetching for doctor ID:', doctorId);
      fetchPatients();
    }
  }, [fetchPatients, authLoading, doctorId]);

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      if (!authLoading) {
        fetchPatients();
      }
    }, [fetchPatients, authLoading])
  );

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPatients();
  }, [fetchPatients]);

  // Filter patients by search
  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchText.toLowerCase()) ||
    p.phone?.toLowerCase().includes(searchText.toLowerCase())
  );

  // Format date for display
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Format gender
  const formatGender = (gender: string) => {
    if (!gender) return 'N/A';
    return gender.charAt(0).toUpperCase() + gender.slice(1);
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={PRIMARY_DARK} />
        <Text style={styles.loadingText}>
          {authLoading ? 'Checking authentication...' : 'Loading patient history...'}
        </Text>
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
        <Text style={styles.header}>Patient History</Text>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchBar}
            placeholder="Search patients..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.countText}>
          {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''} found
        </Text>

        <ScrollView 
          style={styles.listContainer} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[PRIMARY_DARK]}
              tintColor={PRIMARY_DARK}
            />
          }
        >
          {filteredPatients.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>
                {searchText ? 'No patients match your search.' : 'No patients found.'}
              </Text>
            </View>
          ) : (
            filteredPatients.map(patient => (
              <TouchableOpacity 
                key={patient.patient_id} 
                style={[
                  styles.patientCard,
                  selectedPatient?.patient_id === patient.patient_id && styles.selectedCard
                ]}
                onPress={() => setSelectedPatient(patient)}
              >
                <View style={styles.patientInfo}>
                  <Text style={styles.patientName}>{patient.name}</Text>
                  <Text style={styles.patientDetails}>Last Service: {patient.last_service}</Text>
                  <Text style={styles.patientDetails}>Last Visit: {formatDate(patient.last_visit)}</Text>
                </View>
                <View style={styles.buttonsContainer}>
                  <TouchableOpacity
                    style={styles.diagnosisButton}
                    onPress={() =>
                      router.push({
                        pathname: '/doctor/diagnosis/[id]',
                        params: { id: patient.patient_id },
                      })
                    }
                  >
                    <Text style={styles.buttonText}>Diagnosis</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.patientPageButton}
                    onPress={() =>
                      router.push({
                        pathname: '/doctor/patient-page/[id]',
                        params: { id: patient.patient_id },
                      })
                    }
                  >
                    <Text style={styles.buttonText}>Details</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
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
              <Text style={styles.patientNameLarge}>{selectedPatient.name}</Text>
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
                <Ionicons name="medical-outline" size={16} color={PRIMARY_DARK} />
                <Text style={styles.infoLabel}>Last Service</Text>
              </View>
              <Text style={styles.infoValue}>{selectedPatient.last_service}</Text>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoIconRow}>
                <Ionicons name="time-outline" size={16} color={PRIMARY_DARK} />
                <Text style={styles.infoLabel}>Last Visit</Text>
              </View>
              <Text style={styles.infoValue}>{formatDate(selectedPatient.last_visit)}</Text>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Action Buttons */}
            <Text style={styles.actionsTitle}>Quick Actions</Text>

            <TouchableOpacity
              style={styles.startDiagnosisButton}
              onPress={() =>
                router.push({
                  pathname: '/doctor/diagnosis/[id]',
                  params: { id: selectedPatient.patient_id },
                })
              }
            >
              <Ionicons name="clipboard-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.actionButtonText}>Start Diagnosis</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.viewPatientButton}
              onPress={() =>
                router.push({
                  pathname: '/doctor/patient-page/[id]',
                  params: { id: selectedPatient.patient_id },
                })
              }
            >
              <Ionicons name="document-text-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.actionButtonText}>View Full Profile</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.noPatientContainer}>
            <Ionicons name="person-outline" size={48} color="#ddd" />
            <Text style={styles.noPatientText}>Select a patient from the list to view details</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#FAFAFA' },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  
  // Left Panel
  leftPanel: { flex: 1, padding: 20 },
  header: { fontSize: 22, fontWeight: 'bold', color: PRIMARY_DARK, marginBottom: 15 },
  
  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  searchIcon: { marginRight: 8 },
  searchBar: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  countText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  
  // List
  listContainer: { flex: 1 },
  patientCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  selectedCard: {
    backgroundColor: '#F3E5F5',
    borderWidth: 1,
    borderColor: PRIMARY_LIGHT,
  },
  patientInfo: { flex: 1 },
  patientName: { fontSize: 16, fontWeight: 'bold', marginBottom: 4, color: '#333' },
  patientDetails: { fontSize: 14, color: '#666' },
  buttonsContainer: { flexDirection: 'row', gap: 8 },
  diagnosisButton: {
    backgroundColor: PRIMARY_LIGHT,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginRight: 5,
  },
  patientPageButton: {
    backgroundColor: PRIMARY_DARK,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  // Empty & Loading States
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 10,
    color: '#999',
    fontSize: 14,
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

  // Right Panel
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
  patientNameLarge: {
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
  startDiagnosisButton: {
    flexDirection: 'row',
    backgroundColor: PRIMARY_LIGHT,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  viewPatientButton: {
    flexDirection: 'row',
    backgroundColor: PRIMARY_DARK,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
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
