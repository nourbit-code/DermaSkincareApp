import { useRouter } from 'expo-router';
import { useState, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, TextInput } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons, Feather } from '@expo/vector-icons'; 

// --- TYPE DEFINITIONS (FIXES ts(7053), ts(7006), ts(7031)) ---

// Define the structure of a single appointment/patient entry
interface AppointmentData {
    id: number;
    name: string;
    service: string;
    time: string;
    status: 'Pending' | 'Confirmed' | 'Canceled'; // Added status for the main list
}

// Define the structure for the appointments grouped by date
// The key is a string (date), and the value is an array of AppointmentData
interface AppointmentsByDate {
    [key: string]: AppointmentData[];
}

// Define props for the StatItem component
interface StatItemProps {
    icon: keyof typeof Ionicons.glyphMap; // Ensures icon is a valid Ionicons name
    label: string;
    value: number;
    color: string;
}

// Define props for the Filter Button component
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

// --- DATA STRUCTURES ---
const patientsToday: AppointmentData[] = [ // Explicitly type the array
    { id: 1, name: "Ahmed Mohamed", service: "Laser", time: "10:00 AM", status: "Pending" },
    { id: 2, name: "Mona Ali", service: "Beauty", time: "11:30 AM", status: "Confirmed" },
    { id: 3, name: "Laila Hassan", service: "Diagnosis", time: "12:15 PM", status: "Pending" },
    { id: 4, name: "Youssef Karim", service: "Checkup", time: "01:00 PM", status: "Confirmed" },
    { id: 5, name: "Fatima Essam", service: "Treatment", time: "02:30 PM", status: "Pending" },
];

// Use the AppointmentsByDate interface
const appointmentsByDate: AppointmentsByDate = {
    "2025-12-01": [
        { id: 1, name: "Ahmed Mohamed", service: "Laser", time: "10:00 AM", status: "Pending" },
        { id: 2, name: "Mona Ali", service: "Beauty", time: "11:30 AM", status: "Confirmed" },
    ],
    "2025-12-02": [
        { id: 3, name: "Laila Hassan", service: "Diagnosis", time: "12:15 PM", status: "Pending" },
        { id: 4, name: "Youssef Karim", service: "Checkup", time: "01:00 PM", status: "Confirmed" },
    ],
};

export default function DoctorDashboard() {
    const router = useRouter();
    // Using the type from the data structure for initialization
    const [selectedPatient, setSelectedPatient] = useState<AppointmentData>(patientsToday[0]);
    const [selectedDate, setSelectedDate] = useState("2025-12-01");
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    // FIX 1: Accessing the appointmentsByDate object using selectedDate (a string key)
    // The AppointmentsByDate interface now explicitly allows string indexing.
    const todayAppointments: AppointmentData[] = appointmentsByDate[selectedDate] || [];

    const filteredPatients = useMemo(() => {
        let results = patientsToday;

        if (filterStatus !== 'All') {
            // TypeScript automatically knows p is AppointmentData here
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
    }, [searchTerm, filterStatus]);

    const totalSessions = patientsToday.length;
    const pendingDiagnosis = patientsToday.filter(p => p.status === 'Pending').length;
    const confirmedPatients = patientsToday.filter(p => p.status === 'Confirmed').length;

    // FIX 2: Explicitly typing the date variable in reduce function
    const markedDates = Object.keys(appointmentsByDate).reduce((acc: Record<string, any>, date: string) => {
        acc[date] = { marked: true, dotColor: PRIMARY_LIGHT };
        return acc;
    }, {});

    return (
        <View style={styles.container}>
            {/* LEFT PANEL - MAIN CONTENT */}
            <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false}>
                
                {/* IMPROVED HEADER & QUICK STATS */}
                <View style={[styles.mainHeaderCard, styles.cardShadow]}>
                    <View style={styles.headerTopRow}>
                        <View>
                            <Text style={styles.greetingTitle}>👋 Welcome back, Dr. Nour</Text>
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
                            value={totalSessions}
                            color={PRIMARY_DARK}
                        />
                        <StatItem 
                            icon="timer-outline"
                            label="Pending"
                            value={pendingDiagnosis}
                            color={PENDING_COLOR}
                        />
                        <StatItem 
                            icon="checkmark-circle-outline"
                            label="Confirmed"
                            value={confirmedPatients}
                            color={CONFIRMED_COLOR}
                        />
                        <StatItem 
                            icon="document-text-outline"
                            label="Open Records"
                            value={56} 
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
                                    selectedPatient.id === p.id ? styles.selectedRow : null,
                                ]}
                                onPress={() => router.push(`/doctor/patient-page/${p.id}`)}
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
                                        router.push(`/doctor/patient-page/${p.id}`);
                                    }}
                                >
                                    <Ionicons name="arrow-forward-circle" size={24} color={PRIMARY_DARK} />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={styles.noResultsContainer}>
                            <Text style={styles.noResultsText}>No patients found matching the criteria.</Text>
                        </View>
                    )}

                </View>
            </ScrollView>

            {/* RIGHT PANEL - CALENDAR & APPOINTMENTS */}
            <View style={[styles.rightPanel, styles.cardShadow]}>
                <Text style={styles.sectionTitle}>Appointments Calendar</Text>

                <Calendar
                    onDayPress={(day) => setSelectedDate(day.dateString)}
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
                    {todayAppointments.length > 0 ? (
                        // FIX 3: Explicitly typing the app variable in map function
                        todayAppointments.map((app: AppointmentData) => ( 
                            <TouchableOpacity key={app.id} style={styles.appointmentCard}
                                onPress={() => router.push(`/doctor/patient-page/${app.id}`)}
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
});