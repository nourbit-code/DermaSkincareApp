// Report API Service - Connect reports to backend
const API_URL = 'http://127.0.0.1:8000/api';

// Types
export interface ReportAnalytics {
  period: 'week' | 'month' | 'year';
  date_range: {
    start: string;
    end: string;
  };
  labels: string[];
  appointments: {
    data: number[];
    total: number;
    completed: number;
    cancelled: number;
    no_shows: number;
    completion_rate: number;
  };
  new_patients: {
    data: number[];
    total: number;
  };
  payments: {
    data: number[];
    total: number;
    by_method: Array<{
      payment_method: string;
      total: number;
      count: number;
    }>;
  };
  check_ins: {
    data: number[];
    total: number;
  };
}

export interface AppointmentsReport {
  period: string;
  labels: string[];
  data: number[];
  total: number;
  average_per_day: number;
  status_breakdown: Array<{ status: string; count: number }>;
  service_breakdown: Array<{ type: string; count: number }>;
  hourly_distribution: Array<{ hour: number; count: number }>;
  completed: number;
  no_shows: number;
}

export interface InventoryReportItem {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  reorder_level?: number;
  supplier?: string;
  expiry_date?: string;
  is_low_stock?: boolean;
  is_expiring_soon?: boolean;
}

export interface InventoryReport {
  summary: {
    total_items: number;
    total_quantity: number;
    low_stock_count: number;
    expiring_soon_count: number;
  };
  category_breakdown: Record<string, {
    count: number;
    quantity: number;
    items: InventoryReportItem[];
  }>;
  low_stock_items: InventoryReportItem[];
  expiring_soon_items: InventoryReportItem[];
  top_stocked_items: InventoryReportItem[];
  recent_transactions: Array<{
    id: number;
    item_name: string;
    type: string;
    quantity: number;
    date: string;
    performed_by: string;
  }>;
}

// API Functions

/**
 * Get comprehensive analytics for reports dashboard
 * @param period - 'week', 'month', or 'year'
 */
export async function getReportAnalytics(period: 'week' | 'month' | 'year' = 'week'): Promise<ReportAnalytics> {
  try {
    const response = await fetch(`${API_URL}/reports/analytics/?period=${period}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching report analytics:', error);
    throw error;
  }
}

/**
 * Get detailed appointments report
 * @param period - 'week', 'month', or 'year'
 * @param doctorId - Optional doctor ID to filter by
 */
export async function getAppointmentsReport(
  period: 'week' | 'month' | 'year' = 'week',
  doctorId?: number
): Promise<AppointmentsReport> {
  try {
    let url = `${API_URL}/reports/appointments/?period=${period}`;
    if (doctorId) {
      url += `&doctor_id=${doctorId}`;
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching appointments report:', error);
    throw error;
  }
}

/**
 * Get detailed inventory report
 */
export async function getInventoryReport(): Promise<InventoryReport> {
  try {
    const response = await fetch(`${API_URL}/reports/inventory/`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching inventory report:', error);
    throw error;
  }
}

/**
 * Get payments/invoices data for a period
 * @param period - 'week', 'month', or 'year'
 */
export async function getPaymentsReport(period: 'week' | 'month' | 'year' = 'week') {
  try {
    const analytics = await getReportAnalytics(period);
    return analytics.payments;
  } catch (error) {
    console.error('Error fetching payments report:', error);
    throw error;
  }
}

/**
 * Get new patients data for a period
 * @param period - 'week', 'month', or 'year'
 */
export async function getNewPatientsReport(period: 'week' | 'month' | 'year' = 'week') {
  try {
    const response = await fetch(`${API_URL}/reports/patients/?period=${period}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching new patients report:', error);
    throw error;
  }
}
