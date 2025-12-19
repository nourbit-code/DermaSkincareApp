// app/doctor/report/inventory.tsx
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { BarChart } from "react-native-chart-kit";
import { chartConfig } from "./chartConfig";
import { getInventoryReport, InventoryReport as InventoryReportType } from "../../../src/api/reportApi";
import {
  AlertCircle,
  Package,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
} from "lucide-react-native";

const W = Dimensions.get("window").width - 40;

export default function InventoryReportScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<InventoryReportType | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getInventoryReport();
        setData(response);
      } catch (err) {
        setError("Failed to load inventory data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Prepare chart for top items by stock
  const chartData = useMemo(() => {
    const top = data?.top_stocked_items || [];
    return {
      labels: top.map((t) => t.name.split(" ").slice(0, 2).join(" ")),
      datasets: [{ data: top.length > 0 ? top.map((t) => t.quantity) : [0] }],
    };
  }, [data]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center", flex: 1 }]}>
        <ActivityIndicator size="large" color="#9B084D" />
        <Text style={{ marginTop: 16, color: "#666" }}>Loading inventory...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center", flex: 1 }]}>
        <AlertCircle size={48} color="#dc3545" />
        <Text style={{ marginTop: 16, color: "#dc3545" }}>{error}</Text>
        <Pressable
          style={[styles.reorderBtn, { marginTop: 16, paddingHorizontal: 20 }]}
          onPress={() => setError(null)}
        >
          <Text style={styles.reorderText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Inventory Overview</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.close}>Close</Text>
        </Pressable>
      </View>

      {/* Summary Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Package size={24} color="#9B084D" />
          <Text style={styles.statValue}>{data?.total_items || 0}</Text>
          <Text style={styles.statLabel}>Total Items</Text>
        </View>
        <View style={styles.statCard}>
          <TrendingUp size={24} color="#28a745" />
          <Text style={[styles.statValue, { color: "#28a745" }]}>
            {data?.total_quantity || 0}
          </Text>
          <Text style={styles.statLabel}>Total Stock</Text>
        </View>
        <View style={styles.statCard}>
          <AlertTriangle size={24} color="#dc3545" />
          <Text style={[styles.statValue, { color: "#dc3545" }]}>
            {data?.low_stock_items?.length || 0}
          </Text>
          <Text style={styles.statLabel}>Low Stock</Text>
        </View>
        <View style={styles.statCard}>
          <Clock size={24} color="#ffc107" />
          <Text style={[styles.statValue, { color: "#ffc107" }]}>
            {data?.expiring_soon_items?.length || 0}
          </Text>
          <Text style={styles.statLabel}>Expiring Soon</Text>
        </View>
      </View>

      {/* Category Breakdown */}
      {data?.category_breakdown && data.category_breakdown.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>By Category</Text>
          {data.category_breakdown.map((cat, idx) => {
            const maxQty = Math.max(...data.category_breakdown.map((c) => c.total_quantity));
            return (
              <View key={idx} style={styles.categoryRow}>
                <Text style={styles.categoryName}>{cat.category || "Uncategorized"}</Text>
                <View style={styles.categoryBarContainer}>
                  <View
                    style={[
                      styles.categoryBar,
                      { width: `${(cat.total_quantity / maxQty) * 100}%` },
                    ]}
                  />
                </View>
                <Text style={styles.categoryCount}>
                  {cat.count} items ({cat.total_quantity})
                </Text>
              </View>
            );
          })}
        </>
      )}

      {/* Top Stocked Items Chart */}
      {chartData.datasets[0].data.length > 0 && chartData.datasets[0].data[0] !== 0 && (
        <>
          <Text style={styles.sectionTitle}>Top Stocked Items</Text>
          <BarChart
            data={chartData}
            width={W}
            height={220}
            fromZero
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={{
              ...chartConfig,
              color: (o = 1) => `rgba(155,8,77, ${o})`,
              labelColor: (o = 1) => `rgba(68,68,68, ${o})`,
            }}
            style={{ borderRadius: 14, marginTop: 12 }}
          />
        </>
      )}

      {/* Low Stock Items */}
      <Text style={styles.sectionTitle}>Low Stock Items</Text>
      <View style={styles.list}>
        {!data?.low_stock_items || data.low_stock_items.length === 0 ? (
          <Text style={styles.info}>All items are above reorder level.</Text>
        ) : (
          data.low_stock_items.map((it) => (
            <View key={it.id} style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={styles.itemName}>{it.name}</Text>
                <Text style={styles.itemMeta}>
                  Min level: {it.min_level} • Current: {it.quantity}
                </Text>
              </View>
              <View style={styles.rowRight}>
                <TrendingDown size={20} color="#dc3545" />
              </View>
            </View>
          ))
        )}
      </View>

      {/* Expiring Soon Items */}
      {data?.expiring_soon_items && data.expiring_soon_items.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Expiring Soon (30 days)</Text>
          <View style={styles.list}>
            {data.expiring_soon_items.map((it) => (
              <View key={it.id} style={styles.row}>
                <View style={styles.rowLeft}>
                  <Text style={styles.itemName}>{it.name}</Text>
                  <Text style={styles.itemMeta}>Expires: {it.expiry_date}</Text>
                </View>
                <View style={styles.rowRight}>
                  <Text style={[styles.itemStock, { color: "#ffc107" }]}>{it.quantity}</Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Recent Transactions */}
      {data?.recent_transactions && data.recent_transactions.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <View style={styles.list}>
            {data.recent_transactions.slice(0, 5).map((tx) => (
              <View key={tx.id} style={styles.row}>
                <View style={styles.rowLeft}>
                  <Text style={styles.itemName}>{tx.item_name}</Text>
                  <Text style={styles.itemMeta}>
                    {tx.transaction_type} • {tx.date}
                  </Text>
                </View>
                <View style={styles.rowRight}>
                  <Text
                    style={[
                      styles.itemStock,
                      { color: tx.transaction_type === "IN" ? "#28a745" : "#dc3545" },
                    ]}
                  >
                    {tx.transaction_type === "IN" ? "+" : "-"}
                    {tx.quantity}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#F4F6F9", flex: 1 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 22, fontWeight: "800", color: "#222" },
  close: { color: "#9B084D", fontWeight: "700" },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 16,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#9B084D",
    marginTop: 8,
  },
  statLabel: { color: "#666", fontSize: 12, marginTop: 4 },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 8,
    fontWeight: "700",
    fontSize: 16,
    color: "#333",
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryName: { width: 100, fontSize: 14, color: "#333" },
  categoryBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: "#eee",
    borderRadius: 4,
    marginHorizontal: 12,
  },
  categoryBar: { height: 8, backgroundColor: "#9B084D", borderRadius: 4 },
  categoryCount: { fontSize: 12, color: "#666" },
  list: { marginTop: 8 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  rowLeft: { flex: 1 },
  rowRight: { alignItems: "flex-end", marginLeft: 12 },
  itemName: { fontWeight: "700", color: "#333" },
  itemMeta: { color: "#666", fontSize: 12, marginTop: 4 },
  itemStock: { fontWeight: "800", color: "#9B084D", fontSize: 16 },
  reorderBtn: {
    marginTop: 8,
    backgroundColor: "#9B084D",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reorderText: { color: "#fff", fontWeight: "700" },
  info: { color: "#555", marginTop: 6 },
});
