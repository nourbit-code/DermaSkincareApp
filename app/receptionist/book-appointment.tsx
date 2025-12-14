import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React, { Dispatch, SetStateAction, useContext, useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// --- COLOR PALETTE (Consistent) ---
const PRIMARY_DARK = '#9B084D'; 
const PRIMARY_LIGHT = '#E80A7A'; 
const BACKGROUND_LIGHT = '#F4F7FA'; 
const CARD_BG = '#FFFFFF'; 
const INPUT_BORDER = '#D1D9E0'; 
const SUCCESS_GREEN = '#28A745';
const WARNING_YELLOW = '#FFC107';

// Mock Context for demonstration (Replace with your actual import)
const AppointmentContext = React.createContext({}); 

// --- TypeScript Interface for LabeledIconInput ---
interface LabeledIconInputProps {
    label: string;
    iconName: keyof typeof Ionicons.glyphMap; 
    placeholder?: string;
    value?: string;
    onChangeText?: Dispatch<SetStateAction<string>>;
    keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad'; 
    isPicker?: boolean; 
    children?: React.ReactNode; 
}

// --- Reusable Labeled Input Component with Icon ---
const LabeledIconInput: React.FC<LabeledIconInputProps> = ({ 
    label, 
    iconName, 
    placeholder, 
    value, 
    onChangeText, 
    keyboardType, 
    isPicker = false, 
    children 
}) => (
    <View style={professionalStyles.inputGroup}>
        <Text style={professionalStyles.inputLabel}>{label}</Text>
        <View style={professionalStyles.inputWrapper}>
            <Ionicons name={iconName} size={20} color={PRIMARY_DARK} style={professionalStyles.inputIcon} />
            {isPicker ? (
                <View style={professionalStyles.pickerContainer}>{children}</View>
            ) : (
                <TextInput
                    style={professionalStyles.inputField}
                    placeholder={placeholder}
                    value={value}
                    {...(onChangeText && { onChangeText: onChangeText })} 
                    keyboardType={keyboardType || 'default'}
                    placeholderTextColor="#999"
                />
            )}
        </View>
    </View>
);

// --- Component for Date/Time Selection (Fixed for all platforms) ---
interface DatePickerButtonProps {
    label: string;
    iconName: keyof typeof Ionicons.glyphMap;
    value: string;
    onSelect: (newValue: string) => void;
    placeholder: string;
}

// --- Calendar Modal Component ---
interface CalendarModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectDate: (date: string) => void;
}

