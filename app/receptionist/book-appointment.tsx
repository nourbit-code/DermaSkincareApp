import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React, { Dispatch, SetStateAction, useState, useEffect } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getPatients, getDoctors, getServices, createAppointment, convertTo24Hour, getAppointments } from '../../src/api/appointmentApi';

// --- ENHANCED COLOR PALETTE ---
const PRIMARY_DARK = '#9B084D'; 
const PRIMARY_LIGHT = '#E80A7A'; 
const PRIMARY_GRADIENT_START = '#9B084D';
const PRIMARY_GRADIENT_END = '#E80A7A';
const ACCENT_PURPLE = '#6B21A8';
const BACKGROUND_GRADIENT_START = '#FDF2F8';
const BACKGROUND_GRADIENT_END = '#F3E8FF';
const CARD_BG = '#FFFFFF'; 
const INPUT_BG = '#FAFBFC';
const INPUT_BORDER = '#E5E7EB';
const INPUT_FOCUS_BORDER = '#E80A7A';
const SUCCESS_GREEN = '#10B981';
const WARNING_AMBER = '#F59E0B';
const ERROR_RED = '#EF4444';
const TEXT_PRIMARY = '#1F2937';
const TEXT_SECONDARY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';

// --- TypeScript Interfaces ---
interface Patient {
    patient_id: number;
    name: string;
    phone?: string;
}

interface Doctor {
    doctor_id: number;
    name: string;
    specialty?: string;
}

interface Service {
    service_id: number;
    service_name: string;
    category?: string;
    price?: number;
}

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

// --- Enhanced Input Component ---
interface EnhancedInputProps {
    label: string;
    iconName: keyof typeof Ionicons.glyphMap;
    placeholder?: string;
    value?: string;
    onChangeText?: Dispatch<SetStateAction<string>>;
    keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
    isPicker?: boolean;
    children?: React.ReactNode;
    required?: boolean;
}

const EnhancedInput: React.FC<EnhancedInputProps> = ({
    label,
    iconName,
    placeholder,
    value,
    onChangeText,
    keyboardType,
    isPicker = false,
    children,
    required = false,
}) => (
    <View style={styles.inputContainer}>
        <View style={styles.labelRow}>
            <Text style={styles.inputLabel}>{label}</Text>
            {required && <Text style={styles.requiredStar}>*</Text>}
        </View>
        <View style={styles.inputWrapper}>
            <View style={styles.iconContainer}>
                <Ionicons name={iconName} size={20} color={PRIMARY_DARK} />
            </View>
            {isPicker ? (
                <View style={styles.pickerContainer}>{children}</View>
            ) : (
                <TextInput
                    style={styles.inputField}
                    placeholder={placeholder}
                    value={value}
                    {...(onChangeText && { onChangeText: onChangeText })}
                    keyboardType={keyboardType || 'default'}
                    placeholderTextColor={TEXT_MUTED}
                />
            )}
        </View>
    </View>
);

// --- Enhanced Calendar Modal ---
interface CalendarModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectDate: (date: string) => void;
}

