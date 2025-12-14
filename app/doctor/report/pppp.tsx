// app/doctor/report/patients.tsx
import React, { useEffect, useState } from "react";
import { View, Text, Dimensions, StyleSheet, ScrollView, Pressable } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { useRouter } from "expo-router";
import { chartConfig } from "./chartConfig";

const W = Dimensions.get("window").width - 40;

export default function PatientsReport() {
  const router = useRouter();
  const [labels, setLabels] = useState<string[]>([]);
  const [points, setPoints] = useState<number[]>([]);

  useEffect(() => {
    // FAKE demo data - replace with fetch to your backend
    const fake = [
      { date: "Sat", patients: 6 },
      { date: "Sun", patients: 5 },
      { date: "Mon", patients: 8 },
      { date: "Tue", patients: 4 },
      { date: "Wed", patients: 3 },
      { date: "Thu", patients: 4 },
      { date: "Fri", patients: 2 },
    ];
    setLabels(fake.map((d) => d.date));
    setPoints(fake.map((d) => d.patients));
  }, []);

  const total = points.reduce((a, b) => a + b, 0);
  const avg = Math.round(total / Math.max(1, points.length));

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Patients — Last 7 Days</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.close}>Close</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.big}>Total: {total}</Text>
        <Text style={styles.sub}>Avg/day: {avg}</Text>
      </View>

      <LineChart
        data={{ labels, datasets: [{ data: points }] }}
        width={W}
        height={300}
        chartConfig={{
          ...chartConfig,
          color: (o = 1) => `rgba(155,8,77, ${o})`,
          labelColor: (o = 1) => `rgba(68,68,68, ${o})`,
        }}
        bezier
        style={{ borderRadius: 16, marginVertical: 12 }}
        yAxisSuffix=""
      />

      <Text style={styles.sectionTitle}>Insights</Text>
      <Text style={styles.info}>• Most active day: {labels[points.indexOf(Math.max(...points))]}</Text>
      <Text style={styles.info}>• Returning patients proportion: ~32%</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#FFF" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "800" },
  close: { color: "#9B084D", fontWeight: "700" },

  card: { backgroundColor: "#F6F7FB", padding: 12, borderRadius: 12, marginTop: 12, marginBottom: 12 },
  big: { fontSize: 22, fontWeight: "800" },
  sub: { color: "#555" },

  sectionTitle: { marginTop: 14, fontWeight: "700" },
  info: { marginTop: 6, color: "#555" },
});
