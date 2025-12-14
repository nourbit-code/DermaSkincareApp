import React, { useEffect, useState, useMemo } from "react";
import {
    View,
    ScrollView,
    TouchableOpacity,
    Text,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import InventoryCharts from '../../components/inventory/InventoryCharts';
// Import types and THEME from the unified file
import { InventoryItem, THEME } from '../../types/InventoryTypes'; 

// Typed Mock Data (Note: Added all required fields from InventoryItem)
const mockInventory: InventoryItem[] = [
    { id: 101, name: 'Botox Vial (100u)', category: 'Injection', quantity: 8, unit: 'vial', linkedService: 'Botox', supplier: 'A', expiry: 'N/A' },
    { id: 102, name: 'HA Filler (1ml)', category: 'Injection', quantity: 45, unit: 'ml', linkedService: 'Filler', supplier: 'B', expiry: 'N/A' },
    { id: 103, name: 'Lidocaine 2%', category: 'Consumable', quantity: 22, unit: 'ml', linkedService: 'General', supplier: 'C', expiry: 'N/A' },
    { id: 104, name: 'Micro-Needle Tip', category: 'Tool', quantity: 9, unit: 'unit', linkedService: 'Microneedling', supplier: 'D', expiry: 'N/A' },
    { id: 105, name: 'Saline Solution', category: 'Consumable', quantity: 15, unit: 'bottle', linkedService: 'General', supplier: 'E', expiry: 'N/A' },
    { id: 106, name: 'Chemical Peel Solution (AHA)', category: 'Peel', quantity: 12, unit: 'ml', linkedService: 'Peel', supplier: 'F', expiry: 'N/A' },
];

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

// --- Inventory Item Card (Core Component) ---
interface InventoryUsageItemProps {
    item: InventoryItem;
    onUse: (id: number) => void;
    onUndo: (id: number) => void;
}
const InventoryUsageItem = ({ item, onUse, onUndo }: InventoryUsageItemProps) => {
    const isLowStock = item.quantity < LOW_STOCK_THRESHOLD;

    return (
        <View style={[styles.itemCard, isLowStock && { borderColor: THEME.danger, borderWidth: 1.5 }]}>
            <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <View style={styles.itemDetails}>
                    <Text style={styles.itemDetailText}>{item.category} • {item.linkedService}</Text>
                    {isLowStock && (
                        <View style={styles.lowStockBadge}>
                            <Ionicons name="alert-circle" size={12} color={THEME.white} />
                            <Text style={styles.lowStockText}>LOW</Text>
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.usageControls}>
                {/* Conditionally style Undo button based on usage log */}
                <TouchableOpacity 
                    style={[styles.actionBtn, styles.undoBtn]} 
                    onPress={() => onUndo(item.id)}
                >
                    <Text style={styles.undoText}>Undo</Text>
                </TouchableOpacity>

                <View style={styles.quantityDisplay}>
                    <Text style={[styles.quantityText, { color: isLowStock ? THEME.danger : THEME.secondary }]}>
                        {item.quantity} {item.unit}
                    </Text>
                </View>

                {/* The USE button (minus icon) */}
                <TouchableOpacity 
                    style={[styles.actionBtn, styles.useBtn]} 
                    onPress={() => onUse(item.id)}
                    disabled={item.quantity <= 0}
                >
                    <Ionicons name="remove" size={20} color={THEME.white} />
                </TouchableOpacity>
            </View>
        </View>
    );
}


const DoctorInventory = () => {
    // Correctly typed state variables
    const [inventory, setInventory] = useState<InventoryItem[]>(mockInventory);
    const [loading, setLoading] = useState<boolean>(false);
    
    // Tracks the most recent usage (map of Item ID to usage count)
    const [usageLog, setUsageLog] = useState<Record<number, number>>({}); 

    // --- Simulated Data Fetching and Listener ---
    useEffect(() => {
        setLoading(true);
        setTimeout(() => {
            setInventory(mockInventory);
            setLoading(false);
        }, 800);
    }, []);

    // --- Usage Logic (Simulates decrementing stock and logging usage) ---
    const useStock = async (itemId: number) => {
        const item = inventory.find(i => i.id === itemId);
        if (!item || item.quantity <= 0) {
            Alert.alert("Error", `${item?.name || 'Item'} is out of stock.`);
            return;
        }

        const newQuantity = item.quantity - 1;
        setInventory(prev => prev.map(i => i.id === itemId ? { ...i, quantity: newQuantity } : i));
        
        // Log the usage for undo functionality
        setUsageLog(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));

        console.log(`DOCTOR USED 1 UNIT OF ITEM ID: ${itemId}`);
        // In a real app, this would be an API call (POST /inventory/use, creating a UsageLog entry)
    };

    // --- Undo Logic (Simulates reversing the last usage) ---
    const undoStock = async (itemId: number) => {
        const usageCount = usageLog[itemId] || 0;
        if (usageCount === 0) {
            Alert.alert("Error", "No recent usage recorded to undo for this item.");
            return;
        }

        const item = inventory.find(i => i.id === itemId);
        
        // Restore quantity
        const newQuantity = (item?.quantity || 0) + 1;
        
        setInventory(prev => prev.map(i => i.id === itemId ? { ...i, quantity: newQuantity } : i));

        // Decrement log count
        setUsageLog(prev => ({ ...prev, [itemId]: usageCount - 1 }));

        console.log(`DOCTOR UNDO: Restored 1 unit of ITEM ID: ${itemId}`);
        // In a real app, this would be an API call (POST /inventory/undo, flagging a UsageLog entry)
    };
    
    // Sorts low stock items to the top for quick access
    const sortedInventory = useMemo(() => {
        return [...inventory].sort((a, b) => {
            const aLow = a.quantity < LOW_STOCK_THRESHOLD;
            const bLow = b.quantity < LOW_STOCK_THRESHOLD;
            if (aLow && !bLow) return -1;
            if (!aLow && bLow) return 1;
            return a.name.localeCompare(b.name);
        });
    }, [inventory]);


    if (loading) return <ActivityIndicator color={THEME.primary} size="large" style={styles.loading} />;

    return (
        <View style={styles.container}>
            <Text style={styles.pageTitle}> Treatment Inventory Panel</Text>

            <View style={styles.splitViewContainer}>
                {/* LEFT COLUMN: Usage Controls */}
                <View style={styles.columnLeft}>
                    <SectionHeader icon="layers" title="Quick Stock Usage" color={THEME.primary} />
                    
                    <ScrollView style={styles.scrollArea}>
                        {sortedInventory.map((item) => (
                            <InventoryUsageItem 
                                key={item.id} 
                                item={item} 
                                onUse={useStock} 
                                onUndo={undoStock}
                            />
                        ))}
                    </ScrollView>
                </View>

                {/* RIGHT COLUMN: Analytics and Reporting */}
                <View style={styles.columnRight}>
                    <SectionHeader icon="analytics" title="Doctor Usage Analytics" color={THEME.accentBlue} />
                    
                    <View style={styles.card}>
                        <Text style={styles.analyticTextBold}>Items Used in This Session:</Text>
                        {Object.keys(usageLog).filter(id => usageLog[Number(id)] > 0).length > 0 ? (
                            Object.keys(usageLog)
                                .filter(id => usageLog[Number(id)] > 0)
                                .map(id => {
                                    const item = inventory.find(i => i.id === Number(id));
                                    return (
                                        <Text key={id} style={styles.analyticItem}>
                                            • {item?.name}: {usageLog[Number(id)]} unit(s)
                                        </Text>
                                    );
                                })
                        ) : (
                            <Text style={styles.analyticItem}>No items used yet.</Text>
                        )}
                    </View>
                    
                    <InventoryCharts role="doctor" />

                    <TouchableOpacity style={styles.reportBtn} onPress={() => Alert.alert("Report", "Fetching personal usage graph...")}>
                        <Ionicons name="stats-chart" size={18} color={THEME.white} />
                        <Text style={styles.reportBtnText}>View Usage Report</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
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
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: THEME.secondary,
        marginBottom: 15,
    },
    splitViewContainer: {
        flexDirection: 'row', 
        gap: 20,
        flex: 1,
    },
    columnLeft: {
        flex: 2, // Quick usage panel takes more space
        minWidth: 400,
        height: '100%',
    },
    columnRight: {
        flex: 1, // Analytics panel
        minWidth: 300,
    },
    scrollArea: {
        flex: 1,
        paddingRight: 10,
    },

    // --- 2. Shared Card Styles ---
    card: {
        backgroundColor: THEME.white,
        borderRadius: THEME.radius,
        padding: 15,
        marginBottom: 20,
        ...THEME.shadow,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 8,
    },
    
    // --- 3. Inventory Item Card Styles (Fixing the layout issue) ---
    itemCard: {
        flexDirection: 'row', // KEY FIX: Ensures horizontal layout
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: THEME.white,
        borderRadius: THEME.radius / 2,
        padding: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: THEME.border,
        elevation: 1,
    },
    itemInfo: {
        flex: 1, // Allows item info to take up remaining space
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        color: THEME.secondary,
    },
    itemDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    itemDetailText: {
        fontSize: 12,
        color: THEME.textLight,
        marginRight: 10,
    },
    lowStockBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.danger,
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    lowStockText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: THEME.white,
        marginLeft: 3,
    },
    
    // --- 4. Usage Controls (Buttons and Quantity) ---
    usageControls: {
        flexDirection: 'row', // KEY FIX: Ensures buttons and quantity are in a row
        alignItems: 'center',
        gap: 8, // Space between elements
        minWidth: 160,
        justifyContent: 'flex-end',
    },
    actionBtn: {
        height: 36,
        width: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    useBtn: {
        backgroundColor: THEME.primary,
    },
    undoBtn: {
        backgroundColor: THEME.border,
        paddingHorizontal: 10,
        width: 'auto',
    },
    undoText: {
        color: THEME.text,
        fontSize: 12,
        fontWeight: '600',
    },
    quantityDisplay: {
        minWidth: 50,
        alignItems: 'flex-end',
    },
    quantityText: {
        fontSize: 16,
        fontWeight: '700',
    },

    // --- 5. Analytics & Reports Styles ---
    analyticTextBold: {
        fontSize: 16,
        fontWeight: '600',
        color: THEME.secondary,
        marginBottom: 8,
    },
    analyticItem: {
        fontSize: 14,
        color: THEME.text,
        marginLeft: 5,
        marginBottom: 3,
    },
    reportBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: THEME.accentBlue,
        borderRadius: THEME.radius,
        padding: 12,
        marginTop: 10,
    },
    reportBtnText: {
        color: THEME.white,
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 10,
    },
});

export default DoctorInventory;