const CalendarModal: React.FC<CalendarModalProps> = ({ visible, onClose, onSelectDate }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

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
        // Format in local timezone, not UTC
        const year = selected.getFullYear();
        const month = String(selected.getMonth() + 1).padStart(2, '0');
        const date = String(selected.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${date}`;
        onSelectDate(formattedDate);
        onClose();
    };

    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    // Build weeks array for proper grid layout
    const weeks = [];
    let week = [];

    // Add empty cells for days before the month starts
    for (let i = 0; i < firstDay; i++) {
        week.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        week.push(day);
        if (week.length === 7) {
            weeks.push(week);
            week = [];
        }
    }

    // Fill the last week with empty cells if needed
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
                    <View style={calendarStyles.header}>
                        <TouchableOpacity onPress={goToPreviousMonth}>
                            <Ionicons name="chevron-back-outline" size={24} color={PRIMARY_DARK} />
                        </TouchableOpacity>
                        <Text style={calendarStyles.headerText}>{monthName}</Text>
                        <TouchableOpacity onPress={goToNextMonth}>
                            <Ionicons name="chevron-forward-outline" size={24} color={PRIMARY_DARK} />
                        </TouchableOpacity>
                    </View>

                    {/* Days of Week Header */}
                    <View style={calendarStyles.daysOfWeek}>
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                            <Text key={day} style={calendarStyles.dayOfWeekText}>{day}</Text>
                        ))}
                    </View>

                    {/* Calendar Grid - Render by weeks */}
                    {weeks.map((week, weekIndex) => (
                        <View key={weekIndex} style={calendarStyles.week}>
                            {week.map((day, dayIndex) => (
                                <TouchableOpacity
                                    key={dayIndex}
                                    style={[
                                        calendarStyles.day,
                                        day === null && calendarStyles.emptyDay,
                                    ]}
                                    onPress={() => day !== null && handleSelectDay(day)}
                                    disabled={day === null}
                                >
                                    {day !== null && <Text style={calendarStyles.dayText}>{day}</Text>}
                                </TouchableOpacity>
                            ))}
                        </View>
                    ))}

                    <TouchableOpacity style={calendarStyles.closeBtn} onPress={onClose}>
                        <Text style={calendarStyles.closeBtnText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

// --- Time Slot Picker Modal ---
interface TimeSlotModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectTime: (time: string) => void;
}

const TIME_SLOTS = [
    '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM',
    '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
    '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
    '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
];

const TimeSlotModal: React.FC<TimeSlotModalProps> = ({ visible, onClose, onSelectTime }) => {
    const handleSelectTime = (time: string) => {
        onSelectTime(time);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={timeSlotStyles.overlay}>
                <View style={timeSlotStyles.container}>
                    <Text style={timeSlotStyles.title}>Select Time Slot</Text>

                    <ScrollView style={timeSlotStyles.slotsContainer} scrollEnabled={true}>
                        {TIME_SLOTS.map((time) => (
                            <TouchableOpacity
                                key={time}
                                style={timeSlotStyles.timeSlot}
                                onPress={() => handleSelectTime(time)}
                            >
                                <Text style={timeSlotStyles.timeSlotText}>{time}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <TouchableOpacity style={timeSlotStyles.closeBtn} onPress={onClose}>
                        <Text style={timeSlotStyles.closeBtnText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const DatePickerButton: React.FC<DatePickerButtonProps> = ({ label, iconName, value, onSelect, placeholder }) => {
    const [showModal, setShowModal] = useState(false);
    const isDatePicker = label === 'Date';

    return (
        <>
            <View style={professionalStyles.inputGroup}>
                <Text style={professionalStyles.inputLabel}>{label}</Text>
                <TouchableOpacity style={professionalStyles.dateButtonWrapper} onPress={() => setShowModal(true)}>
                    <Ionicons name={iconName} size={20} color={PRIMARY_DARK} style={professionalStyles.inputIcon} />
                    <Text style={[professionalStyles.dateButtonText, !value && professionalStyles.dateButtonPlaceholder]}>
                        {value || placeholder}
                    </Text>
                    <Ionicons name="chevron-down-outline" size={18} color="#999" />
                </TouchableOpacity>
            </View>

            {isDatePicker ? (
                <CalendarModal
                    visible={showModal}
                    onClose={() => setShowModal(false)}
                    onSelectDate={onSelect}
                />
            ) : (
                <TimeSlotModal
                    visible={showModal}
                    onClose={() => setShowModal(false)}
                    onSelectTime={onSelect}
                />
            )}
        </>
    );
};

export default function BookAppointment() {
    const router = useRouter();
    const { addAppointment } = useContext(AppointmentContext) as { addAppointment?: (appt: any) => void };

    const [patient, setPatient] = useState('');
    const [service, setService] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [status, setStatus] = useState('Booked');
    const [price, setPrice] = useState('');

    const handleConfirm = () => {
        if (!patient || !service || !date || !time || !price) {
             Alert.alert('Missing Info', 'Please fill in all required fields (Patient, Service, Date, Time, Price).');
             return;
        }
        
        const appt = { patient, service, date, time, status, price };
        if (addAppointment) addAppointment(appt);
        
        Alert.alert('Success', `Appointment booked for ${patient} on ${date} at ${time}`);
        
        router.push('/receptionist/dashboard'); 
    };

    const getStatusColor = (currentStatus: string) => {
        switch (currentStatus) {
            case 'Booked':
                return PRIMARY_DARK;
            case 'Completed':
                return SUCCESS_GREEN;
            case 'Waiting':
                return WARNING_YELLOW;
            default:
                return PRIMARY_DARK;
        }
    };
    
    return (
        <ScrollView style={professionalStyles.page} contentContainerStyle={professionalStyles.pageContent}>
            <View style={professionalStyles.wrapper}>
                
                {/* Form Panel */}
                <View style={[professionalStyles.formPanel, professionalStyles.cardShadow]}>
                    <Text style={professionalStyles.formTitle}>
                        <Ionicons name="calendar-outline" size={28} color={PRIMARY_DARK} style={{ marginRight: 10 }} /> 
                        Book New Appointment
                    </Text>
                    <View style={professionalStyles.formDivider} />

                    <LabeledIconInput
                        label="Patient Name"
                        iconName="person-outline"
                        placeholder="Enter patient full name"
                        value={patient}
                        onChangeText={setPatient}
                    />

                    <LabeledIconInput
                        label="Service Type"
                        iconName="briefcase-outline"
                        isPicker
                    >
                        <Picker selectedValue={service} onValueChange={setService} style={professionalStyles.picker}>
                            <Picker.Item label="— Select Service —" value="" enabled={false} style={{ color: '#999' }} />
                            <Picker.Item label="Laser" value="Laser" />
                            <Picker.Item label="Beauty" value="Beauty" />
                            <Picker.Item label="Medical Diagnosis" value="Medical Diagnosis" />
                        </Picker>
                    </LabeledIconInput>
                    
                    {/* Date & Time Pickers */}
                    <View style={professionalStyles.rowContainer}>
                        <View style={professionalStyles.halfInput}>
                            <DatePickerButton
                                label="Date"
                                iconName="calendar-outline"
                                value={date}
                                onSelect={setDate}
                                placeholder="Select Date"
                            />
                        </View>
                        <View style={professionalStyles.halfInput}>
                            <DatePickerButton
                                label="Time"
                                iconName="time-outline"
                                value={time}
                                onSelect={setTime}
                                placeholder="Select Time"
                            />
                        </View>
                    </View>


                    <LabeledIconInput
                        label="Status"
                        iconName="stats-chart-outline"
                        isPicker
                    >
                        <Picker selectedValue={status} onValueChange={setStatus} style={professionalStyles.picker}>
                            <Picker.Item label="Booked" value="Booked" />
                            <Picker.Item label="Completed" value="Completed" />
                            <Picker.Item label="Waiting" value="Waiting" />
                        </Picker>
                    </LabeledIconInput>

                    <LabeledIconInput
                        label="Price"
                        iconName="pricetag-outline"
                        placeholder="Enter price (e.g., 250)"
                        value={price}
                        onChangeText={setPrice}
                        keyboardType="numeric" 
                    />

                    <View style={professionalStyles.actionRow}>
                        <TouchableOpacity style={professionalStyles.confirmBtn} onPress={handleConfirm}>
                            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{marginRight: 8}} />
                            <Text style={professionalStyles.confirmBtnText}>Confirm Booking</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={professionalStyles.cancelBtn} onPress={() => router.back()}>
                            <Text style={professionalStyles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Summary Panel */}
                <View style={[professionalStyles.summaryPanel, professionalStyles.cardShadow]}>
                    <Text style={professionalStyles.summaryTitle}>
                        <Ionicons name="document-text-outline" size={22} color={PRIMARY_DARK} style={{ marginRight: 8 }} />
                        Live Summary
                    </Text>
                    <View style={professionalStyles.summaryCard}>
                        
                        <View style={professionalStyles.summaryRow}>
                            <Text style={professionalStyles.summaryLabel}>Patient</Text>
                            <Text style={professionalStyles.summaryValue}>{patient || '—'}</Text>
                        </View>
                        <View style={professionalStyles.summaryRow}>
                            <Text style={professionalStyles.summaryLabel}>Service</Text>
                            <Text style={professionalStyles.summaryValue}>{service || '—'}</Text>
                        </View>
                        <View style={professionalStyles.summaryRow}>
                            <Text style={professionalStyles.summaryLabel}>Date & Time</Text>
                            <Text style={professionalStyles.summaryValue}>{date && time ? `${date} @ ${time}` : '—'}</Text>
                        </View>
                        <View style={professionalStyles.summaryRow}>
                            <Text style={professionalStyles.summaryLabel}>Price</Text>
                            <Text style={[professionalStyles.summaryValue, { fontWeight: '700', color: PRIMARY_LIGHT }]}>{price ? `$${price}` : '—'}</Text>
                        </View>

                        <View style={professionalStyles.summaryDivider} />

                        <View style={[professionalStyles.badge, { backgroundColor: getStatusColor(status) }]}>
                            <Text style={professionalStyles.badgeText}>Status: {status}</Text>
                        </View>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

const professionalStyles = StyleSheet.create({
    // --- Layout & General ---
    page: { flex: 1, backgroundColor: BACKGROUND_LIGHT },
    pageContent: { flexGrow: 1, justifyContent: 'center', minHeight: '100%' },
    wrapper: { 
        flexDirection: Platform.OS === 'web' ? 'row' : 'column', 
        flex: 1, 
        padding: 30, 
        maxWidth: Platform.OS === 'web' ? 1100 : '100%', 
        alignSelf: 'center' 
    },
    cardShadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05, 
        shadowRadius: 15,
        elevation: 8,
    },
    
    // --- Form Panel ---
    formPanel: {
        flex: Platform.OS === 'web' ? 2 : 1,
        backgroundColor: CARD_BG,
        borderRadius: 16,
        padding: 30,
        marginRight: Platform.OS === 'web' ? 30 : 0,
        marginBottom: Platform.OS === 'web' ? 0 : 30,
        borderWidth: 1,
        borderColor: INPUT_BORDER,
    },
    formTitle: { 
        fontSize: 28, 
        fontWeight: '800', 
        color: PRIMARY_DARK, 
        marginBottom: 10,
        flexDirection: 'row', 
        alignItems: 'center',
    },
    formDivider: { 
        height: 1, 
        backgroundColor: INPUT_BORDER, 
        marginBottom: 20 
    },

    // --- Input Styles ---
    inputGroup: { marginBottom: 20 },
    inputLabel: { 
        marginTop: 0, 
        color: PRIMARY_DARK, 
        fontWeight: '700', 
        fontSize: 14,
        marginBottom: 6,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: INPUT_BORDER,
        borderRadius: 12, 
        backgroundColor: '#F8FAFC', 
    },
    inputIcon: { paddingHorizontal: 12 },
    inputField: {
        flex: 1,
        paddingVertical: Platform.OS === 'web' ? 14 : 12,
        paddingRight: 12,
        fontSize: 16,
        color: '#333',
        fontWeight: '600', 
    },

    // --- Date/Time Button Styles ---
    dateButtonWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: INPUT_BORDER,
        borderRadius: 12, 
        backgroundColor: '#F8FAFC', 
        paddingVertical: Platform.OS === 'web' ? 14 : 12,
        justifyContent: 'space-between',
        paddingRight: 12,
    },
    dateButtonText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        fontWeight: '600',
    },
    dateButtonPlaceholder: {
        color: '#999',
        fontWeight: '400',
    },

    rowContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 15 },
    halfInput: { flex: 1 },

    // --- Picker Styles ---
    pickerContainer: { flex: 1, overflow: 'hidden' },
    picker: { 
        height: 50,
        color: PRIMARY_DARK, 
        fontWeight: '600',
        paddingHorizontal: 0, 
    },

    // --- Action Buttons ---
    actionRow: { flexDirection: 'row', marginTop: 40, gap: 15 },
    confirmBtn: { 
        flex: 3, 
        backgroundColor: PRIMARY_LIGHT, 
        paddingVertical: 16, 
        borderRadius: 12, 
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        shadowColor: PRIMARY_LIGHT,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    confirmBtnText: { color: '#fff', fontWeight: '800', fontSize: 18, textTransform: 'uppercase' },
    cancelBtn: { 
        flex: 1, 
        borderColor: INPUT_BORDER, 
        borderWidth: 1, 
        paddingVertical: 16, 
        borderRadius: 12, 
        alignItems: 'center',
        backgroundColor: CARD_BG,
    },
    cancelBtnText: { color: '#666', fontWeight: '700', fontSize: 16 },

    // --- Summary Panel ---
    summaryPanel: { 
        flex: 1, 
        backgroundColor: CARD_BG, 
        borderRadius: 16, 
        padding: 30,
        borderWidth: 1,
        borderColor: INPUT_BORDER,
    },
    summaryTitle: { 
        fontSize: 22, 
        fontWeight: '800', 
        color: PRIMARY_DARK, 
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    summaryCard: { 
        backgroundColor: BACKGROUND_LIGHT, 
        borderRadius: 12, 
        padding: 20, 
        borderLeftWidth: 4, 
        borderLeftColor: PRIMARY_DARK,
    },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 },
    summaryLabel: { fontWeight: '600', color: '#444', fontSize: 15 },
    summaryValue: { fontWeight: '700', color: '#111', fontSize: 15 },
    summaryDivider: { height: 1, backgroundColor: INPUT_BORDER, marginVertical: 15 },
    badge: { 
        marginTop: 10, 
        paddingVertical: 8, 
        paddingHorizontal: 15, 
        borderRadius: 25, 
        alignSelf: 'flex-start',
    },
    badgeText: { fontWeight: '700', color: '#fff', fontSize: 14, textTransform: 'uppercase' },
});

// --- Calendar Styles ---
const calendarStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: Platform.OS === 'web' ? 400 : '85%',
        backgroundColor: CARD_BG,
        borderRadius: 16,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerText: {
        fontSize: 18,
        fontWeight: '700',
        color: PRIMARY_DARK,
    },
    daysOfWeek: {
        flexDirection: 'row',
        marginBottom: 10,
        gap: 0,
    },
    dayOfWeekText: {
        flex: 1,
        textAlign: 'center',
        fontWeight: '600',
        color: '#666',
        fontSize: 12,
        paddingVertical: 8,
    },
    week: {
        flexDirection: 'row',
        marginBottom: 8,
        gap: 0,
    },
    day: {
        flex: 1,
        aspectRatio: 1,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: BACKGROUND_LIGHT,
        borderWidth: 1,
        borderColor: INPUT_BORDER,
        marginHorizontal: 2,
    },
    emptyDay: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        borderWidth: 0,
    },
    dayText: {
        fontWeight: '600',
        color: PRIMARY_DARK,
        fontSize: 14,
    },
    closeBtn: {
        backgroundColor: PRIMARY_LIGHT,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 15,
    },
    closeBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
});

// --- Time Slot Styles ---
const timeSlotStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: Platform.OS === 'web' ? 400 : '85%',
        maxHeight: '70%',
        backgroundColor: CARD_BG,
        borderRadius: 16,
        padding: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: PRIMARY_DARK,
        marginBottom: 20,
        textAlign: 'center',
    },
    slotsContainer: {
        marginBottom: 20,
        maxHeight: 300,
    },
    timeSlot: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: BACKGROUND_LIGHT,
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: INPUT_BORDER,
    },
    timeSlotText: {
        fontWeight: '600',
        color: PRIMARY_DARK,
        fontSize: 16,
        textAlign: 'center',
    },
    closeBtn: {
        backgroundColor: PRIMARY_LIGHT,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    closeBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
});