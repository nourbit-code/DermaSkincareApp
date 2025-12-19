import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator, Dimensions, Platform, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import local components and the unified data/theme
import InventoryTable from '../../components/inventory/InventoryTable';
import {AddStockForm} from '../../components/inventory/AddStockForm';
import InventoryCharts from '../../components/inventory/InventoryCharts';
import { InventoryItem, StockFormData, THEME } from '../../types/InventoryTypes'; 

// Import API functions
import { 
    getInventory, 
    createInventoryItem, 
    addStock, 
    getInventorySummary 
} from '../../src/api/inventoryApi';

// --- Configuration ---
const { width } = Dimensions.get('window');
const BREAKPOINT = 1000; // Switch to single-column layout below 1000px width

// Category mapping from backend to frontend
const CATEGORY_MAP: Record<string, string> = {
    'neurotoxin': 'Botulinum Toxin (Neurotoxin)',
    'ha_filler': 'Hyaluronic Acid Filler',
    'bio_filler': 'Biostimulatory Filler',
    'suture': 'Suture/Thread',
    'consumable': 'Consumable (Syringe/Needle)',
    'prescription': 'Topical/Rx (Prescription)',
    'equipment': 'Equipment/Tool',
    'cleaning': 'Cleaning/Sterilization',
    'other': 'Other',
};

// Reverse category mapping (frontend to backend)
const CATEGORY_REVERSE_MAP: Record<string, string> = {
    'Botulinum Toxin (Neurotoxin)': 'neurotoxin',
    'Hyaluronic Acid Filler': 'ha_filler',
    'Biostimulatory Filler': 'bio_filler',
    'Suture/Thread': 'suture',
    'Consumable (Syringe/Needle)': 'consumable',
    'Topical/Rx (Prescription)': 'prescription',
    'Equipment/Tool': 'equipment',
    'Cleaning/Sterilization': 'cleaning',
    'Other': 'other',
    // Handle old category names
    'Filler': 'ha_filler',
    'Consumable': 'consumable',
    'Tool': 'equipment',
    'Prescription': 'prescription',
};

const ReceptionistInventory = () => {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [summary, setSummary] = useState<any>(null);
    const isSmallScreen = width < BREAKPOINT;

    // Transform backend data to frontend format
    const transformBackendItem = (item: any): InventoryItem => ({
        id: item.item_id,
        name: item.name,
        category: item.category_display || CATEGORY_MAP[item.category] || item.category,
        quantity: item.quantity,
        unit: item.unit,
        supplier: item.supplier || '',
        expiry: item.expiry_date || 'N/A',
        linkedService: item.linked_service || 'Unassigned',
    });

    // Load data from API
    const loadData = async () => {
        try {
            console.log('[ReceptionistInventory] Loading inventory data...');
            
            // Fetch inventory items
            const inventoryResult = await getInventory();
            if (inventoryResult.success && inventoryResult.data) {
                console.log('[ReceptionistInventory] Inventory loaded:', inventoryResult.data.length, 'items');
                const transformedItems = inventoryResult.data.map(transformBackendItem);
                setInventory(transformedItems);
            } else {
                console.error('[ReceptionistInventory] Failed to load inventory:', inventoryResult.error);
            }
            
            // Fetch summary
            const summaryResult = await getInventorySummary();
            if (summaryResult.success && summaryResult.data) {
                console.log('[ReceptionistInventory] Summary loaded:', summaryResult.data);
                setSummary(summaryResult.data);
            }
            
        } catch (error) {
            console.error('[ReceptionistInventory] Error loading data:', error);
            Alert.alert('Error', 'Failed to load inventory data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadData();
    }, []);

    const handleStockAdded = async (newStockData: StockFormData) => {
        try {
            console.log('[ReceptionistInventory] Adding stock:', newStockData);
            
            // Check if item exists in current inventory
            const existingItem = inventory.find(i => 
                i.name.toLowerCase() === newStockData.itemName.toLowerCase()
            );
            
            if (existingItem) {
                // Add stock to existing item
                const result = await addStock(existingItem.id, {
                    quantity: parseInt(newStockData.quantity),
                    supplier: newStockData.supplier,
                    expiry_date: newStockData.expiryDate || null,
                    notes: `Stock added via receptionist inventory`,
                    performed_by: 'Receptionist',
                });
                
                if (result.success) {
                    Alert.alert('Success', `Added ${newStockData.quantity} ${newStockData.unit} to ${newStockData.itemName}`);
                    loadData(); // Refresh data
                } else {
                    Alert.alert('Error', result.error || 'Failed to add stock');
                }
            } else {
                // Create new inventory item
                const categoryKey = CATEGORY_REVERSE_MAP[newStockData.category] || 'other';
                
                const result = await createInventoryItem({
                    name: newStockData.itemName,
                    category: categoryKey,
                    quantity: parseInt(newStockData.quantity),
                    unit: newStockData.unit.toLowerCase(),
                    supplier: newStockData.supplier || '',
                    expiry_date: newStockData.expiryDate || null,
                    linked_service: 'Unassigned',
                    min_stock_level: 5,
                    cost_per_unit: 0,
                });
                
                if (result.success) {
                    Alert.alert('Success', `Created new item: ${newStockData.itemName}`);
                    loadData(); // Refresh data
                } else {
                    Alert.alert('Error', result.error || 'Failed to create item');
                }
            }
        } catch (error) {
            console.error('[ReceptionistInventory] Error adding stock:', error);
            Alert.alert('Error', 'Failed to add stock. Please try again.');
        }
    };
    
    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator color={THEME.primary} size="large" />
                <Text style={{ marginTop: 10, color: THEME.textLight }}>Loading inventory...</Text>
            </View>
        );
    }

