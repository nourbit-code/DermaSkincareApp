import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter, usePathname } from "expo-router";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const menu = [
    { label: "Dashboard", path: "/receptionist/dashboard" },
    { label: "Book Appointment", path: "/receptionist/book-appointment" },
    { label: "Add Patient", path: "/receptionist/add-patient" },
    { label: "Payments", path: "/receptionist/payments" },
    { label: "Patients Directory", path: "/receptionist/patients-directory" },
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
            style={[styles.link, isActive ? styles.active : null]}
          >
            <Text style={[styles.linkText, isActive ? styles.activeText : null]}>
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
    borderRightWidth: 1,
    borderRightColor: "#E0E0E0",
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
    borderTopWidth: 1,
    borderTopColor: "#EEE",
  },
  logoutText: {
    textAlign: "center",
    color: "#E0E0E0",
    fontWeight: "bold",
  },
});
