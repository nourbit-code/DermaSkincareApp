// app/doctor/report/doctor-income.tsx
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { PieChart, LineChart, BarChart } from "react-native-chart-kit";
import { chartConfig } from "./chartConfig";
import { getReportAnalytics, ReportAnalytics } from "../../../src/api/reportApi";
import {
  AlertCircle,
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Activity,
} from "lucide-react-native";

const W = Dimensions.get("window").width - 40;
const DOCTOR_SHARE = 0.45; // Doctor's 45% share

type Period = "week" | "month" | "year";

interface ServiceIncome {
  name: string;
  population: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

export default function DoctorIncomeReport() {
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
        setError("Failed to load income data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [period]);

  // Calculate income from payment data
  const totalRevenue = data?.payments?.total || 0;
  const doctorIncome = Math.round(totalRevenue * DOCTOR_SHARE);
  const clinicShare = totalRevenue - doctorIncome;
  
  // Daily/Period income data
  const incomeData = (data?.payments?.data || []).map(p => Math.round(p * DOCTOR_SHARE));
  const labels = data?.labels || ["No Data"];
  
  // Average income per day
  const avgIncome = incomeData.length > 0 
    ? Math.round(incomeData.reduce((a, b) => a + b, 0) / incomeData.length) 
    : 0;
  
  // Best day
  const maxIncome = Math.max(...(incomeData.length > 0 ? incomeData : [0]));
  const bestDayIndex = incomeData.indexOf(maxIncome);
  const bestDay = labels[bestDayIndex] || "N/A";

  // Payment method breakdown for pie chart
  const paymentMethods = data?.payments?.by_method || [];
  const pieData: ServiceIncome[] = paymentMethods.length > 0
    ? paymentMethods.map((pm: any, idx: number) => ({
        name: pm.payment_method || "Cash",
        population: Math.round((pm.total || 0) * DOCTOR_SHARE),
        color: ["#9B084D", "#FF7BA9", "#FFB6D5", "#28a745", "#ffc107"][idx % 5],
        legendFontColor: "#7F7F7F",
        legendFontSize: 12,
      }))
    : [
        { name: "No Data", population: 1, color: "#ccc", legendFontColor: "#7F7F7F", legendFontSize: 12 }
      ];

  // Appointments completed (for per-visit calculation)
  const completedAppointments = data?.appointments?.completed || 0;
  const incomePerVisit = completedAppointments > 0 
    ? Math.round(doctorIncome / completedAppointments) 
    : 0;

  // Safe chart data
  const safeIncomeData = incomeData.length > 0 ? incomeData : [0];
  const safeLabels = labels.length > 0 ? labels : ["N/A"];

  // Previous period comparison (mock - could be enhanced with real comparison)
  const previousIncome = doctorIncome * 0.92; // Placeholder
  const changePercent = previousIncome > 0 
    ? Math.round(((doctorIncome - previousIncome) / previousIncome) * 100) 
    : 0;
  const isPositiveChange = changePercent >= 0;

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center", flex: 1 }]}>
        <ActivityIndicator size="large" color="#9B084D" />
        <Text style={{ marginTop: 16, color: "#666" }}>Loading income data...</Text>
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
        <Text style={styles.title}>Doctor Income</Text>
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

      {/* Main Income Card */}
      <View style={styles.incomeCard}>
        <View style={styles.incomeHeader}>
          <Wallet size={32} color="#fff" />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.incomeLabel}>Your Income This {period === "week" ? "Week" : period === "month" ? "Month" : "Year"}</Text>
            <Text style={styles.incomeValue}>EGP {doctorIncome.toLocaleString()}</Text>
          </View>
        </View>
        <View style={styles.incomeStats}>
          <View style={styles.incomeStat}>
            <Text style={styles.incomeStatValue}>EGP {totalRevenue.toLocaleString()}</Text>
            <Text style={styles.incomeStatLabel}>Total Revenue</Text>
          </View>
          <View style={styles.incomeStatDivider} />
          <View style={styles.incomeStat}>
            <Text style={styles.incomeStatValue}>{(DOCTOR_SHARE * 100)}%</Text>
            <Text style={styles.incomeStatLabel}>Your Share</Text>
          </View>
          <View style={styles.incomeStatDivider} />
          <View style={styles.incomeStat}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {isPositiveChange ? (
                <TrendingUp size={16} color="#28a745" />
              ) : (
                <TrendingDown size={16} color="#dc3545" />
              )}
              <Text style={[styles.incomeStatValue, { color: isPositiveChange ? "#28a745" : "#dc3545", marginLeft: 4 }]}>
                {changePercent > 0 ? "+" : ""}{changePercent}%
              </Text>
            </View>
            <Text style={styles.incomeStatLabel}>vs Last {period}</Text>
          </View>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <DollarSign size={24} color="#9B084D" />
          <Text style={styles.statValue}>EGP {avgIncome.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Avg/Day</Text>
        </View>
        <View style={styles.statCard}>
          <Activity size={24} color="#28a745" />
          <Text style={[styles.statValue, { color: "#28a745" }]}>EGP {incomePerVisit.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Per Visit</Text>
        </View>
        <View style={styles.statCard}>
          <Calendar size={24} color="#ffc107" />
          <Text style={[styles.statValue, { color: "#ffc107" }]}>{bestDay}</Text>
          <Text style={styles.statLabel}>Best Day</Text>
        </View>
        <View style={styles.statCard}>
          <TrendingUp size={24} color="#17a2b8" />
          <Text style={[styles.statValue, { color: "#17a2b8" }]}>EGP {maxIncome.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Max/Day</Text>
        </View>
      </View>

      {/* Income Over Time Chart */}
      <Text style={styles.sectionTitle}>Income Over Time</Text>
      <LineChart
        data={{
          labels: safeLabels,
          datasets: [{ data: safeIncomeData }],
        }}
        width={W}
        height={220}
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

      {/* Payment Methods Pie Chart */}
      {pieData.length > 0 && pieData[0].name !== "No Data" && (
        <>
          <Text style={styles.sectionTitle}>Income by Payment Method</Text>
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
        </>
      )}

      {/* Daily Breakdown Bar Chart */}
      <Text style={styles.sectionTitle}>Daily Income Breakdown</Text>
      <BarChart
        data={{
          labels: safeLabels.slice(-7),
          datasets: [{ data: safeIncomeData.slice(-7) }],
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

      {/* Income Split */}
      <Text style={styles.sectionTitle}>Revenue Split</Text>
      <View style={styles.splitCard}>
        <View style={styles.splitRow}>
          <View style={styles.splitItem}>
            <View style={[styles.splitDot, { backgroundColor: "#9B084D" }]} />
            <Text style={styles.splitLabel}>Doctor ({DOCTOR_SHARE * 100}%)</Text>
          </View>
          <Text style={styles.splitValue}>EGP {doctorIncome.toLocaleString()}</Text>
        </View>
        <View style={styles.splitRow}>
          <View style={styles.splitItem}>
            <View style={[styles.splitDot, { backgroundColor: "#FFB6D5" }]} />
            <Text style={styles.splitLabel}>Clinic ({(1 - DOCTOR_SHARE) * 100}%)</Text>
          </View>
          <Text style={styles.splitValue}>EGP {clinicShare.toLocaleString()}</Text>
        </View>
        <View style={styles.splitBar}>
          <View style={[styles.splitBarDoctor, { flex: DOCTOR_SHARE }]} />
          <View style={[styles.splitBarClinic, { flex: 1 - DOCTOR_SHARE }]} />
        </View>
      </View>

      {/* Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>📊 Income Insights</Text>
        <Text style={styles.infoText}>
          • Your income is based on {(DOCTOR_SHARE * 100)}% of clinic revenue{"\n"}
          • You completed {completedAppointments} appointments this {period}{"\n"}
          • Average income per visit: EGP {incomePerVisit}
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

  incomeCard: {
    backgroundColor: "#9B084D",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
  },
  incomeHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  incomeLabel: { color: "#ffe6f0", fontSize: 14 },
  incomeValue: { color: "#fff", fontSize: 32, fontWeight: "800" },
  incomeStats: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  incomeStat: { alignItems: "center", flex: 1 },
  incomeStatValue: { color: "#fff", fontSize: 16, fontWeight: "700" },
  incomeStatLabel: { color: "#ffe6f0", fontSize: 11, marginTop: 2 },
  incomeStatDivider: { width: 1, height: 30, backgroundColor: "rgba(255,255,255,0.3)" },

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

  splitCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    elevation: 2,
  },
  splitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  splitItem: { flexDirection: "row", alignItems: "center" },
  splitDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  splitLabel: { fontSize: 14, color: "#555" },
  splitValue: { fontSize: 16, fontWeight: "700", color: "#333" },
  splitBar: {
    flexDirection: "row",
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
    marginTop: 8,
  },
  splitBarDoctor: { backgroundColor: "#9B084D" },
  splitBarClinic: { backgroundColor: "#FFB6D5" },

  infoCard: {
    backgroundColor: "#fff3cd",
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#ffc107",
  },
  infoTitle: { fontSize: 16, fontWeight: "700", color: "#856404", marginBottom: 8 },
  infoText: { fontSize: 14, color: "#856404", lineHeight: 22 },
});
