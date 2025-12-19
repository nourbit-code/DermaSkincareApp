// app/doctor/report/patients.tsx
import React, { useEffect, useState, useMemo } from "react";
import { View, Text, Dimensions, StyleSheet, ScrollView, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";
import { useRouter } from "expo-router";
import { chartConfig } from "./chartConfig";
import { getNewPatientsReport } from "../../../src/api/reportApi";
import { Users, TrendingUp, Calendar, UserPlus, AlertCircle, Activity, Pill, Stethoscope, Heart, AlertTriangle } from "lucide-react-native";

const W = Dimensions.get("window").width - 40;

type Period = "week" | "month" | "year";

export default function PatientsReport() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("week");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const fetchData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const response = await getNewPatientsReport(period);
      setData(response);
    } catch (err) {
      setError("Failed to load patients data");
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  // Data extraction
  const labels = data?.labels || [];
  const points = data?.data || [];
  const total = data?.total || 0;
  const avg = points.length > 0 ? Math.round(total / points.length) : 0;
  const maxDay = points.length > 0 ? Math.max(...points) : 0;
  const bestDayIndex = points.indexOf(maxDay);
  const bestDay = labels[bestDayIndex] || "N/A";

  // Gender breakdown for pie chart
  const genderData = useMemo(() => {
    if (data?.by_gender && data.by_gender.length > 0) {
      const colors = ["#9B084D", "#17a2b8", "#28a745", "#ffc107"];
      return data.by_gender.map((g: any, idx: number) => ({
        name: g.gender || "Unknown",
        count: g.count,
        color: colors[idx % colors.length],
        legendFontColor: "#555",
        legendFontSize: 12,
      }));
    }
    return [];
  }, [data]);

  // Age breakdown for bar chart
  const ageData = useMemo(() => {
    if (data?.by_age && data.by_age.length > 0) {
      return {
        labels: data.by_age.map((a: any) => a.age_group),
        datasets: [{ data: data.by_age.map((a: any) => a.count) }],
      };
    }
    return { labels: ["N/A"], datasets: [{ data: [0] }] };
  }, [data]);

  // Safe chart data
  const safeLabels = labels.length > 0 ? labels : ["N/A"];
  const safePoints = points.length > 0 ? points : [0];

  const periodLabel = period === "week" ? "7 Days" : period === "month" ? "30 Days" : "Year";

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center", flex: 1 }]}>
        <ActivityIndicator size="large" color="#9B084D" />
        <Text style={{ marginTop: 16, color: "#666" }}>Loading patients analytics...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center", flex: 1 }]}>
        <AlertCircle size={48} color="#dc3545" />
        <Text style={{ marginTop: 16, color: "#dc3545" }}>{error}</Text>
        <Pressable style={[styles.filterBtn, styles.filterBtnActive, { marginTop: 16 }]} onPress={() => fetchData()}>
          <Text style={styles.filterTextActive}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 60 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#9B084D"]} />}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>Patient Analytics</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.close}>Close</Text>
        </Pressable>
      </View>

      <Text style={styles.dateRange}>
        {data?.date_range?.start} → {data?.date_range?.end}
      </Text>

      {/* Period Filter */}
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

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryIcon}>
          <UserPlus size={32} color="#fff" />
        </View>
        <View style={styles.summaryContent}>
          <Text style={styles.summaryLabel}>New Patients</Text>
          <Text style={styles.summaryValue}>{total}</Text>
          <Text style={styles.summaryPeriod}>Last {periodLabel} • Avg Age: {data?.average_age || "N/A"}</Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Calendar size={20} color="#9B084D" />
          <Text style={styles.statValue}>{avg}</Text>
          <Text style={styles.statLabel}>Avg/Day</Text>
        </View>
        <View style={styles.statCard}>
          <TrendingUp size={20} color="#28a745" />
          <Text style={[styles.statValue, { color: "#28a745" }]}>{maxDay}</Text>
          <Text style={styles.statLabel}>Best Day</Text>
        </View>
        <View style={styles.statCard}>
          <Users size={20} color="#17a2b8" />
          <Text style={[styles.statValue, { color: "#17a2b8" }]}>{bestDay}</Text>
          <Text style={styles.statLabel}>Peak</Text>
        </View>
      </View>

      {/* Registration Trend Line Chart */}
      <Text style={styles.sectionTitle}>📈 Registration Trend</Text>
      <LineChart
        data={{ labels: safeLabels, datasets: [{ data: safePoints }] }}
        width={W}
        height={200}
        chartConfig={{
          ...chartConfig,
          color: (o = 1) => `rgba(155,8,77, ${o})`,
          labelColor: (o = 1) => `rgba(68,68,68, ${o})`,
        }}
        bezier
        style={{ borderRadius: 16, marginVertical: 8 }}
        yAxisSuffix=""
      />

      {/* Gender Distribution */}
      {genderData.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>👥 Gender Distribution</Text>
          <View style={styles.chartCard}>
            <PieChart
              data={genderData}
              width={W - 24}
              height={180}
              chartConfig={chartConfig}
              accessor="count"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
          <View style={styles.genderBars}>
            {genderData.map((g: any, idx: number) => (
              <View key={idx} style={styles.genderRow}>
                <View style={[styles.genderDot, { backgroundColor: g.color }]} />
                <Text style={styles.genderLabel}>{g.name}</Text>
                <View style={styles.genderBarContainer}>
                  <View 
                    style={[
                      styles.genderBar, 
                      { 
                        width: `${Math.min(100, (g.count / total) * 100)}%`,
                        backgroundColor: g.color 
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.genderCount}>{g.count} ({total > 0 ? Math.round((g.count / total) * 100) : 0}%)</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Age Distribution */}
      {ageData.datasets[0].data[0] !== 0 && (
        <>
          <Text style={styles.sectionTitle}>📊 Age Distribution</Text>
          <BarChart
            data={ageData}
            width={W}
            height={200}
            fromZero
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={{
              ...chartConfig,
              color: (o = 1) => `rgba(23, 162, 184, ${o})`,
              labelColor: (o = 1) => `rgba(68,68,68, ${o})`,
              barPercentage: 0.7,
            }}
            style={{ borderRadius: 16, marginVertical: 8 }}
          />
          <View style={styles.ageStatsRow}>
            {data?.by_age?.map((a: any, idx: number) => (
              <View key={idx} style={styles.ageStat}>
                <Text style={styles.ageStatValue}>{a.count}</Text>
                <Text style={styles.ageStatLabel}>{a.age_group}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Top Diagnoses */}
      {data?.top_diagnoses && data.top_diagnoses.length > 0 && (
        <View style={styles.listCard}>
          <View style={styles.listHeader}>
            <Stethoscope size={20} color="#9B084D" />
            <Text style={styles.listTitle}>Top Diagnoses</Text>
          </View>
          {data.top_diagnoses.slice(0, 8).map((d: any, idx: number) => (
            <View key={idx} style={styles.listRow}>
              <View style={styles.listRank}>
                <Text style={styles.listRankText}>{idx + 1}</Text>
              </View>
              <Text style={styles.listName}>{d.diagnosis}</Text>
              <View style={styles.listBarContainer}>
                <View 
                  style={[
                    styles.listBar, 
                    { width: `${Math.min(100, (d.count / data.top_diagnoses[0].count) * 100)}%` }
                  ]} 
                />
              </View>
              <Text style={styles.listCount}>{d.count}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Most Prescribed Medications */}
      {data?.top_medications && data.top_medications.length > 0 && (
        <View style={[styles.listCard, { backgroundColor: "#e8f5e9" }]}>
          <View style={styles.listHeader}>
            <Pill size={20} color="#28a745" />
            <Text style={styles.listTitle}>Top Medications (This {period})</Text>
          </View>
          {data.top_medications.slice(0, 8).map((m: any, idx: number) => (
            <View key={idx} style={styles.listRow}>
              <View style={[styles.listRank, { backgroundColor: "#28a745" }]}>
                <Text style={styles.listRankText}>{idx + 1}</Text>
              </View>
              <Text style={styles.listName}>{m.medication}</Text>
              <View style={styles.listBarContainer}>
                <View 
                  style={[
                    styles.listBar, 
                    { 
                      width: `${Math.min(100, (m.count / data.top_medications[0].count) * 100)}%`,
                      backgroundColor: "#28a745"
                    }
                  ]} 
                />
              </View>
              <Text style={styles.listCount}>{m.count}x</Text>
            </View>
          ))}
        </View>
      )}

      {/* All-Time Medications */}
      {data?.all_time_medications && data.all_time_medications.length > 0 && (
        <View style={[styles.listCard, { backgroundColor: "#fff3cd" }]}>
          <View style={styles.listHeader}>
            <Activity size={20} color="#856404" />
            <Text style={styles.listTitle}>All-Time Top Medications</Text>
          </View>
          {data.all_time_medications.slice(0, 6).map((m: any, idx: number) => (
            <View key={idx} style={styles.listRow}>
              <View style={[styles.listRank, { backgroundColor: "#856404" }]}>
                <Text style={styles.listRankText}>{idx + 1}</Text>
              </View>
              <Text style={styles.listName}>{m.medication}</Text>
              <View style={styles.listBarContainer}>
                <View 
                  style={[
                    styles.listBar, 
                    { 
                      width: `${Math.min(100, (m.count / data.all_time_medications[0].count) * 100)}%`,
                      backgroundColor: "#856404"
                    }
                  ]} 
                />
              </View>
              <Text style={styles.listCount}>{m.count}x</Text>
            </View>
          ))}
        </View>
      )}

      {/* Chronic Conditions */}
      {data?.chronic_conditions && data.chronic_conditions.length > 0 && (
        <View style={[styles.listCard, { backgroundColor: "#f8d7da" }]}>
          <View style={styles.listHeader}>
            <Heart size={20} color="#dc3545" />
            <Text style={styles.listTitle}>Common Medical History</Text>
          </View>
          {data.chronic_conditions.slice(0, 6).map((c: any, idx: number) => (
            <View key={idx} style={styles.listRow}>
              <View style={[styles.listRank, { backgroundColor: "#dc3545" }]}>
                <Text style={styles.listRankText}>{idx + 1}</Text>
              </View>
              <Text style={styles.listName}>{c.condition}</Text>
              <View style={styles.listBarContainer}>
                <View 
                  style={[
                    styles.listBar, 
                    { 
                      width: `${Math.min(100, (c.count / data.chronic_conditions[0].count) * 100)}%`,
                      backgroundColor: "#dc3545"
                    }
                  ]} 
                />
              </View>
              <Text style={styles.listCount}>{c.count}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Allergies */}
      {data?.top_allergies && data.top_allergies.length > 0 && (
        <View style={[styles.listCard, { backgroundColor: "#ffe4e6" }]}>
          <View style={styles.listHeader}>
            <AlertTriangle size={20} color="#e11d48" />
            <Text style={styles.listTitle}>Common Allergies</Text>
            {data?.allergy_stats && (
              <View style={styles.allergyBadge}>
                <Text style={styles.allergyBadgeText}>
                  {data.allergy_stats.percentage}% of patients
                </Text>
              </View>
            )}
          </View>
          {data?.allergy_stats && (
            <View style={styles.allergyStatsRow}>
              <Text style={styles.allergyStatText}>
                {data.allergy_stats.patients_with_allergies} out of {data.allergy_stats.total_patients} patients have recorded allergies
              </Text>
            </View>
          )}
          {data.top_allergies.slice(0, 8).map((a: any, idx: number) => (
            <View key={idx} style={styles.listRow}>
              <View style={[styles.listRank, { backgroundColor: "#e11d48" }]}>
                <Text style={styles.listRankText}>{idx + 1}</Text>
              </View>
              <Text style={styles.listName}>{a.allergy}</Text>
              <View style={styles.listBarContainer}>
                <View 
                  style={[
                    styles.listBar, 
                    { 
                      width: `${Math.min(100, (a.count / data.top_allergies[0].count) * 100)}%`,
                      backgroundColor: "#e11d48"
                    }
                  ]} 
                />
              </View>
              <Text style={styles.listCount}>{a.count}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Insights */}
      <View style={styles.insightsCard}>
        <Text style={styles.insightsTitle}>💡 Insights</Text>
        <Text style={styles.insightItem}>• Average patient age: <Text style={styles.highlight}>{data?.average_age || "N/A"} years</Text></Text>
        <Text style={styles.insightItem}>• Most registrations on: <Text style={styles.highlight}>{bestDay}</Text></Text>
        {genderData.length > 0 && (
          <Text style={styles.insightItem}>• Primary demographic: <Text style={styles.highlight}>{genderData[0]?.name}</Text></Text>
        )}
        {data?.top_diagnoses?.length > 0 && (
          <Text style={styles.insightItem}>• Most common diagnosis: <Text style={styles.highlight}>{data.top_diagnoses[0].diagnosis}</Text></Text>
        )}
        {data?.top_medications?.length > 0 && (
          <Text style={styles.insightItem}>• Most prescribed: <Text style={styles.highlight}>{data.top_medications[0].medication}</Text></Text>
        )}
        {data?.top_allergies?.length > 0 && (
          <Text style={styles.insightItem}>• Most common allergy: <Text style={styles.highlight}>{data.top_allergies[0].allergy}</Text></Text>
        )}
        {data?.allergy_stats && (
          <Text style={styles.insightItem}>• Patients with allergies: <Text style={styles.highlight}>{data.allergy_stats.percentage}%</Text></Text>
        )}
      </View>

      <Text style={styles.hint}>Pull down to refresh • Tap period buttons to change timeframe</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#F4F6F9", flex: 1 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "800", color: "#222" },
  close: { color: "#9B084D", fontWeight: "700" },
  dateRange: { fontSize: 13, color: "#666", marginTop: 4, marginBottom: 12 },

  filterRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#fff",
    elevation: 2,
  },
  filterBtnActive: { backgroundColor: "#9B084D" },
  filterText: { color: "#555", fontWeight: "700" },
  filterTextActive: { color: "#fff" },

  summaryCard: {
    backgroundColor: "#9B084D",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    elevation: 4,
  },
  summaryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  summaryContent: { marginLeft: 16, flex: 1 },
  summaryLabel: { color: "#ffe6f0", fontSize: 14 },
  summaryValue: { color: "#fff", fontSize: 36, fontWeight: "800" },
  summaryPeriod: { color: "#ffe6f0", fontSize: 12, marginTop: 4 },

  statsGrid: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 4,
    alignItems: "center",
    elevation: 2,
  },
  statValue: { fontSize: 18, fontWeight: "800", color: "#9B084D", marginTop: 6 },
  statLabel: { fontSize: 11, color: "#666", marginTop: 2 },

  sectionTitle: { marginTop: 16, marginBottom: 8, fontWeight: "700", fontSize: 16, color: "#333" },

  chartCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    elevation: 2,
  },

  genderBars: { marginTop: 8 },
  genderRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  genderDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  genderLabel: { width: 70, fontSize: 13, color: "#555" },
  genderBarContainer: { flex: 1, height: 8, backgroundColor: "#eee", borderRadius: 4, marginHorizontal: 8 },
  genderBar: { height: 8, borderRadius: 4 },
  genderCount: { width: 60, fontSize: 12, color: "#333", textAlign: "right" },

  ageStatsRow: { flexDirection: "row", justifyContent: "space-around", marginTop: 8, marginBottom: 8 },
  ageStat: { alignItems: "center" },
  ageStatValue: { fontSize: 16, fontWeight: "700", color: "#17a2b8" },
  ageStatLabel: { fontSize: 11, color: "#666" },

  listCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    elevation: 2,
  },
  listHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  listTitle: { fontSize: 16, fontWeight: "700", color: "#333", marginLeft: 8 },
  listRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  listRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#9B084D",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  listRankText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  listName: { flex: 1, fontSize: 13, color: "#333" },
  listBarContainer: { width: 60, height: 6, backgroundColor: "#eee", borderRadius: 3, marginHorizontal: 8 },
  listBar: { height: 6, backgroundColor: "#9B084D", borderRadius: 3 },
  listCount: { width: 40, fontSize: 13, fontWeight: "600", color: "#555", textAlign: "right" },

  allergyBadge: {
    marginLeft: "auto",
    backgroundColor: "#e11d48",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  allergyBadgeText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  allergyStatsRow: {
    backgroundColor: "rgba(225, 29, 72, 0.1)",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  allergyStatText: { color: "#be123c", fontSize: 13 },

  insightsCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    elevation: 2,
  },
  insightsTitle: { fontSize: 16, fontWeight: "700", color: "#333", marginBottom: 10 },
  insightItem: { color: "#555", marginBottom: 6, fontSize: 14 },
  highlight: { color: "#9B084D", fontWeight: "600" },

  hint: { marginTop: 20, marginBottom: 40, color: "#999", textAlign: "center", fontSize: 13 },
});
