import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getAppointmentsByDate, getDoctorDashboard } from '../../src/api/doctorApi';

// --- TYPE DEFINITIONS ---
interface AppointmentData {
  id: number;
  patient_id: number;
  name: string;
  service: string;
  time: string;
  status: 'Pending' | 'Confirmed' | 'Canceled' | 'Checked In';
}

interface AppointmentsByDate {
  [key: string]: AppointmentData[];
}

// API Response Types
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

interface ApiErrorResponse {
  success: false;
  error: string;
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

interface DashboardData {
  doctor: { id: number; name: string; specialty: string };
  stats: any;
  todays_appointments: AppointmentData[];
  appointments_by_date: AppointmentsByDate;
}

interface AppointmentsDateData {
  appointments: AppointmentData[];
  date: string;
}

// --- COLOR PALETTE ---
const PRIMARY_DARK = '#9B084D';
const PRIMARY_LIGHT = '#E80A7A';

const getTodayDate = () => new Date().toISOString().split('T')[0];

export default function TodaysPatients() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const doctorId = user?.id || 2;

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [appointmentsByDate, setAppointmentsByDate] = useState<AppointmentsByDate>({});
  const [selectedDateAppointments, setSelectedDateAppointments] = useState<AppointmentData[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<AppointmentData | null>(null);

  // Fetch initial data (dashboard with all appointments)
  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      console.log('[TodaysPatients] Fetching data for doctor:', doctorId);
      const result = await getDoctorDashboard(doctorId) as ApiResponse<DashboardData>;

      if (result.success) {
        const { appointments_by_date, todays_appointments } = result.data;
        setAppointmentsByDate(appointments_by_date);
        
        // Set today's appointments
        const todayStr = getTodayDate();
        const todayAppts = appointments_by_date[todayStr] || todays_appointments || [];
        setSelectedDateAppointments(todayAppts);
        
        if (todayAppts.length > 0) {
          setSelectedPatient(todayAppts[0]);
        }
      } else {
        setError(result.error);
        Alert.alert('Error', result.error);
      }
    } catch (err) {
      const errorMessage = 'Failed to load appointments. Please check your connection.';
      setError(errorMessage);
      console.error('[TodaysPatients] Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [doctorId]);

  // Fetch appointments for a specific date
  const fetchAppointmentsForDate = useCallback(async (date: string) => {
    // First check if we already have data in cache
    if (appointmentsByDate[date]) {
      setSelectedDateAppointments(appointmentsByDate[date]);
      if (appointmentsByDate[date].length > 0) {
        setSelectedPatient(appointmentsByDate[date][0]);
      } else {
        setSelectedPatient(null);
      }
      return;
    }

    // Fetch from API if not in cache
    try {
      const result = await getAppointmentsByDate(doctorId, date) as ApiResponse<AppointmentsDateData>;
      if (result.success) {
        const appointments = result.data.appointments;
        setSelectedDateAppointments(appointments);
        
        // Update cache
        setAppointmentsByDate(prev => ({
          ...prev,
          [date]: appointments
        }));
        
        if (appointments.length > 0) {
          setSelectedPatient(appointments[0]);
        } else {
          setSelectedPatient(null);
        }
      }
    } catch (err) {
      console.error('[TodaysPatients] Error fetching appointments for date:', err);
    }
  }, [appointmentsByDate, doctorId]);

  // Initial data fetch - wait for auth
  useEffect(() => {
    if (!authLoading) {
      console.log('[TodaysPatients] Auth loaded, fetching for doctor ID:', doctorId);
      fetchDashboardData();
    }
  }, [fetchDashboardData, authLoading, doctorId]);

  // Fetch appointments when date changes
  useEffect(() => {
    if (selectedDate && !loading) {
      fetchAppointmentsForDate(selectedDate);
    }
  }, [selectedDate, fetchAppointmentsForDate, loading]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Calculate marked dates for calendar
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    
    // Mark dates with appointments
    Object.keys(appointmentsByDate).forEach(date => {
      if (appointmentsByDate[date].length > 0) {
        marks[date] = { 
          marked: true, 
          dotColor: PRIMARY_LIGHT,
          selected: date === selectedDate,
          selectedColor: date === selectedDate ? PRIMARY_DARK : undefined
        };
      }
    });
    
    // Always mark selected date
    if (!marks[selectedDate]) {
      marks[selectedDate] = { selected: true, selectedColor: PRIMARY_DARK };
    } else {
      marks[selectedDate] = { ...marks[selectedDate], selected: true, selectedColor: PRIMARY_DARK };
    }
    
    return marks;
  }, [appointmentsByDate, selectedDate]);

  // Format time for display
  const formatTime = (time: string) => {
    if (!time) return '';
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch {
      return time;
    }
  };

  // Get status style
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return styles.statusConfirmed;
      case 'Pending':
        return styles.statusPending;
      case 'Checked In':
        return styles.statusCheckedIn;
      case 'Canceled':
        return styles.statusCanceled;
      default:
        return {};
    }
  };

  // Get status badge background style
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return { backgroundColor: '#E8F5E9' };
      case 'Pending':
        return { backgroundColor: '#FFF8E1' };
      case 'Checked In':
        return { backgroundColor: '#E3F2FD' };
      case 'Canceled':
        return { backgroundColor: '#FFEBEE' };
      default:
        return { backgroundColor: '#F5F5F5' };
    }
  };

  // Get status text color style
  const getStatusTextStyle = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return { color: '#28A745' };
      case 'Pending':
        return { color: '#E6A000' };
      case 'Checked In':
        return { color: '#1976D2' };
      case 'Canceled':
        return { color: '#DC3545' };
      default:
        return { color: '#666' };
    }
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={PRIMARY_DARK} />
        <Text style={styles.loadingText}>
          {authLoading ? 'Checking authentication...' : 'Loading appointments...'}
        </Text>
      </View>
    );
  }

  // Error state
  if (error && selectedDateAppointments.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle-outline" size={48} color={PRIMARY_DARK} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchDashboardData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isToday = selectedDate === getTodayDate();
  const dateTitle = isToday ? "Today's Patients" : `Patients for ${selectedDate}`;

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.leftPanel} 
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[PRIMARY_DARK]}
            tintColor={PRIMARY_DARK}
          />
        }
      >
        {/* CALENDAR AT TOP */}
        <View style={styles.calendarContainer}>
          <Text style={styles.calendarHeader}>Appointments Calendar</Text>
          <Calendar
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={markedDates}
            theme={{
              selectedDayBackgroundColor: PRIMARY_DARK,
              todayTextColor: PRIMARY_LIGHT,
              arrowColor: PRIMARY_DARK,
            }}
            style={styles.calendarStyle}
          />
        </View>

        {/* TABLE BELOW CALENDAR */}
        <Text style={styles.header}>{dateTitle}</Text>

        {selectedDateAppointments.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No appointments for this date</Text>
          </View>
        ) : (
          <>
            <View style={styles.tableHeader}>
              <Text style={[styles.cell, styles.headerCell]}>Patient</Text>
              <Text style={[styles.cell, styles.headerCell]}>Service</Text>
              <Text style={[styles.cell, styles.headerCell]}>Time</Text>
              <Text style={[styles.cell, styles.headerCell]}>Status</Text>
              <Text style={[styles.cell, styles.headerCell]}>Action</Text>
            </View>

            {selectedDateAppointments.map((p) => (
              <TouchableOpacity 
                key={p.id} 
                style={[
                  styles.tableRow,
                  selectedPatient?.id === p.id && styles.selectedRow
                ]}
                onPress={() => setSelectedPatient(p)}
              >
                <Text style={styles.cell}>{p.name}</Text>
                <Text style={styles.cell}>{p.service}</Text>
                <Text style={styles.cell}>{formatTime(p.time)}</Text>
                <Text style={[styles.cell, getStatusStyle(p.status)]}>
                  {p.status}
                </Text>
                <TouchableOpacity
                  style={styles.startExamButton}
                  onPress={() =>
                    router.push({
                      pathname: '/doctor/diagnosis/[id]',
                      params: { id: p.patient_id || p.id },
                    })
                  }
                >
                  <Text style={styles.startExamText}>Start diagnosis</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>

      {/* RIGHT QUICK INFO PANEL */}
      <View style={styles.rightPanel}>
        {/* Header */}
        <View style={styles.panelHeader}>
          <Ionicons name="person-circle-outline" size={20} color="#9B084D" />
          <Text style={styles.infoHeader}>Patient Quick Info</Text>
        </View>

        {selectedPatient ? (
          <>
            {/* Patient Avatar & Name */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {selectedPatient.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.patientName}>{selectedPatient.name}</Text>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Info Cards */}
            <View style={styles.infoCard}>
              <View style={styles.infoIconRow}>
                <Ionicons name="medical-outline" size={16} color="#9B084D" />
                <Text style={styles.infoLabel}>Service</Text>
              </View>
              <Text style={styles.infoValue}>{selectedPatient.service}</Text>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoIconRow}>
                <Ionicons name="time-outline" size={16} color="#9B084D" />
                <Text style={styles.infoLabel}>Time</Text>
              </View>
              <Text style={styles.infoValue}>{formatTime(selectedPatient.time)}</Text>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoIconRow}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#9B084D" />
                <Text style={styles.infoLabel}>Status</Text>
              </View>
              <View style={[styles.statusBadge, getStatusBadgeStyle(selectedPatient.status)]}>
                <Text style={[styles.statusBadgeText, getStatusTextStyle(selectedPatient.status)]}>
                  {selectedPatient.status}
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Action Buttons */}
            <Text style={styles.actionsTitle}>Quick Actions</Text>

            <TouchableOpacity
              style={styles.openDiagnosisButton}
              onPress={() =>
                router.push({
                  pathname: '/doctor/diagnosis/[id]',
                  params: { id: selectedPatient.patient_id || selectedPatient.id },
                })
              }
            >
              <Ionicons name="clipboard-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.openDiagnosisText}>Start Diagnosis</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.viewHistoryButton}
              onPress={() =>
                router.push({
                  pathname: '/doctor/patient-page/[id]',
                  params: { id: selectedPatient.patient_id || selectedPatient.id },
                })
              }
            >
              <Ionicons name="document-text-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.viewHistoryText}>View History</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.noPatientContainer}>
            <Ionicons name="person-outline" size={40} color="#ddd" />
            <Text style={styles.noPatientText}>Select a patient from the list to view their information</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#F9F9F9' },
  centerContent: { justifyContent: 'center', alignItems: 'center' },

  // Left panel (table)
  leftPanel: { flex: 1, paddingRight: 10 },
  header: { fontSize: 22, fontWeight: 'bold', color: '#9B084D', marginBottom: 20 },

  // Calendar styles
  calendarContainer: { marginBottom: 16 },
  calendarHeader: { fontSize: 16, fontWeight: '700', color: '#9B084D', marginBottom: 8 },
  calendarStyle: { borderRadius: 8 },

  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#ccc', paddingVertical: 8 },
  tableRow: { 
    flexDirection: 'row', 
    paddingVertical: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee', 
    alignItems: 'center',
    borderRadius: 4,
  },
  selectedRow: {
    backgroundColor: '#F3E5F5',
  },
  cell: { flex: 1, textAlign: 'center', fontSize: 13 },
  headerCell: { fontWeight: 'bold', color: '#9B084D' },
  statusConfirmed: { color: '#28A745', fontWeight: 'bold' },
  statusPending: { color: '#E6A000', fontWeight: 'bold' },
  statusCheckedIn: { color: '#17A2B8', fontWeight: 'bold' },
  statusCanceled: { color: '#DC3545', fontWeight: 'bold' },
  startExamButton: { backgroundColor: '#9B084D', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 },
  startExamText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  // Right panel (quick info)
  rightPanel: {
    width: 240,
    backgroundColor: '#fff',
    padding: 16,
    borderLeftWidth: 0,
    borderRadius: 12,
    margin: 12,
    shadowColor: '#9B084D',
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
  infoHeader: {
    fontWeight: '700',
    fontSize: 15,
    marginLeft: 8,
    color: '#9B084D',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3E5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#E80A7A',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#9B084D',
  },
  patientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0E6F0',
    marginVertical: 14,
  },
  infoCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    padding: 10,
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
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    marginLeft: 22,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginLeft: 22,
    marginTop: 2,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  openDiagnosisButton: {
    flexDirection: 'row',
    backgroundColor: '#E80A7A',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  openDiagnosisText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  viewHistoryButton: {
    flexDirection: 'row',
    backgroundColor: '#9B084D',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewHistoryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  noPatientContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },

  // Loading & Error states
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  errorText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 15,
    backgroundColor: '#9B084D',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 10,
    color: '#999',
    fontSize: 14,
  },
  noPatientText: {
    color: '#aaa',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },
});
