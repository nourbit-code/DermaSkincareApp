// app/doctor/report/index.tsx
import { useRouter } from "expo-router";
import { CalendarDays, Users, Wallet } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import { getReportAnalytics, ReportAnalytics } from "../../../src/api/reportApi";

const WIDTH = Dimensions.get("window").width - 40;
const INNER_WIDTH = WIDTH - 24; // account for card padding so charts fit inside cards

type Period = "week" | "month" | "year";

export default function ReceptionistReportIndex() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("week");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<ReportAnalytics | null>(null);
  const fade = useMemo(() => new Animated.Value(1), []);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getReportAnalytics(period);
        setAnalytics(data);
      } catch (err) {
        setError('Failed to load analytics. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  useEffect(() => {
    // fade animation when period changes
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  }, [period]);

  // Safe data with fallbacks
  const labels = analytics?.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const appointmentsData = analytics?.appointments?.data || [0, 0, 0, 0, 0, 0, 0];
  const newPatientsData = analytics?.new_patients?.data || [0, 0, 0, 0, 0, 0, 0];
  const checkInsData = analytics?.check_ins?.data || [0, 0, 0, 0, 0, 0, 0];
  const paymentsData = analytics?.payments?.data || [0, 0, 0, 0, 0, 0, 0];

  // KPI totals
  const totals = {
    appointments: analytics?.appointments?.total || 0,
    checkIns: analytics?.check_ins?.total || 0,
    newPatients: analytics?.new_patients?.total || 0,
    payments: analytics?.payments?.total || 0,
    completionRate: analytics?.appointments?.completion_rate || 0,
  };

  // Ensure chart data has at least one non-zero value to avoid errors
  const safeChartData = (data: number[]) => {
    const hasData = data.some(v => v > 0);
    return hasData ? data : data.map(() => 0.1);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#9B084D" />
        <Text style={{ marginTop: 12, color: '#666' }}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      <Text style={styles.header}>Receptionist Analytics — Overview</Text>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Filters */}
      <View style={styles.filterRow}>
        {(["week", "month", "year"] as Period[]).map((p, idx, arr) => (
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
            data={{ labels: labels.slice(0, 7), datasets: [{ data: safeChartData(newPatientsData.slice(0, 7)) }] }}
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
              <Text style={styles.cardSub}>Completion rate: {totals.completionRate}%</Text>
            </View>
          </View>

          <LineChart
            data={{ labels: labels.slice(0, 7), datasets: [{ data: safeChartData(appointmentsData.slice(0, 7)) }] }}
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
              <Text style={styles.smallLabel}>Items</Text>
            </View>
            <View style={styles.smallSegment}>
              <View style={[styles.smallBar, { width: 24 }]} />
              <Text style={styles.smallLabel}>Low Stock</Text>
            </View>
            <View style={styles.smallSegment}>
              <View style={[styles.smallBar, { width: 18 }]} />
              <Text style={styles.smallLabel}>Expiring</Text>
            </View>
          </View>
        </Pressable>

        {/* Payments Summary Card */}
        <Pressable style={[styles.card, { backgroundColor: '#0284c7' }]} onPress={() => {}}>
          <View style={styles.cardHead}>
            <Wallet size={28} color="#fff" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.cardTitle}>Total Payments</Text>
              <Text style={styles.cardValue}>EGP {totals.payments.toLocaleString()}</Text>
              <Text style={styles.cardSub}>Revenue this {period}</Text>
            </View>
          </View>

          <LineChart
            data={{ labels: labels.slice(0, 7), datasets: [{ data: safeChartData(paymentsData.slice(0, 7)) }] }}
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
      </Animated.View>

      <Text style={styles.hint}>Tap any card for full analytics — swipe inside detail pages for filters and export.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#F4F6F9", padding: 20, flex: 1 },
  header: { fontSize: 28, fontWeight: "800", color: "#222", marginBottom: 12 },

  errorBox: { backgroundColor: '#fee2e2', padding: 12, borderRadius: 8, marginBottom: 12 },
  errorText: { color: '#dc2626', fontWeight: '600' },

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
