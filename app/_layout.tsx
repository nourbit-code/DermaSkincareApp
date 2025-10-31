import React from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppointmentProvider } from './context/AppointmentContext';
import { PatientsProvider } from './context/PatientContext'; // <-- import PatientsProvider

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();

  return (
    <AppointmentProvider>
      <PatientsProvider> {/* <-- wrap your app with PatientsProvider */}
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" />
            <Stack.Screen name="receptionist/dashboard" />
            <Stack.Screen name="receptionist/book-appointment" />
            <Stack.Screen name="receptionist/patients-directory" /> {/* Add your new screen */}
            <Stack.Screen name="receptionist/edit-patient" /> {/* Add edit screen */}
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </PatientsProvider>
    </AppointmentProvider>
  );
}
