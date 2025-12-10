import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { InventoryTableProps, THEME as OriginalTHEME } from '../../types/InventoryTypes';

// --- ENHANCED THEME COLORS ---
const THEME = {
    // Primary (Action & Brand) - Deep Pink/Magenta
    primary: "#be185d", 
    primaryLight: "#fce7f3",
    
    // Secondary (Text & Accent) - Dark charcoal for readability
    secondary: "#0f172a", 
    
    // Text Colors
    text: "#334155", 
    textLight: "#94a3b8", 
    
    // Backgrounds
    bg: "#f1f5f9", 
    white: "#ffffff", 
    
    // Borders
    border: "#e2e8f0", 
    
    // Status Colors (Warning state will be mapped to Danger for consistent visual alert)
    success: "#10b981", 
    warning: "#f59e0b", // Retained definition but not used for row color anymore
    danger: "#ef4444", // RED: Used for LOW STOCK, CRITICAL LOW, and EXPIRED
    
    // Spacing/Other
    radius: 8, 
};

const LOW_STOCK_THRESHOLD = 10;

const InventoryTable: React.FC<InventoryTableProps> = ({ inventoryItems }) => {
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortField, setSortField] = useState<'name' | 'quantity' | 'category' | 'expiry'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filtered and sorted items
  const filteredItems = useMemo(() => {
    return [...inventoryItems]
      .filter((item) => {
        const matchesName = item.name.toLowerCase().includes(searchText.toLowerCase());
        const matchesCategory = categoryFilter ? item.category === categoryFilter : true;
        return matchesName && matchesCategory;
      })
      .sort((a, b) => {
        let aValue: any = a[sortField];
        let bValue: any = b[sortField];

        if (sortField === 'quantity') {
          aValue = Number(a.quantity);
          bValue = Number(b.quantity);
        } else if (sortField === 'expiry') {
          aValue = new Date(a.expiry);
          bValue = new Date(b.expiry);
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [inventoryItems, searchText, categoryFilter, sortField, sortDirection]);

  return (
    <View style={styles.card}>
      {/* FILTER + SORT BAR */}
      <View style={styles.filterContainer}>
        <TextInput
          placeholder="Search by item name..."
          value={searchText}
          onChangeText={setSearchText}
          style={styles.searchInput}
          placeholderTextColor={THEME.textLight}
        />

        <Picker
          selectedValue={categoryFilter}
          onValueChange={(val: string) => setCategoryFilter(val)}
          style={styles.picker}
          itemStyle={styles.pickerItem}
        >
          <Picker.Item label="All Categories" value="" />
          {Array.from(new Set(inventoryItems.map((i) => i.category))).map((c) => (
            <Picker.Item key={c} label={c} value={c} />
          ))}
        </Picker>

        <Picker
          selectedValue={sortField}
          onValueChange={(val: 'name' | 'quantity' | 'category' | 'expiry') => setSortField(val)}
          style={styles.picker}
          itemStyle={styles.pickerItem}
        >
          <Picker.Item label="Name" value="name" />
          <Picker.Item label="Quantity" value="quantity" />
          <Picker.Item label="Category" value="category" />
          <Picker.Item label="Expiry" value="expiry" />
        </Picker>

        <Picker
          selectedValue={sortDirection}
          onValueChange={(val: 'asc' | 'desc') => setSortDirection(val)}
          style={styles.picker}
          itemStyle={styles.pickerItem}
        >
          <Picker.Item label="Asc" value="asc" />
          <Picker.Item label="Desc" value="desc" />
        </Picker>
      </View>

      {/* TABLE */}
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.headerRow}>
          <Text style={[styles.headerText, { flex: 3 }]}>Item Name</Text>
          <Text style={[styles.headerText, { flex: 1 }]}>Category</Text>
          <Text style={[styles.headerText, styles.centerText, { flex: 1 }]}>Qty</Text>
          <Text style={[styles.headerText, { flex: 2 }]}>Supplier / Expiry</Text>
        </View>

        {filteredItems.length > 0 ? (
          filteredItems.map((item, index) => {
            // Status Logic Check
            const isLow = item.quantity < LOW_STOCK_THRESHOLD; // Low Stock includes Critical Low
            const isExpired = new Date(item.expiry) < new Date();
            const rowStyle = index % 2 === 0 ? styles.evenRow : styles.oddRow;

            let statusRowStyle = {};
            let qtyColor = THEME.text;
            
            // --- RED WARNING LOGIC START ---
            const needsRedAlert = isLow || isExpired;

            if (needsRedAlert) {
                // Apply red background tint and left border for any high-priority alert
                statusRowStyle = styles.redAlertRow;
                qtyColor = THEME.danger;
            }
            // --- RED WARNING LOGIC END ---

            return (
              <View
                key={item.id}
                style={[
                  styles.dataRow,
                  rowStyle,
                  statusRowStyle, // Will be red tint if needsRedAlert is true
                ]}
              >
                <Text style={[styles.dataText, { flex: 3, fontWeight: needsRedAlert ? '600' : '400' }]}>
                  {item.name}
                </Text>
                <Text style={[styles.dataText, { flex: 1 }]}>{item.category}</Text>
                <Text
                  style={[
                    styles.dataText,
                    styles.centerText,
                    { flex: 1, fontWeight: '700', color: qtyColor },
                  ]}
                >
                  {item.quantity} {item.unit}
                </Text>
                <View style={{ flex: 2 }}>
                  <Text style={[styles.dataTextSmall, { color: THEME.textLight }]}>{item.supplier}</Text>
                  <Text style={[styles.dataTextSmall, needsRedAlert && { color: THEME.danger, fontWeight: '600' }]}>
                    Exp: {item.expiry} {isExpired ? ' 🚨 EXPIRED' : ''}
                  </Text>
                </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.emptyText}>No inventory items found.</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: THEME.white,
    borderRadius: THEME.radius,
    padding: 15,
    // Enhanced Shadow
    ...Platform.select({
      ios: {
        shadowColor: THEME.secondary,
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16, 
    alignItems: 'center',
    gap: 10, 
    flexWrap: 'wrap',
  },
  searchInput: {
    flex: 2,
    minWidth: 150, 
    backgroundColor: THEME.white, 
    color: THEME.text,
    paddingVertical: 10, 
    paddingHorizontal: 15,
    borderRadius: THEME.radius,
    fontSize: 14,
    borderWidth: 1, 
    borderColor: THEME.border,
  },
  picker: {
    flex: 1,
    minWidth: 90, 
    height: 40,
    backgroundColor: THEME.white,
    borderRadius: THEME.radius,
    borderWidth: 1,
    borderColor: THEME.border,
    overflow: 'hidden', 
  },
  pickerItem: {
    color: THEME.text, 
    fontSize: 14,
  },
  scrollContainer: {
    maxHeight: 600,
    borderRadius: THEME.radius, 
    borderWidth: 1,
    borderColor: THEME.border,
  },
  headerRow: {
    flexDirection: 'row',
    paddingVertical: 14, 
    backgroundColor: THEME.primary, 
    borderBottomWidth: 2,
    borderBottomColor: THEME.primary, 
    borderTopLeftRadius: THEME.radius - 1,
    borderTopRightRadius: THEME.radius - 1,
  },
  headerText: {
    fontWeight: '700',
    color: THEME.white, 
    fontSize: 15,
    paddingHorizontal: 10, 
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    paddingHorizontal: 0, 
  },
  evenRow: { backgroundColor: THEME.white },
  oddRow: { backgroundColor: THEME.bg }, 
  
  // --- NEW RED ALERT STYLE ---
  redAlertRow: {
    backgroundColor: THEME.danger + '10', // Consistent light red background tint
    borderLeftWidth: 4,
    borderLeftColor: THEME.danger, // Solid red left border
    paddingLeft: 10, 
  },
  
  // Removed lowStockRow, criticalLowStockRow, and expiredRow as they are now consolidated into redAlertRow.
  
  dataText: { 
    fontSize: 14, 
    color: THEME.text, 
    paddingHorizontal: 10, 
  },
  dataTextSmall: { 
    fontSize: 12, 
    color: THEME.textLight, 
    paddingHorizontal: 10,
  },
  centerText: { textAlign: 'center' },
  emptyText: { textAlign: 'center', padding: 30, color: THEME.textLight, fontStyle: 'italic', backgroundColor: THEME.white },
});

export default InventoryTable;