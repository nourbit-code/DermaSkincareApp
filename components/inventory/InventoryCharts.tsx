import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Button, Platform } from 'react-native';
import * as Print from 'expo-print';
import { InventoryItem, THEME } from '../../types/InventoryTypes';

interface InventoryReportProps {
    role: 'doctor' | 'receptionist';
    inventoryItems?: InventoryItem[]; 
}

const LOW_STOCK_THRESHOLD = 5; 
const NEAR_EXPIRY_DAYS = 60;
const MAX_CHART_ITEMS = 10; 

// --- LOCAL FALLBACK WARNING COLOR ---
const WARNING_COLOR = '#FFA500'; // Standard Orange/Warning Hex
// ------------------------------------

// --- Operational Stock Data Generation (Function remains the same) ---
const generateOperationalData = (items: InventoryItem[]) => {
    const today = new Date();
    const expiryDangerLimit = new Date(today);
    expiryDangerLimit.setDate(today.getDate() + NEAR_EXPIRY_DAYS);

    const lowStockItems: InventoryItem[] = [];
    const expiringSoonItems: InventoryItem[] = [];
    
    const stockLevels: { name: string; quantity: number; isLow: boolean }[] = [];

    items.forEach(item => {
        const expiryDate = new Date(item.expiry);
        const isExpired = expiryDate < today;
        const isNearExpiry = expiryDate > today && expiryDate <= expiryDangerLimit;
        const isLow = item.quantity <= LOW_STOCK_THRESHOLD;

        if (isLow) {
            lowStockItems.push(item);
        }
        
        if (isNearExpiry || isExpired) {
            expiringSoonItems.push(item);
        }
        
        stockLevels.push({
            name: item.name,
            quantity: item.quantity,
            isLow: isLow,
        });
    });

    const sortedStockLevels = stockLevels
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, MAX_CHART_ITEMS);

    const maxQuantity = Math.max(...sortedStockLevels.map(d => d.quantity), 1);
    
    const uniqueLowStock = Array.from(new Set(lowStockItems.map(item => item.id)))
        .map(id => lowStockItems.find(item => item.id === id)!);
    
    const uniqueExpiring = Array.from(new Set(expiringSoonItems.map(item => item.id)))
        .map(id => expiringSoonItems.find(item => item.id === id)!);


    return {
        lowStockItems: uniqueLowStock,
        expiringSoonItems: uniqueExpiring.sort((a, b) => new Date(a.expiry).getTime() - new Date(b.expiry).getTime()),
        stockLevelsChartData: sortedStockLevels,
        maxQuantity,
    };
};

