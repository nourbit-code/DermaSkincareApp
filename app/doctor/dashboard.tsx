import { useRouter } from 'expo-router';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, TextInput, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons, Feather } from '@expo/vector-icons'; 
import { getDoctorDashboard, getAppointmentsByDate } from '../../src/api/doctorApi';
import { useAuth, useDoctorId } from '../context/AuthContext';

// --- TYPE DEFINITIONS ---
interface AppointmentData {
    id: number;
    patient_id: number;
    name: string;
    service: string;
    time: string;
    status: 'Pending' | 'Confirmed' | 'Canceled';
}

interface AppointmentsByDate {
    [key: string]: AppointmentData[];
}

interface DashboardStats {
    total_sessions: number;
    pending: number;
    confirmed: number;
    open_records: number;
}

interface DoctorInfo {
    id: number;
    name: string;
    specialty: string;
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
    doctor: DoctorInfo;
    stats: DashboardStats;
    todays_appointments: AppointmentData[];
    appointments_by_date: AppointmentsByDate;
}

interface AppointmentsDateData {
    appointments: AppointmentData[];
    date: string;
}

interface StatItemProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: number;
    color: string;
}

interface StatusFilterButtonProps {
    label: string;
    currentFilter: string;
    setFilter: (filter: string) => void;
    defaultColor: string;
}

// --- COLOR PALETTE ---
const PRIMARY_DARK = '#9B084D'; 
const PRIMARY_LIGHT = '#E80A7A'; 
const SECONDARY_BG = '#F3E5F5'; 
const PENDING_COLOR = '#E6A000'; 
const CONFIRMED_COLOR = '#28A745'; 

