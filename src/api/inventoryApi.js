import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

// ==================== INVENTORY API FUNCTIONS ====================

/**
 * Get all inventory items
 * @returns {Promise<Object>} List of inventory items
 */
export const getInventory = async () => {
  try {
    console.log('[InventoryAPI] Fetching all inventory items');
    const response = await axios.get(`${API_BASE_URL}/inventory/`);
    console.log('[InventoryAPI] Inventory response:', response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('[InventoryAPI] Error fetching inventory:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch inventory'
    };
  }
};

/**
 * Get a specific inventory item by ID
 * @param {number} itemId - The item ID
 * @returns {Promise<Object>} Inventory item data
 */
export const getInventoryItem = async (itemId) => {
  try {
    console.log('[InventoryAPI] Fetching inventory item:', itemId);
    const response = await axios.get(`${API_BASE_URL}/inventory/${itemId}/`);
    console.log('[InventoryAPI] Item response:', response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('[InventoryAPI] Error fetching item:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch inventory item'
    };
  }
};

/**
 * Create a new inventory item
 * @param {Object} itemData - Item data
 * @returns {Promise<Object>} Created item
 */
export const createInventoryItem = async (itemData) => {
  try {
    console.log('[InventoryAPI] Creating inventory item:', itemData);
    const response = await axios.post(`${API_BASE_URL}/inventory/`, itemData);
    console.log('[InventoryAPI] Create item response:', response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('[InventoryAPI] Error creating item:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to create inventory item'
    };
  }
};

/**
 * Update an inventory item
 * @param {number} itemId - The item ID
 * @param {Object} itemData - Updated item data
 * @returns {Promise<Object>} Updated item
 */
export const updateInventoryItem = async (itemId, itemData) => {
  try {
    console.log('[InventoryAPI] Updating inventory item:', itemId, itemData);
    const response = await axios.patch(`${API_BASE_URL}/inventory/${itemId}/`, itemData);
    console.log('[InventoryAPI] Update item response:', response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('[InventoryAPI] Error updating item:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to update inventory item'
    };
  }
};

/**
 * Delete an inventory item
 * @param {number} itemId - The item ID
 * @returns {Promise<Object>} Response
 */
export const deleteInventoryItem = async (itemId) => {
  try {
    console.log('[InventoryAPI] Deleting inventory item:', itemId);
    await axios.delete(`${API_BASE_URL}/inventory/${itemId}/`);
    console.log('[InventoryAPI] Item deleted successfully');
    return {
      success: true
    };
  } catch (error) {
    console.error('[InventoryAPI] Error deleting item:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to delete inventory item'
    };
  }
};

/**
 * Add stock to an existing item
 * @param {number} itemId - The item ID
 * @param {Object} stockData - Stock data (quantity, notes, performed_by, supplier, expiry_date)
 * @returns {Promise<Object>} Updated item
 */
export const addStock = async (itemId, stockData) => {
  try {
    console.log('[InventoryAPI] Adding stock to item:', itemId, stockData);
    const response = await axios.post(`${API_BASE_URL}/inventory/${itemId}/add_stock/`, stockData);
    console.log('[InventoryAPI] Add stock response:', response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('[InventoryAPI] Error adding stock:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to add stock'
    };
  }
};

/**
 * Use/deduct stock from an item
 * @param {number} itemId - The item ID
 * @param {Object} usageData - Usage data (quantity, notes, performed_by)
 * @returns {Promise<Object>} Updated item
 */
export const useStock = async (itemId, usageData) => {
  try {
    console.log('[InventoryAPI] Using stock from item:', itemId, usageData);
    const response = await axios.post(`${API_BASE_URL}/inventory/${itemId}/use_stock/`, usageData);
    console.log('[InventoryAPI] Use stock response:', response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('[InventoryAPI] Error using stock:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to use stock'
    };
  }
};

/**
 * Get low stock items
 * @returns {Promise<Object>} List of low stock items
 */
export const getLowStockItems = async () => {
  try {
    console.log('[InventoryAPI] Fetching low stock items');
    const response = await axios.get(`${API_BASE_URL}/inventory/low_stock/`);
    console.log('[InventoryAPI] Low stock response:', response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('[InventoryAPI] Error fetching low stock:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch low stock items'
    };
  }
};

/**
 * Get items expiring soon
 * @returns {Promise<Object>} List of expiring items
 */
export const getExpiringItems = async () => {
  try {
    console.log('[InventoryAPI] Fetching expiring items');
    const response = await axios.get(`${API_BASE_URL}/inventory/expiring_soon/`);
    console.log('[InventoryAPI] Expiring items response:', response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('[InventoryAPI] Error fetching expiring items:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch expiring items'
    };
  }
};

/**
 * Get inventory summary statistics
 * @returns {Promise<Object>} Summary data
 */
export const getInventorySummary = async () => {
  try {
    console.log('[InventoryAPI] Fetching inventory summary');
    const response = await axios.get(`${API_BASE_URL}/inventory/summary/`);
    console.log('[InventoryAPI] Summary response:', response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('[InventoryAPI] Error fetching summary:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch inventory summary'
    };
  }
};

/**
 * Get stock transactions
 * @param {number} itemId - Optional item ID to filter transactions
 * @returns {Promise<Object>} List of transactions
 */
export const getStockTransactions = async (itemId = null) => {
  try {
    console.log('[InventoryAPI] Fetching stock transactions');
    const url = itemId 
      ? `${API_BASE_URL}/stock-transactions/?item=${itemId}`
      : `${API_BASE_URL}/stock-transactions/`;
    const response = await axios.get(url);
    console.log('[InventoryAPI] Transactions response:', response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('[InventoryAPI] Error fetching transactions:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch transactions'
    };
  }
};
