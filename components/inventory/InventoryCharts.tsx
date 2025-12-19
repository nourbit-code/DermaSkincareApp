import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Button, Platform, ActivityIndicator, TouchableOpacity } from 'react-native';
import * as Print from 'expo-print';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../../types/InventoryTypes';
import { 
    getInventory, 
    getLowStockItems, 
    getExpiringItems, 
    getInventorySummary,
    getStockTransactions 
} from '../../src/api/inventoryApi';

interface InventoryReportProps {
    role: 'doctor' | 'receptionist';
}

// Backend item structure
interface BackendInventoryItem {
    item_id: number;
    name: string;
    category: string;
    category_display: string;
    quantity: number;
    unit: string;
    unit_display: string;
    supplier: string;
    expiry_date: string | null;
    linked_service: string;
    min_stock_level: number;
    cost_per_unit: string;
    is_low_stock: boolean;
    is_expiring_soon: boolean;
}

interface StockTransaction {
    transaction_id: number;
    item: number;
    item_name: string;
    transaction_type: string;
    quantity: number;
    notes: string;
    performed_by: string;
    created_at: string;
}

interface SummaryData {
    total_items: number;
    total_quantity: number;
    low_stock_count: number;
    expiring_soon_count: number;
    category_breakdown: Record<string, { count: number; total_quantity: number }>;
}

const LOW_STOCK_THRESHOLD = 5; 
const NEAR_EXPIRY_DAYS = 60;
const MAX_CHART_ITEMS = 10; 

const WARNING_COLOR = '#FFA500';

const InventoryReport: React.FC<InventoryReportProps> = ({ role }) => {
    
    // State for data from backend
    const [loading, setLoading] = useState(true);
    const [inventoryItems, setInventoryItems] = useState<BackendInventoryItem[]>([]);
    const [lowStockItems, setLowStockItems] = useState<BackendInventoryItem[]>([]);
    const [expiringSoonItems, setExpiringSoonItems] = useState<BackendInventoryItem[]>([]);
    const [summary, setSummary] = useState<SummaryData | null>(null);
    const [recentTransactions, setRecentTransactions] = useState<StockTransaction[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    // Load all data from backend
    const loadData = useCallback(async () => {
        try {
            const [inventoryRes, lowStockRes, expiringRes, summaryRes, transactionsRes] = await Promise.all([
                getInventory(),
                getLowStockItems(),
                getExpiringItems(),
                getInventorySummary(),
                getStockTransactions(),
            ]);

            if (inventoryRes.success) setInventoryItems(inventoryRes.data);
            if (lowStockRes.success) setLowStockItems(lowStockRes.data);
            if (expiringRes.success) setExpiringSoonItems(expiringRes.data);
            if (summaryRes.success) setSummary(summaryRes.data);
            if (transactionsRes.success) {
                // Get the 10 most recent transactions
                const sorted = (transactionsRes.data || [])
                    .sort((a: StockTransaction, b: StockTransaction) => 
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    )
                    .slice(0, 10);
                setRecentTransactions(sorted);
            }
        } catch (error) {
            console.error('Error loading analytics data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    // Calculate stock levels for chart
    const stockLevelsChartData = useMemo(() => {
        const data = inventoryItems
            .map(item => ({
                name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
                fullName: item.name,
                quantity: item.quantity,
                isLow: item.is_low_stock,
            }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, MAX_CHART_ITEMS);
        return data;
    }, [inventoryItems]);

    const maxQuantity = useMemo(() => 
        Math.max(...stockLevelsChartData.map(d => d.quantity), 1), 
    [stockLevelsChartData]);

    // Category breakdown for chart
    const categoryData = useMemo(() => {
        if (!summary?.category_breakdown) return [];
        return Object.entries(summary.category_breakdown).map(([name, data]) => ({
            name,
            count: data.count,
            quantity: data.total_quantity,
        }));
    }, [summary]);

    // Usage statistics from transactions
    const usageStats = useMemo(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const useTransactions = recentTransactions.filter(t => t.transaction_type === 'use');
        const todayUsage = useTransactions.filter(t => new Date(t.created_at) >= today);
        const weekUsage = useTransactions.filter(t => new Date(t.created_at) >= weekAgo);
        
        return {
            todayCount: todayUsage.reduce((sum, t) => sum + Math.abs(t.quantity), 0),
            weekCount: weekUsage.reduce((sum, t) => sum + Math.abs(t.quantity), 0),
            totalTransactions: recentTransactions.length,
        };
    }, [recentTransactions]);

    // --- Print Function: Clean Invoice-Style Report ---
    const handlePrint = async () => {
        const today = new Date();
        const reportDate = today.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: '2-digit' 
        });
        const reportId = `RPT-${String(Date.now()).slice(-6)}`;

        // Calculate totals
        const totalQuantity = summary?.total_quantity || inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
        
        // Generate inventory rows
        const inventoryRows = inventoryItems
            .map((item, index) => {
                const isExpired = item.expiry_date && new Date(item.expiry_date) < today;
                const isLow = item.is_low_stock;
                const rowStyle = isExpired ? 'background-color: #ffe0e0; color: #dc3545;' : 
                                 isLow ? 'background-color: #fff3cd; color: #856404;' : '';
                return `
                    <tr style="${rowStyle}">
                        <td style="text-align: center;">${index + 1}</td>
                        <td style="text-align: left;">${item.name}</td>
                        <td>${item.category_display}</td>
                        <td style="text-align: center; font-weight: bold;">${item.quantity}</td>
                        <td>${item.unit_display || item.unit}</td>
                        <td>${item.supplier || '—'}</td>
                        <td>${item.expiry_date || 'N/A'}${isExpired ? ' ⚠️' : ''}</td>
                    </tr>`;
            })
            .join('');

        // Generate category rows
        const categoryRows = categoryData
            .map(cat => `
                <tr>
                    <td style="text-align: left;">${cat.name}</td>
                    <td style="text-align: center;">${cat.count}</td>
                    <td style="text-align: center;">${cat.quantity}</td>
                </tr>
            `).join('');

        // Generate low stock rows
        const lowStockRows = lowStockItems.length > 0 
            ? lowStockItems.map(item => `
                <tr>
                    <td style="text-align: left;">${item.name}</td>
                    <td style="text-align: center; color: #dc3545; font-weight: bold;">${item.quantity} ${item.unit_display || item.unit}</td>
                    <td>${item.category_display}</td>
                </tr>
            `).join('')
            : '<tr><td colspan="3" style="text-align: center; color: #28a745;">✓ No low stock items</td></tr>';

        // Generate expiring rows
        const expiringRows = expiringSoonItems.length > 0
            ? expiringSoonItems.map(item => `
                <tr>
                    <td style="text-align: left;">${item.name}</td>
                    <td style="text-align: center;">${item.expiry_date || 'N/A'}</td>
                    <td style="text-align: center;">${item.quantity} ${item.unit_display || item.unit}</td>
                </tr>
            `).join('')
            : '<tr><td colspan="3" style="text-align: center; color: #28a745;">✓ No items expiring soon</td></tr>';

        const html = `
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
                    h2 { color: #9B084D; border-bottom: 2px solid #ddd; padding-bottom: 5px; margin-top: 25px; }
                    h3 { color: #666; margin-top: 20px; font-size: 14px; }
                    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                    th, td { border: 1px solid #eee; padding: 8px; text-align: right; font-size: 12px; }
                    th { background-color: #F7F7F7; color: #555; text-align: center; }
                    .summary-row td { border: none; font-weight: bold; }
                    .total-row td { background-color: #9B084D; color: #FFFFFF; }
                    .header-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
                    .status { padding: 5px 10px; border-radius: 4px; display: inline-block; font-weight: bold; }
                    .status-good { background-color: #28a745; color: white; }
                    .status-warning { background-color: #ffc107; color: #333; }
                    .status-danger { background-color: #dc3545; color: white; }
                    .clinic-header { text-align: center; border-bottom: 3px solid #9B084D; padding-bottom: 15px; margin-bottom: 20px; }
                    .clinic-name { font-size: 24px; font-weight: bold; color: #9B084D; }
                    .report-title { font-size: 18px; color: #666; margin-top: 5px; }
                    .info-box { background: #f8f9fa; padding: 10px; border-radius: 5px; margin: 10px 0; }
                    .alert-box { padding: 10px; border-radius: 5px; margin: 10px 0; }
                    .alert-danger { background: #ffe0e0; border-left: 4px solid #dc3545; }
                    .alert-warning { background: #fff3cd; border-left: 4px solid #ffc107; }
                </style>
            </head>
            <body>
                <div class="clinic-header">
                    <div class="clinic-name">🏥 DermaSkincare Clinic</div>
                    <div class="report-title">Inventory Stock Report</div>
                </div>

                <table style="border: none; margin-bottom: 20px;">
                    <tr style="border: none;">
                        <td style="border: none; text-align: left;"><strong>Report ID:</strong> ${reportId}</td>
                        <td style="border: none; text-align: right;"><strong>Date:</strong> ${reportDate}</td>
                    </tr>
                </table>

                <h2>📊 Summary Overview</h2>
                <table>
                    <thead>
                        <tr>
                            <th style="text-align: left;">Metric</th>
                            <th>Value</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="text-align: left;">Total Unique Items</td>
                            <td style="text-align: center; font-weight: bold;">${inventoryItems.length}</td>
                            <td style="text-align: center;"><span class="status status-good">✓</span></td>
                        </tr>
                        <tr>
                            <td style="text-align: left;">Total Stock Quantity</td>
                            <td style="text-align: center; font-weight: bold;">${totalQuantity} units</td>
                            <td style="text-align: center;"><span class="status status-good">✓</span></td>
                        </tr>
                        <tr>
                            <td style="text-align: left;">Low Stock Alerts</td>
                            <td style="text-align: center; font-weight: bold;">${lowStockItems.length}</td>
                            <td style="text-align: center;"><span class="status ${lowStockItems.length > 0 ? 'status-danger' : 'status-good'}">${lowStockItems.length > 0 ? '⚠️' : '✓'}</span></td>
                        </tr>
                        <tr>
                            <td style="text-align: left;">Expiring Soon (${NEAR_EXPIRY_DAYS} days)</td>
                            <td style="text-align: center; font-weight: bold;">${expiringSoonItems.length}</td>
                            <td style="text-align: center;"><span class="status ${expiringSoonItems.length > 0 ? 'status-warning' : 'status-good'}">${expiringSoonItems.length > 0 ? '⚠️' : '✓'}</span></td>
                        </tr>
                    </tbody>
                </table>

                <h2>📦 Inventory by Category</h2>
                <table>
                    <thead>
                        <tr>
                            <th style="text-align: left;">Category</th>
                            <th>Items Count</th>
                            <th>Total Qty</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${categoryRows}
                        <tr class="total-row">
                            <td style="text-align: left;">TOTAL</td>
                            <td style="text-align: center;">${inventoryItems.length}</td>
                            <td style="text-align: center;">${totalQuantity}</td>
                        </tr>
                    </tbody>
                </table>

                <h2>🔴 Low Stock Items (≤ ${LOW_STOCK_THRESHOLD} units)</h2>
                <table>
                    <thead>
                        <tr>
                            <th style="text-align: left;">Item Name</th>
                            <th>Quantity</th>
                            <th>Category</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${lowStockRows}
                    </tbody>
                </table>

                <h2>🟠 Expiring Soon (Within ${NEAR_EXPIRY_DAYS} Days)</h2>
                <table>
                    <thead>
                        <tr>
                            <th style="text-align: left;">Item Name</th>
                            <th>Expiry Date</th>
                            <th>Quantity</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${expiringRows}
                    </tbody>
                </table>

                <h2>📋 Complete Inventory List</h2>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th style="text-align: left;">Item Name</th>
                            <th>Category</th>
                            <th>Qty</th>
                            <th>Unit</th>
                            <th>Supplier</th>
                            <th>Expiry</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${inventoryRows}
                        <tr class="summary-row">
                            <td colspan="3" style="text-align: right;">Total Items:</td>
                            <td style="text-align: center;">${totalQuantity}</td>
                            <td colspan="3"></td>
                        </tr>
                    </tbody>
                </table>

                <div style="margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px;">
                    <table style="border: none;">
                        <tr style="border: none;">
                            <td style="border: none; width: 33%; text-align: center;">
                                <div style="border-top: 1px solid #333; width: 150px; margin: 30px auto 5px;"></div>
                                <small>Prepared By</small>
                            </td>
                            <td style="border: none; width: 33%; text-align: center;">
                                <div style="border-top: 1px solid #333; width: 150px; margin: 30px auto 5px;"></div>
                                <small>Verified By</small>
                            </td>
                            <td style="border: none; width: 33%; text-align: center;">
                                <div style="border-top: 1px solid #333; width: 150px; margin: 30px auto 5px;"></div>
                                <small>Approved By</small>
                            </td>
                        </tr>
                    </table>
                </div>

                <p style="text-align: center; color: #999; font-size: 10px; margin-top: 30px;">
                    Generated by DermaSkincare Clinic Inventory System • ${reportDate}
                </p>
            </body>
            </html>
        `;
        
        await Print.printAsync({ html });
    };

    // --- Component Rendering ---
    // Loading state
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={THEME.primary} />
                <Text style={styles.loadingText}>Loading analytics...</Text>
            </View>
        );
    }

    return (
        <View style={styles.card}>
            {/* --- 1. Dashboard Summary Cards --- */}
            <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                    <Ionicons name="stats-chart" size={16} color={THEME.primary} />
                    <Text style={styles.sectionTitle}>Quick Overview</Text>
                </View>
                
                <View style={styles.summaryContainer}>
                    {/* Total Items */}
                    <View style={[styles.summaryBox, styles.summaryBoxPrimary]}>
                        <Ionicons name="cube" size={24} color={THEME.primary} />
                        <Text style={[styles.summaryValue, { color: THEME.primary }]}>{summary?.total_items || inventoryItems.length}</Text>
                        <Text style={styles.summaryLabel}>Total Items</Text>
                    </View>

                    {/* Low Stock */}
                    <View style={[styles.summaryBox, styles.summaryBoxDanger]}>
                        <Ionicons name="alert-circle" size={24} color={THEME.danger} />
                        <Text style={[styles.summaryValue, { color: THEME.danger }]}>{summary?.low_stock_count || lowStockItems.length}</Text>
                        <Text style={styles.summaryLabel}>Low Stock</Text>
                    </View>

                    {/* Expiring Soon */}
                    <View style={[styles.summaryBox, styles.summaryBoxWarning]}>
                        <Ionicons name="time" size={24} color={WARNING_COLOR} />
                        <Text style={[styles.summaryValue, { color: WARNING_COLOR }]}>{summary?.expiring_soon_count || expiringSoonItems.length}</Text>
                        <Text style={styles.summaryLabel}>Expiring</Text>
                    </View>

                    {/* Total Quantity */}
                    <View style={[styles.summaryBox, styles.summaryBoxSuccess]}>
                        <Ionicons name="layers" size={24} color={THEME.success} />
                        <Text style={[styles.summaryValue, { color: THEME.success }]}>{summary?.total_quantity || 0}</Text>
                        <Text style={styles.summaryLabel}>Total Qty</Text>
                    </View>
                </View>
            </View>

            {/* --- 2. Usage Activity (Doctor-specific) --- */}
            {role === 'doctor' && (
                <View style={[styles.section, { backgroundColor: '#fdf2f8' }]}>
                    <View style={styles.sectionHeaderRow}>
                        <Ionicons name="trending-up" size={16} color={THEME.primary} />
                        <Text style={styles.sectionTitle}>Your Usage Activity</Text>
                    </View>
                    <View style={styles.usageRow}>
                        <View style={styles.usageStat}>
                            <View style={styles.usageStatCircle}>
                                <Text style={styles.usageValue}>{usageStats.todayCount}</Text>
                            </View>
                            <Text style={styles.usageLabel}>Used Today</Text>
                        </View>
                        <View style={styles.usageStat}>
                            <View style={[styles.usageStatCircle, { backgroundColor: '#e0f2fe' }]}>
                                <Text style={[styles.usageValue, { color: THEME.accentBlue }]}>{usageStats.weekCount}</Text>
                            </View>
                            <Text style={styles.usageLabel}>This Week</Text>
                        </View>
                        <View style={styles.usageStat}>
                            <View style={[styles.usageStatCircle, { backgroundColor: '#f0fdf4' }]}>
                                <Text style={[styles.usageValue, { color: THEME.success }]}>{recentTransactions.length}</Text>
                            </View>
                            <Text style={styles.usageLabel}>Recent Logs</Text>
                        </View>
                    </View>
                </View>
            )}

            {/* --- 3. Category Breakdown --- */}
            {categoryData.length > 0 && (
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Ionicons name="grid" size={16} color={THEME.accentBlue} />
                        <Text style={styles.sectionTitle}>By Category</Text>
                    </View>
                    <View style={styles.categoryGrid}>
                        {categoryData.map((cat, i) => (
                            <View key={i} style={styles.categoryItem}>
                                <Text style={styles.categoryName}>{cat.name}</Text>
                                <View style={styles.categoryStats}>
                                    <Text style={styles.categoryCount}>{cat.count} items</Text>
                                    <Text style={styles.categoryQty}>{cat.quantity} units</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {/* --- 4. Bar Chart: Stock Levels --- */}
            <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                    <Ionicons name="bar-chart" size={16} color={THEME.primary} />
                    <Text style={styles.sectionTitle}>Stock Levels (Top {Math.min(stockLevelsChartData.length, MAX_CHART_ITEMS)})</Text>
                </View>
                
                <View style={styles.chartArea}>
                    {stockLevelsChartData.length === 0 ? (
                        <Text style={styles.emptyTextSmall}>No inventory items to display</Text>
                    ) : (
                        stockLevelsChartData.map((d, i) => {
                            const barWidth = Math.max((d.quantity / maxQuantity) * 85, 5);
                            const barColor = d.isLow ? THEME.danger : THEME.primary;
                            return (
                                <View key={i} style={styles.barContainer}>
                                    <Text style={[styles.barLabel, d.isLow && { color: THEME.danger, fontWeight: '600' }]} numberOfLines={1}>
                                        {d.name}
                                    </Text>
                                    <View style={styles.barWrapper}>
                                        <View style={[styles.bar, { width: `${barWidth}%`, backgroundColor: barColor }]}>
                                            <Text style={styles.barValueInside}>{d.quantity}</Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>
            </View>

            {/* --- 5. Alert Details --- */}
            <View style={[styles.section, styles.alertSection]}>
                <View style={styles.sectionHeaderRow}>
                    <Ionicons name="warning" size={16} color={THEME.danger} />
                    <Text style={[styles.sectionTitle, { color: THEME.danger }]}>Items Needing Attention</Text>
                </View>
                
                {/* Low Stock List */}
                <Text style={styles.alertListHeader}>
                    <Ionicons name="alert-circle" size={14} color={THEME.danger} /> Low Stock ({lowStockItems.length})
                </Text>
                <View style={styles.alertList}>
                    {lowStockItems.length > 0 ? (
                        lowStockItems.slice(0, 5).map(item => (
                            <View key={item.item_id} style={styles.alertItem}>
                                <Text style={styles.alertItemName}>{item.name}</Text>
                                <Text style={[styles.alertItemQty, { color: THEME.danger }]}>
                                    {item.quantity} {item.unit_display || item.unit}
                                </Text>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyTextSmall}>✓ All items stocked</Text>
                    )}
                </View>

                {/* Expiring Soon List */}
                <Text style={[styles.alertListHeader, { marginTop: 12 }]}>
                    <Ionicons name="time" size={14} color={WARNING_COLOR} /> Expiring Soon ({expiringSoonItems.length})
                </Text>
                <View style={styles.alertList}>
                    {expiringSoonItems.length > 0 ? (
                        expiringSoonItems.slice(0, 5).map(item => (
                            <View key={item.item_id} style={styles.alertItem}>
                                <Text style={styles.alertItemName}>{item.name}</Text>
                                <Text style={[styles.alertItemQty, { color: WARNING_COLOR }]}>
                                    {item.expiry_date || 'N/A'}
                                </Text>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyTextSmall}>✓ No items expiring soon</Text>
                    )}
                </View>
            </View>

            {/* --- 6. Recent Transactions --- */}
            {recentTransactions.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🕐 Recent Activity</Text>
                    <View style={styles.transactionList}>
                        {recentTransactions.slice(0, 5).map((t, i) => (
                            <View key={i} style={styles.transactionItem}>
                                <View style={styles.transactionIcon}>
                                    <Ionicons 
                                        name={t.transaction_type === 'add' ? 'add-circle' : 'remove-circle'} 
                                        size={18} 
                                        color={t.transaction_type === 'add' ? THEME.success : THEME.primary} 
                                    />
                                </View>
                                <View style={styles.transactionInfo}>
                                    <Text style={styles.transactionName} numberOfLines={1}>{t.item_name || `Item #${t.item}`}</Text>
                                    <Text style={styles.transactionMeta}>
                                        {t.performed_by || 'System'} • {new Date(t.created_at).toLocaleDateString()}
                                    </Text>
                                </View>
                                <Text style={[
                                    styles.transactionQty,
                                    { color: t.transaction_type === 'add' ? THEME.success : THEME.danger }
                                ]}>
                                    {t.transaction_type === 'add' ? '+' : '-'}{Math.abs(t.quantity)}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {/* Print Button */}
            <TouchableOpacity style={styles.printBtn} onPress={handlePrint}>
                <Ionicons name="print" size={18} color={THEME.white} />
                <Text style={styles.printBtnText}>Print Full Report</Text>
            </TouchableOpacity>
        </View>
    );
};

// --- STYLES --- 
const styles = StyleSheet.create({
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 14,
        color: THEME.textLight,
    },
    card: {
        backgroundColor: THEME.white,
        borderRadius: 12,
        padding: 16,
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
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: THEME.border,
    },
    title: { 
        fontSize: 16, 
        fontWeight: '700', 
        color: THEME.secondary, 
    },
    refreshButton: {
        backgroundColor: THEME.primary,
        padding: 8,
        borderRadius: 8,
    },
    section: {
        marginBottom: 16,
        padding: 12,
        backgroundColor: THEME.bg,
        borderRadius: 10,
    },
    alertSection: {
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: THEME.secondary,
    },
    
    // Summary Cards
    summaryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
    },
    summaryBox: {
        flex: 1,
        padding: 12,
        backgroundColor: THEME.white,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: THEME.border,
        alignItems: 'center',
    },
    summaryBoxPrimary: {
        borderColor: THEME.primary,
        backgroundColor: '#fdf2f8',
    },
    summaryBoxDanger: {
        borderColor: THEME.danger,
        backgroundColor: '#fef2f2',
    },
    summaryBoxWarning: {
        borderColor: '#f59e0b',
        backgroundColor: '#fffbeb',
    },
    summaryBoxSuccess: {
        borderColor: THEME.success,
        backgroundColor: '#f0fdf4',
    },
    summaryValue: {
        fontSize: 22,
        fontWeight: '800',
        marginTop: 6,
    },
    summaryLabel: {
        fontSize: 10,
        color: THEME.textLight,
        marginTop: 4,
        textAlign: 'center',
        fontWeight: '600',
    },

    // Usage Stats
    usageRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    usageStat: {
        alignItems: 'center',
    },
    usageStatCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#fdf2f8',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    usageValue: {
        fontSize: 22,
        fontWeight: '800',
        color: THEME.primary,
    },
    usageLabel: {
        fontSize: 11,
        color: THEME.textLight,
        fontWeight: '600',
    },

    // Category Grid
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryItem: {
        backgroundColor: THEME.white,
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: THEME.border,
        minWidth: '30%',
        flex: 1,
    },
    categoryName: {
        fontSize: 12,
        fontWeight: '600',
        color: THEME.secondary,
        marginBottom: 4,
    },
    categoryStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    categoryCount: {
        fontSize: 11,
        color: THEME.textLight,
    },
    categoryQty: {
        fontSize: 11,
        color: THEME.primary,
        fontWeight: '600',
    },

    // Chart Styles
    chartArea: { paddingVertical: 5 },
    barContainer: { marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
    barLabel: { fontSize: 11, fontWeight: '500', color: THEME.text, width: 100 },
    barWrapper: { flex: 1, height: 16, backgroundColor: THEME.border, borderRadius: 8 },
    bar: { 
        height: '100%', 
        borderRadius: 8, 
        justifyContent: 'center', 
        paddingRight: 6, 
        alignItems: 'flex-end',
        minWidth: 5,
    },
    barValueInside: { fontSize: 10, fontWeight: '700', color: '#fff', lineHeight: 16 },

    // Alert List Styles
    alertListHeader: {
        fontSize: 12,
        fontWeight: '600',
        color: THEME.secondary,
        marginBottom: 6,
    },
    alertList: {
        padding: 8,
        backgroundColor: THEME.white,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: THEME.border,
    },
    alertItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
        borderBottomWidth: 1,
        borderBottomColor: THEME.border,
    },
    alertItemName: {
        fontSize: 12,
        color: THEME.text,
        flex: 1,
    },
    alertItemQty: {
        fontSize: 12,
        fontWeight: '600',
    },
    emptyTextSmall: { 
        textAlign: 'center', 
        padding: 10, 
        fontSize: 11, 
        color: THEME.textLight, 
        fontStyle: 'italic' 
    },

    // Transaction List
    transactionList: {
        backgroundColor: THEME.white,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: THEME.border,
        overflow: 'hidden',
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: THEME.border,
    },
    transactionIcon: {
        marginRight: 10,
    },
    transactionInfo: {
        flex: 1,
    },
    transactionName: {
        fontSize: 12,
        fontWeight: '500',
        color: THEME.text,
    },
    transactionMeta: {
        fontSize: 10,
        color: THEME.textLight,
        marginTop: 2,
    },
    transactionQty: {
        fontSize: 14,
        fontWeight: '700',
    },

    // Print Button
    printBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: THEME.primary,
        padding: 12,
        borderRadius: 10,
        marginTop: 10,
        gap: 8,
    },
    printBtnText: {
        color: THEME.white,
        fontSize: 14,
        fontWeight: '600',
    },
});

export default InventoryReport;