export default function DoctorDashboard() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    
    // Get doctor ID from auth context, fallback to 2 for backwards compatibility
    const doctorId = user?.id || 2;
    
    // State for API data
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Dashboard data state
    const [doctorInfo, setDoctorInfo] = useState<DoctorInfo | null>(null);
    const [stats, setStats] = useState<DashboardStats>({
        total_sessions: 0,
        pending: 0,
        confirmed: 0,
        open_records: 0,
    });
    const [todaysAppointments, setTodaysAppointments] = useState<AppointmentData[]>([]);
    const [appointmentsByDate, setAppointmentsByDate] = useState<AppointmentsByDate>({});
    
    // UI state
    const [selectedPatient, setSelectedPatient] = useState<AppointmentData | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [selectedDateAppointments, setSelectedDateAppointments] = useState<AppointmentData[]>([]);

    // Fetch dashboard data
    const fetchDashboardData = useCallback(async () => {
        try {
            setError(null);
            console.log('[Dashboard] Fetching dashboard data for doctor:', doctorId);
            const result = await getDoctorDashboard(doctorId) as ApiResponse<DashboardData>;
            console.log('[Dashboard] API Response:', result);
            
            if (result.success) {
                const { doctor, stats: apiStats, todays_appointments, appointments_by_date } = result.data;
                console.log('[Dashboard] Today appointments:', todays_appointments);
                console.log('[Dashboard] Appointments by date:', appointments_by_date);
                
                setDoctorInfo(doctor);
                setStats(apiStats);
                setTodaysAppointments(todays_appointments);
                setAppointmentsByDate(appointments_by_date);
                
                // Set initial selected patient if available
                if (todays_appointments.length > 0) {
                    setSelectedPatient(todays_appointments[0]);
                }
                
                // Set appointments for selected date
                const todayStr = new Date().toISOString().split('T')[0];
                setSelectedDateAppointments(appointments_by_date[todayStr] || []);
            } else {
                setError(result.error);
                Alert.alert('Error', result.error);
            }
        } catch (err) {
            const errorMessage = 'Failed to load dashboard data. Please check your connection.';
            setError(errorMessage);
            Alert.alert('Error', errorMessage);
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
            }
        } catch (err) {
            console.error('Error fetching appointments for date:', err);
        }
    }, [appointmentsByDate, doctorId]);

    // Initial data fetch - wait for auth to load first
    useEffect(() => {
        if (!authLoading) {
            console.log('[Dashboard] Auth loaded, fetching data for doctor ID:', doctorId);
            fetchDashboardData();
        }
    }, [fetchDashboardData, authLoading, doctorId]);

    // Auto-refresh every 30 seconds to get new appointments from receptionist
    useEffect(() => {
        const intervalId = setInterval(() => {
            console.log('[Dashboard] Auto-refreshing data...');
            fetchDashboardData();
        }, 30000); // 30 seconds

        return () => clearInterval(intervalId);
    }, [fetchDashboardData]);

    // Fetch appointments when selected date changes
    useEffect(() => {
        if (selectedDate) {
            fetchAppointmentsForDate(selectedDate);
        }
    }, [selectedDate, fetchAppointmentsForDate]);

    // Pull to refresh
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchDashboardData();
    }, [fetchDashboardData]);

    // Filter today's appointments based on search and status
    const filteredPatients = useMemo(() => {
        let results = todaysAppointments;

        if (filterStatus !== 'All') {
            results = results.filter(p => p.status === filterStatus);
        }

        if (searchTerm) {
            const lowerCaseSearch = searchTerm.toLowerCase();
            results = results.filter(p => 
                p.name.toLowerCase().includes(lowerCaseSearch) ||
                p.service.toLowerCase().includes(lowerCaseSearch)
            );
        }

        return results;
    }, [todaysAppointments, searchTerm, filterStatus]);

    // Calculate marked dates for calendar
    const markedDates = useMemo(() => {
        return Object.keys(appointmentsByDate).reduce((acc: Record<string, any>, date: string) => {
            acc[date] = { marked: true, dotColor: PRIMARY_LIGHT };
            return acc;
        }, {});
    }, [appointmentsByDate]);

    // Handle date selection
    const handleDatePress = (day: { dateString: string }) => {
        setSelectedDate(day.dateString);
    };

    // Loading state - wait for both auth and data to load
    if (authLoading || loading) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color={PRIMARY_DARK} />
                <Text style={styles.loadingText}>{authLoading ? 'Checking authentication...' : 'Loading dashboard...'}</Text>
            </View>
        );
    }

    // Error state with retry
    if (error && !doctorInfo) {
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

    const doctorName = doctorInfo?.name || 'Doctor';

    return (
        <View style={styles.container}>
            {/* LEFT PANEL - MAIN CONTENT */}
            <ScrollView 
                style={styles.mainContent} 
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
                
                {/* IMPROVED HEADER & QUICK STATS */}
                <View style={[styles.mainHeaderCard, styles.cardShadow]}>
                    <View style={styles.headerTopRow}>
                        <View>
                            <Text style={styles.greetingTitle}>👋 Welcome back, Dr. {doctorName}</Text>
                            <Text style={styles.greetingDate}>Today is {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                        </View>
                        {/* QUICK ADD BUTTON linked to the AddPatient screen */}
                        

                        <TouchableOpacity 
                            style={styles.quickActionButton} 
                            // CHANGE THIS LINE to use the correct nested path:
                            onPress={() => router.push('/receptionist/add-patient')}
                        >
                            <Ionicons name="person-add-outline" size={24} color="#fff" />
                            <Text style={styles.quickActionButtonText}>New Patient</Text>
                        </TouchableOpacity>

                    </View>

                    <View style={styles.headerDivider} />

                    {/* INTEGRATED STATS */}
                    <View style={styles.statsContainerIntegrated}>
                        <StatItem 
                            icon="people-outline"
                            label="Total Sessions"
                            value={stats.total_sessions}
                            color={PRIMARY_DARK}
                        />
                        <StatItem 
                            icon="timer-outline"
                            label="Pending"
                            value={stats.pending}
                            color={PENDING_COLOR}
                        />
                        <StatItem 
                            icon="checkmark-circle-outline"
                            label="Confirmed"
                            value={stats.confirmed}
                            color={CONFIRMED_COLOR}
                        />
                        <StatItem 
                            icon="document-text-outline"
                            label="Open Records"
                            value={stats.open_records} 
                            color={PRIMARY_LIGHT}
                        />
                    </View>
                </View>

                {/* TODAY'S PATIENTS LIST (TABLE) */}
                <View style={[styles.tableContainer, styles.cardShadow]}>
                    <Text style={styles.sectionTitle}>Today's Appointments</Text>
                    
                    {/* SEARCH AND FILTER BAR */}
                    <View style={styles.searchFilterBar}>
                        <View style={styles.searchContainer}>
                            <Feather name="search" size={18} color="#999" style={{ marginRight: 8 }} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search by name or service..."
                                value={searchTerm}
                                onChangeText={setSearchTerm}
                                placeholderTextColor="#999"
                            />
                        </View>
                        <StatusFilterButton
                            label="All"
                            currentFilter={filterStatus}
                            setFilter={setFilterStatus}
                            defaultColor={PRIMARY_DARK}
                        />
                        <StatusFilterButton
                            label="Pending"
                            currentFilter={filterStatus}
                            setFilter={setFilterStatus}
                            defaultColor={PENDING_COLOR}
                        />
                        <StatusFilterButton
                            label="Confirmed"
                            currentFilter={filterStatus}
                            setFilter={setFilterStatus}
                            defaultColor={CONFIRMED_COLOR}
                        />
                    </View>
                    
                    <View style={styles.tableHeaderRow}>
                        <Text style={[styles.tableCellHeader, { flex: 2 }]}>Patient Name</Text>
                        <Text style={styles.tableCellHeader}>Service</Text>
                        <Text style={styles.tableCellHeader}>Time</Text>
                        <Text style={[styles.tableCellHeader, { flex: 1.5 }]}>Status</Text>
                        <Text style={[styles.tableCellHeader, { flex: 0.5 }]}></Text>
                    </View>

                    {filteredPatients.length > 0 ? (
                        filteredPatients.map((p) => (
                            <TouchableOpacity
                                key={p.id}
                                style={[
                                    styles.tableRow,
                                    selectedPatient?.id === p.id ? styles.selectedRow : null,
                                ]}
                                onPress={() => {
                                    setSelectedPatient(p);
                                    router.push(`/doctor/patient-page/${p.patient_id}`);
                                }}
                            >
                                <Text style={[styles.tableCell, { flex: 2, fontWeight: '500', color: PRIMARY_DARK }]}>{p.name}</Text>
                                <Text style={styles.tableCell}>{p.service}</Text>
                                <Text style={styles.tableCell}>{p.time}</Text>
                                <View style={[styles.tableCell, { flex: 1.5 }]}>
                                    <Text style={[
                                        styles.statusBadge,
                                        p.status === 'Confirmed' ? styles.statusConfirmed : styles.statusPending
                                    ]}>
                                        {p.status}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.openRecordButton}
                                    onPress={(e) => {
                                        e.stopPropagation(); 
                                        router.push(`/doctor/patient-page/${p.patient_id}`);
                                    }}
                                >
                                    <Ionicons name="arrow-forward-circle" size={24} color={PRIMARY_DARK} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.openRecordButton, { marginLeft: 8 }]}
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        router.push(`/receptionist/book-appointment?appointmentId=${p.id}`);
                                    }}
                                >
                                    <Ionicons name="create-outline" size={20} color={PRIMARY_DARK} />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={styles.noResultsContainer}>
                            <Ionicons name="calendar-outline" size={32} color="#999" />
                            <Text style={styles.noResultsText}>
                                {todaysAppointments.length === 0 
                                    ? 'No appointments scheduled for today.' 
                                    : 'No patients found matching the criteria.'}
                            </Text>
                        </View>
                    )}

                </View>
            </ScrollView>

            {/* RIGHT PANEL - CALENDAR & APPOINTMENTS */}
            <View style={[styles.rightPanel, styles.cardShadow]}>
                <Text style={styles.sectionTitle}>Appointments Calendar</Text>

                <Calendar
                    onDayPress={handleDatePress}
                    markedDates={{
                        [selectedDate]: { selected: true, selectedColor: PRIMARY_DARK, selectedTextColor: '#fff' },
                        ...markedDates, // Use the pre-calculated markedDates object
                    }}
                    theme={{
                        selectedDayBackgroundColor: PRIMARY_DARK,
                        todayTextColor: PRIMARY_LIGHT,
                        arrowColor: PRIMARY_DARK,
                        textDayFontWeight: '500',
                        textMonthFontWeight: 'bold',
                        textDayHeaderFontWeight: '600',
                        dotColor: PRIMARY_LIGHT,
                    }}
                    style={styles.calendarStyle}
                />

                <View style={styles.dateAppointmentsHeader}>
                    <Text style={styles.dateAppointmentsTitle}>
                      Appointments on
                    </Text>
                    <Text style={styles.dateAppointmentsDate}>{selectedDate}</Text>
                </View>

                <ScrollView style={styles.appointmentsList}>
                    {selectedDateAppointments.length > 0 ? (
                        // FIX 3: Explicitly typing the app variable in map function
                        selectedDateAppointments.map((app: AppointmentData) => ( 
                            <TouchableOpacity key={app.id} style={styles.appointmentCard}
                                onPress={() => router.push(`/doctor/patient-page/${app.patient_id}`)}
                            >
                                <View style={styles.timeBadge}>
                                    <Text style={styles.timeText}>{app.time}</Text>
                                </View>
                                <View style={styles.appointmentDetails}>
                                    <Text style={styles.appointmentName}>{app.name}</Text>
                                    <Text style={styles.appointmentService}>{app.service}</Text>
                                </View>
                                <Ionicons name="chevron-forward-outline" size={20} color={PRIMARY_DARK} />
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={styles.noAppointmentsContainer}>
                            <Ionicons name="information-circle-outline" size={20} color="#666" />
                            <Text style={styles.noAppointmentsText}>No appointments scheduled for this date.</Text>
                        </View>
                    )}
                </ScrollView>
            </View>
        </View>
    );
}

