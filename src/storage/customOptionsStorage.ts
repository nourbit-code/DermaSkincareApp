// Custom Options Storage - For persisting user-added dropdown options
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  CUSTOM_CATEGORIES: '@inventory_custom_categories',
  CUSTOM_UNITS: '@inventory_custom_units',
  CUSTOM_ITEM_NAMES: '@inventory_custom_item_names',
  CUSTOM_SUPPLIERS: '@inventory_custom_suppliers',
};

// Generic save function
async function saveOptions(key: string, options: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(options));
  } catch (error) {
    console.error(`Error saving options for ${key}:`, error);
  }
}

// Generic load function
async function loadOptions(key: string): Promise<string[]> {
  try {
    const stored = await AsyncStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error(`Error loading options for ${key}:`, error);
    return [];
  }
}

// --- Categories ---
export async function saveCustomCategories(categories: string[]): Promise<void> {
  return saveOptions(STORAGE_KEYS.CUSTOM_CATEGORIES, categories);
}

export async function loadCustomCategories(): Promise<string[]> {
  return loadOptions(STORAGE_KEYS.CUSTOM_CATEGORIES);
}

export async function addCustomCategory(category: string): Promise<string[]> {
  const existing = await loadCustomCategories();
  if (!existing.includes(category)) {
    const updated = [...existing, category];
    await saveCustomCategories(updated);
    return updated;
  }
  return existing;
}

// --- Units (stored as category:unit pairs) ---
export interface CustomUnits {
  [category: string]: string[];
}

export async function saveCustomUnits(units: CustomUnits): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_UNITS, JSON.stringify(units));
  } catch (error) {
    console.error('Error saving custom units:', error);
  }
}

export async function loadCustomUnits(): Promise<CustomUnits> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_UNITS);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error loading custom units:', error);
    return {};
  }
}

export async function addCustomUnit(category: string, unit: string): Promise<CustomUnits> {
  const existing = await loadCustomUnits();
  if (!existing[category]) {
    existing[category] = [];
  }
  if (!existing[category].includes(unit)) {
    existing[category].push(unit);
    await saveCustomUnits(existing);
  }
  return existing;
}

// --- Item Names ---
export async function saveCustomItemNames(items: string[]): Promise<void> {
  return saveOptions(STORAGE_KEYS.CUSTOM_ITEM_NAMES, items);
}

export async function loadCustomItemNames(): Promise<string[]> {
  return loadOptions(STORAGE_KEYS.CUSTOM_ITEM_NAMES);
}

export async function addCustomItemName(itemName: string): Promise<string[]> {
  const existing = await loadCustomItemNames();
  if (!existing.includes(itemName)) {
    const updated = [...existing, itemName];
    await saveCustomItemNames(updated);
    return updated;
  }
  return existing;
}

// --- Suppliers ---
export async function saveCustomSuppliers(suppliers: string[]): Promise<void> {
  return saveOptions(STORAGE_KEYS.CUSTOM_SUPPLIERS, suppliers);
}

export async function loadCustomSuppliers(): Promise<string[]> {
  return loadOptions(STORAGE_KEYS.CUSTOM_SUPPLIERS);
}

export async function addCustomSupplier(supplier: string): Promise<string[]> {
  const existing = await loadCustomSuppliers();
  if (!existing.includes(supplier)) {
    const updated = [...existing, supplier];
    await saveCustomSuppliers(updated);
    return updated;
  }
  return existing;
}

// --- Load All Custom Options at Once ---
export interface AllCustomOptions {
  categories: string[];
  units: CustomUnits;
  itemNames: string[];
  suppliers: string[];
}

export async function loadAllCustomOptions(): Promise<AllCustomOptions> {
  const [categories, units, itemNames, suppliers] = await Promise.all([
    loadCustomCategories(),
    loadCustomUnits(),
    loadCustomItemNames(),
    loadCustomSuppliers(),
  ]);
  
  return { categories, units, itemNames, suppliers };
}

// --- Clear All Custom Options (for testing/reset) ---
export async function clearAllCustomOptions(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.CUSTOM_CATEGORIES,
      STORAGE_KEYS.CUSTOM_UNITS,
      STORAGE_KEYS.CUSTOM_ITEM_NAMES,
      STORAGE_KEYS.CUSTOM_SUPPLIERS,
    ]);
  } catch (error) {
    console.error('Error clearing custom options:', error);
  }
}
