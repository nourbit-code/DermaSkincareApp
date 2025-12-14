// app/doctor/report/appointments.tsx
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { chartConfig } from "./chartConfig";

const W = Dimensions.get("window").width - 40;

export default function AppointmentsReport() {
  const router = useRouter();
  const [labels, setLabels] = useState<string[]>([]);
  const [dataPoints, setDataPoints] = useState<number[]>([]);

  useEffect(() => {
    const fake = [
      { date: "Sat", count: 7 },
      { date: "Sun", count: 6 },
      { date: "Mon", count: 9 },
      { date: "Tue", count: 5 },
      { date: "Wed", count: 4 },
      { date: "Thu", count: 6 },
      { date: "Fri", count: 3 },
    ];
    setLabels(fake.map((d) => d.date));
    setDataPoints(fake.map((d) => d.count));
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Appointments — Daily</Text>
        <Pressable onPress={() => router.back()}><Text style={styles.close}>Close</Text></Pressable>
      </View>

      <LineChart
        data={{ labels, datasets: [{ data: dataPoints }] }}
        width={W}
        height={320}
        chartConfig={{
          ...chartConfig,
          color: (o = 1) => `rgba(155,8,77, ${o})`,
          labelColor: (o = 1) => `rgba(68,68,68, ${o})`,
        }}
        bezier
        style={{ borderRadius: 14, marginTop: 12 }}
        yAxisSuffix=""
      />
      

      <View style={{ marginTop: 16 }}>
        <Text style={styles.info}>Completed this period: {dataPoints.reduce((a: number, b: number) => a + b, 0)}</Text>
        <Text style={styles.info}>No-shows: 3 (demo)</Text>
        <Text style={styles.info}>Average duration: 22 mins</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "800" },
  close: { color: "#9B084D", fontWeight: "700" },
  info: { marginTop: 8, color: "#555" },
});
