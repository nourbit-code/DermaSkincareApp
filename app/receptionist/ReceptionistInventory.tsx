import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import local components and the unified data/theme
import InventoryTable from '../../components/inventory/InventoryTable';
import {AddStockForm} from '../../components/inventory/AddStockForm';
import InventoryCharts from '../../components/inventory/InventoryCharts';
import { InventoryItem, StockFormData, THEME } from '../../types/InventoryTypes'; 

// --- Configuration ---
const { width } = Dimensions.get('window');
const BREAKPOINT = 1000; // Switch to single-column layout below 1000px width

// Typed Mock Data
const mockInventory: InventoryItem[] = [
    { id: 1, name: 'Hyaluronic Acid Serum', category: 'Filler', quantity: 25, unit: 'ml', supplier: 'Aesthetics Co', expiry: '2026-03-01', linkedService: 'Filler' },
    { id: 2, name: 'Numbing Cream A', category: 'Consumable', quantity: 8, unit: 'unit', supplier: 'PharmaSupply', expiry: '2025-12-31', linkedService: 'General' },
    { id: 3, name: 'Micro-Needle Cartridge', category: 'Tool', quantity: 150, unit: 'unit', supplier: 'ToolTech', expiry: 'N/A', linkedService: 'Microneedling' },
    { id: 4, name: 'Tretinoin Cream', category: 'Prescription', quantity: 12, unit: 'tube', supplier: 'Dermalogic', expiry: '2027-01-15', linkedService: 'General' },
];

const ReceptionistInventory = () => {
    const [inventory, setInventory] = useState<InventoryItem[]>(mockInventory);
    const [loading, setLoading] = useState<boolean>(false);
    const isSmallScreen = width < BREAKPOINT;

    // --- Simulated Data Fetching and Real-time Listener Setup ---
    useEffect(() => {
        setLoading(true);
        
        setTimeout(() => {
            setInventory(mockInventory); 
            setLoading(false);
        }, 500);

        const simulateUpdate = (updatedItem: { id: number, name: string, new_quantity: number }) => {
             setInventory(prev => prev.map(item =>
                 item.id === updatedItem.id ? { ...item, quantity: updatedItem.new_quantity } : item
             ));
        };

        const interval = setInterval(() => {
            const itemToUpdate = inventory.find(i => i.id === 3);
            if (itemToUpdate && itemToUpdate.quantity > 100) {
                 // Simulate a doctor using one cartridge
                 simulateUpdate({ id: 3, name: itemToUpdate.name, new_quantity: itemToUpdate.quantity - 1 });
            }
        }, 10000); 

        return () => {
             clearInterval(interval); 
        };
    }, []);

    const handleStockAdded = (newStockData: StockFormData) => {
        const existingItem = inventory.find(i => i.name === newStockData.itemName);
        
        if (existingItem) {
            const newQuantity = existingItem.quantity + parseInt(newStockData.quantity);
            setInventory(prev => prev.map(i => 
                i.name === newStockData.itemName ? { 
                    ...i, 
                    quantity: newQuantity, 
                    supplier: newStockData.supplier || i.supplier,
                    expiry: newStockData.expiryDate || i.expiry 
                } : i
            ));
        } else {
            setInventory(prev => [...prev, {
                id: Date.now(), 
                name: newStockData.itemName,
                category: newStockData.category,
                quantity: parseInt(newStockData.quantity),
                unit: newStockData.unit,
                supplier: newStockData.supplier,
                expiry: newStockData.expiryDate,
                linkedService: 'Unassigned' 
            }]);
        }
    };
    
    if (loading) {
        return <ActivityIndicator color={THEME.primary} size="large" style={styles.loading} />;
    }

    // Conditional Styles for layout change (using the adjusted column styles)
    const splitViewStyles = isSmallScreen ? styles.splitViewContainerSmall : styles.splitViewContainerAdjusted;
    const columnTableStyles = isSmallScreen ? styles.columnFullWidth : styles.columnTableAdjusted;
    const columnFormStyles = isSmallScreen ? styles.columnFullWidth : styles.columnFormAdjusted;

    return (
        <ScrollView style={styles.container}>
            <View style={styles.pageHeader}>
                <Text style={styles.pageTitle}>Stock & Inventory Management</Text>
                <Text style={styles.pageSubtitle}>Receptionist View: Add, Track, and Report Stock Levels</Text>
            </View>

            <View style={splitViewStyles}>
                
                {/* 1. Add Stock Form (Simplified Pink Card) */}
                <View style={[columnFormStyles, styles.simplifiedActionCard]}> 
                    <AddStockForm onStockAdded={handleStockAdded} />
                </View>
                
                {/* 2. Inventory Table (Detailed View) */}
                <View style={columnTableStyles}>
                    <View style={[styles.section, { padding: 0 }]}>
                        <View style={styles.tableHeaderSection}>
                            <Ionicons name="grid" size={20} color={THEME.secondary} />
                            <Text style={styles.tableTitle}>Current Inventory Details</Text>
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
    
    // --- 2. Split View (Large Screen - ADJUSTED RATIOS) ---
    splitViewContainerAdjusted: {
        flexDirection: 'row', 
        gap: 20,
        marginBottom: 20,
    },
    columnTableAdjusted: {
        flex: 2, // Takes 2/3 of the space
        minWidth: 600, 
    },
    columnFormAdjusted: {
        flex: 1, // Takes 1/3 of the space (SMALLER)
        minWidth: 350, 
    },
    
    // --- 2. Split View (Small Screen/Mobile Fallback) ---
    splitViewContainerSmall: {
        flexDirection: 'column',
        gap: 20,
        marginBottom: 20,
    },
    columnFullWidth: {
        flex: 1,
        minWidth: '100%',
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

    // --- 3a. Primary Action Card (MODIFIED: Simplified Pink Box) ---
    simplifiedActionCard: {
        //backgroundColor: THEME.primary, 
        padding: -50,
        borderRadius: THEME.radius,
        // Lifted shadow for importance
    
        // NOTE: The inner AddStockForm component must handle its own styling (e.g., ensuring text inputs are white/light).
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