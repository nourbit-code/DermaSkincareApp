import React from "react";
import { View, StyleSheet } from "react-native";
import { Stack } from "expo-router";
// import Sidebar from "../../components/Sidebar"; // ⛔ temporarily comment this out
import Sidebar from "../../components/Sidebar";
import { PatientsProvider } from "../context/PatientContext"; // adjust path if needed

export default function ReceptionistLayout() {
  return (
    <View style={styles.container}>
      {/* <Sidebar />  ⛔ comment this line out */}
      <Sidebar />
      <View style={styles.pageContainer}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: "row", backgroundColor: "#FAFAFA" },
  pageContainer: { flex: 1 },
});
