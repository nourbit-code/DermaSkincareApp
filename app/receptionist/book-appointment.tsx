import React, { useState, useContext } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { AppointmentContext } from '../context/AppointmentContext';

export default function BookAppointment() {
  const router = useRouter();
  const { addAppointment } = useContext(AppointmentContext);

  const [patient, setPatient] = useState('');
  const [service, setService] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [status, setStatus] = useState('Booked');
  const [price, setPrice] = useState('');

  const handleConfirm = () => {
    const appt = { patient, service, date, time, status, price };
    if (addAppointment) addAppointment(appt);
    router.push('/receptionist/dashboard');
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.wrapper}>
        {/* Form Panel */}
        <View style={[styles.formPanel, styles.cardShadow]}>
          <Text style={styles.formTitle}>Book New Appointment</Text>

          <Text style={styles.label}>Patient Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter patient name"
            value={patient}
            onChangeText={setPatient}
          />

          <Text style={styles.label}>Service Type</Text>
          <View style={styles.pickerWrapper}>
            <Picker selectedValue={service} onValueChange={setService} style={styles.picker}>
              <Picker.Item label="Select Service" value="" />
              <Picker.Item label="Laser" value="Laser" />
              <Picker.Item label="Beauty" value="Beauty" />
              <Picker.Item label="Medical Diagnosis" value="Medical Diagnosis" />
            </Picker>
          </View>

          <Text style={styles.label}>Date</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={date}
            onChangeText={setDate}
          />

          <Text style={styles.label}>Time</Text>
          <TextInput
            style={styles.input}
            placeholder="HH:MM"
            value={time}
            onChangeText={setTime}
          />

          <Text style={styles.label}>Status</Text>
          <View style={styles.pickerWrapper}>
            <Picker selectedValue={status} onValueChange={setStatus} style={styles.picker}>
              <Picker.Item label="Booked" value="Booked" />
              <Picker.Item label="Completed" value="Completed" />
              <Picker.Item label="Waiting" value="Waiting" />
            </Picker>
          </View>

          <Text style={styles.label}>Price</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter price"
            value={price}
            onChangeText={setPrice}
          />

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmBtnText}>Confirm</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary Panel */}
        <View style={[styles.summaryPanel, styles.cardShadow]}>
          <Text style={styles.summaryTitle}>Appointment Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Patient:</Text>
              <Text>{patient || '—'}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Service:</Text>
              <Text>{service || '—'}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date & Time:</Text>
              <Text>{date && time ? `${date} @ ${time}` : '—'}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Price:</Text>
              <Text>{price || '—'}</Text>
            </View>

            <View
              style={[
                styles.badge,
                status === 'Booked'
                  ? styles.booked
                  : status === 'Completed'
                  ? styles.completed
                  : styles.waiting,
              ]}
            >
              <Text style={styles.badgeText}>{status}</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FAFAFA' },
  wrapper: { flexDirection: 'row', flex: 1, padding: 20 },
  formPanel: {
    flex: 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginRight: 20,
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  formTitle: { fontSize: 22, fontWeight: '700', color: '#9B084D', marginBottom: 16 },
  label: { marginTop: 12, color: '#333', fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#e3e3e3',
    borderRadius: 10,
    paddingVertical: Platform.OS === 'web' ? 12 : 10,
    paddingHorizontal: 12,
    marginTop: 6,
    backgroundColor: '#fff',
  },
  pickerWrapper: { borderWidth: 1, borderColor: '#e3e3e3', borderRadius: 10, marginTop: 6, overflow: 'hidden' },
  picker: { height: 48 },
  actionRow: { flexDirection: 'row', marginTop: 20 },
  confirmBtn: { flex: 1, backgroundColor: '#E80A7A', paddingVertical: 14, borderRadius: 12, marginRight: 12, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cancelBtn: { flex: 1, borderColor: '#E80A7A', borderWidth: 2, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelBtnText: { color: '#E80A7A', fontWeight: '700', fontSize: 16 },

  summaryPanel: { flex: 1, backgroundColor: '#FFF5F8', borderRadius: 12, padding: 20 },
  summaryTitle: { fontSize: 18, fontWeight: '700', color: '#9B084D', marginBottom: 12 },
  summaryCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 6 },
  summaryLabel: { fontWeight: '700', color: '#333' },
  badge: { marginTop: 12, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, alignSelf: 'flex-start' },
  badgeText: { fontWeight: '700', color: '#fff' },
  booked: { backgroundColor: '#9B084D' },
  completed: { backgroundColor: '#0A7A3F' },
  waiting: { backgroundColor: '#F5A623' },
});
