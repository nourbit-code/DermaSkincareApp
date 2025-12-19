import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
    View,
    ScrollView,
    TouchableOpacity,
    Text,
    StyleSheet,
    Alert,
    ActivityIndicator,
    TextInput,
    RefreshControl,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useAuth } from '../context/AuthContext';
import InventoryCharts from '../../components/inventory/InventoryCharts';
import { THEME } from '../../types/InventoryTypes'; 
import { getInventory, useStock, addStock, getLowStockItems } from '../../src/api/inventoryApi';

// Backend inventory item structure
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

const LOW_STOCK_THRESHOLD = 10;

// Helper Component (SectionHeader)
interface SectionHeaderProps { 
    icon: keyof typeof Ionicons.glyphMap; 
    title: string; 
    color?: string; 
}
const SectionHeader = ({ icon, title, color = THEME.primary }: SectionHeaderProps) => (
    <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={18} color={color} />
        <Text style={[styles.sectionTitle, { color: THEME.secondary }]}>{title}</Text>
    </View>
);

// --- Inventory Item Card (Enhanced Component) ---
interface InventoryUsageItemProps {
    item: BackendInventoryItem;
    onUse: (id: number, qty: number) => void;
}
const InventoryUsageItem = ({ item, onUse }: InventoryUsageItemProps) => {
    const [useQty, setUseQty] = useState(1);
    const isLowStock = item.is_low_stock || item.quantity <= item.min_stock_level;
    const isExpiringSoon = item.is_expiring_soon;

    return (
        <View style={[
            styles.itemCard, 
            isLowStock && styles.itemCardLowStock,
            isExpiringSoon && styles.itemCardExpiring
        ]}>
            <View style={styles.itemInfo}>
                <View style={styles.itemNameRow}>
                    <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                </View>
                <View style={styles.itemDetails}>
                    <Text style={styles.itemDetailText}>{item.category_display}</Text>
                    {item.linked_service && (
                        <Text style={styles.itemServiceTag}>• {item.linked_service}</Text>
                    )}
                </View>
                <View style={styles.badgeRow}>
                    {isLowStock && (
                        <View style={styles.lowStockBadge}>
                            <Ionicons name="alert-circle" size={12} color={THEME.white} />
                            <Text style={styles.lowStockText}>LOW STOCK</Text>
                        </View>
                    )}
                    {isExpiringSoon && (
                        <View style={styles.expiringBadge}>
                            <Ionicons name="time" size={12} color={THEME.white} />
                            <Text style={styles.expiringText}>EXPIRING</Text>
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.usageControls}>
                {/* Quantity Display */}
                <View style={styles.quantityDisplay}>
                    <Text style={[
                        styles.quantityText, 
                        { color: isLowStock ? THEME.danger : THEME.secondary }
                    ]}>
                        {item.quantity}
                    </Text>
                    <Text style={styles.unitText}>{item.unit_display || item.unit}</Text>
                </View>

                {/* Quantity Selector */}
                <View style={styles.qtySelector}>
                    <TouchableOpacity 
                        style={styles.qtyBtn}
                        onPress={() => setUseQty(Math.max(1, useQty - 1))}
                    >
                        <Ionicons name="remove" size={16} color={THEME.text} />
                    </TouchableOpacity>
                    <Text style={styles.qtyValue}>{useQty}</Text>
                    <TouchableOpacity 
                        style={styles.qtyBtn}
                        onPress={() => setUseQty(Math.min(item.quantity, useQty + 1))}
                    >
                        <Ionicons name="add" size={16} color={THEME.text} />
                    </TouchableOpacity>
                </View>

                {/* The USE button */}
                <TouchableOpacity 
                    style={[styles.useBtn, item.quantity <= 0 && styles.useBtnDisabled]} 
                    onPress={() => {
                        onUse(item.item_id, useQty);
                        setUseQty(1);
                    }}
                    disabled={item.quantity <= 0}
                >
                    <Ionicons name="checkmark" size={18} color={THEME.white} />
                    <Text style={styles.useBtnText}>Use</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}


const DoctorInventory = () => {
    const { user } = useAuth();
    
    // State
    const [inventory, setInventory] = useState<BackendInventoryItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [summaryStats, setSummaryStats] = useState({
        totalItems: 0,
        lowStockCount: 0,
        expiringCount: 0,
    });

    // Load inventory from backend
    const loadInventory = useCallback(async () => {
        try {
            const result = await getInventory();
            if (result.success && result.data) {
                setInventory(result.data);
                
                // Calculate stats
                const lowStock = result.data.filter((i: BackendInventoryItem) => i.is_low_stock).length;
                const expiring = result.data.filter((i: BackendInventoryItem) => i.is_expiring_soon).length;
                setSummaryStats({
                    totalItems: result.data.length,
                    lowStockCount: lowStock,
                    expiringCount: expiring,
                });
            }
        } catch (error) {
            console.error('Error loading inventory:', error);
            Alert.alert('Error', 'Failed to load inventory');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadInventory();
    }, [loadInventory]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadInventory();
    }, [loadInventory]);

    // Use stock - connects to backend
    const handleUseStock = async (itemId: number, quantity: number) => {
        const item = inventory.find(i => i.item_id === itemId);
        if (!item || item.quantity < quantity) {
            Alert.alert("Error", `Insufficient stock for ${item?.name || 'item'}`);
            return;
        }

        try {
            const result = await useStock(itemId, {
                quantity: quantity,
                notes: `Quick usage from Doctor Panel`,
                performed_by: user?.name || 'Doctor'
            });

            if (result.success) {
                // Update local state
                setInventory(prev => prev.map(i => 
                    i.item_id === itemId 
                        ? { ...i, quantity: i.quantity - quantity, is_low_stock: (i.quantity - quantity) <= i.min_stock_level }
                        : i
                ));

                // Update summary stats
                const updatedItem = inventory.find(i => i.item_id === itemId);
                if (updatedItem && (updatedItem.quantity - quantity) <= updatedItem.min_stock_level) {
                    setSummaryStats(prev => ({
                        ...prev,
                        lowStockCount: prev.lowStockCount + 1
                    }));
                }

                // Show feedback
                Alert.alert(
                    "Stock Used", 
                    `Used ${quantity} ${item.unit_display || item.unit} of ${item.name}`,
                    [{ text: "OK" }]
                );
            } else {
                Alert.alert("Error", result.error || "Failed to use stock");
            }
        } catch (error) {
            console.error('Error using stock:', error);
            Alert.alert("Error", "Failed to update inventory");
        }
    };

    // Get unique categories from inventory
    const categories = useMemo(() => {
        const cats = new Set(inventory.map(i => i.category_display || i.category));
        return ['All', ...Array.from(cats)];
    }, [inventory]);

    // Filter and sort inventory
    const filteredInventory = useMemo(() => {
        return inventory
            .filter(item => {
                const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (item.category_display || item.category).toLowerCase().includes(searchQuery.toLowerCase());
                const matchesCategory = selectedCategory === 'All' || 
                    (item.category_display || item.category) === selectedCategory;
                return matchesSearch && matchesCategory;
            })
            .sort((a, b) => {
                // Low stock items first
                if (a.is_low_stock && !b.is_low_stock) return -1;
                if (!a.is_low_stock && b.is_low_stock) return 1;
                // Then expiring items
                if (a.is_expiring_soon && !b.is_expiring_soon) return -1;
                if (!a.is_expiring_soon && b.is_expiring_soon) return 1;
                // Then alphabetically
                return a.name.localeCompare(b.name);
            });
    }, [inventory, searchQuery, selectedCategory]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator color={THEME.primary} size="large" />
                <Text style={styles.loadingText}>Loading inventory...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.pageTitle}>Treatment Inventory</Text>
                    <Text style={styles.pageSubtitle}>Quick stock usage during procedures</Text>
                </View>
                <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
                    <Ionicons name="refresh" size={20} color={THEME.white} />
                </TouchableOpacity>
            </View>

            {/* Stats Cards */}
            <View style={styles.statsRow}>
                <View style={[styles.statCard, { backgroundColor: '#e0f2fe' }]}>
                    <Ionicons name="cube" size={24} color={THEME.accentBlue} />
                    <Text style={styles.statValue}>{summaryStats.totalItems}</Text>
                    <Text style={styles.statLabel}>Total Items</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#fef2f2' }]}>
                    <Ionicons name="alert-circle" size={24} color={THEME.danger} />
                    <Text style={[styles.statValue, { color: THEME.danger }]}>{summaryStats.lowStockCount}</Text>
                    <Text style={styles.statLabel}>Low Stock</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#fef3c7' }]}>
                    <Ionicons name="time" size={24} color="#f59e0b" />
                    <Text style={[styles.statValue, { color: '#f59e0b' }]}>{summaryStats.expiringCount}</Text>
                    <Text style={styles.statLabel}>Expiring Soon</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#f0fdf4' }]}>
                    <Ionicons name="checkmark-done" size={24} color={THEME.success} />
                    <Text style={[styles.statValue, { color: THEME.success }]}>{inventory.filter(i => i.quantity > 0).length}</Text>
                    <Text style={styles.statLabel}>In Stock</Text>
                </View>
            </View>

            <View style={styles.splitViewContainer}>
                {/* LEFT COLUMN: Usage Controls */}
                <View style={styles.columnLeft}>
                    {/* Search Bar */}
                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color={THEME.textLight} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search items..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor={THEME.textLight}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={20} color={THEME.textLight} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Category Filter */}
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        style={styles.categoryScroll}
                        contentContainerStyle={styles.categoryContainer}
                    >
                        {categories.map((cat) => (
                            <TouchableOpacity
                                key={cat}
                                style={[
                                    styles.categoryChip,
                                    selectedCategory === cat && styles.categoryChipActive
                                ]}
                                onPress={() => setSelectedCategory(cat)}
                            >
                                <Text style={[
                                    styles.categoryChipText,
                                    selectedCategory === cat && styles.categoryChipTextActive
                                ]}>{cat}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <SectionHeader icon="layers" title={`Inventory (${filteredInventory.length})`} color={THEME.primary} />
                    
                    <ScrollView 
                        style={styles.scrollArea}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[THEME.primary]} />
                        }
                    >
                        {filteredInventory.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="cube-outline" size={48} color={THEME.textLight} />
                                <Text style={styles.emptyText}>No items found</Text>
                            </View>
                        ) : (
                            filteredInventory.map((item) => (
                                <InventoryUsageItem 
                                    key={item.item_id} 
                                    item={item} 
                                    onUse={handleUseStock}
                                />
                            ))
                        )}
                    </ScrollView>
                </View>

                {/* RIGHT COLUMN: Quick Actions & Alerts */}
                <ScrollView 
                    style={styles.columnRight}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                >
                    {/* Quick Stats Summary */}
                    <SectionHeader icon="speedometer" title="Quick Summary" color={THEME.primary} />
                    <View style={styles.quickStatsRow}>
                        <View style={[styles.quickStatBox, { backgroundColor: '#eef2ff', borderColor: THEME.primary }]}>
                            <Ionicons name="cube" size={20} color={THEME.primary} />
                            <Text style={[styles.quickStatValue, { color: THEME.primary }]}>{summaryStats.totalItems}</Text>
                            <Text style={styles.quickStatLabel}>Total Items</Text>
                        </View>
                        <View style={[styles.quickStatBox, summaryStats.lowStockCount > 0 ? { backgroundColor: '#fef2f2', borderColor: THEME.danger } : {}]}>
                            <Ionicons name="alert-circle" size={20} color={summaryStats.lowStockCount > 0 ? THEME.danger : THEME.textLight} />
                            <Text style={[styles.quickStatValue, summaryStats.lowStockCount > 0 && { color: THEME.danger }]}>{summaryStats.lowStockCount}</Text>
                            <Text style={styles.quickStatLabel}>Low Stock</Text>
                        </View>
                        <View style={[styles.quickStatBox, summaryStats.expiringCount > 0 ? { backgroundColor: '#fffbeb', borderColor: '#f59e0b' } : {}]}>
                            <Ionicons name="time" size={20} color={summaryStats.expiringCount > 0 ? '#f59e0b' : THEME.textLight} />
                            <Text style={[styles.quickStatValue, summaryStats.expiringCount > 0 && { color: '#f59e0b' }]}>{summaryStats.expiringCount}</Text>
                            <Text style={styles.quickStatLabel}>Expiring</Text>
                        </View>
                    </View>

                    {/* Alerts Section */}
                    {(summaryStats.lowStockCount > 0 || summaryStats.expiringCount > 0) && (
                        <View style={styles.alertsCard}>
                            <View style={styles.alertsHeader}>
                                <Ionicons name="warning" size={18} color="#f59e0b" />
                                <Text style={styles.alertsTitle}>Attention Needed</Text>
                            </View>
                            
                            {inventory.filter(i => i.is_low_stock).slice(0, 3).map((item) => (
                                <View key={item.item_id} style={styles.alertRow}>
                                    <View style={[styles.alertDot, { backgroundColor: THEME.danger }]} />
                                    <View style={styles.alertInfo}>
                                        <Text style={styles.alertItemName} numberOfLines={1}>{item.name}</Text>
                                        <Text style={styles.alertItemDetail}>Only {item.quantity} {item.unit_display} left</Text>
                                    </View>
                                    <View style={styles.alertBadge}>
                                        <Text style={styles.alertBadgeText}>LOW</Text>
                                    </View>
                                </View>
                            ))}
                            
                            {inventory.filter(i => i.is_expiring_soon && !i.is_low_stock).slice(0, 2).map((item) => (
                                <View key={item.item_id} style={styles.alertRow}>
                                    <View style={[styles.alertDot, { backgroundColor: '#f59e0b' }]} />
                                    <View style={styles.alertInfo}>
                                        <Text style={styles.alertItemName} numberOfLines={1}>{item.name}</Text>
                                        <Text style={styles.alertItemDetail}>Expires: {item.expiry_date || 'Soon'}</Text>
                                    </View>
                                    <View style={[styles.alertBadge, { backgroundColor: '#fffbeb' }]}>
                                        <Text style={[styles.alertBadgeText, { color: '#f59e0b' }]}>EXP</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Frequently Used Items */}
                    <SectionHeader icon="flash" title="Quick Use Items" color={THEME.success} />
                    <View style={styles.quickUseSection}>
                        {inventory
                            .filter(i => i.quantity > 0 && !i.is_low_stock)
                            .slice(0, 4)
                            .map((item) => (
                                <TouchableOpacity 
                                    key={item.item_id} 
                                    style={styles.quickUseItem}
                                    onPress={() => handleUseStock(item.item_id, 1)}
                                >
                                    <View style={styles.quickUseIcon}>
                                        <Ionicons name="add-circle" size={24} color={THEME.success} />
                                    </View>
                                    <Text style={styles.quickUseName} numberOfLines={1}>{item.name}</Text>
                                    <Text style={styles.quickUseQty}>{item.quantity} left</Text>
                                </TouchableOpacity>
                            ))
                        }
                    </View>
                    
                    {/* Charts - Enhanced Analytics Section */}
                    <View style={styles.analyticsSection}>
                        <View style={styles.analyticsSectionHeader}>
                            <View style={styles.analyticsHeaderLeft}>
                                <Ionicons name="bar-chart" size={22} color={THEME.white} />
                                <Text style={styles.analyticsHeaderTitle}>Live Analytics</Text>
                            </View>
                            <View style={styles.analyticsBadge}>
                                <Ionicons name="pulse" size={12} color={THEME.success} />
                                <Text style={styles.analyticsBadgeText}>REAL-TIME</Text>
                            </View>
                        </View>
                        <InventoryCharts role="doctor" />
                    </View>

                    {/* Refresh Button */}
                    <TouchableOpacity 
                        style={styles.refreshBtn} 
                        onPress={onRefresh}
                    >
                        <Ionicons name="refresh" size={18} color={THEME.primary} />
                        <Text style={styles.refreshBtnText}>Refresh Data</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    // --- Main Layout ---
    container: {
        flex: 1,
        backgroundColor: THEME.bg,
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: THEME.bg,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: THEME.textLight,
    },
    
    // --- Header ---
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: THEME.secondary,
    },
    pageSubtitle: {
        fontSize: 14,
        color: THEME.textLight,
        marginTop: 2,
    },
    refreshBtn: {
        backgroundColor: THEME.primary,
        padding: 10,
        borderRadius: 10,
    },
    
    // --- Stats Row ---
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
        color: THEME.secondary,
        marginTop: 4,
    },
    statLabel: {
        fontSize: 11,
        color: THEME.textLight,
        marginTop: 2,
    },
    
    // --- Split View ---
    splitViewContainer: {
        flexDirection: 'row', 
        gap: 20,
        flex: 1,
    },
    columnLeft: {
        flex: 2,
        minWidth: 400,
    },
    columnRight: {
        flex: 1,
        minWidth: 300,
    },
    
    // --- Search & Filter ---
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.white,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 12,
        gap: 8,
        ...THEME.shadow,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: THEME.text,
    },
    categoryScroll: {
        maxHeight: 44,
        marginBottom: 12,
    },
    categoryContainer: {
        gap: 8,
    },
    categoryChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: THEME.white,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: THEME.border,
    },
    categoryChipActive: {
        backgroundColor: THEME.primary,
        borderColor: THEME.primary,
    },
    categoryChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: THEME.text,
    },
    categoryChipTextActive: {
        color: THEME.white,
    },
    
    scrollArea: {
        flex: 1,
    },

    // --- Section Header ---
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    
    // --- Item Card ---
    itemCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: THEME.white,
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: THEME.border,
        ...THEME.shadow,
    },
    itemCardLowStock: {
        borderColor: THEME.danger,
        borderWidth: 2,
        backgroundColor: '#fef2f2',
    },
    itemCardExpiring: {
        borderColor: '#f59e0b',
        borderWidth: 2,
    },
    itemInfo: {
        flex: 1,
        marginRight: 12,
    },
    itemNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    itemName: {
        fontSize: 15,
        fontWeight: '600',
        color: THEME.secondary,
        flex: 1,
    },
    sessionUsageBadge: {
        backgroundColor: THEME.primary,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    sessionUsageText: {
        fontSize: 11,
        fontWeight: '700',
        color: THEME.white,
    },
    itemDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        flexWrap: 'wrap',
    },
    itemDetailText: {
        fontSize: 12,
        color: THEME.textLight,
    },
    itemServiceTag: {
        fontSize: 12,
        color: THEME.accentBlue,
        marginLeft: 4,
    },
    badgeRow: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 6,
    },
    lowStockBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.danger,
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        gap: 3,
    },
    lowStockText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: THEME.white,
    },
    expiringBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f59e0b',
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        gap: 3,
    },
    expiringText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: THEME.white,
    },
    
    // --- Usage Controls ---
    usageControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    quantityDisplay: {
        alignItems: 'center',
        minWidth: 50,
    },
    quantityText: {
        fontSize: 20,
        fontWeight: '800',
    },
    unitText: {
        fontSize: 10,
        color: THEME.textLight,
    },
    qtySelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.bg,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: THEME.border,
    },
    qtyBtn: {
        padding: 8,
    },
    qtyValue: {
        fontSize: 14,
        fontWeight: '700',
        color: THEME.secondary,
        minWidth: 24,
        textAlign: 'center',
    },
    useBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.primary,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 8,
        gap: 4,
    },
    useBtnDisabled: {
        backgroundColor: THEME.textLight,
        opacity: 0.5,
    },
    useBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: THEME.white,
    },

    // --- Card & Log Styles ---
    card: {
        backgroundColor: THEME.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        ...THEME.shadow,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: THEME.secondary,
        marginBottom: 12,
    },
    logScroll: {
        maxHeight: 200,
    },
    logItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: THEME.border,
    },
    logItemInfo: {
        flex: 1,
    },
    logItemName: {
        fontSize: 13,
        fontWeight: '500',
        color: THEME.text,
    },
    logItemTime: {
        fontSize: 11,
        color: THEME.textLight,
        marginTop: 2,
    },
    logItemQty: {
        backgroundColor: '#fef2f2',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    logItemQtyText: {
        fontSize: 13,
        fontWeight: '700',
        color: THEME.danger,
    },
    emptyLog: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    emptyLogText: {
        fontSize: 13,
        color: THEME.textLight,
        marginTop: 8,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 14,
        color: THEME.textLight,
        marginTop: 12,
    },
    
    // --- Quick Stats Row ---
    quickStatsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    quickStatBox: {
        flex: 1,
        backgroundColor: THEME.white,
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: THEME.border,
        ...THEME.shadow,
    },
    quickStatValue: {
        fontSize: 22,
        fontWeight: '700',
        color: THEME.text,
        marginTop: 4,
    },
    quickStatLabel: {
        fontSize: 10,
        color: THEME.textLight,
        marginTop: 2,
        textTransform: 'uppercase',
    },
    
    // --- Alerts Card ---
    alertsCard: {
        backgroundColor: '#fffbeb',
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#fcd34d',
    },
    alertsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#fcd34d',
    },
    alertsTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#92400e',
    },
    alertRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        gap: 10,
    },
    alertDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    alertInfo: {
        flex: 1,
    },
    alertItemName: {
        fontSize: 13,
        fontWeight: '600',
        color: THEME.text,
    },
    alertItemDetail: {
        fontSize: 11,
        color: THEME.textLight,
        marginTop: 1,
    },
    alertBadge: {
        backgroundColor: '#fef2f2',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    alertBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: THEME.danger,
    },
    
    // --- Quick Use Section ---
    quickUseSection: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 16,
    },
    quickUseItem: {
        width: '48%',
        backgroundColor: THEME.white,
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d1fae5',
        ...THEME.shadow,
    },
    quickUseIcon: {
        marginBottom: 6,
    },
    quickUseName: {
        fontSize: 12,
        fontWeight: '600',
        color: THEME.text,
        textAlign: 'center',
        marginBottom: 2,
    },
    quickUseQty: {
        fontSize: 10,
        color: THEME.success,
        fontWeight: '500',
    },
    
    // --- Refresh Button ---
    refreshBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#eef2ff',
        borderWidth: 1,
        borderColor: THEME.primary,
        borderRadius: 10,
        padding: 12,
        marginTop: 10,
        marginBottom: 20,
        gap: 6,
    },
    refreshBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: THEME.primary,
    },
    
    // --- Analytics Section ---
    analyticsSection: {
        backgroundColor: THEME.white,
        borderRadius: 16,
        overflow: 'hidden',
        marginTop: 16,
        borderWidth: 2,
        borderColor: THEME.primary,
        ...THEME.shadow,
    },
    analyticsSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: THEME.primary,
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    analyticsHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    analyticsHeaderTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: THEME.white,
    },
    analyticsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    analyticsBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: THEME.white,
    },
});

export default DoctorInventory;