// Reusable Stat Item Component
// FIX 4: Apply StatItemProps type
const StatItem: React.FC<StatItemProps> = ({ icon, label, value, color }) => (
    <View style={styles.statItem}>
        <Ionicons name={icon} size={28} color={color} />
        <Text style={[styles.statItemValue, { color }]}>{value}</Text>
        <Text style={styles.statItemLabel}>{label}</Text>
    </View>
);

// Reusable Filter Button Component
// FIX 5: Apply StatusFilterButtonProps type
const StatusFilterButton: React.FC<StatusFilterButtonProps> = ({ label, currentFilter, setFilter, defaultColor }) => {
    const isSelected = currentFilter === label;
    const color = isSelected ? '#fff' : defaultColor;
    const backgroundColor = isSelected ? defaultColor : '#fff';

    return (
        <TouchableOpacity 
            style={[styles.filterButton, { backgroundColor, borderColor: defaultColor }]}
            onPress={() => setFilter(label)}
        >
            <Text style={[styles.filterButtonText, { color }]}>{label}</Text>
        </TouchableOpacity>
    );
};

// ... (Styles remain the same)
const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#FAFAFA' },
  mainContent: { flex: 1, padding: 25 },
  cardShadow: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 6 },
  
  // --- HEADER CARD STYLES ---
  mainHeaderCard: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 25, 
    marginBottom: 20 
  },
  headerTopRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 15 
  },
  greetingTitle: { 
    fontSize: 26, 
    fontWeight: '700', 
    color: PRIMARY_DARK 
  },
  greetingDate: { 
    fontSize: 14, 
    color: '#666', 
    marginTop: 4 
  },
  quickActionButton: { 
    backgroundColor: PRIMARY_LIGHT, 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 15, 
    paddingVertical: 10, 
    borderRadius: 10,
  },
  quickActionButtonText: { 
    color: '#fff', 
    fontWeight: '600', 
    fontSize: 14, 
    marginLeft: 8 
  },
  headerDivider: { 
    height: 1, 
    backgroundColor: '#F0F0F0', 
    marginBottom: 15 
  },
  statsContainerIntegrated: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  statItemValue: { 
    fontSize: 24, 
    fontWeight: 'bold', 
  },
  statItemLabel: { 
    marginTop: 2, 
    color: '#666', 
    fontSize: 12, 
    textAlign: 'center' 
  },

  // --- TABLE & FILTER STYLES ---
  tableContainer: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginTop: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 15, color: PRIMARY_DARK },
  searchFilterBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, flexWrap: 'wrap', gap: 10 },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F0F0', borderRadius: 10, paddingHorizontal: 15, paddingVertical: 8, minWidth: 250 },
  searchInput: { flex: 1, fontSize: 16, color: '#333' },
  filterButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  filterButtonText: { fontWeight: '600', fontSize: 14 },
  tableHeaderRow: { flexDirection: 'row', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#E0E0E0', marginBottom: 10, backgroundColor: '#F9F9F9', borderRadius: 4, paddingHorizontal: 10 },
  tableCellHeader: { flex: 1, textAlign: 'center', fontWeight: 'bold', color: '#444', fontSize: 14 },
  tableRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', alignItems: 'center', borderRadius: 8, paddingHorizontal: 10 },
  selectedRow: { backgroundColor: SECONDARY_BG, borderColor: PRIMARY_LIGHT, borderWidth: 1 }, 
  tableCell: { flex: 1, textAlign: 'center', color: '#333' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, color: '#fff', fontWeight: 'bold', textAlign: 'center', minWidth: 90, fontSize: 12 },
  statusConfirmed: { backgroundColor: CONFIRMED_COLOR }, 
  statusPending: { backgroundColor: PENDING_COLOR }, 
  openRecordButton: { flex: 0.5, alignItems: 'flex-end', paddingRight: 5 },
  noResultsContainer: { padding: 20, alignItems: 'center', justifyContent: 'center' },
  noResultsText: { color: '#666', fontSize: 16 },

  // --- RIGHT PANEL STYLES ---
  rightPanel: { width: 350, backgroundColor: '#fff', padding: 20, borderLeftWidth: 1, borderLeftColor: '#E0E0E0' },
  calendarStyle: { borderRadius: 12, borderWidth: 1, borderColor: '#E0E0E0' },
  dateAppointmentsHeader: { marginTop: 20, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  dateAppointmentsTitle: { fontSize: 16, fontWeight: '600', color: '#444' },
  dateAppointmentsDate: { fontSize: 16, fontWeight: 'bold', color: PRIMARY_DARK, marginLeft: 5 },
  appointmentsList: { maxHeight: 350 },
  appointmentCard: { padding: 15, marginVertical: 6, backgroundColor: '#FAFAFA', borderRadius: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#EBEBEB' },
  timeBadge: { backgroundColor: PRIMARY_DARK, padding: 8, borderRadius: 8, marginRight: 15, minWidth: 75, alignItems: 'center' },
  timeText: { color: '#fff', fontWeight: 'bold' },
  appointmentDetails: { flex: 1 },
  appointmentName: { fontWeight: '700', color: '#1A1A1A', fontSize: 16 },
  appointmentService: { color: PRIMARY_DARK, fontSize: 14, marginTop: 2 },
  noAppointmentsContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 15, justifyContent: 'center', padding: 10, backgroundColor: SECONDARY_BG, borderRadius: 8 },
  noAppointmentsText: { color: PRIMARY_DARK, marginLeft: 5, fontSize: 14 },
  // --- LOADING & ERROR STYLES ---
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' },
  loadingText: { marginTop: 15, fontSize: 16, color: '#666' },
  errorText: { marginTop: 15, fontSize: 16, color: '#e74c3c', textAlign: 'center', paddingHorizontal: 20 },
  retryButton: { marginTop: 20, backgroundColor: PRIMARY_LIGHT, paddingHorizontal: 25, paddingVertical: 12, borderRadius: 10 },
  retryButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },});