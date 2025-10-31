// app/doctor/_layout.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import DoctorSidebar from '../../components/DoctorSidebar';

export default function DoctorLayout() {
  return (
    <View style={styles.container}>
      {/* Sidebar stays fixed */}
      <DoctorSidebar />

      {/* Stack renders current doctor page */}
      <View style={styles.pageContainer}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FAFAFA',
  },
  pageContainer: {
    flex: 1,
  },
});
