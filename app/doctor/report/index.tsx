// app/doctor/report/index.tsx
import { useRouter } from "expo-router";
import { CalendarDays, TrendingUp, Users, Wallet } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { chartConfig } from "./chartConfig";

const WIDTH = Dimensions.get("window").width - 40;
const INNER_WIDTH = WIDTH - 24; // account for card padding so charts fit inside cards

type Period = "week" | "month" | "year";

export default function DoctorReportIndex() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("week");
  const fade = useMemo(() => new Animated.Value(1), []);

  type DataSet = { patients: number[]; appointments: number[]; revenue: number[]; income: number[] };

  // ****** FAKE data (demo). Replace these with fetch() from your API later ******
  const FAKE: Record<Period, DataSet> = {
    week: {
      patients: [6, 5, 8, 4, 3, 4, 2],
      appointments: [7, 6, 9, 5, 4, 6, 3],
      revenue: [2200, 1800, 2600, 1500, 1300, 1800, 1300],
      income: [900, 700, 1000, 600, 500, 800, 500],
    },
    month: {
      patients: Array.from({ length: 30 }, () => Math.round(4 + Math.random() * 8)),
      appointments: Array.from({ length: 30 }, () => Math.round(5 + Math.random() * 10)),
      revenue: Array.from({ length: 30 }, () => Math.round(1200 + Math.random() * 4000)),
      income: Array.from({ length: 30 }, () => Math.round(400 + Math.random() * 1500)),
    },
    year: {
      patients: Array.from({ length: 12 }, () => Math.round(100 + Math.random() * 300)),
      appointments: Array.from({ length: 12 }, () => Math.round(120 + Math.random() * 340)),
      revenue: Array.from({ length: 12 }, () => Math.round(20000 + Math.random() * 80000)),
      income: Array.from({ length: 12 }, () => Math.round(9000 + Math.random() * 30000)),
    },
  };

  // labels generation for chart mini previews
  const labelsFor = (p: Period, len: number) => {
    if (p === "week") return ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"].slice(0, len);
    if (p === "month") return Array.from({ length: len }, (_, i) => `${i + 1}`);
    return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].slice(0, len);
  };

  const dataFor = (p: Period) => {
    const d = FAKE[p];
    return {
      labelsPatients: labelsFor(p, d.patients.length),
      patients: d.patients,
      labelsAppointments: labelsFor(p, d.appointments.length),
      appointments: d.appointments,
      revenue: d.revenue,
      income: d.income,
    };
  };

  const current = dataFor(period);

  useEffect(() => {
    // fade animation when period changes
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  }, [period]);

  // KPI aggregates
  const totals = {
    patients: current.patients.reduce((a: number, b: number) => a + b, 0),
    appointments: current.appointments.reduce((a: number, b: number) => a + b, 0),
    revenue: current.revenue.reduce((a: number, b: number) => a + b, 0),
    income: current.income.reduce((a: number, b: number) => a + b, 0),
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      <Text style={styles.header}>Clinic Analytics — Overview</Text>

      {/* Filters */}
      <View style={styles.filterRow}>
        {( ["week", "month", "year"] as Period[]).map((p, idx, arr) => (
          <Pressable
            key={p}
            style={[
              styles.filterBtn,
              period === p && styles.filterBtnActive,
              { marginRight: idx < arr.length - 1 ? 8 : 0 },
            ]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.filterText, period === p && styles.filterTextActive]}>
              {p.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* KPI grid */}
      <Animated.View style={{ opacity: fade }}>
        {/* Patients card with mini LineChart */}
        <Pressable style={styles.card} onPress={() => router.push("/doctor/report/pppp")}>
          <View style={styles.cardHead}>
            <Users size={28} color="#fff" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.cardTitle}>Patients</Text>
              <Text style={styles.cardValue}>{totals.patients}</Text>
              <Text style={styles.cardSub}>New vs returning, growth +8%</Text>
            </View>
          </View>

          <LineChart
            data={{ labels: current.labelsPatients, datasets: [{ data: current.patients }] }}
            width={INNER_WIDTH}
            height={80}
            withVerticalLines={false}
            withHorizontalLines={false}
            chartConfig={{
              ...chartConfig,
              color: (o = 1) => `rgba(255,255,255,${o})`,
              labelColor: (o = 1) => `rgba(255,255,255,${o})`,
              backgroundGradientFrom: "transparent",
              backgroundGradientTo: "transparent",
            }}
            style={styles.miniChart}
            bezier
            yAxisSuffix=""
          />
        </Pressable>

        {/* Appointments card with mini BarChart */}
        <Pressable style={styles.card} onPress={() => router.push("/doctor/report/appointments")}>
          <View style={styles.cardHead}>
            <CalendarDays size={28} color="#fff" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.cardTitle}>Appointments</Text>
              <Text style={styles.cardValue}>{totals.appointments}</Text>
              <Text style={styles.cardSub}>On-time 92% • No-show 4%</Text>
            </View>
          </View>

          <LineChart
            data={{ labels: current.labelsAppointments, datasets: [{ data: current.appointments }] }}
            width={INNER_WIDTH}
            height={80}
            chartConfig={{
              ...chartConfig,
              color: (o = 1) => `rgba(255,255,255,${o})`,
              labelColor: (o = 1) => `rgba(255,255,255,${o})`,
              backgroundGradientFrom: "transparent",
              backgroundGradientTo: "transparent",
            }}
            style={styles.miniChart}
            bezier
            yAxisSuffix=""
          />
        </Pressable>

        {/* Revenue card (area-like line) */}
        <Pressable style={styles.card} onPress={() => router.push("/doctor/report/revenue")}>
          <View style={styles.cardHead}>
            <TrendingUp size={28} color="#fff" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.cardTitle}>Revenue</Text>
              <Text style={styles.cardValue}>EGP {totals.revenue.toLocaleString()}</Text>
              <Text style={styles.cardSub}>Avg per visit: EGP {Math.round(totals.revenue / Math.max(1, totals.appointments))}</Text>
            </View>
          </View>

          <LineChart
            data={{ labels: current.labelsAppointments, datasets: [{ data: current.revenue }] }}
            width={INNER_WIDTH}
            height={80}
            bezier
            withDots={false}
            chartConfig={{
              ...chartConfig,
              color: (o = 1) => `rgba(255,255,255,${o})`,
              labelColor: (o = 1) => `rgba(255,255,255,${o})`,
              backgroundGradientFrom: "transparent",
              backgroundGradientTo: "transparent",
              propsForBackgroundLines: { strokeDasharray: "" },
            }}
            style={styles.miniChart}
            yAxisSuffix=""
          />
        </Pressable>

        {/* Inventory card */}
        <Pressable style={styles.card} onPress={() => router.push("/doctor/report/inventory")}>
          <View style={styles.cardHead}>
            <Wallet size={28} color="#fff" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.cardTitle}>Inventory</Text>
              <Text style={styles.cardValue}>Stock</Text>
              <Text style={styles.cardSub}>Track supplies & reorder</Text>
            </View>
          </View>

          {/* small segments to indicate distribution */}
          <View style={{ flexDirection: "row", marginTop: 8, justifyContent: "space-between" }}>
            <View style={styles.smallSegment}>
              <View style={[styles.smallBar, { width: 36 }]} />
              <Text style={styles.smallLabel}>Sunscreen</Text>
            </View>
            <View style={styles.smallSegment}>
              <View style={[styles.smallBar, { width: 24 }]} />
              <Text style={styles.smallLabel}>Serum</Text>
            </View>
            <View style={styles.smallSegment}>
              <View style={[styles.smallBar, { width: 18 }]} />
              <Text style={styles.smallLabel}>Mask</Text>
            </View>
          </View>
        </Pressable>

        {/* Income (pie-like small chart imitation) */}
        <Pressable style={styles.card} onPress={() => router.push("/doctor/report/Doctor In")}>
          <View style={styles.cardHead}>
            <Wallet size={28} color="#fff" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.cardTitle}>Doctor Income</Text>
              <Text style={styles.cardValue}>EGP {totals.income.toLocaleString()}</Text>
              <Text style={styles.cardSub}>Share: 45%</Text>
            </View>
          </View>

          {/* lightweight "mini bars" to simulate distribution */}
          <View style={{ flexDirection: "row", marginTop: 8, justifyContent: "space-between" }}>
            <View style={styles.smallSegment}>
              <View style={[styles.smallBar, { width: 40 }]} />
              <Text style={styles.smallLabel}>Consult</Text>
            </View>
            <View style={styles.smallSegment}>
              <View style={[styles.smallBar, { width: 28 }]} />
              <Text style={styles.smallLabel}>Laser</Text>
            </View>
            <View style={styles.smallSegment}>
              <View style={[styles.smallBar, { width: 22 }]} />
              <Text style={styles.smallLabel}>Beauty</Text>
            </View>
          </View>
        </Pressable>
      </Animated.View>

      <Text style={styles.hint}>Tap any card for full analytics — swipe inside detail pages for filters and export.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#F4F6F9", padding: 20, flex: 1 },
  header: { fontSize: 28, fontWeight: "800", color: "#222", marginBottom: 12 },

  filterRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#fff",
    elevation: 2,
  },
  filterBtnActive: { backgroundColor: "#9B084D" },
  filterText: { color: "#555", fontWeight: "700" },
  filterTextActive: { color: "#fff" },

  card: {
    backgroundColor: "#9B084D",
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    elevation: 6,
  },
  cardHead: { flexDirection: "row", alignItems: "center" },
  cardTitle: { color: "#fff", fontWeight: "700", fontSize: 14 },
  cardValue: { color: "#fff", fontWeight: "800", fontSize: 20, marginTop: 4 },
  cardSub: { color: "#ffe6f0", marginTop: 6, fontSize: 12 },

  miniChart: { marginTop: 8, borderRadius: 12, backgroundColor: "transparent" },

  smallSegment: { alignItems: "center" },
  smallBar: { height: 8, backgroundColor: "#fff", borderRadius: 6, marginBottom: 6, opacity: 0.9 },
  smallLabel: { color: "#ffe6f0", fontSize: 12 },

  hint: { marginTop: 12, color: "#666", textAlign: "center" },
});
