// app/doctor/report/doctor-income.tsx
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { PieChart } from "react-native-chart-kit";
import { chartConfig } from "./chartConfig";

const W = Dimensions.get("window").width - 40;

export default function IncomeReport() {
  const router = useRouter();
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    setChartData([
      { name: "Consultation", population: 2500, color: "#9B084D", legendFontColor: "#7F7F7F", legendFontSize: 12 },
      { name: "Laser", population: 1800, color: "#FF7BA9", legendFontColor: "#7F7F7F", legendFontSize: 12 },
      { name: "Beauty", population: 1325, color: "#FFB6D5", legendFontColor: "#7F7F7F", legendFontSize: 12 },
    ]);
  }, []);

  const total = chartData.reduce((a, b) => a + (b.population || 0), 0);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Doctor Income Breakdown</Text>
        <Pressable onPress={() => router.back()}><Text style={styles.close}>Close</Text></Pressable>
      </View>

      <Text style={styles.summary}>This week: EGP {total.toLocaleString()}</Text>

      <PieChart
        data={chartData}
        width={W}
        height={240}
        chartConfig={chartConfig}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute
      />

      <Text style={styles.info}>Doctor share: 45% (configurable)</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "800" },
  close: { color: "#9B084D", fontWeight: "700" },
  summary: { fontSize: 18, marginVertical: 12 },
  info: { marginTop: 12, color: "#555" },
});
