// app/doctor/report/appointments.tsx
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LineChart, BarChart } from "react-native-chart-kit";
import { chartConfig } from "./chartConfig";
import { getAppointmentsReport, AppointmentsReport } from "../../../src/api/reportApi";

const W = Dimensions.get("window").width - 40;

type Period = "week" | "month" | "year";

export default function AppointmentsReportPage() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("week");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<AppointmentsReport | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAppointmentsReport(period);
        setReport(data);
      } catch (err) {
        setError('Failed to load appointments report');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [period]);

  // Safe data with fallbacks
  const labels = report?.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dataPoints = report?.data || [0, 0, 0, 0, 0, 0, 0];
  
  // Ensure chart data has values
  const safeDataPoints = dataPoints.some(v => v > 0) ? dataPoints : dataPoints.map(() => 0.1);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', flex: 1 }]}>
        <ActivityIndicator size="large" color="#9B084D" />
        <Text style={{ marginTop: 12, color: '#666' }}>Loading report...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Appointments Report</Text>
        <Pressable onPress={() => router.back()}><Text style={styles.close}>Close</Text></Pressable>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

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

      {/* Main Chart */}
      <LineChart
        data={{ labels: labels.slice(0, period === 'week' ? 7 : 12), datasets: [{ data: safeDataPoints.slice(0, period === 'week' ? 7 : 12) }] }}
        width={W}
        height={280}
        chartConfig={{
          ...chartConfig,
          color: (o = 1) => `rgba(155,8,77, ${o})`,
          labelColor: (o = 1) => `rgba(68,68,68, ${o})`,
        }}
        bezier
        style={{ borderRadius: 14, marginTop: 12 }}
        yAxisSuffix=""
      />

      {/* Stats Summary */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{report?.total || 0}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{report?.completed || 0}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{report?.no_shows || 0}</Text>
          <Text style={styles.statLabel}>Cancelled</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{report?.average_per_day || 0}</Text>
          <Text style={styles.statLabel}>Avg/Day</Text>
        </View>
      </View>

      {/* Status Breakdown */}
      {report?.status_breakdown && report.status_breakdown.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status Breakdown</Text>
          {report.status_breakdown.map((item, index) => (
            <View key={index} style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>{item.status}</Text>
              <View style={styles.breakdownBarContainer}>
                <View 
                  style={[
                    styles.breakdownBar, 
                    { width: `${Math.min((item.count / (report?.total || 1)) * 100, 100)}%` }
                  ]} 
                />
              </View>
              <Text style={styles.breakdownValue}>{item.count}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Service Type Breakdown */}
      {report?.service_breakdown && report.service_breakdown.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>By Service Type</Text>
          {report.service_breakdown.slice(0, 5).map((item, index) => (
            <View key={index} style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>{item.type || 'General'}</Text>
              <View style={styles.breakdownBarContainer}>
                <View 
                  style={[
                    styles.breakdownBar, 
                    { width: `${Math.min((item.count / (report?.total || 1)) * 100, 100)}%`, backgroundColor: '#0284c7' }
                  ]} 
                />
              </View>
              <Text style={styles.breakdownValue}>{item.count}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Hourly Distribution */}
      {report?.hourly_distribution && report.hourly_distribution.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Busiest Hours</Text>
          <View style={styles.hourlyGrid}>
            {report.hourly_distribution.slice(0, 12).map((item, index) => (
              <View key={index} style={styles.hourlyItem}>
                <Text style={styles.hourlyTime}>{item.hour}:00</Text>
                <Text style={styles.hourlyCount}>{item.count}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "800" },
  close: { color: "#9B084D", fontWeight: "700" },
  
  errorBox: { backgroundColor: '#fee2e2', padding: 12, borderRadius: 8, marginTop: 12 },
  errorText: { color: '#dc2626', fontWeight: '600' },

  filterRow: { flexDirection: 'row', marginTop: 16, gap: 8 },
  filterBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#f0f0f0' },
  filterBtnActive: { backgroundColor: '#9B084D' },
  filterText: { fontWeight: '600', color: '#666' },
  filterTextActive: { color: '#fff' },

  statsGrid: { flexDirection: 'row', marginTop: 20, gap: 10 },
  statCard: { flex: 1, backgroundColor: '#f8f9fa', padding: 12, borderRadius: 10, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: '#9B084D' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 4 },

  section: { marginTop: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, color: '#333' },

  breakdownRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  breakdownLabel: { width: 80, fontSize: 13, color: '#555', textTransform: 'capitalize' },
  breakdownBarContainer: { flex: 1, height: 12, backgroundColor: '#f0f0f0', borderRadius: 6, marginHorizontal: 10 },
  breakdownBar: { height: 12, backgroundColor: '#9B084D', borderRadius: 6 },
  breakdownValue: { width: 40, textAlign: 'right', fontWeight: '700', color: '#333' },

  hourlyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hourlyItem: { backgroundColor: '#f8f9fa', padding: 10, borderRadius: 8, alignItems: 'center', minWidth: 60 },
  hourlyTime: { fontSize: 12, color: '#666' },
  hourlyCount: { fontSize: 16, fontWeight: '700', color: '#9B084D' },

  info: { marginTop: 8, color: "#555" },
});
