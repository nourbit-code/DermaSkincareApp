import React, { useState, useContext, Dispatch, SetStateAction } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; 

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

const DatePickerButton: React.FC<DatePickerButtonProps> = ({ label, iconName, value, onSelect, placeholder }) => {
    
    // FIX: Using Alert.alert instead of Alert.prompt for universal compatibility.
    // In a real application, you would replace this Alert logic with a package like
    // @react-native-community/datetimepicker or a custom modal.
    const handlePress = () => {
        const mockValue = label.includes('Date') ? '2026-01-20' : '10:30 AM';
        
        Alert.alert(
            `Select ${label}`,
            `Simulating native picker. Select 'Confirm' to use the mock value: ${mockValue}`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Confirm',
                    onPress: () => {
                        onSelect(mockValue);
                    },
                },
            ],
            { cancelable: true }
        );
    };

    return (
        <View style={professionalStyles.inputGroup}>
            <Text style={professionalStyles.inputLabel}>{label}</Text>
            <TouchableOpacity style={professionalStyles.dateButtonWrapper} onPress={handlePress}>
                <Ionicons name={iconName} size={20} color={PRIMARY_DARK} style={professionalStyles.inputIcon} />
                <Text style={[professionalStyles.dateButtonText, !value && professionalStyles.dateButtonPlaceholder]}>
                    {value || placeholder}
                </Text>
                <Ionicons name="chevron-down-outline" size={18} color="#999" />
            </TouchableOpacity>
        </View>
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