// Layout - side by side on large screens

    return (
        <ScrollView 
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[THEME.primary]} />
            }
        >
            <View style={styles.pageHeader}>
                <Text style={styles.pageTitle}>Stock & Inventory Management</Text>
                <Text style={styles.pageSubtitle}>Receptionist View: Add, Track, and Report Stock Levels</Text>
                {summary && (
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryText}>
                            Total Items: {summary.total_items} | Total Quantity: {summary.total_quantity} | 
                            Low Stock: {summary.low_stock_count} | Expiring Soon: {summary.expiring_soon_count}
                        </Text>
                    </View>
                )}
            </View>

            {/* Side by Side Layout: Form on left, Table on right */}
            <View style={styles.splitContainer}>
                {/* 1. Add Stock Form (Left Side) */}
                <View style={styles.formColumn}>
                    <AddStockForm onStockAdded={handleStockAdded} />
                </View>

                {/* 2. Inventory Table (Right Side) */}
                <View style={styles.tableColumn}>
                    <View style={[styles.section, { padding: 0, marginBottom: 0 }]}>
                        <View style={styles.tableHeaderSection}>
                            <Ionicons name="grid" size={20} color={THEME.secondary} />
                            <Text style={styles.tableTitle}>Current Inventory Details</Text>
                            <Text style={styles.itemCount}>({inventory.length} items)</Text>
                        </View>
                        <InventoryTable inventoryItems={inventory} readOnly={true} />
                    </View>
                </View>
            </View>

            {/* 3. Reports / Analytics */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="analytics" size={20} color={THEME.primary} />
                    <Text style={styles.sectionTitle}>Stock Analytics & Reports</Text>
                </View>
                
                <InventoryCharts inventoryItems={inventory} role="receptionist" />
                
                
            </View>
            
            <View style={{ height: 50 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    // --- 1. Main Layout & Structure ---
    container: {
        flex: 1,
        backgroundColor: THEME.bg, 
        padding: 20,
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: THEME.white,
    },
    pageHeader: {
        marginBottom: 25,
        borderBottomWidth: 1,
        borderBottomColor: THEME.border,
        paddingBottom: 10,
    },
    pageTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: THEME.primary,
    },
    pageSubtitle: {
        fontSize: 14,
        color: THEME.textLight,
        fontWeight: '500',
    },
    
// --- 2. Split Container (Side by Side) ---
    splitContainer: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 25,
    },
    formColumn: {
        flex: 1,
        minWidth: 350,
        maxWidth: 450,
    },
    tableColumn: {
        flex: 2,
        minWidth: 500,
    },

    // --- 3. Card Base Style ---
    section: {
        backgroundColor: THEME.white,
        borderRadius: THEME.radius,
        padding: 20,
        marginBottom: 20,
        ...Platform.select({
            ios: { shadowColor: THEME.secondary, shadowOpacity: 0.1, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10 },
            android: { elevation: 5 }
        }),
        borderWidth: 1,
        borderColor: THEME.border,
    },

    // --- 3b. Inventory Table Card Appearance ---
    tableHeaderSection: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: THEME.border,
        backgroundColor: THEME.white, 
        borderTopLeftRadius: THEME.radius,
        borderTopRightRadius: THEME.radius,
    },
    tableTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: THEME.secondary,
        marginLeft: 8,
    },    itemCount: {
        fontSize: 14,
        color: THEME.textLight,
        marginLeft: 8,
    },
    summaryRow: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: THEME.border,
    },
    summaryText: {
        fontSize: 13,
        color: THEME.textLight,
    },
    // --- 4. Section Headers (Standard) ---
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: THEME.primary,
        marginLeft: 8,
    },

    // --- 5. Report Button (REMOVED) ---
});

export default ReceptionistInventory;