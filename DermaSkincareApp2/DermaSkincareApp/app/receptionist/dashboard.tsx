import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Link, useRouter } from "expo-router";
import { CalendarPlus, UserPlus, CreditCard, Bell } from "lucide-react-native";

const appointments = [
  { patient: "Sara Ahmed", service: "Laser", time: "10:00 AM", status: "Confirmed" },
  { patient: "Mona Ali", service: "Beauty", time: "11:30 AM", status: "Pending" },
  { patient: "Laila Hassan", service: "Diagnosis", time: "12:15 PM", status: "Confirmed" },
];

export default function ReceptionistDashboard() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Main Content */}
      <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false}>
        {/* Greeting Card */}
        <View style={styles.greetingCard}>
          <Text style={styles.greetingTitle}>Welcome back, Receptionist 👋</Text>
          <Text style={styles.greetingSubtitle}>Here’s what’s happening today.</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Link href="/receptionist/book-appointment" asChild>
            <TouchableOpacity style={styles.actionBtn}>
              <CalendarPlus color="#fff" size={22} />
              <Text style={styles.actionText}>Book Appointment</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/receptionist/add-patient" asChild>
            <TouchableOpacity style={styles.actionBtn}>
              <UserPlus color="#fff" size={22} />
              <Text style={styles.actionText}>Add Patient</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/receptionist/payments" asChild>
            <TouchableOpacity style={styles.actionBtn}>
              <CreditCard color="#fff" size={22} />
              <Text style={styles.actionText}>Payments</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Appointments Table */}
        <View style={styles.tableContainer}>
          <Text style={styles.sectionTitle}>Today's Appointments</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.headerText]}>Patient</Text>
            <Text style={[styles.tableCell, styles.headerText]}>Service</Text>
            <Text style={[styles.tableCell, styles.headerText]}>Time</Text>
            <Text style={[styles.tableCell, styles.headerText]}>Status</Text>
            <Text style={[styles.tableCell, styles.headerText]}>Action</Text>
          </View>

          {appointments.map((appt, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableCell}>{appt.patient}</Text>
              <Text style={styles.tableCell}>{appt.service}</Text>
              <Text style={styles.tableCell}>{appt.time}</Text>
              <Text
                style={[
                  styles.tableCell,
                  appt.status === "Confirmed" ? styles.statusConfirmed : styles.statusPending,
                ]}
              >
                {appt.status}
              </Text>
              <TouchableOpacity style={styles.openBtn}>
                <Text style={styles.openBtnText}>Open</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Right Panel */}
      <View style={styles.rightPanel}>
        <Text style={styles.panelTitle}>Notifications</Text>
        <View style={styles.notificationBox}>
          <Bell color="#9B084D" size={18} />
          <Text style={styles.notificationText}>No new notifications</Text>
        </View>

        <Text style={[styles.panelTitle, { marginTop: 25 }]}>Upcoming Sessions</Text>
        <View style={styles.upcomingBox}>
          <Text style={styles.upcomingText}>Next: 10:00 AM - Sara Ahmed</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#FAFAFA",
  },
  mainContent: {
    flex: 1,
    padding: 25,
  },
  greetingCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#9B084D",
  },
  greetingSubtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 5,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: "#E80A7A",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginHorizontal: 6,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  actionText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  tableContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#9B084D",
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: "row",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2",
  },
  tableCell: {
    flex: 1,
    textAlign: "center",
    color: "#333",
  },
  headerText: {
    fontWeight: "700",
    color: "#9B084D",
  },
  openBtn: {
    backgroundColor: "#9B084D",
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  openBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  statusConfirmed: {
    color: "#28A745",
    fontWeight: "600",
  },
  statusPending: {
    color: "#E6A000",
    fontWeight: "600",
  },
  rightPanel: {
    width: 230,
    backgroundColor: "#fff",
    padding: 18,
    borderLeftWidth: 1,
    borderLeftColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  panelTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#9B084D",
    marginBottom: 10,
  },
  notificationBox: {
    backgroundColor: "#FFF5F8",
    borderRadius: 8,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  notificationText: {
    color: "#666",
    fontSize: 14,
  },
  upcomingBox: {
    backgroundColor: "#FFF5F8",
    borderRadius: 8,
    padding: 10,
    marginTop: 5,
  },
  upcomingText: {
    color: "#9B084D",
    fontWeight: "500",
  },
});
