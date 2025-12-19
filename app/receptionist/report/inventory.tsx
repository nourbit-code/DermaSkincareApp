// app/doctor/report/inventory.tsx
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { BarChart } from "react-native-chart-kit";
import { chartConfig } from "./chartConfig";
import { getInventoryReport, InventoryReport } from "../../../src/api/reportApi";

const W = Dimensions.get("window").width - 40;

export default function InventoryReportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<InventoryReport | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getInventoryReport();
        setReport(data);
      } catch (err) {
        setError('Failed to load inventory report');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Prepare chart data for top stocked items
  const chartData = useMemo(() => {
    if (!report?.top_stocked_items || report.top_stocked_items.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{ data: [0] }],
      };
    }
    const top = report.top_stocked_items.slice(0, 6);
    return {
      labels: top.map((t) => t.name.split(" ").slice(0, 2).join(" ")),
      datasets: [{ data: top.map((t) => t.quantity || 0.1) }],
    };
  }, [report]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', flex: 1 }]}>
        <ActivityIndicator size="large" color="#9B084D" />
        <Text style={{ marginTop: 12, color: '#666' }}>Loading inventory report...</Text>
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

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{report?.summary.total_items || 0}</Text>
            <Text style={styles.summaryLabel}>Total Items</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{report?.summary.total_quantity || 0}</Text>
            <Text style={styles.summaryLabel}>Total Units</Text>
          </View>
        </View>
        <View style={styles.summaryRow}>
          <View style={[styles.summaryItem, styles.warningItem]}>
            <Text style={[styles.summaryValue, { color: '#dc2626' }]}>{report?.summary.low_stock_count || 0}</Text>
            <Text style={styles.summaryLabel}>Low Stock</Text>
          </View>
          <View style={[styles.summaryItem, styles.warningItem]}>
            <Text style={[styles.summaryValue, { color: '#f59e0b' }]}>{report?.summary.expiring_soon_count || 0}</Text>
            <Text style={styles.summaryLabel}>Expiring Soon</Text>
          </View>
        </View>
      </View>

      {/* Top Stocked Items Chart */}
      {report?.top_stocked_items && report.top_stocked_items.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Top Stocked Items</Text>
          <BarChart
            data={chartData}
            width={W}
            height={260}
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

      {/* Category Breakdown */}
      {report?.category_breakdown && Object.keys(report.category_breakdown).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>By Category</Text>
          {Object.entries(report.category_breakdown).map(([category, data]) => (
            <View key={category} style={styles.categoryRow}>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{category}</Text>
                <Text style={styles.categoryMeta}>{data.count} items • {data.quantity} units</Text>
              </View>
              <View style={styles.categoryBar}>
                <View 
                  style={[
                    styles.categoryBarFill, 
                    { width: `${Math.min((data.quantity / (report.summary.total_quantity || 1)) * 100, 100)}%` }
                  ]} 
                />
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Low Stock Items */}
      <Text style={styles.sectionTitle}>Low Stock Alerts</Text>
      <View style={styles.list}>
        {!report?.low_stock_items || report.low_stock_items.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>✅ All items are above reorder level</Text>
          </View>
        ) : (
          report.low_stock_items.map((item) => (
            <View key={item.id} style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemMeta}>Reorder at: {item.reorder_level || 'N/A'} {item.unit}</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.itemStock}>{item.quantity} {item.unit}</Text>
                <Text style={styles.itemSupplier}>{item.supplier || 'No supplier'}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Expiring Soon */}
      <Text style={styles.sectionTitle}>Expiring Soon</Text>
      <View style={styles.list}>
        {!report?.expiring_soon_items || report.expiring_soon_items.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>✅ No items expiring within 90 days</Text>
          </View>
        ) : (
          report.expiring_soon_items.map((item) => (
            <View key={item.id} style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemMeta}>Quantity: {item.quantity} {item.unit}</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={[styles.itemStock, { color: '#f59e0b' }]}>
                  {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : 'No date'}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Recent Transactions */}
      {report?.recent_transactions && report.recent_transactions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {report.recent_transactions.slice(0, 10).map((tx) => (
            <View key={tx.id} style={styles.txRow}>
              <View style={[styles.txBadge, tx.type === 'add' ? styles.txAdd : styles.txUse]}>
                <Text style={styles.txBadgeText}>{tx.type === 'add' ? '+' : '-'}</Text>
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txItem}>{tx.item_name}</Text>
                <Text style={styles.txMeta}>
                  {new Date(tx.date).toLocaleDateString()} • {tx.performed_by || 'System'}
                </Text>
              </View>
              <Text style={[styles.txQty, tx.type === 'add' ? { color: '#10b981' } : { color: '#dc2626' }]}>
                {tx.type === 'add' ? '+' : ''}{tx.quantity}
              </Text>
            </View>
          ))}
        </View>
      )}
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

  summaryCard: { backgroundColor: "#F6F7FB", padding: 16, borderRadius: 12, marginTop: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  summaryItem: { alignItems: 'center', flex: 1 },
  warningItem: { backgroundColor: '#fff', padding: 10, borderRadius: 8 },
  summaryValue: { fontSize: 24, fontWeight: "800", color: '#9B084D' },
  summaryLabel: { color: "#555", marginTop: 4, fontSize: 12 },

  section: { marginTop: 20 },
  sectionTitle: { marginTop: 20, fontWeight: "700", fontSize: 16, marginBottom: 8 },

  categoryRow: { marginBottom: 12 },
  categoryInfo: { marginBottom: 6 },
  categoryName: { fontWeight: '600', color: '#333' },
  categoryMeta: { fontSize: 12, color: '#666' },
  categoryBar: { height: 8, backgroundColor: '#f0f0f0', borderRadius: 4 },
  categoryBarFill: { height: 8, backgroundColor: '#9B084D', borderRadius: 4 },

  list: { marginTop: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  rowLeft: { flex: 1 },
  rowRight: { alignItems: "flex-end", marginLeft: 12 },
  itemName: { fontWeight: "700", color: '#333' },
  itemMeta: { color: "#666", fontSize: 12, marginTop: 4 },
  itemStock: { fontWeight: "800", color: "#9B084D" },
  itemSupplier: { fontSize: 11, color: '#888', marginTop: 2 },

  emptyState: { backgroundColor: '#f0fdf4', padding: 16, borderRadius: 8, alignItems: 'center' },
  emptyText: { color: '#10b981', fontWeight: '600' },

  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  txBadge: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  txAdd: { backgroundColor: '#d1fae5' },
  txUse: { backgroundColor: '#fee2e2' },
  txBadgeText: { fontWeight: '800', fontSize: 16 },
  txInfo: { flex: 1 },
  txItem: { fontWeight: '600', color: '#333' },
  txMeta: { fontSize: 11, color: '#888', marginTop: 2 },
  txQty: { fontWeight: '700', fontSize: 16 },

  hint: { marginTop: 12, color: "#666", textAlign: "center" },
});
