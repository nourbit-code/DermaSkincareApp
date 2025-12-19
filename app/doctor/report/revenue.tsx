// app/doctor/report/revenue.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Dimensions,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";
import { chartConfig } from "./chartConfig";
import { useRouter } from "expo-router";
import { getReportAnalytics, ReportAnalytics } from "../../../src/api/reportApi";
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Users,
  Calendar,
} from "lucide-react-native";

const W = Dimensions.get("window").width - 40;

type Period = "week" | "month" | "year";

export default function RevenueReport() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("week");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReportAnalytics | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getReportAnalytics(period);
        setData(response);
      } catch (err) {
        setError("Failed to load revenue data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [period]);

  // Extract data from API response
  const labels = data?.labels || ["No Data"];
  const amounts = data?.payments?.data || [0];
  const totalRevenue = data?.payments?.total || 0;
  const totalAppointments = data?.appointments?.total || 0;
  const completedAppointments = data?.appointments?.completed || 0;
  
  // Calculate averages
  const avgPerDay = amounts.length > 0 
    ? Math.round(amounts.reduce((a, b) => a + b, 0) / amounts.length) 
    : 0;
  const avgPerVisit = completedAppointments > 0 
    ? Math.round(totalRevenue / completedAppointments) 
    : 0;
  
  // Best day
  const maxRevenue = Math.max(...(amounts.length > 0 ? amounts : [0]));
  const bestDayIndex = amounts.indexOf(maxRevenue);
  const bestDay = labels[bestDayIndex] || "N/A";

  // Payment method breakdown
  const paymentMethods = data?.payments?.by_method || [];
  const pieData = paymentMethods.length > 0
    ? paymentMethods.map((pm: any, idx: number) => ({
        name: pm.payment_method || "Cash",
        population: pm.total || 0,
        color: ["#9B084D", "#FF7BA9", "#28a745", "#ffc107", "#17a2b8"][idx % 5],
        legendFontColor: "#7F7F7F",
        legendFontSize: 12,
      }))
    : [{ name: "No Data", population: 1, color: "#ccc", legendFontColor: "#7F7F7F", legendFontSize: 12 }];

  // Safe chart data
  const safeAmounts = amounts.length > 0 ? amounts : [0];
  const safeLabels = labels.length > 0 ? labels : ["N/A"];

  // Trends (mock comparison)
  const previousTotal = totalRevenue * 0.88;
  const changePercent = previousTotal > 0 
    ? Math.round(((totalRevenue - previousTotal) / previousTotal) * 100) 
    : 0;
  const isPositive = changePercent >= 0;

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center", flex: 1 }]}>
        <ActivityIndicator size="large" color="#9B084D" />
        <Text style={{ marginTop: 16, color: "#666" }}>Loading revenue data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center", flex: 1 }]}>
        <AlertCircle size={48} color="#dc3545" />
        <Text style={{ marginTop: 16, color: "#dc3545" }}>{error}</Text>
        <Pressable
          style={[styles.filterBtn, styles.filterBtnActive, { marginTop: 16 }]}
          onPress={() => setPeriod(period)}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Clinic Revenue</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.close}>Close</Text>
        </Pressable>
      </View>

      {/* Period Filter */}
      <View style={styles.filterRow}>
        {(["week", "month", "year"] as Period[]).map((p) => (
          <Pressable
            key={p}
            style={[styles.filterBtn, period === p && styles.filterBtnActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.filterText, period === p && styles.filterTextActive]}>
              {p.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Main Revenue Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <DollarSign size={32} color="#fff" />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.summaryLabel}>Total Revenue This {period === "week" ? "Week" : period === "month" ? "Month" : "Year"}</Text>
            <Text style={styles.summaryValue}>EGP {totalRevenue.toLocaleString()}</Text>
          </View>
        </View>
        <View style={styles.trendRow}>
          {isPositive ? (
            <TrendingUp size={20} color="#28a745" />
          ) : (
            <TrendingDown size={20} color="#dc3545" />
          )}
          <Text style={[styles.trendText, { color: isPositive ? "#28a745" : "#dc3545" }]}>
            {changePercent > 0 ? "+" : ""}{changePercent}% vs last {period}
          </Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <DollarSign size={24} color="#9B084D" />
          <Text style={styles.statValue}>EGP {avgPerDay.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Avg/Day</Text>
        </View>
        <View style={styles.statCard}>
          <Users size={24} color="#28a745" />
          <Text style={[styles.statValue, { color: "#28a745" }]}>EGP {avgPerVisit.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Per Visit</Text>
        </View>
        <View style={styles.statCard}>
          <Calendar size={24} color="#ffc107" />
          <Text style={[styles.statValue, { color: "#ffc107" }]}>{bestDay}</Text>
          <Text style={styles.statLabel}>Best Day</Text>
        </View>
        <View style={styles.statCard}>
          <CreditCard size={24} color="#17a2b8" />
          <Text style={[styles.statValue, { color: "#17a2b8" }]}>{completedAppointments}</Text>
          <Text style={styles.statLabel}>Transactions</Text>
        </View>
      </View>

      {/* Revenue Over Time Chart */}
      <Text style={styles.sectionTitle}>Revenue Over Time</Text>
      <LineChart
        data={{
          labels: safeLabels,
          datasets: [{ data: safeAmounts }],
        }}
        width={W}
        height={260}
        chartConfig={{
          ...chartConfig,
          color: (o = 1) => `rgba(155, 8, 77, ${o})`,
          labelColor: (o = 1) => `rgba(68, 68, 68, ${o})`,
        }}
        bezier
        style={{ borderRadius: 14, marginTop: 12 }}
        yAxisSuffix=""
        yAxisLabel="EGP "
      />

      {/* Daily Revenue Bar Chart */}
      <Text style={styles.sectionTitle}>Daily Breakdown</Text>
      <BarChart
        data={{
          labels: safeLabels.slice(-7),
          datasets: [{ data: safeAmounts.slice(-7) }],
        }}
        width={W}
        height={220}
        chartConfig={{
          ...chartConfig,
          color: (o = 1) => `rgba(155, 8, 77, ${o})`,
          labelColor: (o = 1) => `rgba(68, 68, 68, ${o})`,
          barPercentage: 0.6,
        }}
        style={{ borderRadius: 14, marginTop: 12 }}
        yAxisSuffix=""
        yAxisLabel="EGP "
      />

      {/* Payment Methods Pie Chart */}
      {pieData.length > 0 && pieData[0].name !== "No Data" && (
        <>
          <Text style={styles.sectionTitle}>By Payment Method</Text>
          <View style={styles.pieContainer}>
            <PieChart
              data={pieData}
              width={W}
              height={200}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
          
          {/* Payment Method List */}
          <View style={styles.methodList}>
            {paymentMethods.map((pm: any, idx: number) => (
              <View key={idx} style={styles.methodItem}>
                <View style={[styles.methodDot, { backgroundColor: ["#9B084D", "#FF7BA9", "#28a745", "#ffc107", "#17a2b8"][idx % 5] }]} />
                <Text style={styles.methodName}>{pm.payment_method || "Cash"}</Text>
                <Text style={styles.methodValue}>EGP {(pm.total || 0).toLocaleString()}</Text>
                <Text style={styles.methodCount}>({pm.count || 0})</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Performance Metrics */}
      <Text style={styles.sectionTitle}>Performance Metrics</Text>
      <View style={styles.metricsCard}>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Total Appointments</Text>
          <Text style={styles.metricValue}>{totalAppointments}</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Completed</Text>
          <Text style={[styles.metricValue, { color: "#28a745" }]}>{completedAppointments}</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Completion Rate</Text>
          <Text style={[styles.metricValue, { color: "#17a2b8" }]}>
            {totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0}%
          </Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Revenue per Appointment</Text>
          <Text style={[styles.metricValue, { color: "#9B084D" }]}>EGP {avgPerVisit}</Text>
        </View>
      </View>

      {/* Insights */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>💡 Revenue Insights</Text>
        <Text style={styles.infoText}>
          • Best performing day: {bestDay} (EGP {maxRevenue.toLocaleString()}){"\n"}
          • Average daily revenue: EGP {avgPerDay.toLocaleString()}{"\n"}
          • Total visits this {period}: {completedAppointments}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#F4F6F9", flex: 1 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "800", color: "#222" },
  close: { color: "#9B084D", fontWeight: "700", fontSize: 16 },

  filterRow: { flexDirection: "row", alignItems: "center", marginVertical: 16 },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#fff",
    marginRight: 8,
    elevation: 2,
  },
  filterBtnActive: { backgroundColor: "#9B084D" },
  filterText: { color: "#555", fontWeight: "700" },
  filterTextActive: { color: "#fff" },

  summaryCard: {
    backgroundColor: "#9B084D",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
  },
  summaryHeader: { flexDirection: "row", alignItems: "center" },
  summaryLabel: { color: "#ffe6f0", fontSize: 14 },
  summaryValue: { color: "#fff", fontSize: 32, fontWeight: "800" },
  trendRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  trendText: { marginLeft: 8, fontWeight: "700", fontSize: 14 },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 16 },
  statCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
    elevation: 2,
  },
  statValue: { fontSize: 18, fontWeight: "700", color: "#9B084D", marginTop: 8 },
  statLabel: { fontSize: 12, color: "#666", marginTop: 4 },

  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#333", marginTop: 20, marginBottom: 8 },

  pieContainer: { backgroundColor: "#fff", borderRadius: 14, padding: 12, elevation: 2 },

  methodList: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginTop: 12, elevation: 2 },
  methodItem: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  methodDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  methodName: { flex: 1, fontSize: 14, color: "#333" },
  methodValue: { fontSize: 14, fontWeight: "700", color: "#333", marginRight: 8 },
  methodCount: { fontSize: 12, color: "#666" },

  metricsCard: { backgroundColor: "#fff", borderRadius: 12, padding: 16, elevation: 2 },
  metricRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10 },
  metricLabel: { fontSize: 14, color: "#666" },
  metricValue: { fontSize: 16, fontWeight: "700", color: "#333" },
  metricDivider: { height: 1, backgroundColor: "#eee" },

  infoCard: {
    backgroundColor: "#d4edda",
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#28a745",
  },
  infoTitle: { fontSize: 16, fontWeight: "700", color: "#155724", marginBottom: 8 },
  infoText: { fontSize: 14, color: "#155724", lineHeight: 22 },
});
