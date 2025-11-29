import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter, usePathname } from "expo-router";

export default function DoctorSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const menu = [
    { label: "Dashboard", path: "/doctor/dashboard" }, // keep file home.tsx
    { label: "Today's Patients", path: "/doctor/todays-patients" },
    { label: "Patient History", path: "/doctor/patient-history" },
  ] as const;

  return (
    <View style={styles.sidebar}>
      <Text style={styles.title}>ClinicCare</Text>

      {menu.map((item) => {
        const isActive = pathname === item.path;
        return (
          <TouchableOpacity
            key={item.path}
            onPress={() => router.push(item.path)}
            style={[styles.link, isActive ? styles.active : {}]}
          >
            <Text style={[styles.linkText, isActive ? styles.activeText : {}]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        style={styles.logout}
        onPress={() => router.replace("/login")}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 220,
    backgroundColor: "#9B084D",
    paddingVertical: 30,
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#E0E0E0",
    textAlign: "center",
    marginBottom: 30,
  },
  link: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 6,
    borderRadius: 6,
  },
  active: {
    backgroundColor: "#9B084D",
  },
  linkText: {
    color: "#E0E0E0",
    fontSize: 16,
  },
  activeText: {
    color: "#fff",
    fontWeight: "600",
  },
  logout: {
    marginTop: 30,
    paddingVertical: 10,
  },
  logoutText: {
    textAlign: "center",
    color: "#E0E0E0",
    fontWeight: "bold",
  },
});
