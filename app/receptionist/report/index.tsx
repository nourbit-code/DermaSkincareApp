// app/doctor/report/index.tsx
import { useRouter } from "expo-router";
import { CalendarDays, Users, Wallet } from "lucide-react-native";
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

export default function ReceptionistReportIndex() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("week");
  const fade = useMemo(() => new Animated.Value(1), []);

  // For receptionist we track: appointments, checkIns, newPatients, payments
  type ReceptionistData = {
    appointments: number[];
    checkIns: number[];
    newPatients: number[];
    payments: number[];
  };

  // ****** FAKE data (demo). Replace these with fetch() from your API later ******
  const FAKE: Record<Period, ReceptionistData> = {
    week: {
      appointments: [7, 6, 9, 5, 4, 6, 3],
      checkIns: [6, 5, 7, 5, 3, 5, 2],
      newPatients: [1, 0, 2, 1, 1, 0, 1],
      payments: [2200, 1800, 2600, 1500, 1300, 1800, 1300],
    },
    month: {
      appointments: Array.from({ length: 30 }, () => Math.round(5 + Math.random() * 10)),
      checkIns: Array.from({ length: 30 }, () => Math.round(4 + Math.random() * 9)),
      newPatients: Array.from({ length: 30 }, () => Math.round(0 + Math.random() * 3)),
      payments: Array.from({ length: 30 }, () => Math.round(1200 + Math.random() * 4000)),
    },
    year: {
      appointments: Array.from({ length: 12 }, () => Math.round(120 + Math.random() * 340)),
      checkIns: Array.from({ length: 12 }, () => Math.round(100 + Math.random() * 300)),
      newPatients: Array.from({ length: 12 }, () => Math.round(10 + Math.random() * 60)),
      payments: Array.from({ length: 12 }, () => Math.round(20000 + Math.random() * 80000)),
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
      labelsAppointments: labelsFor(p, d.appointments.length),
      appointments: d.appointments,
      checkIns: d.checkIns,
      newPatients: d.newPatients,
      payments: d.payments,
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
    appointments: current.appointments.reduce((a: number, b: number) => a + b, 0),
    checkIns: current.checkIns.reduce((a: number, b: number) => a + b, 0),
    newPatients: current.newPatients.reduce((a: number, b: number) => a + b, 0),
    payments: current.payments.reduce((a: number, b: number) => a + b, 0),
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      <Text style={styles.header}>Receptionist Analytics — Overview</Text>

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
        <Pressable style={styles.card} onPress={() => router.push("/receptionist/report/pppp")}>
          <View style={styles.cardHead}>
            <Users size={28} color="#fff" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.cardTitle}>New Patients</Text>
              <Text style={styles.cardValue}>{totals.newPatients}</Text>
              <Text style={styles.cardSub}>Signups this period</Text>
            </View>
          </View>

          <LineChart
            data={{ labels: current.labelsAppointments, datasets: [{ data: current.newPatients }] }}
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
        <Pressable style={styles.card} onPress={() => router.push("/receptionist/report/appointments")}>
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


        {/* Inventory card */}
        <Pressable style={styles.card} onPress={() => router.push("/receptionist/report/inventory")}>
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

        {/* (Receptionist doesn't show doctor income card) */}
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
