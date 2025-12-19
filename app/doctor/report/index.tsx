// app/doctor/report/index.tsx
import { useRouter } from "expo-router";
import { CalendarDays, TrendingUp, Users, Wallet, AlertCircle, DollarSign, Package, Activity } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { LineChart, BarChart } from "react-native-chart-kit";
import { chartConfig } from "./chartConfig";
import { getReportAnalytics, ReportAnalytics } from "../../../src/api/reportApi";

const WIDTH = Dimensions.get("window").width - 40;
const INNER_WIDTH = WIDTH - 24;
const DOCTOR_SHARE = 0.45;

export default function DoctorReportIndex() {
  const router = useRouter();
  const period = "week"; // Fixed to week for main dashboard
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReportAnalytics | null>(null);
  const fade = useMemo(() => new Animated.Value(1), []);

  const fetchData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const response = await getReportAnalytics("week");
      setData(response);
    } catch (err) {
      setError("Failed to load analytics data");
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  // KPI aggregates
  const totals = {
    patients: data?.new_patients?.total || 0,
    appointments: data?.appointments?.total || 0,
    completed: data?.appointments?.completed || 0,
    revenue: data?.payments?.total || 0,
    income: Math.round((data?.payments?.total || 0) * DOCTOR_SHARE),
    checkIns: data?.check_ins?.total || 0,
    completionRate: data?.appointments?.completion_rate || 0,
  };

  // Chart data
  const chartLabels = data?.labels || ["No Data"];
  const appointmentsData = data?.appointments?.data || [0];
  const paymentsData = data?.payments?.data || [0];
  const patientsData = data?.new_patients?.data || [0];
  const incomeData = paymentsData.map(p => Math.round(p * DOCTOR_SHARE));

  const safeChartData = (arr: number[]) => arr.length > 0 ? arr : [0];
  const safeLabels = (arr: string[]) => arr.length > 0 ? arr : ["N/A"];

  // Trends
  const avgRevPerDay = paymentsData.length > 0 
    ? Math.round(paymentsData.reduce((a, b) => a + b, 0) / paymentsData.length) 
    : 0;
  const avgPerVisit = totals.completed > 0 
    ? Math.round(totals.revenue / totals.completed) 
    : 0;

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#9B084D" />
        <Text style={{ marginTop: 16, color: "#666" }}>Loading analytics...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <AlertCircle size={48} color="#dc3545" />
        <Text style={{ marginTop: 16, color: "#dc3545", fontSize: 16 }}>{error}</Text>
        <Pressable
          style={[styles.filterBtn, styles.filterBtnActive, { marginTop: 16 }]}
          onPress={() => fetchData()}
        >
          <Text style={styles.filterTextActive}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={{ paddingBottom: 60 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#9B084D"]} />
      }
    >
      <Text style={styles.header}>Clinic Analytics</Text>
      <Text style={styles.subHeader}>
        {data?.date_range?.start} → {data?.date_range?.end}
      </Text>

      {/* Quick Stats Summary Row */}
      <View style={styles.quickStatsRow}>
        <View style={styles.quickStat}>
          <Text style={styles.quickStatValue}>{totals.appointments}</Text>
          <Text style={styles.quickStatLabel}>Appts</Text>
        </View>
        <View style={[styles.quickStat, { backgroundColor: "#d4edda" }]}>
          <Text style={[styles.quickStatValue, { color: "#28a745" }]}>{totals.completionRate}%</Text>
          <Text style={styles.quickStatLabel}>Complete</Text>
        </View>
        <View style={[styles.quickStat, { backgroundColor: "#fff3cd" }]}>
          <Text style={[styles.quickStatValue, { color: "#856404" }]}>{totals.patients}</Text>
          <Text style={styles.quickStatLabel}>New Pts</Text>
        </View>
        <View style={[styles.quickStat, { backgroundColor: "#cce5ff" }]}>
          <Text style={[styles.quickStatValue, { color: "#004085" }]}>EGP {(totals.income / 1000).toFixed(1)}K</Text>
          <Text style={styles.quickStatLabel}>Income</Text>
        </View>
      </View>

      <Animated.View style={{ opacity: fade }}>
        {/* Patients Card */}
        <Pressable style={styles.card} onPress={() => router.push("/doctor/report/pppp")}>
          <View style={styles.cardHead}>
            <Users size={28} color="#fff" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.cardTitle}>New Patients</Text>
              <Text style={styles.cardValue}>{totals.patients}</Text>
              <Text style={styles.cardSub}>Registered this {period}</Text>
            </View>
          </View>
          <LineChart
            data={{ labels: safeLabels(chartLabels), datasets: [{ data: safeChartData(patientsData) }] }}
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

        {/* Appointments Card */}
        <Pressable style={styles.card} onPress={() => router.push("/doctor/report/appointments")}>
          <View style={styles.cardHead}>
            <CalendarDays size={28} color="#fff" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.cardTitle}>Appointments</Text>
              <Text style={styles.cardValue}>{totals.appointments}</Text>
              <View style={styles.cardSubRow}>
                <Text style={styles.cardSub}>✓ {totals.completed} completed</Text>
                <Text style={styles.cardSubHighlight}>{totals.completionRate}% rate</Text>
              </View>
            </View>
          </View>
          <LineChart
            data={{ labels: safeLabels(chartLabels), datasets: [{ data: safeChartData(appointmentsData) }] }}
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

        {/* Revenue Card */}
        <Pressable style={[styles.card, { backgroundColor: "#28a745" }]} onPress={() => router.push("/doctor/report/revenue")}>
          <View style={styles.cardHead}>
            <TrendingUp size={28} color="#fff" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.cardTitle}>Clinic Revenue</Text>
              <Text style={styles.cardValue}>EGP {totals.revenue.toLocaleString()}</Text>
              <View style={styles.cardSubRow}>
                <Text style={styles.cardSub}>Avg/visit: EGP {avgPerVisit}</Text>
                <Text style={styles.cardSubHighlight}>Avg/day: EGP {avgRevPerDay}</Text>
              </View>
            </View>
          </View>
          <LineChart
            data={{ labels: safeLabels(chartLabels), datasets: [{ data: safeChartData(paymentsData) }] }}
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
            }}
            style={styles.miniChart}
            yAxisSuffix=""
          />
        </Pressable>

        {/* Doctor Income Card */}
        <Pressable style={[styles.card, { backgroundColor: "#17a2b8" }]} onPress={() => router.push("/doctor/report/doctor-income")}>
          <View style={styles.cardHead}>
            <Wallet size={28} color="#fff" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.cardTitle}>Your Income</Text>
              <Text style={styles.cardValue}>EGP {totals.income.toLocaleString()}</Text>
              <View style={styles.cardSubRow}>
                <Text style={styles.cardSub}>Share: {DOCTOR_SHARE * 100}%</Text>
                <Text style={styles.cardSubHighlight}>Per visit: EGP {totals.completed > 0 ? Math.round(totals.income / totals.completed) : 0}</Text>
              </View>
            </View>
          </View>
          <LineChart
            data={{ labels: safeLabels(chartLabels), datasets: [{ data: safeChartData(incomeData) }] }}
            width={INNER_WIDTH}
            height={80}
            bezier
            chartConfig={{
              ...chartConfig,
              color: (o = 1) => `rgba(255,255,255,${o})`,
              labelColor: (o = 1) => `rgba(255,255,255,${o})`,
              backgroundGradientFrom: "transparent",
              backgroundGradientTo: "transparent",
            }}
            style={styles.miniChart}
            yAxisSuffix=""
          />
        </Pressable>

        {/* Inventory Card */}
        <Pressable style={[styles.card, { backgroundColor: "#6f42c1" }]} onPress={() => router.push("/doctor/report/inventory")}>
          <View style={styles.cardHead}>
            <Package size={28} color="#fff" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.cardTitle}>Inventory</Text>
              <Text style={styles.cardValue}>Stock Overview</Text>
              <Text style={styles.cardSub}>Track supplies & alerts</Text>
            </View>
          </View>
          <View style={styles.inventoryPreview}>
            <View style={styles.inventoryItem}>
              <View style={[styles.inventoryBar, { height: 40 }]} />
              <Text style={styles.inventoryLabel}>Supplies</Text>
            </View>
            <View style={styles.inventoryItem}>
              <View style={[styles.inventoryBar, { height: 28 }]} />
              <Text style={styles.inventoryLabel}>Products</Text>
            </View>
            <View style={styles.inventoryItem}>
              <View style={[styles.inventoryBar, { height: 20 }]} />
              <Text style={styles.inventoryLabel}>Equipment</Text>
            </View>
          </View>
        </Pressable>

        {/* Performance Summary */}
        <View style={styles.performanceCard}>
          <Text style={styles.performanceTitle}>📊 Performance Summary</Text>
          <View style={styles.performanceGrid}>
            <View style={styles.performanceItem}>
              <Activity size={20} color="#9B084D" />
              <Text style={styles.performanceValue}>{totals.checkIns}</Text>
              <Text style={styles.performanceLabel}>Check-ins</Text>
            </View>
            <View style={styles.performanceItem}>
              <CalendarDays size={20} color="#28a745" />
              <Text style={[styles.performanceValue, { color: "#28a745" }]}>{totals.completed}</Text>
              <Text style={styles.performanceLabel}>Completed</Text>
            </View>
            <View style={styles.performanceItem}>
              <Users size={20} color="#ffc107" />
              <Text style={[styles.performanceValue, { color: "#856404" }]}>{totals.patients}</Text>
              <Text style={styles.performanceLabel}>New Patients</Text>
            </View>
            <View style={styles.performanceItem}>
              <DollarSign size={20} color="#17a2b8" />
              <Text style={[styles.performanceValue, { color: "#17a2b8" }]}>EGP {avgPerVisit}</Text>
              <Text style={styles.performanceLabel}>Per Visit</Text>
            </View>
          </View>
        </View>

        {/* Payment Methods */}
        {data?.payments?.by_method && data.payments.by_method.length > 0 && (
          <View style={styles.paymentMethodsCard}>
            <Text style={styles.paymentMethodsTitle}>💳 Payment Methods</Text>
            {data.payments.by_method.map((pm: any, idx: number) => (
              <View key={idx} style={styles.paymentMethodRow}>
                <Text style={styles.paymentMethodName}>{pm.payment_method || "Cash"}</Text>
                <View style={styles.paymentMethodBarContainer}>
                  <View 
                    style={[
                      styles.paymentMethodBar, 
                      { width: `${Math.min(100, (pm.total / totals.revenue) * 100)}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.paymentMethodValue}>EGP {(pm.total || 0).toLocaleString()}</Text>
              </View>
            ))}
          </View>
        )}
      </Animated.View>

      <Text style={styles.hint}>Tap any card for detailed analytics • Pull down to refresh</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#F4F6F9", padding: 20, flex: 1 },
  header: { fontSize: 28, fontWeight: "800", color: "#222" },
  subHeader: { fontSize: 13, color: "#666", marginTop: 4, marginBottom: 16 },

  quickStatsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  quickStat: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 4,
    alignItems: "center",
    elevation: 2,
  },
  quickStatValue: { fontSize: 16, fontWeight: "800", color: "#9B084D" },
  quickStatLabel: { fontSize: 10, color: "#666", marginTop: 2 },

  card: {
    backgroundColor: "#9B084D",
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    elevation: 6,
  },
  cardHead: { flexDirection: "row", alignItems: "center" },
  cardTitle: { color: "#fff", fontWeight: "700", fontSize: 14 },
  cardValue: { color: "#fff", fontWeight: "800", fontSize: 22, marginTop: 4 },
  cardSub: { color: "#ffe6f0", marginTop: 4, fontSize: 12 },
  cardSubRow: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 12 },
  cardSubHighlight: { color: "#fff", fontSize: 12, fontWeight: "600", backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },

  miniChart: { marginTop: 8, borderRadius: 12, backgroundColor: "transparent" },

  inventoryPreview: { flexDirection: "row", justifyContent: "space-around", marginTop: 12, paddingTop: 8 },
  inventoryItem: { alignItems: "center" },
  inventoryBar: { width: 30, backgroundColor: "rgba(255,255,255,0.8)", borderRadius: 4 },
  inventoryLabel: { color: "#ffe6f0", fontSize: 11, marginTop: 4 },

  performanceCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    elevation: 3,
  },
  performanceTitle: { fontSize: 16, fontWeight: "700", color: "#333", marginBottom: 12 },
  performanceGrid: { flexDirection: "row", justifyContent: "space-between" },
  performanceItem: { alignItems: "center", flex: 1 },
  performanceValue: { fontSize: 18, fontWeight: "700", color: "#9B084D", marginTop: 6 },
  performanceLabel: { fontSize: 11, color: "#666", marginTop: 2 },

  paymentMethodsCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    elevation: 3,
  },
  paymentMethodsTitle: { fontSize: 16, fontWeight: "700", color: "#333", marginBottom: 12 },
  paymentMethodRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  paymentMethodName: { width: 70, fontSize: 13, color: "#555" },
  paymentMethodBarContainer: { flex: 1, height: 8, backgroundColor: "#eee", borderRadius: 4, marginHorizontal: 10 },
  paymentMethodBar: { height: 8, backgroundColor: "#9B084D", borderRadius: 4 },
  paymentMethodValue: { fontSize: 13, fontWeight: "600", color: "#333" },

  hint: { marginTop: 12, color: "#666", textAlign: "center", fontSize: 13 },
});