const InventoryReport: React.FC<InventoryReportProps> = ({ inventoryItems = [], role }) => {
    
    const { lowStockItems, expiringSoonItems, stockLevelsChartData, maxQuantity } = useMemo(() => 
        generateOperationalData(inventoryItems), 
    [inventoryItems]);

    // --- Print Function: Organized HTML Report Generation (Export List) ---
    const handlePrint = async () => {
        const getRowClass = (item: InventoryItem) => {
            const expiryDate = new Date(item.expiry);
            if (item.quantity < LOW_STOCK_THRESHOLD || expiryDate < new Date()) {
                return 'alert-row';
            }
            return '';
        };

        const html = `
            <html>
            <head>
                <title>Dermatology Stock Export List</title>
                <style>
                    /* Simplified print styles for a clean list export */
                    body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 0; margin: 0; color: #333; }
                    .page { padding: 15mm; margin: 0 auto; }
                    h1 { text-align: center; color: #007bff; border-bottom: 2px solid #007bff; padding-bottom: 5px; margin-bottom: 20px; }
                    h3 { color: #333; margin-top: 15px; border-bottom: 1px dashed #ccc; padding-bottom: 5px; font-weight: 600; }
                    
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th, td { padding: 8px 10px; text-align: left; font-size: 11px; border: 1px solid #ddd; }
                    th { background-color: #f8f8f8; font-weight: bold; }
                    
                    .alert-row { background-color: #ffe0e0; color: #dc3545; }
                    .alert-row td { font-weight: 600; }

                    /* Bar Chart styling for print */
                    .chart-bar-wrapper { display: flex; align-items: center; margin-bottom: 5px; }
                    .chart-bar-label { font-size: 10px; color: #333; width: 120px; }
                    .chart-bar { display: block; height: 12px; border-radius: 2px; text-align: right; padding-right: 3px; line-height: 12px; font-size: 8px; margin-left: 5px; background-color: #007bff; color: white; }
                    .low-stock-bar { background-color: #dc3545 !important; }

                </style>
            </head>
            <body>
                <div class="page">
                    <h1>Clinic Stock Export List</h1>
                    <p style="text-align: right; font-size: 10px;">Generated: ${new Date().toLocaleDateString()}</p>

                    <h3>1. Critical Operational Alerts</h3>
                    <p style="font-size: 11px;">**🔴 Low Stock Items (< ${LOW_STOCK_THRESHOLD} Units):** ${lowStockItems.length} unique items</p>
                    <p style="font-size: 11px;">**🟠 Expiring Soon/Expired (Within ${NEAR_EXPIRY_DAYS} Days):** ${expiringSoonItems.length} unique items</p>

                    <h3>2. Current Stock Levels (Top ${MAX_CHART_ITEMS} Items)</h3>
                    
                    ${stockLevelsChartData
                        .map(
                            (d) =>
                                `<div class="chart-bar-wrapper">
                                    <span class="chart-bar-label">${d.name} (${d.quantity} units):</span>
                                    <span style="width:${(d.quantity / maxQuantity) * 60 + 5}%;" class="chart-bar ${d.isLow ? 'low-stock-bar' : ''}">${d.quantity}</span>
                                </div>`
                        )
                        .join('')}

                    <h3>3. Full Stock List Export (Quantity & Expiry)</h3>
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 30%;">Item Name</th>
                                <th style="width: 15%;">Category</th>
                                <th style="width: 10%; text-align: center;">Qty</th>
                                <th style="width: 15%;">Unit</th>
                                <th style="width: 30%;">Expiry Date</th>
                            </tr>
                        </thead>
                        <tbody>
                        ${inventoryItems
                            .map((item, index) => {
                                const rowClass = getRowClass(item);
                                const isExpired = new Date(item.expiry) < new Date();

                                return `
                                <tr class="${rowClass}">
                                    <td>${item.name}</td>
                                    <td>${item.category}</td>
                                    <td style="text-align: center;">${item.quantity}</td>
                                    <td>${item.unit}</td>
                                    <td>${item.supplier}</td>
                                    <td>${item.expiry} ${isExpired ? ' (EXPIRED)' : ''}</td>
                                </tr>`;
                            })
                            .join('')}
                        </tbody>
                    </table>
                </div>
            </body>
            </html>
        `;
        await Print.printAsync({ html });
    };

    // --- Component Rendering ---
    return (
        <ScrollView style={styles.card}>
            <Text style={styles.title}>Dermatology Stock Report</Text>

            {/* --- 1. Dashboard Cards --- */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Dashboard Alerts</Text>
                
                <View style={styles.summaryContainer}>
                    {/* 🔴 Low Stock Items */}
                    <View style={[styles.summaryBox, { borderColor: THEME.danger }]}>
                        <Text style={[styles.statusIcon, { color: THEME.danger }]}>🔴</Text>
                        <Text style={[styles.summaryValue, { color: THEME.danger }]}>{lowStockItems.length}</Text>
                        <Text style={styles.summaryLabel}>Low Stock Items ( {LOW_STOCK_THRESHOLD} Units)</Text>
                    </View>

                    {/* 🟠 Expiring Soon */}
                    <View style={[styles.summaryBox, { borderColor: WARNING_COLOR }]}>
                        <Text style={[styles.statusIcon, { color: WARNING_COLOR }]}>🟠</Text>
                        <Text style={[styles.summaryValue, { color: WARNING_COLOR }]}>{expiringSoonItems.length}</Text>
                        <Text style={styles.summaryLabel}>Expiring Soon ( {NEAR_EXPIRY_DAYS} Days)</Text>
                    </View>

                    {/* Placeholder for Total Items (Replaced finance metric) */}
                    <View style={[styles.summaryBox, { borderColor: THEME.primary }]}>
                        <Text style={[styles.statusIcon, { color: THEME.primary }]}>🟢</Text>
                        <Text style={[styles.summaryValue, { color: THEME.primary }]}>{inventoryItems.length}</Text>
                        <Text style={styles.summaryLabel}>Total Unique Items</Text>
                    </View>
                </View>
            </View>

            {/* --- 2. Bar Chart: Stock Levels per Item --- */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Bar Chart: Stock Levels (Top {MAX_CHART_ITEMS})</Text>
                
                <View style={styles.chartArea}>
                    {stockLevelsChartData.map((d, i) => {
                        const barWidth = (d.quantity / maxQuantity) * 85;
                        const barColor = d.isLow ? THEME.danger : THEME.primary;
                        return (
                            <View key={i} style={styles.barContainer}>
                                <Text style={[styles.barLabel, d.isLow && { color: THEME.danger, fontWeight: '600' }]}>{d.name}</Text>
                                <View style={styles.barWrapper}>
                                    <View
                                        style={[
                                            styles.bar,
                                            { 
                                                width: `${barWidth + 5}%`, 
                                                backgroundColor: barColor 
                                            },
                                        ]}
                                    >
                                        <Text style={styles.barValueInside}>{d.quantity}</Text>
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </View>

            {/* --- 3. Detailed Lists (For Immediate Action) --- */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Alert Details: Items to Action</Text>
                
                <Text style={styles.alertListHeader}>🔴 Low Stock List ({lowStockItems.length} items)</Text>
                <View style={styles.alertList}>
                    {lowStockItems.map(item => (
                        <Text key={item.id} style={styles.alertListItem}>
                            • **{item.name}** ({item.quantity} {item.unit}) - Category: {item.category}
                        </Text>
                    ))}
                    {lowStockItems.length === 0 && <Text style={styles.emptyTextSmall}>No items below stock threshold.</Text>}
                </View>

                <Text style={styles.alertListHeader}>🟠 Expiring Soon List ({expiringSoonItems.length} items)</Text>
                <View style={styles.alertList}>
                    {expiringSoonItems.map(item => (
                        <Text key={item.id} style={[styles.alertListItem, new Date(item.expiry) < new Date() && {color: THEME.danger}]}>
                            • **{item.name}** - Expiry: {item.expiry} ({item.quantity} {item.unit})
                        </Text>
                    ))}
                    {expiringSoonItems.length === 0 && <Text style={styles.emptyTextSmall}>No items expiring within {NEAR_EXPIRY_DAYS} days.</Text>}
                </View>
            </View>

            <View style={{ marginTop: 30 }}>
                <Button title="Print Organized Stock Export List" color={THEME.primary} onPress={handlePrint} />
            </View>
        </ScrollView>
    );
};

// --- STYLES --- 
const styles = StyleSheet.create({
    card: {
        backgroundColor: THEME.white,
        borderRadius: THEME.radius,
        padding: 16,
        margin: 10,
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
    title: { 
        fontSize: 18, 
        fontWeight: '700', 
        color: THEME.secondary, 
        textAlign: 'center', 
        marginBottom: 16,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: THEME.border,
    },
    section: {
        marginBottom: 20,
        padding: 10,
        backgroundColor: THEME.bg,
        borderRadius: THEME.radius / 2,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: THEME.secondary,
        marginBottom: 10,
        paddingBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: THEME.border,
    },
    
    // --- Summary Styles ---
    summaryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    summaryBox: {
        width: '32%',
        padding: 10,
        backgroundColor: THEME.white,
        borderRadius: THEME.radius / 2,
        borderWidth: 1,
        borderColor: THEME.border,
        alignItems: 'center',
    },
    statusIcon: {
        fontSize: 20,
        marginBottom: 5,
    },
    summaryValue: {
        fontSize: 22,
        fontWeight: '800',
        color: THEME.primary,
    },
    summaryLabel: {
        fontSize: 10,
        color: THEME.textLight,
        marginTop: 4,
        textAlign: 'center'
    },

    // --- Chart Styles ---
    chartArea: { paddingVertical: 5 },
    barContainer: { marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
    barLabel: { fontSize: 13, fontWeight: '500', color: THEME.text, width: 120 },
    barWrapper: { flex: 1, height: 16, backgroundColor: THEME.border, borderRadius: 8 },
    bar: { 
        height: '100%', 
        borderRadius: 8, 
        justifyContent: 'center', 
        paddingRight: 6, 
        alignItems: 'flex-end',
        minWidth: 5,
    },
    barValueInside: { fontSize: 11, fontWeight: '700', color: '#fff', lineHeight: 16 },

    // --- Alert List Styles ---
    alertListHeader: {
        fontSize: 13,
        fontWeight: '700',
        color: THEME.secondary,
        marginTop: 15,
        marginBottom: 5,
    },
    alertList: {
        padding: 8,
        backgroundColor: THEME.white,
        borderRadius: THEME.radius / 2,
        borderWidth: 1,
        borderColor: THEME.border,
    },
    alertListItem: {
        fontSize: 12,
        color: THEME.text,
        paddingVertical: 3,
    },
    emptyTextSmall: { textAlign: 'center', padding: 5, fontSize: 11, color: THEME.textLight, fontStyle: 'italic' },
    
});

export default InventoryReport;