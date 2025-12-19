import React, { useState, useMemo, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { Link, useRouter } from "expo-router";
import { Ionicons, Feather } from '@expo/vector-icons'; 
import { Calendar } from 'react-native-calendars'; 
import { getReceptionistDashboard } from '../../src/api/receptionistApi';
import { useAuth } from '../context/AuthContext';

// --- TYPE DEFINITIONS ---
interface AppointmentData {
    patient: string;
    service: string;
    time: string;
    status: 'Pending' | 'Confirmed' | 'Checked In' | 'Canceled';
    id: number;
    patient_id?: number;
    doctor?: string;
}

interface AppointmentsByDate {
    [key: string]: AppointmentData[];
}

interface DashboardStats {
    total_appointments: number;
    pending: number;
    confirmed: number;
    checked_in: number;
    total_patients: number;
}

interface ReceptionistInfo {
    id: number;
    name: string;
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
    receptionist: ReceptionistInfo;
    stats: DashboardStats;
    todays_appointments: AppointmentData[];
    appointments_by_date: AppointmentsByDate;
}

// --- STRICT COLOR PALETTE ---
const PRIMARY_DARK = '#9B084D'; // Maroon/Dark Pink (Text, Headers, Calendar Select)
const PRIMARY_LIGHT = '#E80A7A'; // Bright Pink (Main Row Accent, Quick Actions)
const WHITE = '#FFFFFF';
const GRAY_BG = '#F7F7F7'; // Clean background for the main screen
const BORDER_LIGHT = '#E0E0E0';
const TEXT_DARK = '#333333';
const TEXT_MEDIUM = '#666666';

// --- STATUS COLORS (Matching Image Colors) ---
const STATUS_PENDING_BG = '#FFB800'; // Orange/Amber
const STATUS_CONFIRMED_BG = '#30AD4F'; // Bright Green
const STATUS_CHECKED_IN_BG = PRIMARY_LIGHT; // Using primary light for Checked In

const getTodayDate = () => new Date().toISOString().split('T')[0];

export default function ReceptionistDashboard() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const receptionistId = user?.id || 1; // Fallback to 1 if not logged in
    
    // State for API data
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Dashboard data state
    const [receptionistInfo, setReceptionistInfo] = useState<ReceptionistInfo | null>(null);
    const [stats, setStats] = useState<DashboardStats>({
        total_appointments: 0,
        pending: 0,
        confirmed: 0,
        checked_in: 0,
        total_patients: 0,
    });
    const [todaysAppointments, setTodaysAppointments] = useState<AppointmentData[]>([]);
    const [appointmentsByDate, setAppointmentsByDate] = useState<AppointmentsByDate>({});
    
    // UI state
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [selectedDate, setSelectedDate] = useState(getTodayDate());
    
    const appointmentsOnSelectedDate: AppointmentData[] = appointmentsByDate[selectedDate] || [];

    // Fetch dashboard data
    const fetchDashboardData = useCallback(async () => {
        try {
            setError(null);
            console.log('[ReceptionistDashboard] Fetching dashboard data...');
            const result = await getReceptionistDashboard(receptionistId) as ApiResponse<DashboardData>;
            console.log('[ReceptionistDashboard] API Response:', result);
            
            if (result.success) {
                const { receptionist, stats: apiStats, todays_appointments, appointments_by_date } = result.data;
                console.log('[ReceptionistDashboard] Today appointments:', todays_appointments);
                console.log('[ReceptionistDashboard] Appointments by date:', appointments_by_date);
                
                setReceptionistInfo(receptionist);
                setStats(apiStats);
                setTodaysAppointments(todays_appointments);
                setAppointmentsByDate(appointments_by_date);
            } else {
                setError(result.error);
                Alert.alert('Error', result.error);
            }
        } catch (err) {
            const errorMessage = 'Failed to load dashboard data. Please check your connection.';
            setError(errorMessage);
            console.error('[ReceptionistDashboard] Error:', err);
            Alert.alert('Error', errorMessage);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [receptionistId]);

    // Initial data fetch - wait for auth to load first
    useEffect(() => {
        if (!authLoading) {
            console.log('[ReceptionistDashboard] Auth loaded, fetching data for receptionist ID:', receptionistId);
            fetchDashboardData();
        }
    }, [fetchDashboardData, authLoading, receptionistId]);

    // Auto-refresh every 30 seconds to sync with doctor changes
    useEffect(() => {
        const intervalId = setInterval(() => {
            console.log('[Receptionist Dashboard] Auto-refreshing data...');
            fetchDashboardData();
        }, 30000); // 30 seconds

        return () => clearInterval(intervalId);
    }, [fetchDashboardData]);

    // Pull to refresh
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchDashboardData();
    }, [fetchDashboardData]);

    // Helper functions for status colors (MAIN LIST)
    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Confirmed': return { backgroundColor: STATUS_CONFIRMED_BG };
            case 'Pending': return { backgroundColor: STATUS_PENDING_BG };
            case 'Checked In': return { backgroundColor: STATUS_CHECKED_IN_BG };
            default: return { backgroundColor: STATUS_PENDING_BG };
        }
    };
    
    // Helper function for calendar list status text color
    const getCalendarStatusTextColor = (status: string) => {
        switch (status) {
            case 'Confirmed': return STATUS_CONFIRMED_BG;
            case 'Pending': return STATUS_PENDING_BG;
            case 'Checked In': return PRIMARY_DARK;
            default: return TEXT_MEDIUM;
        }
    };

    // --- Filtering Logic (Based on Search and Status Filter) ---
    const filteredAppointments = useMemo(() => {
        let results = todaysAppointments;

        // 1. Status Filtering
        if (filterStatus !== 'All') {
            results = results.filter(appt => appt.status === filterStatus);
        }

        // 2. Search Filtering
        if (searchTerm) {
            const lowerCaseSearch = searchTerm.toLowerCase();
            results = results.filter(appt => 
                appt.patient.toLowerCase().includes(lowerCaseSearch) ||
                appt.service.toLowerCase().includes(lowerCaseSearch)
            );
        }
        return results;
    }, [todaysAppointments, searchTerm, filterStatus]);

    // Calendar Marking Logic
    const calendarMarkedDates = useMemo(() => {
        const marked = Object.keys(appointmentsByDate).reduce((acc: Record<string, any>, date: string) => {
            acc[date] = { marked: true, dotColor: PRIMARY_LIGHT };
            return acc;
        }, {});
        if (selectedDate) {
            marked[selectedDate] = { 
                ...(marked[selectedDate] || {}),
                selected: true, 
                selectedColor: PRIMARY_DARK, 
                selectedTextColor: WHITE 
            };
        }
        return marked;
    }, [appointmentsByDate, selectedDate]);
    
    // --- Filter Button Component ---
    const FilterButton: React.FC<{ label: string, status: string }> = ({ label, status }) => {
        const isActive = filterStatus === status;
        let colorStyle = {};
        
        switch(status) {
            case 'Pending': colorStyle = { backgroundColor: STATUS_PENDING_BG }; break;
            case 'Confirmed': colorStyle = { backgroundColor: STATUS_CONFIRMED_BG }; break;
            case 'All': colorStyle = { backgroundColor: PRIMARY_DARK }; break;
        }

        return (
            <TouchableOpacity 
                style={[
                    styles.filterButton, 
                    isActive ? colorStyle : styles.filterButtonInactive
                ]}
                onPress={() => setFilterStatus(status)}
            >
                <Text style={[styles.filterButtonText, isActive ? {color: WHITE} : {color: TEXT_DARK}]}>
                    {label}
                </Text>
            </TouchableOpacity>
        );
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
    if (error && !receptionistInfo) {
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

    const receptionistName = receptionistInfo?.name || 'Receptionist';

    return (
        <View style={styles.container}>
            {/* Main Content (Left Side) */}
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
                
                {/* 1. PROFESSIONAL GREETING CARD (RETAINED FROM PREVIOUS VERSION) */}
                <View style={[styles.greetingCardUpper, styles.cardShadow]}>
                    <Text style={styles.greetingTitleUpper}>Welcome back, {receptionistName} 👋</Text>
                    <Text style={styles.greetingSubtitleUpper}>Today's Appointment Load: {stats.total_appointments} sessions</Text>
                    
                    <View style={styles.quickActions}>
                        <Link href="/receptionist/book-appointment" asChild>
                            <TouchableOpacity style={styles.actionBtn}>
                                <Ionicons name="calendar-outline" color={WHITE} size={20} />
                                <Text style={styles.actionText}>Book Appointment</Text>
                            </TouchableOpacity>
                        </Link>

                        <Link href="/receptionist/add-patient" asChild>
                            <TouchableOpacity style={styles.actionBtn}>
                                <Ionicons name="person-add-outline" color={WHITE} size={20} />
                                <Text style={styles.actionText}>Add Patient</Text>
                            </TouchableOpacity>
                        </Link>

                        <Link href="/receptionist/payments" asChild>
                            <TouchableOpacity style={styles.actionBtn}>
                                <Ionicons name="card-outline" color={WHITE} size={20} />
                                <Text style={styles.actionText}>Process Payment</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>
                <View style={styles.spacer} />
                
                {/* 2. TODAY'S APPOINTMENTS HEADER (FROM IMAGE) */}
                <View style={styles.greetingCardImageStyle}>
                    <Text style={styles.greetingTitleImageStyle}>Today's Appointments</Text>
                </View>


                {/* 3. MAIN APPOINTMENT LIST CONTAINER (IMAGE REPLICATION) */}
                <View style={[styles.mainListContainer, styles.cardShadow]}>
                    
                    {/* Search and Filter Bar */}
                    <View style={styles.topBar}>
                        <View style={styles.searchBar}>
                            <Feather name="search" color={TEXT_MEDIUM} size={18} style={{ marginHorizontal: 10 }} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search by name or service..."
                                placeholderTextColor={TEXT_MEDIUM}
                                value={searchTerm}
                                onChangeText={setSearchTerm}
                            />
                        </View>
                        <View style={styles.filterGroup}>
                            <FilterButton label="All" status="All" />
                            <FilterButton label="Pending" status="Pending" />
                            <FilterButton label="Confirmed" status="Confirmed" />
                        </View>
                    </View>

                    {/* Table Header (Simplified & Styled) */}
                    <View style={styles.tableHeader}>
                        <Text style={[styles.headerCellText, styles.colPatient]}>Patient Name</Text>
                        <Text style={[styles.headerCellText, styles.colService]}>Service</Text>
                        <Text style={[styles.headerCellText, styles.colTime]}>Time</Text>
                        <Text style={[styles.headerCellText, styles.colStatus]}>Status</Text>
                        <View style={styles.colActionPlaceholder} />
                    </View>

                    {/* Appointment Rows (Image Replication) */}
                    {filteredAppointments.map((appt) => (
                        <View 
                            key={appt.id} 
                            style={[
                                styles.rowCard,
                                // Highlight the first row exactly like the image
                                appt.id === 101 ? styles.rowCardHighlighted : {} 
                            ]}
                        >
                            <Text style={[styles.rowText, styles.colPatient, styles.patientNameText]}>{appt.patient}</Text>
                            <Text style={[styles.rowText, styles.colService]}>{appt.service}</Text>
                            <Text style={[styles.rowText, styles.colTime]}>{appt.time}</Text>
                            
                            <View style={[styles.colStatus, styles.statusContainer]}>
                                <View
                                    style={[
                                        styles.statusBadge,
                                        getStatusStyle(appt.status),
                                    ]}
                                >
                                    <Text style={styles.statusBadgeText}>
                                        {appt.status}
                                    </Text>
                                </View>
                            </View>
                            
                            <TouchableOpacity style={styles.colAction}>
                                <Ionicons name="arrow-forward-sharp" size={20} color={PRIMARY_DARK} />
                            </TouchableOpacity>
                        </View>
                    ))}
                    
                    {filteredAppointments.length === 0 && (
                        <View style={styles.noResults}>
                            <Text style={styles.noResultsText}>No appointments match your criteria.</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Right Panel - Calendar & Appointments (NARROWER & PROFESSIONAL) */}
            <View style={[styles.rightPanel, styles.cardShadow]}>
                <Text style={styles.panelTitle}>December 2025</Text> 

                {/* --- CALENDAR INTEGRATION --- */}
                <Calendar
                    onDayPress={(day) => setSelectedDate(day.dateString)}
                    markedDates={calendarMarkedDates}
                    theme={{
                        selectedDayBackgroundColor: PRIMARY_DARK,
                        todayTextColor: PRIMARY_DARK,
                        arrowColor: PRIMARY_DARK,
                        textDayFontWeight: '600',
                        textMonthFontWeight: 'bold',
                        textDayHeaderFontWeight: '700',
                        dotColor: PRIMARY_LIGHT,
                        calendarBackground: WHITE,
                    }}
                    style={styles.calendarStyle}
                />
                {/* --- */}

                <View style={styles.dateAppointmentsHeader}>
                    <Text style={styles.dateAppointmentsDate}>Appointments on {selectedDate}</Text>
                </View>

                {/* Scrollable List for Selected Date - PROFESSIONAL LIST */}
                <ScrollView style={styles.appointmentsList}>
                    {appointmentsOnSelectedDate.length > 0 ? (
                        appointmentsOnSelectedDate.map((app: AppointmentData) => ( 
                            // Non-clickable View element
                            <View 
                                key={app.id} 
                                style={[styles.appointmentCardModern, { borderLeftColor: PRIMARY_DARK }]}
                            >
                                <View style={styles.timeBadgeModern}>
                                    <Text style={styles.timeTextModern}>{app.time}</Text>
                                    <Text style={styles.appointmentServiceModern}>{app.service}</Text>
                                </View>
                                
                                <View style={styles.appointmentDetailsModern}>
                                    <Text style={styles.appointmentNameModern}>{app.patient}</Text>
                                    <Text 
                                        style={[
                                            styles.appointmentStatusModern, 
                                            { color: getCalendarStatusTextColor(app.status) }
                                        ]}
                                    >
                                        {app.status}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward-sharp" size={20} color={PRIMARY_DARK} />
                            </View>
                        ))
                    ) : (
                        <View style={styles.noAppointmentsContainer}>
                            <Ionicons name="information-circle-outline" size={18} color={TEXT_MEDIUM} />
                            <Text style={styles.noAppointmentsText}>No sessions scheduled for this date.</Text>
                        </View>
                    )}
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    // --- General Styles ---
    container: {
        flex: 1,
        flexDirection: "row",
        backgroundColor: GRAY_BG,
    },
    mainContent: {
        flex: 1,
        padding: 25,
    },
    cardShadow: {
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 5, 
        elevation: 3 
    },
    spacer: {
        height: 10,
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: TEXT_MEDIUM,
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
        color: WHITE,
        fontSize: 16,
        fontWeight: '600',
    },
    
    // --- 1. Upper Greeting Card (Retained Professional Look) ---
    greetingCardUpper: {
        backgroundColor: WHITE,
        padding: 25,
        borderRadius: 12,
    },
    greetingTitleUpper: {
        fontSize: 24,
        fontWeight: "700",
        color: PRIMARY_DARK,
    },
    greetingSubtitleUpper: {
        fontSize: 16,
        color: TEXT_MEDIUM,
        marginTop: 5,
        marginBottom: 20,
    },
    quickActions: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
    },
    actionBtn: {
        flex: 1,
        backgroundColor: PRIMARY_DARK,
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center",
        gap: 8,
    },
    actionText: {
        color: WHITE,
        fontWeight: "600",
        fontSize: 14,
    },

    // --- 2. Today's Appointments Header (Image Style) ---
    greetingCardImageStyle: {
        backgroundColor: GRAY_BG,
        padding: 0,
        borderRadius: 0,
        marginBottom: 10,
        marginTop: 10,
    },
    greetingTitleImageStyle: {
        fontSize: 24,
        fontWeight: "700",
        color: PRIMARY_DARK,
    },

    // --- 3. Main List Container (Image Replication) ---
    mainListContainer: {
        backgroundColor: WHITE,
        borderRadius: 12,
        paddingTop: 10,
        marginBottom: 20,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: BORDER_LIGHT,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: GRAY_BG,
        borderRadius: 20,
        paddingVertical: 2,
        flex: 1.5,
        marginRight: 15,
        height: 40,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 5,
        fontSize: 14,
        color: TEXT_DARK,
    },
    filterGroup: {
        flexDirection: 'row',
        flex: 1.5,
        justifyContent: 'flex-start',
        gap: 10,
    },
    filterButton: {
        paddingVertical: 6,
        paddingHorizontal: 15,
        borderRadius: 20,
    },
    filterButtonInactive: {
        backgroundColor: WHITE,
        borderWidth: 1,
        borderColor: BORDER_LIGHT,
    },
    filterButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    tableHeader: {
        flexDirection: "row",
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: BORDER_LIGHT,
        backgroundColor: WHITE,
        paddingHorizontal: 15,
    },
    headerCellText: {
        color: TEXT_MEDIUM,
        fontSize: 13,
        fontWeight: '600',
    },
    rowCard: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: GRAY_BG,
    },
    rowCardHighlighted: {
        backgroundColor: '#FFF5F8',
        borderRadius: 10,
        marginVertical: 4,
        borderWidth: 1,
        borderColor: PRIMARY_LIGHT,
        paddingVertical: 14,
    },
    rowText: {
        color: TEXT_DARK,
        fontSize: 14,
    },
    patientNameText: {
        color: PRIMARY_DARK, 
        fontWeight: '600',
    },

    // --- Column Widths (Adjusted for Image Layout) ---
    colPatient: { flex: 2.5, paddingLeft: 0, fontWeight: '500' },
    colService: { flex: 1.5 },
    colTime: { flex: 1 },
    colStatus: { flex: 1.5, alignItems: 'center' },
    colActionPlaceholder: { width: 40 },
    colAction: { width: 40, alignItems: 'center' },

    // Status Badge in Main Table (Image style)
    statusContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    statusBadge: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 4,
        minWidth: 90,
        alignItems: 'center',
    },
    statusBadgeText: {
        fontWeight: '600',
        fontSize: 13,
        color: WHITE,
    },
    
    noResults: {
        padding: 30,
        alignItems: 'center',
    },
    noResultsText: {
        color: TEXT_MEDIUM,
        fontSize: 15,
        fontStyle: 'italic',
    },

    // --- Right Panel (Calendar) Styles ---
    rightPanel: {
        width: 300, 
        backgroundColor: WHITE,
        padding: 15,
        borderLeftWidth: 1,
        borderLeftColor: BORDER_LIGHT,
    },
    panelTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: PRIMARY_DARK,
        marginBottom: 15,
    },
    calendarStyle: { 
        borderRadius: 10, 
        borderWidth: 1, 
        borderColor: BORDER_LIGHT,
        marginBottom: 15,
    },
    dateAppointmentsHeader: { 
        marginTop: 5, 
        marginBottom: 10, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'flex-start'
    },
    dateAppointmentsDate: { 
        fontSize: 15, 
        fontWeight: 'bold', 
        color: PRIMARY_DARK, 
    },
    appointmentsList: { 
        maxHeight: 450, 
    },

    // --- Appointment Card Modernization (Calendar List - Non-Clickable) ---
    appointmentCardModern: { 
        paddingVertical: 15, 
        paddingHorizontal: 10,
        marginVertical: 4, 
        backgroundColor: WHITE,
        borderRadius: 8, 
        flexDirection: 'row', 
        alignItems: 'center', 
        borderLeftWidth: 4, 
        borderLeftColor: PRIMARY_DARK,
        borderWidth: 1,
        borderColor: GRAY_BG,
    },
    timeBadgeModern: { 
        paddingVertical: 4,
        paddingHorizontal: 8,
        marginRight: 10, 
        minWidth: 60, 
        alignItems: 'center',
    },
    timeTextModern: { 
        color: PRIMARY_DARK, 
        fontWeight: '700',
        fontSize: 16,
    },
    appointmentDetailsModern: { 
        flex: 1 
    },
    appointmentNameModern: { 
        fontWeight: '700', 
        color: TEXT_DARK, 
        fontSize: 14,
        marginBottom: 2,
    },
    appointmentServiceModern: { 
        fontSize: 12,
        fontWeight: '500',
        color: TEXT_MEDIUM,
    },
    appointmentStatusModern: { 
        fontSize: 12, 
        fontWeight: '700',
        marginTop: 2,
    },
    noAppointmentsContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginTop: 10, 
        justifyContent: 'center', 
        padding: 10, 
        backgroundColor: GRAY_BG,
        borderRadius: 8 
    },
    noAppointmentsText: { 
        color: TEXT_MEDIUM, 
        marginLeft: 5, 
        fontSize: 13 
    },
});