import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function PatientPage() {
  const { id } = useLocalSearchParams(); // Get patient ID from URL

  // Dummy patient details
  const patient = {
    name: "Sara Ahmed",
    age: 28,
    gender: "Female",
    phone: "01012345678",
    history: [
      { service: "Laser", date: "10/01/2025", diagnosis: "Mild acne" },
      { service: "Beauty", date: "09/15/2025", diagnosis: "Skin rejuvenation" },
    ],
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Patient Page</Text>
      <Text style={styles.subHeader}>Patient ID: {id}</Text>

      <View style={styles.infoCard}>
        <Text style={styles.label}>Name: {patient.name}</Text>
        <Text style={styles.label}>Age: {patient.age}</Text>
        <Text style={styles.label}>Gender: {patient.gender}</Text>
        <Text style={styles.label}>Phone: {patient.phone}</Text>
      </View>

      <Text style={styles.sectionHeader}>History</Text>
      {patient.history.map((h, i) => (
        <View key={i} style={styles.historyCard}>
          <Text>Service: {h.service}</Text>
          <Text>Date: {h.date}</Text>
          <Text>Diagnosis: {h.diagnosis}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#FAFAFA' },
  header: { fontSize: 22, fontWeight: 'bold', color: '#9B084D', marginBottom: 5 },
  subHeader: { fontSize: 16, color: '#666', marginBottom: 15 },
  infoCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 20 },
  label: { fontSize: 14, marginBottom: 5 },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', color: '#9B084D', marginBottom: 10 },
  historyCard: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 10 },
});
