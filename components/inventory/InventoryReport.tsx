import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Button } from 'react-native';
import * as Print from 'expo-print';
import { InventoryItem, THEME } from '../../types/InventoryTypes';

interface InventoryReportProps {
  role: 'doctor' | 'receptionist';
  inventoryItems: InventoryItem[];
  readOnly?: boolean;
}

const LOW_STOCK_THRESHOLD = 10;

const InventoryReport: React.FC<InventoryReportProps> = ({ role, inventoryItems, readOnly }) => {
  // Sort items: low stock first, then alphabetically
  const sortedItems = useMemo(() => {
    return [...inventoryItems].sort((a, b) => {
      const aLow = a.quantity < LOW_STOCK_THRESHOLD;
      const bLow = b.quantity < LOW_STOCK_THRESHOLD;
      if (aLow && !bLow) return -1;
      if (!aLow && bLow) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [inventoryItems]);

  // Chart mock data
  const chartData = useMemo(() => [
    { label: role === 'doctor' ? 'Botox' : 'Injections', value: role === 'doctor' ? 15 : 120 },
    { label: role === 'doctor' ? 'Filler' : 'Consumables', value: role === 'doctor' ? 10 : 85 },
    { label: role === 'doctor' ? 'Peels' : 'Tools', value: role === 'doctor' ? 5 : 45 },
  ], [role]);

  const handlePrint = async () => {
    const html = `
      <html>
      <head>
        <title>Inventory Report</title>
        <style>
          body { font-family: Arial; padding: 16px; }
          h2 { text-align: center; color: ${THEME.secondary}; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #999; padding: 8px; text-align: left; }
          th { background-color: #eee; }
          .chart-bar { display: inline-block; height: 20px; background-color: ${THEME.primary}; border-radius: 4px; margin-bottom: 8px; color: white; text-align: right; padding-right: 4px; }
          .low-stock { background-color: ${THEME.danger}; }
        </style>
      </head>
      <body>
        <h2>Inventory Report (${role.charAt(0).toUpperCase() + role.slice(1)})</h2>
        
        <h3>Chart Summary</h3>
        ${chartData.map(d => `<div>${d.label}: <span class="chart-bar" style="width:${(d.value / Math.max(...chartData.map(c => c.value))) * 100}%">${d.value}</span></div>`).join('')}

        <h3>Inventory Table</h3>
        <table>
          <tr>
            <th>Item</th><th>Category</th><th>Qty</th><th>Unit</th><th>Supplier</th><th>Expiry</th>
          </tr>
          ${sortedItems.map(item => `
            <tr>
              <td>${item.name}</td>
              <td>${item.category}</td>
              <td>${item.quantity}</td>
              <td>${item.unit}</td>
              <td>${item.supplier}</td>
              <td>${item.expiry}</td>
            </tr>
          `).join('')}
        </table>
      </body>
      </html>
    `;
    await Print.printAsync({ html });
  };

  return (
    <ScrollView style={styles.card}>
      <Text style={styles.title}>Inventory Report ({role})</Text>

      <View style={styles.headerRow}>
        <Text style={[styles.headerText, { flex: 3 }]}>Item</Text>
        <Text style={[styles.headerText, { flex: 1 }]}>Category</Text>
        <Text style={[styles.headerText, { flex: 1, textAlign: 'center' }]}>Qty</Text>
        <Text style={[styles.headerText, { flex: 1 }]}>Unit</Text>
        <Text style={[styles.headerText, { flex: 2 }]}>Supplier</Text>
        <Text style={[styles.headerText, { flex: 2 }]}>Expiry</Text>
      </View>

      {sortedItems.map((item, index) => {
        const isLow = item.quantity < LOW_STOCK_THRESHOLD;
        return (
          <View
            key={item.id}
            style={[
              styles.dataRow,
              index % 2 === 0 ? styles.evenRow : styles.oddRow,
              isLow && { borderLeftWidth: 4, borderLeftColor: THEME.danger, paddingLeft: 6 },
            ]}
          >
            <Text style={[styles.dataText, { flex: 3, fontWeight: isLow ? '600' : '400' }]}>{item.name}</Text>
            <Text style={[styles.dataText, { flex: 1 }]}>{item.category}</Text>
            <Text style={[styles.dataText, { flex: 1, textAlign: 'center', color: isLow ? THEME.danger : THEME.secondary }]}>{item.quantity}</Text>
            <Text style={[styles.dataText, { flex: 1 }]}>{item.unit}</Text>
            <Text style={[styles.dataText, { flex: 2 }]}>{item.supplier}</Text>
            <Text style={[styles.dataText, { flex: 2 }]}>{item.expiry}</Text>
          </View>
        );
      })}

      <View style={{ marginTop: 12 }}>
        <Button title="Print Full Report" color={THEME.primary} onPress={handlePrint} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: THEME.primaryLight + '33', borderRadius: THEME.radius, padding: 16, margin: 10 },
  title: { fontSize: 16, fontWeight: '600', color: THEME.secondary, textAlign: 'center', marginBottom: 12 },
  headerRow: { flexDirection: 'row', paddingVertical: 10, backgroundColor: THEME.white, borderBottomWidth: 2, borderBottomColor: THEME.secondary + '33' },
  headerText: { fontWeight: '700', fontSize: 14, paddingHorizontal: 6, color: THEME.secondary },
  dataRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: THEME.border, alignItems: 'center' },
  evenRow: { backgroundColor: THEME.white },
  oddRow: { backgroundColor: THEME.primaryLight + '15' },
  dataText: { fontSize: 13, paddingHorizontal: 6, color: THEME.text },
});

export default InventoryReport;
