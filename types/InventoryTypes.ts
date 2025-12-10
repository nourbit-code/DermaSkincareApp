// --- InventoryTypes.ts ---

// --- Unified Theme Object ---
export const THEME = {
    primary: "#be185d", // Deep Pink / Magenta (main action color)
    primaryLight: "#fce7f3", 
    secondary: "#0f172a", 
    accentBlue: "#0284c7", 
    text: "#334155", 
    textLight: "#94a3b8", 
    bg: "#f1f5f9", 
    white: "#ffffff",
    border: "#e2e8f0", 
    success: "#10b981",
    danger: "#ef4444",
    radius: 12,
    shadow: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
};

// --- 1. Primary Model: InventoryItem (Master Stock List) ---
export interface InventoryItem {
    id: number;
    name: string;
    category: string;
    quantity: number; 
    unit: string; 
    supplier: string;
    expiry: string; 
    linkedService: string; 
}

// --- ENHANCED EXPORT: Defined Categories (Descriptive) ---
export const INVENTORY_CATEGORIES = [
    'Botulinum Toxin (Neurotoxin)', 
    'Hyaluronic Acid Filler',       
    'Biostimulatory Filler',        
    'Suture/Thread',
    'Consumable (Syringe/Needle)',  
    'Topical/Rx (Prescription)',    
    'Equipment/Tool',
    'Cleaning/Sterilization',       
] as const;

// --- ENHANCED EXPORT: Unit Mappings (For Dynamic Dropdown) ---
export const UNIT_MAPPINGS: Record<string, ReadonlyArray<string>> = {
    'Botulinum Toxin (Neurotoxin)': ['vial', 'unit'],
    'Hyaluronic Acid Filler': ['syringe', 'ml', 'box'],
    'Biostimulatory Filler': ['vial', 'ml', 'kit'],
    'Suture/Thread': ['packet', 'box', 'set'],
    'Consumable (Syringe/Needle)': ['unit', 'box', 'pack', 'ml'],
    'Topical/Rx (Prescription)': ['tube', 'bottle', 'jar', 'mg', 'ml'],
    'Equipment/Tool': ['item', 'unit'],
    'Cleaning/Sterilization': ['wipe', 'gallon', 'bottle'],
    'Other': ['unit', 'item'],
} as const;

// --- ENHANCED EXPORT: MASTER_ITEMS_CATALOG (Logical Mock Data) ---
export const MASTER_ITEMS_CATALOG: InventoryItem[] = [
    // --- Neurotoxins ---
    {
        id: 101,
        name: "Botox 100U Standard",
        category: "Botulinum Toxin (Neurotoxin)",
        quantity: 5, // Low stock simulation
        unit: "vial",
        supplier: "AbbVie",
        expiry: "2026-03-01", // Expiring soon
        linkedService: "Botox Treatment"
    },
    {
        id: 102,
        name: "Dysport 300U",
        category: "Botulinum Toxin (Neurotoxin)",
        quantity: 15,
        unit: "vial",
        supplier: "Galderma",
        expiry: "2026-09-10",
        linkedService: "Dysport Treatment"
    },
    {
        id: 103,
        name: "Xeomin 100U",
        category: "Botulinum Toxin (Neurotoxin)",
        quantity: 10,
        unit: "vial",
        supplier: "Merz",
        expiry: "2026-07-25",
        linkedService: "Xeomin Treatment"
    },

    // --- Fillers ---
    {
        id: 104,
        name: "Juvederm Voluma XC 1ml",
        category: "Hyaluronic Acid Filler",
        quantity: 28,
        unit: "syringe",
        supplier: "AbbVie",
        expiry: "2027-01-20",
        linkedService: "Cheek/Chin Filler"
    },
    {
        id: 105,
        name: "Restylane Kysse 1ml",
        category: "Hyaluronic Acid Filler",
        quantity: 18,
        unit: "syringe",
        supplier: "Galderma",
        expiry: "2026-01-28", // Expiring soonest
        linkedService: "Lip Filler"
    },
    {
        id: 106,
        name: "Sculptra 10ml Reconstituted",
        category: "Biostimulatory Filler",
        quantity: 6, 
        unit: "vial",
        supplier: "Galderma",
        expiry: "2026-08-01",
        linkedService: "Collagen Biostimulation"
    },
    
    // --- Consumables & Tools ---
    {
        id: 107,
        name: "BD Syringe 1cc Insulin",
        category: "Consumable (Syringe/Needle)",
        quantity: 250,
        unit: "unit",
        supplier: "Becton, Dickinson",
        expiry: "N/A", 
        linkedService: "Toxin Prep"
    },
    {
        id: 108,
        name: "PDO Thread Mono 29G (Pack of 20)",
        category: "Suture/Thread",
        quantity: 7, 
        unit: "packet",
        supplier: "SutureMaster",
        expiry: "2026-08-01",
        linkedService: "Thread Lift"
    },
    {
        id: 109,
        name: "Isopropyl Alcohol Wipes",
        category: "Cleaning/Sterilization",
        quantity: 15,
        unit: "box",
        supplier: "CleanPro",
        expiry: "2028-05-01",
        linkedService: "Prep"
    },
    // --- Expired Item for testing ---
    {
        id: 110,
        name: "Expired Lidocaine HCL 2% Vial",
        category: "Consumable (Syringe/Needle)",
        quantity: 2,
        unit: "vial",
        supplier: "PharmaSupply",
        expiry: "2025-01-01", // Already expired
        linkedService: "Anesthesia"
    }
];

// --- Unique Lists for Datalists (Recalculated from Master Catalog) ---
export const UNIQUE_ITEM_NAMES: ReadonlyArray<string> = [
    ...new Set(MASTER_ITEMS_CATALOG.map(item => item.name))
] as const;

export const UNIQUE_SUPPLIERS: ReadonlyArray<string> = [
    ...new Set(MASTER_ITEMS_CATALOG.map(item => item.supplier))
] as const;

// --- 2. Input Model: StockFormData (Used by Receptionist Form) ---
export interface StockFormData {
    itemName: string;
    category: string; 
    quantity: string; 
    unit: string;
    supplier: string;
    expiryDate: string; 
}

// --- 3. Component Props: Form/Table/Chart Props ---
export interface AddStockFormProps {
    onStockAdded: (newStockData: StockFormData) => void;
}

export interface InventoryTableProps {
    inventoryItems: InventoryItem[]; 
    onItemUse?: (itemId: number, amount: number) => void; 
    readOnly: boolean; 
    filter?: string;
}

export interface InventoryChartsProps {
    inventoryItems?: InventoryItem[]; 
    usageLogs?: InventoryUsageLog[]; 
    timePeriod?: 'Week' | 'Month' | 'Quarter'; 
    role: 'doctor' | 'receptionist' | 'admin'; 
}

// --- 4. Log Model: InventoryUsageLog ---
export interface InventoryUsageLog {
    logId: number;
    itemId: number;
    changeAmount: number; 
    actionType: 'USE' | 'UNDO' | 'ADD' | 'AUDIT';
    timestamp: number; 
    userId: string; 
    patientId?: string; 
}