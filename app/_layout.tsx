import React from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppointmentProvider } from './context/AppointmentContext';
import { PatientsProvider } from './context/PatientContext';
import { AuthProvider } from './context/AuthContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <AppointmentProvider>
        <PatientsProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="login" />
              <Stack.Screen name="receptionist/dashboard" />
              <Stack.Screen name="receptionist/book-appointment" />
              <Stack.Screen name="receptionist/patients-directory" />
              <Stack.Screen name="receptionist/edit-patient" />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </PatientsProvider>
      </AppointmentProvider>
    </AuthProvider>
  );
}