const CalendarModal: React.FC<CalendarModalProps> = ({ visible, onClose, onSelectDate }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const today = new Date();

    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const handleSelectDay = (day: number) => {
        const selected = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const year = selected.getFullYear();
        const month = String(selected.getMonth() + 1).padStart(2, '0');
        const date = String(selected.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${date}`;
        onSelectDate(formattedDate);
        onClose();
    };

    const isToday = (day: number) => {
        return (
            today.getDate() === day &&
            today.getMonth() === currentDate.getMonth() &&
            today.getFullYear() === currentDate.getFullYear()
        );
    };

    const isPastDay = (day: number) => {
        const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        return checkDate < todayStart;
    };

    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    const weeks: (number | null)[][] = [];
    let week: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
        week.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        week.push(day);
        if (week.length === 7) {
            weeks.push(week);
            week = [];
        }
    }

    if (week.length > 0) {
        while (week.length < 7) {
            week.push(null);
        }
        weeks.push(week);
    }

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={calendarStyles.overlay}>
                <View style={calendarStyles.container}>
                    <LinearGradient
                        colors={[PRIMARY_GRADIENT_START, PRIMARY_GRADIENT_END]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={calendarStyles.header}
                    >
                        <TouchableOpacity onPress={goToPreviousMonth} style={calendarStyles.navButton}>
                            <Ionicons name="chevron-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={calendarStyles.headerText}>{monthName}</Text>
                        <TouchableOpacity onPress={goToNextMonth} style={calendarStyles.navButton}>
                            <Ionicons name="chevron-forward" size={24} color="#fff" />
                        </TouchableOpacity>
                    </LinearGradient>

                    <View style={calendarStyles.calendarBody}>
                        <View style={calendarStyles.daysOfWeek}>
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                <Text key={day} style={calendarStyles.dayOfWeekText}>{day}</Text>
                            ))}
                        </View>

                        {weeks.map((weekData, weekIndex) => (
                            <View key={weekIndex} style={calendarStyles.week}>
                                {weekData.map((day, dayIndex) => {
                                    const past = day !== null && isPastDay(day);
                                    const todayCheck = day !== null && isToday(day);
                                    return (
                                        <TouchableOpacity
                                            key={dayIndex}
                                            style={[
                                                calendarStyles.day,
                                                day === null && calendarStyles.emptyDay,
                                                todayCheck && calendarStyles.todayDay,
                                                past && calendarStyles.pastDay,
                                            ]}
                                            onPress={() => day !== null && !past && handleSelectDay(day)}
                                            disabled={day === null || past}
                                        >
                                            {day !== null && (
                                                <Text style={[
                                                    calendarStyles.dayText,
                                                    todayCheck && calendarStyles.todayDayText,
                                                    past && calendarStyles.pastDayText,
                                                ]}>
                                                    {day}
                                                </Text>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ))}
                    </View>

                    <TouchableOpacity style={calendarStyles.closeBtn} onPress={onClose}>
                        <Text style={calendarStyles.closeBtnText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

// --- Enhanced Time Slot Modal ---
interface TimeSlotModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectTime: (time: string) => void;
    bookedTimes?: string[];
}

const TIME_SLOTS = [
    { time: '08:00 AM', period: 'Morning' },
    { time: '08:30 AM', period: 'Morning' },
    { time: '09:00 AM', period: 'Morning' },
    { time: '09:30 AM', period: 'Morning' },
    { time: '10:00 AM', period: 'Morning' },
    { time: '10:30 AM', period: 'Morning' },
    { time: '11:00 AM', period: 'Morning' },
    { time: '11:30 AM', period: 'Morning' },
    { time: '12:00 PM', period: 'Afternoon' },
    { time: '12:30 PM', period: 'Afternoon' },
    { time: '01:00 PM', period: 'Afternoon' },
    { time: '01:30 PM', period: 'Afternoon' },
    { time: '02:00 PM', period: 'Afternoon' },
    { time: '02:30 PM', period: 'Afternoon' },
    { time: '03:00 PM', period: 'Afternoon' },
    { time: '03:30 PM', period: 'Afternoon' },
    { time: '04:00 PM', period: 'Evening' },
    { time: '04:30 PM', period: 'Evening' },
    { time: '05:00 PM', period: 'Evening' },
    { time: '05:30 PM', period: 'Evening' },
];

// Helper to convert 24h time to 12h format for comparison
const convertTo12Hour = (time24: string): string => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
};

const TimeSlotModal: React.FC<TimeSlotModalProps> = ({ visible, onClose, onSelectTime, bookedTimes = [] }) => {
    const [selectedPeriod, setSelectedPeriod] = useState<string>('Morning');

    const handleSelectTime = (time: string) => {
        onSelectTime(time);
        onClose();
    };

    // Convert booked times to 12h format for comparison
    const bookedTimes12h = bookedTimes.map(t => convertTo12Hour(t));

    const isTimeBooked = (time: string): boolean => {
        return bookedTimes12h.includes(time);
    };

    const filteredSlots = TIME_SLOTS.filter(slot => slot.period === selectedPeriod);

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={timeStyles.overlay}>
                <View style={timeStyles.container}>
                    <LinearGradient
                        colors={[PRIMARY_GRADIENT_START, PRIMARY_GRADIENT_END]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={timeStyles.header}
                    >
                        <Ionicons name="time-outline" size={24} color="#fff" />
                        <Text style={timeStyles.headerText}>Select Time</Text>
                    </LinearGradient>

                    {/* Period Tabs */}
                    <View style={timeStyles.periodTabs}>
                        {['Morning', 'Afternoon', 'Evening'].map((period) => (
                            <TouchableOpacity
                                key={period}
                                style={[
                                    timeStyles.periodTab,
                                    selectedPeriod === period && timeStyles.periodTabActive,
                                ]}
                                onPress={() => setSelectedPeriod(period)}
                            >
                                <Ionicons
                                    name={period === 'Morning' ? 'sunny-outline' : period === 'Afternoon' ? 'partly-sunny-outline' : 'moon-outline'}
                                    size={16}
                                    color={selectedPeriod === period ? '#fff' : TEXT_SECONDARY}
                                />
                                <Text style={[
                                    timeStyles.periodTabText,
                                    selectedPeriod === period && timeStyles.periodTabTextActive,
                                ]}>
                                    {period}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Time Slots Grid */}
                    <ScrollView style={timeStyles.slotsContainer} showsVerticalScrollIndicator={false}>
                        <View style={timeStyles.slotsGrid}>
                            {filteredSlots.map((slot) => {
                                const booked = isTimeBooked(slot.time);
                                return (
                                    <TouchableOpacity
                                        key={slot.time}
                                        style={[timeStyles.timeSlot, booked && timeStyles.timeSlotBooked]}
                                        onPress={() => !booked && handleSelectTime(slot.time)}
                                        disabled={booked}
                                        activeOpacity={booked ? 1 : 0.7}
                                    >
                                        <Text style={[timeStyles.timeSlotText, booked && timeStyles.timeSlotTextBooked]}>
                                            {slot.time}
                                        </Text>
                                        {booked && (
                                            <Text style={timeStyles.bookedLabel}>Booked</Text>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </ScrollView>

                    <TouchableOpacity style={timeStyles.closeBtn} onPress={onClose}>
                        <Text style={timeStyles.closeBtnText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

// --- Enhanced Date/Time Picker Button ---
interface DatePickerButtonProps {
    label: string;
    iconName: keyof typeof Ionicons.glyphMap;
    value: string;
    onSelect: (newValue: string) => void;
    placeholder: string;
    required?: boolean;
    bookedTimes?: string[];
}

const DatePickerButton: React.FC<DatePickerButtonProps> = ({ label, iconName, value, onSelect, placeholder, required, bookedTimes = [] }) => {
    const [showModal, setShowModal] = useState(false);
    const isDatePicker = label.toLowerCase().includes('date');

    return (
        <>
            <View style={styles.inputContainer}>
                <View style={styles.labelRow}>
                    <Text style={styles.inputLabel}>{label}</Text>
                    {required && <Text style={styles.requiredStar}>*</Text>}
                </View>
                <TouchableOpacity
                    style={[styles.dateButton, value && styles.dateButtonFilled]}
                    onPress={() => setShowModal(true)}
                    activeOpacity={0.7}
                >
                    <View style={styles.iconContainer}>
                        <Ionicons name={iconName} size={20} color={value ? PRIMARY_DARK : TEXT_MUTED} />
                    </View>
                    <Text style={[styles.dateButtonText, !value && styles.dateButtonPlaceholder]}>
                        {value || placeholder}
                    </Text>
                    <View style={styles.chevronContainer}>
                        <Ionicons name="chevron-down" size={18} color={TEXT_MUTED} />
                    </View>
                </TouchableOpacity>
            </View>

            {isDatePicker ? (
                <CalendarModal visible={showModal} onClose={() => setShowModal(false)} onSelectDate={onSelect} />
            ) : (
                <TimeSlotModal visible={showModal} onClose={() => setShowModal(false)} onSelectTime={onSelect} bookedTimes={bookedTimes} />
            )}
        </>
    );
};

// --- Status Badge Component ---
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const getStatusConfig = () => {
        switch (status) {
            case 'booked': return { color: WARNING_AMBER, bg: '#FEF3C7', icon: 'time-outline' as const, label: 'Booked' };
            case 'checked_in': return { color: SUCCESS_GREEN, bg: '#D1FAE5', icon: 'checkmark-circle-outline' as const, label: 'Checked In' };
            case 'completed': return { color: '#3B82F6', bg: '#DBEAFE', icon: 'checkmark-done-outline' as const, label: 'Completed' };
            case 'cancelled': return { color: ERROR_RED, bg: '#FEE2E2', icon: 'close-circle-outline' as const, label: 'Cancelled' };
            default: return { color: PRIMARY_DARK, bg: '#FCE7F3', icon: 'help-circle-outline' as const, label: status };
        }
    };

    const config = getStatusConfig();

    return (
        <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
            <Ionicons name={config.icon} size={16} color={config.color} />
            <Text style={[styles.statusBadgeText, { color: config.color }]}>{config.label}</Text>
        </View>
    );
};

// --- Main Component ---
export default function BookAppointment() {
    const router = useRouter();

    const [patients, setPatients] = useState<Patient[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [services, setServices] = useState<Service[]>([]);

    const [loadingData, setLoadingData] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const successAnimation = useState(new Animated.Value(0))[0];

    const [selectedPatientId, setSelectedPatientId] = useState<number | ''>('');
    const [selectedDoctorId, setSelectedDoctorId] = useState<number | ''>('');
    const [selectedServiceId, setSelectedServiceId] = useState<number | ''>('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [status, setStatus] = useState('booked');
    const [notes, setNotes] = useState('');
    const [bookedTimes, setBookedTimes] = useState<string[]>([]);

    // Handle date change - also clear time since slots may differ
    const handleDateChange = (newDate: string) => {
        setDate(newDate);
        setTime(''); // Clear time when date changes
    };

    // Function to reset form
    const resetForm = () => {
        setSelectedPatientId('');
        setSelectedServiceId('');
        setDate('');
        setTime('');
        setStatus('booked');
        setNotes('');
        setBookedTimes([]);
        // Keep doctor selected as default
        if (doctors.length > 0) setSelectedDoctorId(doctors[0].doctor_id);
    };

    // Show success toast animation
    const showSuccessToast = (message: string) => {
        setSuccessMessage(message);
        setShowSuccess(true);
        successAnimation.setValue(0);
        Animated.sequence([
            Animated.timing(successAnimation, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.delay(2500),
            Animated.timing(successAnimation, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => setShowSuccess(false));
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [patientsRes, doctorsRes, servicesRes] = await Promise.all([
                    getPatients(),
                    getDoctors(),
                    getServices()
                ]) as [ApiResponse<Patient[]>, ApiResponse<Doctor[]>, ApiResponse<Service[]>];

                if (patientsRes.success && patientsRes.data) setPatients(patientsRes.data);
                if (doctorsRes.success && doctorsRes.data) {
                    setDoctors(doctorsRes.data);
                    if (doctorsRes.data.length > 0) setSelectedDoctorId(doctorsRes.data[0].doctor_id);
                }
                if (servicesRes.success && servicesRes.data) setServices(servicesRes.data);
            } catch (error) {
                console.error('Error fetching data:', error);
                Alert.alert('Error', 'Failed to load form data. Please try again.');
            } finally {
                setLoadingData(false);
            }
        };
        fetchData();
    }, []);

    // Fetch booked times when date or doctor changes
    useEffect(() => {
        const fetchBookedTimes = async () => {
            if (!date || !selectedDoctorId) {
                setBookedTimes([]);
                return;
            }

            try {
                const response = await getAppointments({ date, doctor: selectedDoctorId }) as ApiResponse<any[]>;
                if (response.success && response.data) {
                    // Extract times from appointments that are not cancelled
                    const times = response.data
                        .filter((apt: any) => apt.status !== 'cancelled')
                        .map((apt: any) => apt.time);
                    setBookedTimes(times);
                } else {
                    setBookedTimes([]);
                }
            } catch (error) {
                console.error('Error fetching booked times:', error);
                setBookedTimes([]);
            }
        };

        fetchBookedTimes();
    }, [date, selectedDoctorId]);

    const selectedPatient = patients.find(p => p.patient_id === selectedPatientId);
    const selectedService = services.find(s => s.service_id === selectedServiceId);
    const selectedDoctor = doctors.find(d => d.doctor_id === selectedDoctorId);

    const handleConfirm = async () => {
        if (!selectedPatientId || !selectedDoctorId || !date || !time) {
            Alert.alert('Missing Information', 'Please fill in all required fields (Patient, Doctor, Date, Time).');
            return;
        }

        setSubmitting(true);

        try {
            const time24 = convertTo24Hour(time);
            if (!time24) {
                Alert.alert('Error', 'Invalid time format. Please select a valid time.');
                setSubmitting(false);
                return;
            }

            const patientName = selectedPatient?.name || 'patient';
            const appointmentDate = date;
            const appointmentTime = time;

            const appointmentData = {
                patient: Number(selectedPatientId),
                doctor: Number(selectedDoctorId),
                type: selectedService?.service_name || 'General',
                date: date,
                time: time24,
                status: status,
                notes: notes || '',
            };

            const result = await createAppointment(appointmentData) as ApiResponse<any>;

            if (result.success) {
                // Reset form first
                resetForm();
                // Show success toast
                showSuccessToast(`Appointment booked for ${patientName} on ${appointmentDate} at ${appointmentTime}`);
            } else {
                const errorMsg = typeof result.error === 'string' ? result.error : JSON.stringify(result.error);
                Alert.alert('Booking Failed', `${errorMsg}`);
            }
        } catch (error) {
            console.error('Error creating appointment:', error);
            Alert.alert('Error', 'An unexpected error occurred. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Loading State
    if (loadingData) {
        return (
            <View style={styles.loadingContainer}>
                <View style={styles.loadingCard}>
                    <ActivityIndicator size="large" color={PRIMARY_LIGHT} />
                    <Text style={styles.loadingTitle}>Setting up booking...</Text>
                    <Text style={styles.loadingSubtitle}>Loading patients, doctors & services</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Success Toast */}
            {showSuccess && (
                <Animated.View
                    style={[
                        styles.successToast,
                        {
                            opacity: successAnimation,
                            transform: [
                                {
                                    translateY: successAnimation.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [-100, 0],
                                    }),
                                },
                            ],
                        },
                    ]}
                >
                    <LinearGradient
                        colors={['#10B981', '#059669']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.successToastGradient}
                    >
                        <View style={styles.successToastIcon}>
                            <Ionicons name="checkmark-circle" size={28} color="#fff" />
                        </View>
                        <View style={styles.successToastContent}>
                            <Text style={styles.successToastTitle}>Appointment Booked!</Text>
                            <Text style={styles.successToastMessage}>{successMessage}</Text>
                        </View>
                    </LinearGradient>
                </Animated.View>
            )}

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.headerSection}>
                    <LinearGradient
                        colors={[PRIMARY_GRADIENT_START, PRIMARY_GRADIENT_END]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.headerGradient}
                    >
                        <View style={styles.headerContent}>
                            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                                <Ionicons name="arrow-back" size={24} color="#fff" />
                            </TouchableOpacity>
                            <View style={styles.headerTextContainer}>
                                <Text style={styles.headerTitle}>Book Appointment</Text>
                                <Text style={styles.headerSubtitle}>Schedule a new patient visit</Text>
                            </View>
                            <View style={styles.headerIconContainer}>
                                <Ionicons name="calendar" size={48} color="rgba(255,255,255,0.3)" />
                            </View>
                        </View>
                    </LinearGradient>
                </View>

                <View style={styles.contentWrapper}>
                    {/* Main Form Card */}
                    <View style={styles.formCard}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIconContainer}>
                                <Ionicons name="person-add-outline" size={20} color={PRIMARY_DARK} />
                            </View>
                            <Text style={styles.sectionTitle}>Appointment Details</Text>
                        </View>

                        {/* Patient Selection */}
                        <EnhancedInput label="Patient" iconName="person-outline" isPicker required>
                            <Picker
                                selectedValue={selectedPatientId}
                                onValueChange={(value) => setSelectedPatientId(value === '' ? '' : Number(value))}
                                style={styles.picker}
                            >
                                <Picker.Item label="Select a patient..." value="" style={{ color: TEXT_MUTED }} />
                                {patients.map((p) => (
                                    <Picker.Item key={p.patient_id} label={p.name} value={p.patient_id} />
                                ))}
                            </Picker>
                        </EnhancedInput>

                        {/* Doctor Selection */}
                        <EnhancedInput label="Doctor" iconName="medical-outline" isPicker required>
                            <Picker
                                selectedValue={selectedDoctorId}
                                onValueChange={(value) => setSelectedDoctorId(value === '' ? '' : Number(value))}
                                style={styles.picker}
                            >
                                <Picker.Item label="Select a doctor..." value="" style={{ color: TEXT_MUTED }} />
                                {doctors.map((d) => (
                                    <Picker.Item
                                        key={d.doctor_id}
                                        label={`Dr. ${d.name}${d.specialty ? ` • ${d.specialty}` : ''}`}
                                        value={d.doctor_id}
                                    />
                                ))}
                            </Picker>
                        </EnhancedInput>

                        {/* Service Selection */}
                        <EnhancedInput label="Service Type" iconName="briefcase-outline" isPicker>
                            <Picker
                                selectedValue={selectedServiceId}
                                onValueChange={(value) => setSelectedServiceId(value === '' ? '' : Number(value))}
                                style={styles.picker}
                            >
                                <Picker.Item label="Select service (optional)..." value="" style={{ color: TEXT_MUTED }} />
                                {services.map((s) => (
                                    <Picker.Item
                                        key={s.service_id}
                                        label={s.service_name}
                                        value={s.service_id}
                                    />
                                ))}
                            </Picker>
                        </EnhancedInput>

                        {/* Date & Time Row */}
                        <View style={styles.rowContainer}>
                            <View style={styles.halfInput}>
                                <DatePickerButton
                                    label="Date"
                                    iconName="calendar-outline"
                                    value={date}
                                    onSelect={handleDateChange}
                                    placeholder="Select date"
                                    required
                                />
                            </View>
                            <View style={styles.halfInput}>
                                <DatePickerButton
                                    label="Time"
                                    iconName="time-outline"
                                    value={time}
                                    onSelect={setTime}
                                    placeholder="Select time"
                                    required
                                    bookedTimes={bookedTimes}
                                />
                            </View>
                        </View>

                        {/* Status Selection */}
                        <EnhancedInput label="Initial Status" iconName="flag-outline" isPicker>
                            <Picker selectedValue={status} onValueChange={setStatus} style={styles.picker}>
                                <Picker.Item label="Booked" value="booked" />
                                <Picker.Item label="Checked In" value="checked_in" />
                            </Picker>
                        </EnhancedInput>

                        {/* Notes */}
                        <EnhancedInput
                            label="Additional Notes"
                            iconName="create-outline"
                            placeholder="Any special requests or notes..."
                            value={notes}
                            onChangeText={setNotes}
                        />
                    </View>

                    {/* Summary Card */}
                    <View style={styles.summaryCard}>
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionIconContainer, { backgroundColor: '#FDF2F8' }]}>
                                <Ionicons name="receipt-outline" size={20} color={PRIMARY_DARK} />
                            </View>
                            <Text style={styles.sectionTitle}>Booking Summary</Text>
                        </View>

                        <View style={styles.summaryContent}>
                            <View style={styles.summaryRow}>
                                <View style={styles.summaryIconLabel}>
                                    <Ionicons name="person" size={16} color={TEXT_SECONDARY} />
                                    <Text style={styles.summaryLabel}>Patient</Text>
                                </View>
                                <Text style={styles.summaryValue}>{selectedPatient?.name || '—'}</Text>
                            </View>

                            <View style={styles.summaryDivider} />

                            <View style={styles.summaryRow}>
                                <View style={styles.summaryIconLabel}>
                                    <Ionicons name="medical" size={16} color={TEXT_SECONDARY} />
                                    <Text style={styles.summaryLabel}>Doctor</Text>
                                </View>
                                <Text style={styles.summaryValue}>
                                    {selectedDoctor ? `Dr. ${selectedDoctor.name}` : '—'}
                                </Text>
                            </View>

                            <View style={styles.summaryDivider} />

                            <View style={styles.summaryRow}>
                                <View style={styles.summaryIconLabel}>
                                    <Ionicons name="briefcase" size={16} color={TEXT_SECONDARY} />
                                    <Text style={styles.summaryLabel}>Service</Text>
                                </View>
                                <Text style={styles.summaryValue}>{selectedService?.service_name || '—'}</Text>
                            </View>

                            <View style={styles.summaryDivider} />

                            <View style={styles.summaryRow}>
                                <View style={styles.summaryIconLabel}>
                                    <Ionicons name="calendar" size={16} color={TEXT_SECONDARY} />
                                    <Text style={styles.summaryLabel}>Date & Time</Text>
                                </View>
                                <Text style={[styles.summaryValue, { color: PRIMARY_DARK }]}>
                                    {date && time ? `${date} @ ${time}` : '—'}
                                </Text>
                            </View>



                            <View style={styles.statusContainer}>
                                <StatusBadge status={status} />
                            </View>
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionContainer}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => router.back()}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.confirmButton, submitting && styles.confirmButtonDisabled]}
                            onPress={handleConfirm}
                            disabled={submitting}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={submitting ? ['#ccc', '#bbb'] : [PRIMARY_GRADIENT_START, PRIMARY_GRADIENT_END]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.confirmButtonGradient}
                            >
                                {submitting ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Ionicons name="checkmark-circle" size={22} color="#fff" />
                                )}
                                <Text style={styles.confirmButtonText}>
                                    {submitting ? 'Booking...' : 'Confirm Booking'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

// --- STYLES ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },

    // Loading
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    loadingCard: {
        backgroundColor: '#fff',
        padding: 40,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    loadingTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: TEXT_PRIMARY,
        marginTop: 20,
    },
    loadingSubtitle: {
        fontSize: 14,
        color: TEXT_SECONDARY,
        marginTop: 8,
    },

    // Header
    headerSection: {
        marginBottom: -30,
    },
    headerGradient: {
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 60,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTextContainer: {
        flex: 1,
        marginLeft: 16,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
    },
    headerIconContainer: {
        opacity: 0.5,
    },

    // Content
    contentWrapper: {
        paddingHorizontal: 20,
    },

    // Form Card
    formCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 5,
    },

    // Section Header
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    sectionIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#FDF2F8',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: TEXT_PRIMARY,
    },

    // Input Styles
    inputContainer: {
        marginBottom: 20,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: TEXT_PRIMARY,
    },
    requiredStar: {
        color: ERROR_RED,
        marginLeft: 4,
        fontSize: 14,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: INPUT_BG,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: INPUT_BORDER,
        overflow: 'hidden',
    },
    iconContainer: {
        width: 48,
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(155, 8, 77, 0.05)',
    },
    inputField: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 12,
        fontSize: 15,
        color: TEXT_PRIMARY,
        fontWeight: '500',
    },
    pickerContainer: {
        flex: 1,
        overflow: 'hidden',
    },
    picker: {
        height: 52,
        color: TEXT_PRIMARY,
    },

    // Date Button
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: INPUT_BG,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: INPUT_BORDER,
        overflow: 'hidden',
    },
    dateButtonFilled: {
        borderColor: PRIMARY_LIGHT,
        backgroundColor: '#FDF2F8',
    },
    dateButtonText: {
        flex: 1,
        fontSize: 15,
        color: TEXT_PRIMARY,
        fontWeight: '500',
        paddingVertical: 14,
    },
    dateButtonPlaceholder: {
        color: TEXT_MUTED,
        fontWeight: '400',
    },
    chevronContainer: {
        paddingRight: 14,
    },

    // Row Layout
    rowContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    halfInput: {
        flex: 1,
    },

    // Summary Card
    summaryCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 5,
    },
    summaryContent: {
        backgroundColor: '#FAFBFC',
        borderRadius: 16,
        padding: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    summaryIconLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    summaryLabel: {
        fontSize: 14,
        color: TEXT_SECONDARY,
        fontWeight: '500',
    },
    summaryValue: {
        fontSize: 14,
        color: TEXT_PRIMARY,
        fontWeight: '600',
        maxWidth: '50%',
        textAlign: 'right',
    },
    summaryDivider: {
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    priceText: {
        color: SUCCESS_GREEN,
        fontWeight: '700',
        fontSize: 16,
    },
    statusContainer: {
        marginTop: 16,
        alignItems: 'flex-start',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
    },
    statusBadgeText: {
        fontSize: 13,
        fontWeight: '600',
    },

    // Action Buttons
    actionContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 10,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 14,
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: INPUT_BORDER,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: TEXT_SECONDARY,
    },
    confirmButton: {
        flex: 2,
        borderRadius: 14,
        overflow: 'hidden',
    },
    confirmButtonDisabled: {
        opacity: 0.7,
    },
    confirmButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 10,
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    // Success Toast Styles
    successToast: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        zIndex: 1000,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 10,
    },
    successToastGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    successToastIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    successToastContent: {
        flex: 1,
    },
    successToastTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 2,
    },
    successToastMessage: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
    },
});

// --- Calendar Modal Styles ---
const calendarStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        width: Platform.OS === 'web' ? 400 : '100%',
        maxWidth: 400,
        backgroundColor: '#fff',
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.25,
        shadowRadius: 30,
        elevation: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 16,
    },
    navButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    calendarBody: {
        padding: 16,
    },
    daysOfWeek: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    dayOfWeekText: {
        flex: 1,
        textAlign: 'center',
        fontWeight: '600',
        color: TEXT_SECONDARY,
        fontSize: 12,
        paddingVertical: 8,
    },
    week: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    day: {
        flex: 1,
        aspectRatio: 1,
        margin: 2,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    emptyDay: {
        backgroundColor: 'transparent',
    },
    todayDay: {
        backgroundColor: PRIMARY_LIGHT,
    },
    pastDay: {
        backgroundColor: '#F1F5F9',
        opacity: 0.5,
    },
    dayText: {
        fontWeight: '600',
        color: TEXT_PRIMARY,
        fontSize: 14,
    },
    todayDayText: {
        color: '#fff',
    },
    pastDayText: {
        color: TEXT_MUTED,
    },
    closeBtn: {
        paddingVertical: 16,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    closeBtnText: {
        color: TEXT_SECONDARY,
        fontWeight: '600',
        fontSize: 16,
    },
});

// --- Time Slot Modal Styles ---
const timeStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        width: Platform.OS === 'web' ? 400 : '100%',
        maxWidth: 400,
        maxHeight: '80%',
        backgroundColor: '#fff',
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.25,
        shadowRadius: 30,
        elevation: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 20,
    },
    headerText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    periodTabs: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
    },
    periodTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
    },
    periodTabActive: {
        backgroundColor: PRIMARY_DARK,
    },
    periodTabText: {
        fontSize: 13,
        fontWeight: '600',
        color: TEXT_SECONDARY,
    },
    periodTabTextActive: {
        color: '#fff',
    },
    slotsContainer: {
        paddingHorizontal: 16,
        maxHeight: 280,
    },
    slotsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        paddingBottom: 16,
    },
    timeSlot: {
        width: '30%',
        paddingVertical: 14,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    timeSlotBooked: {
        backgroundColor: '#F1F5F9',
        borderColor: '#D1D5DB',
        opacity: 0.7,
    },
    timeSlotText: {
        fontSize: 14,
        fontWeight: '600',
        color: PRIMARY_DARK,
    },
    timeSlotTextBooked: {
        color: '#9CA3AF',
    },
    bookedLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#EF4444',
        marginTop: 2,
        textTransform: 'uppercase',
    },
    closeBtn: {
        paddingVertical: 16,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    closeBtnText: {
        color: TEXT_SECONDARY,
        fontWeight: '600',
        fontSize: 16,
    },
    // Success Toast Styles
    successToast: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        zIndex: 1000,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 10,
    },
    successToastGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    successToastIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    successToastContent: {
        flex: 1,
    },
    successToastTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 2,
    },
    successToastMessage: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
    },
});
