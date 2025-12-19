// app/doctor/report/appointments.tsx
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
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";
import { chartConfig } from "./chartConfig";
import { getAppointmentsReport, AppointmentsReport as AppointmentsReportType } from "../../../src/api/reportApi";
import { AlertCircle, Calendar, Clock, CheckCircle, XCircle, TrendingUp, Users, Activity } from "lucide-react-native";

const W = Dimensions.get("window").width - 40;

type Period = "week" | "month" | "year";

export default function AppointmentsReportScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("week");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AppointmentsReportType | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getAppointmentsReport(period);
        setData(response);
      } catch (err) {
        setError("Failed to load appointments data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [period]);

  // Prepare chart data
  const labels = data?.labels || ["No Data"];
  const dataPoints = data?.data || [0];
  const safeData = dataPoints.length > 0 ? dataPoints : [0];
  const safeLabels = labels.length > 0 ? labels : ["N/A"];

  // Status counts
  const statusBreakdown = data?.status_breakdown || [];
  const completed = statusBreakdown.find((s: any) => s.status === "completed")?.count || data?.completed || 0;
  const cancelled = statusBreakdown.find((s: any) => s.status === "cancelled")?.count || 0;
  const scheduled = statusBreakdown.find((s: any) => s.status === "booked" || s.status === "scheduled")?.count || 0;
  const noShow = statusBreakdown.find((s: any) => s.status === "no_show")?.count || data?.no_shows || 0;
  const totalAppointments = data?.total_appointments || data?.total || 0;

  // Completion rate
  const completionRate = totalAppointments > 0 
    ? Math.round((completed / totalAppointments) * 100) 
    : 0;

  // Busiest day
  const maxAppts = Math.max(...(dataPoints.length > 0 ? dataPoints : [0]));
  const busiestDayIndex = dataPoints.indexOf(maxAppts);
  const busiestDay = labels[busiestDayIndex] || "N/A";

  // Status pie chart data
  const statusPieData = [
    { name: "Completed", population: completed, color: "#28a745", legendFontColor: "#333", legendFontSize: 12 },
    { name: "Cancelled", population: cancelled || 1, color: "#dc3545", legendFontColor: "#333", legendFontSize: 12 },
    { name: "Scheduled", population: scheduled || 1, color: "#ffc107", legendFontColor: "#333", legendFontSize: 12 },
    { name: "No-Show", population: noShow || 1, color: "#6c757d", legendFontColor: "#333", legendFontSize: 12 },
  ].filter(item => item.population > 0);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center", flex: 1 }]}>
        <ActivityIndicator size="large" color="#9B084D" />
        <Text style={{ marginTop: 16, color: "#666" }}>Loading appointments...</Text>
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
          <Text style={{ color: "#fff" }}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Appointments Report</Text>
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

      {/* Main Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Calendar size={32} color="#fff" />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.summaryLabel}>Total Appointments This {period === "week" ? "Week" : period === "month" ? "Month" : "Year"}</Text>
            <Text style={styles.summaryValue}>{totalAppointments}</Text>
          </View>
        </View>
        <View style={styles.summaryStats}>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryStatValue}>{data?.average_per_day?.toFixed(1) || 0}</Text>
            <Text style={styles.summaryStatLabel}>Avg/Day</Text>
          </View>
          <View style={styles.summaryStatDivider} />
          <View style={styles.summaryStat}>
            <Text style={[styles.summaryStatValue, { color: "#28a745" }]}>{completionRate}%</Text>
            <Text style={styles.summaryStatLabel}>Completion</Text>
          </View>
          <View style={styles.summaryStatDivider} />
          <View style={styles.summaryStat}>
            <Text style={styles.summaryStatValue}>{busiestDay}</Text>
            <Text style={styles.summaryStatLabel}>Busiest</Text>
          </View>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Calendar size={24} color="#9B084D" />
          <Text style={styles.statValue}>{totalAppointments}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <CheckCircle size={24} color="#28a745" />
          <Text style={[styles.statValue, { color: "#28a745" }]}>{completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <XCircle size={24} color="#dc3545" />
          <Text style={[styles.statValue, { color: "#dc3545" }]}>{cancelled}</Text>
          <Text style={styles.statLabel}>Cancelled</Text>
        </View>
        <View style={styles.statCard}>
          <Clock size={24} color="#ffc107" />
          <Text style={[styles.statValue, { color: "#ffc107" }]}>{scheduled}</Text>
          <Text style={styles.statLabel}>Scheduled</Text>
        </View>
      </View>

      {/* Line Chart */}
      <Text style={styles.sectionTitle}>Appointments Over Time</Text>
      <LineChart
        data={{ labels: safeLabels, datasets: [{ data: safeData }] }}
        width={W}
        height={220}
        chartConfig={{
          ...chartConfig,
          color: (o = 1) => `rgba(155,8,77, ${o})`,
          labelColor: (o = 1) => `rgba(68,68,68, ${o})`,
        }}
        bezier
        style={{ borderRadius: 14, marginTop: 12 }}
        yAxisSuffix=""
      />

      {/* Status Distribution Pie Chart */}
      {statusPieData.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Status Distribution</Text>
          <View style={styles.pieContainer}>
            <PieChart
              data={statusPieData}
              width={W}
              height={180}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
        </>
      )}

      {/* Status Progress Bars */}
      <Text style={styles.sectionTitle}>Status Breakdown</Text>
      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: "#28a745" }]} />
          <Text style={styles.statusLabel}>Completed</Text>
          <View style={styles.statusBarContainer}>
            <View style={[styles.statusBar, { backgroundColor: "#28a745", width: `${totalAppointments > 0 ? (completed / totalAppointments) * 100 : 0}%` }]} />
          </View>
          <Text style={styles.statusCount}>{completed}</Text>
        </View>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: "#ffc107" }]} />
          <Text style={styles.statusLabel}>Scheduled</Text>
          <View style={styles.statusBarContainer}>
            <View style={[styles.statusBar, { backgroundColor: "#ffc107", width: `${totalAppointments > 0 ? (scheduled / totalAppointments) * 100 : 0}%` }]} />
          </View>
          <Text style={styles.statusCount}>{scheduled}</Text>
        </View>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: "#dc3545" }]} />
          <Text style={styles.statusLabel}>Cancelled</Text>
          <View style={styles.statusBarContainer}>
            <View style={[styles.statusBar, { backgroundColor: "#dc3545", width: `${totalAppointments > 0 ? (cancelled / totalAppointments) * 100 : 0}%` }]} />
          </View>
          <Text style={styles.statusCount}>{cancelled}</Text>
        </View>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: "#6c757d" }]} />
          <Text style={styles.statusLabel}>No-Show</Text>
          <View style={styles.statusBarContainer}>
            <View style={[styles.statusBar, { backgroundColor: "#6c757d", width: `${totalAppointments > 0 ? (noShow / totalAppointments) * 100 : 0}%` }]} />
          </View>
          <Text style={styles.statusCount}>{noShow}</Text>
        </View>
      </View>

      {/* Service Breakdown */}
      {data?.service_breakdown && data.service_breakdown.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>By Service Type</Text>
          <View style={styles.serviceCard}>
            {data.service_breakdown.slice(0, 6).map((service: any, idx: number) => (
              <View key={idx} style={styles.serviceRow}>
                <Text style={styles.serviceName} numberOfLines={1}>{service.type || service.service || "General"}</Text>
                <View style={styles.serviceBarContainer}>
                  <View
                    style={[
                      styles.serviceBar,
                      { width: `${Math.min(100, (service.count / (totalAppointments || 1)) * 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.serviceCount}>{service.count}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Hourly Distribution */}
      {data?.hourly_distribution && data.hourly_distribution.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Peak Hours</Text>
          <View style={styles.hourlyGrid}>
            {data.hourly_distribution
              .sort((a: any, b: any) => b.count - a.count)
              .slice(0, 6)
              .map((hour: any, idx: number) => (
                <View key={idx} style={[styles.hourlyItem, idx === 0 && styles.hourlyItemPeak]}>
                  <Clock size={16} color={idx === 0 ? "#9B084D" : "#666"} />
                  <Text style={[styles.hourlyTime, idx === 0 && { color: "#9B084D" }]}>
                    {hour.hour}:00
                  </Text>
                  <Text style={[styles.hourlyCount, idx === 0 && { color: "#9B084D" }]}>
                    {hour.count}
                  </Text>
                  {idx === 0 && <Text style={styles.peakBadge}>PEAK</Text>}
                </View>
              ))}
          </View>
        </>
      )}

      {/* Insights */}
      <View style={styles.insightsCard}>
        <Text style={styles.insightsTitle}>📊 Appointment Insights</Text>
        <Text style={styles.insightsText}>
          • Busiest day: {busiestDay} ({maxAppts} appointments){"\n"}
          • Completion rate: {completionRate}%{"\n"}
          • Average per day: {data?.average_per_day?.toFixed(1) || 0} appointments{"\n"}
          • Cancellation rate: {totalAppointments > 0 ? Math.round((cancelled / totalAppointments) * 100) : 0}%
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#F4F6F9", flex: 1 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "800", color: "#222" },
  close: { color: "#9B084D", fontWeight: "700", fontSize: 16 },

  filterRow: { flexDirection: "row", marginTop: 16, marginBottom: 16 },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#fff",
    marginRight: 8,
    elevation: 2,
  },
  filterBtnActive: { backgroundColor: "#9B084D" },
  filterText: { color: "#555", fontWeight: "600" },
  filterTextActive: { color: "#fff" },

  summaryCard: {
    backgroundColor: "#9B084D",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
  },
  summaryHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  summaryLabel: { color: "#ffe6f0", fontSize: 14 },
  summaryValue: { color: "#fff", fontSize: 36, fontWeight: "800" },
  summaryStats: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryStat: { alignItems: "center", flex: 1 },
  summaryStatValue: { color: "#fff", fontSize: 18, fontWeight: "700" },
  summaryStatLabel: { color: "#ffe6f0", fontSize: 11, marginTop: 2 },
  summaryStatDivider: { width: 1, height: 30, backgroundColor: "rgba(255,255,255,0.3)" },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 16 },
  statCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    elevation: 3,
  },
  statValue: { fontSize: 24, fontWeight: "800", color: "#9B084D", marginTop: 8 },
  statLabel: { color: "#666", fontSize: 12, marginTop: 4 },

  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#333", marginTop: 20, marginBottom: 8 },

  pieContainer: { backgroundColor: "#fff", borderRadius: 14, padding: 12, elevation: 2 },

  statusCard: { backgroundColor: "#fff", borderRadius: 12, padding: 16, elevation: 2 },
  statusRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  statusLabel: { width: 80, fontSize: 13, color: "#333" },
  statusBarContainer: { flex: 1, height: 8, backgroundColor: "#eee", borderRadius: 4, marginHorizontal: 10 },
  statusBar: { height: 8, borderRadius: 4 },
  statusCount: { width: 40, textAlign: "right", fontSize: 14, fontWeight: "700", color: "#333" },

  serviceCard: { backgroundColor: "#fff", borderRadius: 12, padding: 16, elevation: 2 },
  serviceRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  serviceName: { width: 90, fontSize: 13, color: "#333" },
  serviceBarContainer: { flex: 1, height: 8, backgroundColor: "#eee", borderRadius: 4, marginHorizontal: 10 },
  serviceBar: { height: 8, backgroundColor: "#9B084D", borderRadius: 4 },
  serviceCount: { fontSize: 14, fontWeight: "700", color: "#9B084D" },

  hourlyGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  hourlyItem: {
    width: "30%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    alignItems: "center",
    elevation: 2,
  },
  hourlyItemPeak: { borderWidth: 2, borderColor: "#9B084D" },
  hourlyTime: { fontSize: 14, color: "#666", marginTop: 4 },
  hourlyCount: { fontSize: 18, fontWeight: "700", color: "#333", marginTop: 2 },
  peakBadge: { fontSize: 9, fontWeight: "700", color: "#fff", backgroundColor: "#9B084D", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 },

  insightsCard: {
    backgroundColor: "#e7f3ff",
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#17a2b8",
  },
  insightsTitle: { fontSize: 16, fontWeight: "700", color: "#0c5460", marginBottom: 8 },
  insightsText: { fontSize: 14, color: "#0c5460", lineHeight: 22 },
});
