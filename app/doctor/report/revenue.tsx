// app/doctor/report/revenue.tsx
import React, { useEffect, useState } from "react";
import { View, Text, Dimensions, ScrollView, StyleSheet, Pressable } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { chartConfig } from "./chartConfig";
import { useRouter } from "expo-router";

const W = Dimensions.get("window").width - 40;

export default function RevenueReport() {
  const router = useRouter();
  const [labels, setLabels] = useState<string[]>([]);
  const [amounts, setAmounts] = useState<number[]>([]);

  useEffect(() => {
    const fake = [
      { date: "Sat", amount: 2200 },
      { date: "Sun", amount: 1800 },
      { date: "Mon", amount: 2600 },
      { date: "Tue", amount: 1500 },
      { date: "Wed", amount: 1300 },
      { date: "Thu", amount: 1800 },
      { date: "Fri", amount: 1300 },
    ];
    setLabels(fake.map((d) => d.date));
    setAmounts(fake.map((d) => d.amount));
  }, []);

  const total = amounts.reduce((a, b) => a + b, 0);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Clinic Revenue</Text>
        <Pressable onPress={() => router.back()}><Text style={styles.close}>Close</Text></Pressable>
      </View>

      <View style={styles.summary}>
        <Text style={styles.big}>This week: EGP {total.toLocaleString()}</Text>
        <Text style={styles.sub}>Avg/day: EGP {Math.round(total / amounts.length)}</Text>
      </View>

      <LineChart
        data={{ labels, datasets: [{ data: amounts }] }}
        width={W}
        height={320}
        chartConfig={{
          ...chartConfig,
          color: (o = 1) => `rgba(155,8,77, ${o})`,
        }}
        bezier
        style={{ borderRadius: 14, marginTop: 12 }}
        yAxisSuffix=""
      />

      <Text style={styles.info}>Top service: Laser Sessions (demo)</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "800" },
  close: { color: "#9B084D", fontWeight: "700" },
  summary: { backgroundColor: "#F6F7FB", padding: 12, borderRadius: 12, marginVertical: 12 },
  big: { fontSize: 20, fontWeight: "800" },
  sub: { color: "#555" },
  info: { marginTop: 12, color: "#555" },
});
