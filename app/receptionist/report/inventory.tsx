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
} from "react-native";
import { BarChart } from "react-native-chart-kit";
import { chartConfig } from "./chartConfig";

const W = Dimensions.get("window").width - 40;

type InventoryItem = {
  id: string;
  name: string;
  stock: number;
  unit?: string;
  reorderLevel?: number;
  lastRestocked?: string; // ISO date string (demo)
};

export default function InventoryReport() {
  const router = useRouter();

  const [items, setItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    // demo/fake inventory
    const fake: InventoryItem[] = [
      { id: "1", name: "Sunscreen SPF50", stock: 42, unit: "pcs", reorderLevel: 10, lastRestocked: "2025-11-02" },
      { id: "2", name: "Vitamin C Serum", stock: 8, unit: "btl", reorderLevel: 12, lastRestocked: "2025-11-20" },
      { id: "3", name: "Laser Gel", stock: 26, unit: "tube", reorderLevel: 5, lastRestocked: "2025-10-28" },
      { id: "4", name: "Hydrating Mask", stock: 3, unit: "pcs", reorderLevel: 6, lastRestocked: "2025-11-10" },
      { id: "5", name: "Face Cleanser", stock: 58, unit: "pcs", reorderLevel: 20, lastRestocked: "2025-09-15" },
      { id: "6", name: "Antibiotic Ointment", stock: 14, unit: "tube", reorderLevel: 8, lastRestocked: "2025-11-30" },
    ];
    setItems(fake);
  }, []);

  const lowStock = useMemo(() => items.filter((it) => (it.reorderLevel ?? 0) >= 0 && it.stock <= (it.reorderLevel ?? 0)), [items]);

  // prepare chart for top items by stock
  const chartData = useMemo(() => {
    const top = [...items].sort((a, b) => b.stock - a.stock).slice(0, 6);
    return {
      labels: top.map((t) => t.name.split(" ").slice(0, 2).join(" ")),
      datasets: [{ data: top.map((t) => t.stock) }],
    };
  }, [items]);

  const totalItems = items.length;
  const totalStock = items.reduce((a: number, b: InventoryItem) => a + b.stock, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Inventory Overview</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.close}>Close</Text>
        </Pressable>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.big}>Items: {totalItems}</Text>
        <Text style={styles.sub}>Total units in stock: {totalStock}</Text>
      </View>

      <Text style={styles.sectionTitle}>Top stocked items</Text>
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

      <Text style={styles.sectionTitle}>Low stock</Text>
      <View style={styles.list}>
        {lowStock.length === 0 ? (
          <Text style={styles.info}>All items are above reorder level.</Text>
        ) : (
          lowStock.map((it) => (
            <View key={it.id} style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={styles.itemName}>{it.name}</Text>
                <Text style={styles.itemMeta}>Last restocked: {it.lastRestocked ?? "—"}</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.itemStock}>{it.stock} {it.unit}</Text>
                <Pressable style={styles.reorderBtn} onPress={() => { /* hook to reorder flow */ }}>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </View>

     
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "800" },
  close: { color: "#9B084D", fontWeight: "700" },

  summaryCard: { backgroundColor: "#F6F7FB", padding: 12, borderRadius: 12, marginTop: 12 },
  big: { fontSize: 20, fontWeight: "800" },
  sub: { color: "#555" },

  sectionTitle: { marginTop: 14, fontWeight: "700" },
  list: { marginTop: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  rowLeft: { flex: 1 },
  rowRight: { alignItems: "flex-end", marginLeft: 12 },
  itemName: { fontWeight: "700" },
  itemMeta: { color: "#666", fontSize: 12, marginTop: 4 },
  itemStock: { fontWeight: "800", color: "#9B084D" },
  reorderBtn: { marginTop: 8, backgroundColor: "#9B084D", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  reorderText: { color: "#fff", fontWeight: "700" },

  info: { color: "#555", marginTop: 6 },
  hint: { marginTop: 12, color: "#666", textAlign: "center" },
});
