import { Feather, Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Patient, PatientsContext } from "../context/PatientContext";
import { 
  getInvoices, 
  createInvoice, 
  updateInvoice, 
  getPatients as fetchPatients,
  getServices as fetchServices
} from "../../src/api/receptionistApi";

// --- Custom Types ---

// **FIX:** Define EnhancedPatient to include 'id' (assuming 'Patient' from context is missing it)
// NOTE: You should ideally fix the Patient type definition in your actual PatientContext.ts file.
interface EnhancedPatient extends Patient {
    id: number;
}

type ServiceItem = {
  id: number;
  description: string;
  qty: number;
  unitPrice: number;
}

type PaymentStatus = 'Paid' | 'Not Paid' | 'Canceled';
type PaymentMethod = 'Cash' | 'Visa' | 'InstaPay' | 'E-Wallet';

type InvoiceItem = {
    invoiceId: string;
    backendId?: number;  // Backend invoice_id for API calls
    patientId: number;
    patientName: string;
    date: string;
    totalAmount: number;
    status: PaymentStatus;
    method: PaymentMethod;
    services: ServiceItem[];
    discountAmount: number;
    // ADDED FOR INSURANCE:
    insuranceProvider?: string | null;
    insuranceCoverage?: number; // percent
    insuranceAmount?: number; // LE amount covered by insurance
    patientPays?: number; // final patient responsibility after insurance
  // Snapshot of patient details at time of invoice creation
  patientSnapshot?: {
    id?: number;
    name?: string;
    phone?: string;
    age?: number;
    gender?: string;
  };
};

// --- Color Palette (Consistent Theme) ---
const PRIMARY_DARK = '#9B084D';
const PRIMARY_LIGHT = '#E80A7A';
const WHITE = '#FFFFFF';
const GRAY_BG = '#F7F7F7';
const BORDER_LIGHT = '#E0E0E0';
const TEXT_DARK = '#333333';
const TEXT_MEDIUM = '#666666';
const SUCCESS_COLOR = '#0A7A3F';
const ERROR_COLOR = '#DC3545';
const WARNING_COLOR = '#F39C12'; // For Canceled status

// --- Service Categories (can be loaded from backend later) ---
const serviceCategories = [
    { name: "Laser", price: 450 },
    { name: "Beauty", price: 300 },
    { name: "Diagnosis", price: 150 },
];

const defaultNewServices: ServiceItem[] = [];

// --- COMPONENT START ---

export default function Payments() {
  const { patients: contextPatients } = useContext(PatientsContext);
  const [search, setSearch] = useState("");
  // Use EnhancedPatient in state
  const [selectedPatient, setSelectedPatient] = useState<EnhancedPatient | null>(null);
  
  // Invoice State
  const [currentInvoiceId, setCurrentInvoiceId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("Not Paid");
  const [discountAmount, setDiscountAmount] = useState<string>("0");
  const [services, setServices] = useState<ServiceItem[]>(defaultNewServices);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedServiceNames, setSelectedServiceNames] = useState<Set<string>>(new Set(["Laser"]));
  
  // ADDED FOR INSURANCE:
  const [insuranceProvider, setInsuranceProvider] = useState<string>(''); // empty = none
  const [insuranceCoverage, setInsuranceCoverage] = useState<string>("0"); // percent as string for TextInput
  // Snapshot to preserve patient personal data while editing an invoice
  const [originalPatientSnapshot, setOriginalPatientSnapshot] = useState<Partial<EnhancedPatient> | null>(null);
  // Modal for Print/Download export options
  const [showExportModal, setShowExportModal] = useState(false);
  // Modal for invoice preview before printing
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  // Modal for invoice preview before downloading
  const [showDownloadPreview, setShowDownloadPreview] = useState(false);

  const isPatientSelected = !!selectedPatient;
  const isEditingExisting = currentInvoiceId !== null;

  // --- API Data & Loading States ---
  const [historySearch, setHistorySearch] = useState('');
  const [invoiceHistory, setInvoiceHistory] = useState<InvoiceItem[]>([]); 
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [patients, setPatients] = useState<EnhancedPatient[]>([]);
  const [backendServices, setBackendServices] = useState<any[]>([]);
  
  // --- Load data from API ---
  const loadData = async () => {
    try {
      console.log('[Payments] Loading data from API...');
      
      // Load invoices
      const invoicesResult = await getInvoices();
      if (invoicesResult.success && invoicesResult.data) {
        console.log('[Payments] Invoices loaded:', invoicesResult.data);
        // Transform backend invoice data to frontend format
        const transformedInvoices: InvoiceItem[] = invoicesResult.data.map((inv: any) => ({
          invoiceId: `INV-${String(inv.invoice_id).padStart(5, '0')}`,
          backendId: inv.invoice_id,
          patientId: inv.patient,
          patientName: inv.patient_name || 'Unknown',
          date: new Date(inv.invoice_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }),
          totalAmount: parseFloat(inv.total_amount) || 0,
          status: mapPaymentStatus(inv.payment_status),
          method: mapPaymentMethod(inv.payment_method),
          services: (inv.items || []).map((item: any, idx: number) => ({
            id: item.item_id || idx + 1,
            description: item.description,
            qty: item.quantity,
            unitPrice: parseFloat(item.unit_price) || 0,
          })),
          discountAmount: parseFloat(inv.discount_amount) || 0,
          insuranceProvider: inv.insurance_provider || null,
          insuranceCoverage: parseFloat(inv.insurance_coverage) || 0,
          insuranceAmount: parseFloat(inv.insurance_amount) || 0,
          patientPays: parseFloat(inv.total_amount) || 0,
          patientSnapshot: {
            id: inv.patient,
            name: inv.patient_name,
            phone: inv.patient_phone,
            age: inv.patient_age,
            gender: inv.patient_gender,
          },
        }));
        setInvoiceHistory(transformedInvoices);
      }
      
      // Load patients
      const patientsResult = await fetchPatients();
      if (patientsResult.success && patientsResult.data) {
        console.log('[Payments] Patients loaded:', patientsResult.data.length);
        const transformedPatients = patientsResult.data.map((p: any) => ({
          id: p.patient_id,
          name: p.name,
          phone: p.phone || '',
          age: p.age || 0,
          gender: p.gender || '',
        }));
        setPatients(transformedPatients);
      }
      
      // Load services
      const servicesResult = await fetchServices();
      if (servicesResult.success && servicesResult.data) {
        console.log('[Payments] Services loaded:', servicesResult.data);
        setBackendServices(servicesResult.data);
      }
      
    } catch (error) {
      console.error('[Payments] Error loading data:', error);
      Alert.alert('Error', 'Failed to load payment data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Helper functions to map backend values to frontend
  const mapPaymentStatus = (status: string): PaymentStatus => {
    const map: Record<string, PaymentStatus> = {
      'not_paid': 'Not Paid',
      'paid': 'Paid',
      'canceled': 'Canceled',
    };
    return map[status] || 'Not Paid';
  };
  
  const mapPaymentStatusToBackend = (status: PaymentStatus): string => {
    const map: Record<PaymentStatus, string> = {
      'Not Paid': 'not_paid',
      'Paid': 'paid',
      'Canceled': 'canceled',
    };
    return map[status] || 'not_paid';
  };
  
  const mapPaymentMethod = (method: string): PaymentMethod => {
    const map: Record<string, PaymentMethod> = {
      'cash': 'Cash',
      'visa': 'Visa',
      'instapay': 'InstaPay',
      'ewallet': 'E-Wallet',
      'card': 'Visa',
    };
    return map[method] || 'Cash';
  };
  
  const mapPaymentMethodToBackend = (method: PaymentMethod): string => {
    const map: Record<PaymentMethod, string> = {
      'Cash': 'cash',
      'Visa': 'visa',
      'InstaPay': 'instapay',
      'E-Wallet': 'ewallet',
    };
    return map[method] || 'cash';
  };
  
  useEffect(() => {
    loadData();
  }, []);
  
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []); 
  
  const filteredHistory = useMemo(() => {
    if (!historySearch) return invoiceHistory;
    const lowerSearch = historySearch.toLowerCase();
    return invoiceHistory.filter(inv => 
        inv.invoiceId.toLowerCase().includes(lowerSearch) ||
        inv.patientName.toLowerCase().includes(lowerSearch)
    );
  }, [historySearch, invoiceHistory]);


  // --- CALCULATIONS ---
  const subtotal = useMemo(() => 
    services.reduce((sum, item) => sum + item.qty * item.unitPrice, 0),
    [services]
  );
  
  const numericDiscount = parseFloat(discountAmount) || 0;

  // ADDED FOR INSURANCE: compute insurance percentage, amount and final total
  const insurancePercent = parseFloat(insuranceCoverage) || 0;
  const insuranceAmount = Math.max(0, ((subtotal - numericDiscount) * (insurancePercent / 100)));
  const finalTotal = Math.max(0, subtotal - numericDiscount - insuranceAmount);

  // OLD name `total` replaced by `finalTotal` to reflect insurance deductions where used.
  const total = finalTotal; // keep `total` alias for places that reference it

  // --- Filtering Logic for NEW INVOICE ---
  const filteredPatients = useMemo(() => {
    if (!search) return [];
    // Casting assumed for 'Patient' type definition outside this component
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.phone.includes(search)
    ) as EnhancedPatient[]; 
  }, [patients, search]);

  // --- HANDLERS ---

  const handleReset = () => {
    Alert.alert(
        "Start New Invoice",
        "This will clear the current invoice details. Are you sure?",
        [
            { text: "Cancel", style: "cancel" },
            { 
                text: "Confirm", 
                onPress: () => {
                    setSearch("");
                    setSelectedPatient(null);
                    setCurrentInvoiceId(null);
                    setServices(defaultNewServices);
                    setPaymentStatus("Not Paid");
                    setPaymentMethod("Cash");
                    setDiscountAmount("0");
                    // ADDED FOR INSURANCE:
                    setInsuranceProvider('');
                    setInsuranceCoverage("0");
                  // Clear any preserved snapshot
                  setOriginalPatientSnapshot(null);
                    Alert.alert("Reset Complete", "You are now ready to search for a patient to create a new invoice.");
                }
            }
        ]
    );
  };

  // Handler now expects EnhancedPatient
  const handleSelectPatient = (patient: EnhancedPatient) => {
    setSelectedPatient(patient);
    setCurrentInvoiceId(null);
    setPaymentStatus("Not Paid");
    setPaymentMethod("Cash");
    setServices(defaultNewServices);
    setDiscountAmount("0");
    // ADDED FOR INSURANCE:
    setInsuranceProvider('');
    setInsuranceCoverage("0");
    setSearch(""); 
    // New invoice selection, clear any previous snapshot
    setOriginalPatientSnapshot(null);
  };
  
  // #5: Eye Icon Handler (Load Existing Invoice for Edit)
  const handleLoadInvoiceForEdit = (invoice: InvoiceItem) => {
    // Find patient from loaded patients
    const patientDetails = patients.find(p => p.id === invoice.patientId);
    
    // Build a patient snapshot to preserve personal data while editing
    let snapshot: Partial<EnhancedPatient> | null = null;
    if (invoice.patientSnapshot) {
      snapshot = { ...invoice.patientSnapshot };
    } else if (patientDetails) {
      snapshot = {
        id: patientDetails.id,
        name: invoice.patientName || patientDetails.name,
        phone: patientDetails.phone ?? '',
        age: patientDetails.age ?? 0,
        gender: patientDetails.gender ?? '',
      };
    } else {
      snapshot = { id: invoice.patientId, name: invoice.patientName, phone: '', age: 0, gender: '' };
    }

    // Load all invoice data into the form - create a copy of services to avoid reference issues
    setSelectedPatient(snapshot as EnhancedPatient);
    setOriginalPatientSnapshot(snapshot);
    setCurrentInvoiceId(invoice.backendId || null);
    setPaymentStatus(invoice.status);
    setPaymentMethod(invoice.method);
    setDiscountAmount(invoice.discountAmount.toString());
    setServices([...invoice.services]); // Create a copy of services array
    setInsuranceProvider(invoice.insuranceProvider || '');
    setInsuranceCoverage(((invoice.insuranceCoverage ?? 0)).toString());
    setSearch("");
    
    // Show confirmation that invoice is loaded for editing
    Alert.alert(
      "Edit Invoice",
      `Invoice ${invoice.invoiceId} loaded for editing. Edit the details above and click Done to save changes.`,
      [{ text: "OK", style: "default" }]
    );
  };
  
  // #3: Save Changes Handler
  const handleSaveInvoice = async () => {
    if (!selectedPatient) return;
    
    // 1. Validation Check
    if (subtotal <= 0) {
        Alert.alert("Validation Error", "Invoice must contain services with a positive subtotal.");
        return;
    }

    // compute current numeric values
    const numericDiscountLocal = parseFloat(discountAmount) || 0;
    const insurancePercentLocal = parseFloat(insuranceCoverage) || 0;
    const insuranceAmountLocal = Math.max(0, ((subtotal - numericDiscountLocal) * (insurancePercentLocal / 100)));
    const patientPaysLocal = Math.max(0, subtotal - numericDiscountLocal - insuranceAmountLocal);

    // Prepare data for API
    const invoiceData = {
      patient: originalPatientSnapshot?.id ?? selectedPatient.id,
      discount_amount: numericDiscountLocal,
      insurance_provider: insuranceProvider || '',
      insurance_coverage: insurancePercentLocal,
      payment_method: mapPaymentMethodToBackend(paymentMethod),
      payment_status: mapPaymentStatusToBackend(paymentStatus),
      is_paid: paymentStatus === 'Paid',
      items: services.map(s => ({
        description: s.description,
        quantity: s.qty,
        unit_price: s.unitPrice,
      })),
    };

    try {
      let result;
      if (isEditingExisting && currentInvoiceId) {
        // Update existing invoice
        console.log('[Payments] Updating invoice:', currentInvoiceId);
        result = await updateInvoice(currentInvoiceId, invoiceData);
      } else {
        // Create new invoice
        console.log('[Payments] Creating new invoice');
        result = await createInvoice(invoiceData);
      }
      
      if (result.success) {
        const invoiceId = result.data?.invoice_id || currentInvoiceId;
        if (isEditingExisting) {
          Alert.alert("Success", `Invoice INV-${String(invoiceId).padStart(5, '0')} updated successfully.`);
        } else {
          Alert.alert("Success", `New Invoice INV-${String(invoiceId).padStart(5, '0')} created and saved.`);
          setCurrentInvoiceId(invoiceId);
        }
        // Reload invoices to refresh the list
        loadData();
      } else {
        Alert.alert("Error", result.error || "Failed to save invoice");
      }
    } catch (error) {
      console.error('[Payments] Error saving invoice:', error);
      Alert.alert("Error", "Failed to save invoice. Please try again.");
    }
  };

  const handleMarkPaid = () => {
    if (!selectedPatient) return;
    if (paymentStatus === 'Paid') {
        Alert.alert("Payment Complete", "This invoice is already marked as paid.");
        return;
    }
    if (total <= 0) {
        Alert.alert("Validation Error", "Please ensure the invoice total is greater than zero before marking as paid.");
        return;
    }

    Alert.alert(
        "Confirm Payment",
        `Mark invoice for ${selectedPatient.name} (Total: L.E ${total.toFixed(2)}) as PAID (${paymentMethod})?`,
        [
            { text: "Cancel", style: "cancel" },
            { 
                text: "Confirm", 
                onPress: () => {
                    setPaymentStatus("Paid");
                    // Automatically save the change after marking as paid
                    // NOTE: small delay to ensure state updated — acceptable here since it's immediate feedback.
                    setTimeout(handleSaveInvoice, 100); 
                }
            }
        ]
    );
  };
  
  // --- Service Handlers (Logic remains the same) ---
  const handleUpdateService = useCallback((id: number, field: keyof ServiceItem, value: string) => {
    setServices(prevServices => prevServices.map(item => {
      if (item.id === id) {
        let numericValue: string | number = field === 'description' ? value : parseFloat(value) || 0;
        
        if (field === 'qty' || field === 'unitPrice') {
            numericValue = Math.max(0, parseFloat(value) || 0);
        }

        return { ...item, [field]: numericValue };
      }
      return item;
    }));
  }, []);

  const handleAddService = () => {
    handleOpenServiceModal();
  };

  const handleToggleService = (serviceName: string) => {
    const newSelected = new Set(selectedServiceNames);
    if (newSelected.has(serviceName)) {
      newSelected.delete(serviceName);
    } else {
      newSelected.add(serviceName);
    }
    setSelectedServiceNames(newSelected);
  };

  const handleConfirmServices = () => {
    if (selectedServiceNames.size === 0) {
      Alert.alert("No Services Selected", "Please select at least one service.");
      return;
    }

    // Add selected services to the invoice
    let nextId = services.length > 0 ? Math.max(...services.map(s => s.id)) + 1 : 1;
    const newServices = Array.from(selectedServiceNames).map((name) => {
      const category = serviceCategories.find(c => c.name === name);
      const serviceItem = { id: nextId, description: name, qty: 1, unitPrice: category?.price || 0 };
      nextId++;
      return serviceItem;
    });

    setServices(prevServices => [...prevServices, ...newServices]);
    setShowServiceModal(false);
    setSelectedServiceNames(new Set());
  };

  const handleOpenServiceModal = () => {
    setSelectedServiceNames(new Set());
    setShowServiceModal(true);
  };

  const handleRemoveService = (id: number) => {
    setServices(prevServices => prevServices.filter(item => item.id !== id));
  };

  // --- PRINTING LOGIC ---
  const generateInvoiceHTML = () => {
    if (!selectedPatient) return ""; 

    const servicesRows = services
      .map(
        (s) =>
          `<tr>
            <td style="text-align: left;">${s.description}</td>
            <td>${s.qty}</td>
            <td>L.E ${s.unitPrice.toFixed(2)}</td>
            <td>L.E ${(s.qty * s.unitPrice).toFixed(2)}</td>
          </tr>`
      )
      .join("");

    // ADDED FOR INSURANCE: local numeric values for print
    const numericDiscountLocal = parseFloat(discountAmount) || 0;
    const insurancePercentLocal = parseFloat(insuranceCoverage) || 0;
    const insuranceAmountLocal = Math.max(0, ((subtotal - numericDiscountLocal) * (insurancePercentLocal / 100)));
    const patientPaysLocal = Math.max(0, subtotal - numericDiscountLocal - insuranceAmountLocal);

    const displayInvoiceId = currentInvoiceId ? `INV-${String(currentInvoiceId).padStart(5, '0')}` : 'NEW';

    return `
      <html>
      <head>
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            h2 { color: ${PRIMARY_DARK}; border-bottom: 2px solid #ddd; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { border: 1px solid #eee; padding: 8px; text-align: right; }
            th { background-color: ${GRAY_BG}; color: #555; text-align: center; }
            .summary-row td { border: none; font-weight: bold; }
            .total-row td { background-color: ${PRIMARY_DARK}; color: ${WHITE}; }
            .status { background-color: ${paymentStatus === 'Paid' ? SUCCESS_COLOR : ERROR_COLOR}; color: ${WHITE}; padding: 5px; border-radius: 4px; display: inline-block; }
        </style>
      </head>
        <body>
          <h2>Invoice #${displayInvoiceId}</h2>
          <p><strong>Patient ID:</strong> ${selectedPatient.id}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Patient:</strong> ${selectedPatient.name} (${selectedPatient.phone})</p>
          <p><strong>Status:</strong> <span class="status">${paymentStatus}</span></p>

          <table>
            <thead>
              <tr>
                <th style="text-align: left;">Description</th><th>Qty</th><th>Unit Price</th><th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${servicesRows}
              <tr class="summary-row">
                <td colspan="3">Subtotal</td>
                <td>L.E ${subtotal.toFixed(2)}</td>
              </tr>
              <tr class="summary-row">
                <td colspan="3">Discount</td>
                <td>L.E ${numericDiscountLocal.toFixed(2)}</td>
              </tr>
              <!-- ADDED FOR INSURANCE -->
              <tr class="summary-row">
                <td colspan="3">Insurance Provider</td>
                <td>${insuranceProvider || 'None'}</td>
              </tr>
              <tr class="summary-row">
                <td colspan="3">Insurance Coverage (${insurancePercentLocal}%)</td>
                <td>L.E ${insuranceAmountLocal.toFixed(2)}</td>
              </tr>
              <tr class="total-row">
                <td colspan="3">Patient Pays</td>
                <td>L.E ${patientPaysLocal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          <p><strong>Payment Method:</strong> ${paymentMethod}</p>
        </body>
      </html>
    `;
  };

  // Function to handle actual printing after preview confirmation
  const handleConfirmPrint = async () => {
    try {
        const html = generateInvoiceHTML();
        setShowPrintPreview(false);
        await Print.printAsync({ html });
    } catch (error) {
        console.error("Print error:", error);
        Alert.alert("Print Canceled", "Printing was canceled or an error occurred.");
    }
  };

  const handlePrint = async () => {
    if (!isPatientSelected) {
        Alert.alert("Action Required", "Please select or create an invoice before printing.");
        return;
    }
    // Open preview modal instead of printing directly
    setShowPrintPreview(true);
  };

  const handleDownloadPDF = async () => {
    if (!isPatientSelected) {
        Alert.alert("Action Required", "Please select or create an invoice before downloading a PDF.");
        return;
    }

    try {
        const html = generateInvoiceHTML();
        const { uri } = await Print.printToFileAsync({ html });
        const invoiceIdStr = currentInvoiceId ? `INV-${String(currentInvoiceId).padStart(5, '0')}` : new Date().getTime();
        const fileName = `${selectedPatient.name.replace(/\s/g, '_')}_invoice_${invoiceIdStr}.pdf`;
        
        if (Platform.OS === 'android' && (FileSystem as any).StorageAccessFramework) {
             const permissions = await (FileSystem as any).StorageAccessFramework.requestDirectoryPermissionsAsync();
             if (permissions.granted) {
                 const fileUri = await (FileSystem as any).StorageAccessFramework.createFileAsync(
                     permissions.directoryUri, 
                     fileName, 
                     'application/pdf'
                 );
                 await FileSystem.copyAsync({ from: uri, to: fileUri });
                 Alert.alert("Success", `PDF saved to your Downloads folder!`);
             } else {
                 Alert.alert("Permission Denied", "Cannot save file without storage permission.");
             }
        } else {
             const fileUri = `${(FileSystem as any).documentDirectory}${fileName}`;
             await FileSystem.copyAsync({ from: uri, to: fileUri });
             Alert.alert("Success", `PDF prepared. Check your device's documents or share menu.`);
        }
    } catch (error) {
        console.error("PDF Download Error:", error);
        Alert.alert("Error", "Could not generate or save PDF.");
    }
  };

  // New: Combined Print or Download prompt for the current invoice (no history)
  const handlePrintOrDownload = () => {
    if (!isPatientSelected) {
      Alert.alert("Action Required", "Please select or create an invoice before exporting.");
      return;
    }
    // Open custom modal instead of Alert for better async handling
    setShowExportModal(true);
  };

  // Helper for Payment History Status Badge
  const getStatusBadgeStyle = (status: PaymentStatus) => {
    switch (status) {
        case 'Paid': return { backgroundColor: SUCCESS_COLOR };
        case 'Not Paid': return { backgroundColor: ERROR_COLOR };
        case 'Canceled': return { backgroundColor: WARNING_COLOR };
        default: return { backgroundColor: TEXT_MEDIUM };
    }
  };
  
  // Helper for Status Text styling
  const getStatusTextStyle = (status: PaymentStatus) => {
    switch (status) {
        case 'Paid': return styles.paid;
        case 'Not Paid': return styles.notPaid;
        case 'Canceled': return styles.canceled;
        default: return styles.notPaid;
    }
  };

  // --- JSX STRUCTURE ---
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={PRIMARY_DARK} />
        <Text style={{ marginTop: 10, color: TEXT_MEDIUM }}>Loading payments...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY_DARK]} />
      }
    >
      <Text style={styles.pageTitle}><Ionicons name="card-outline" size={24} color={PRIMARY_DARK} /> Payments Dashboard</Text>
      <Text style={styles.subtitle}>
        Process new invoices, edit existing records, and review comprehensive payment history.
      </Text>

      {/* NEW INVOICE SECTION HEADER */}
      <View style={[styles.invoiceCreationHeader, styles.cardShadow]}>
          <Text style={styles.sectionTitle}>
             <Ionicons name="document-text-outline" size={18} color={PRIMARY_DARK} /> 
             {isEditingExisting ? `Editing Invoice: INV-${String(currentInvoiceId).padStart(5, '0')}` : 'New Invoice & Processing'}
          </Text>
      </View>

      <View style={styles.sectionContainer}>
        
        {/* LEFT COLUMN: INVOICE CARD (Editable) */}
        <View style={[styles.invoiceCard, styles.cardShadow, { opacity: isPatientSelected ? 1 : 0.6 }]}>
          <Text style={styles.sectionTitleSmall}>Invoice Details</Text>
          
          {isPatientSelected ? (
            <View style={styles.patientInfoBox}>
                <Text style={styles.infoTextId}>Patient ID: {selectedPatient.id}</Text>
                <Text style={styles.infoTextName}>{selectedPatient.name}</Text>
                <Text style={styles.infoTextPhone}>{selectedPatient.phone}</Text>
                <Text style={styles.infoTextDetails}>Gender: {selectedPatient.gender} | Age: {selectedPatient.age}</Text>
            </View>
          ) : (
            <Text style={styles.placeholderText}>Select a patient using the search tool on the right to start an invoice.</Text>
          )}

          {/* Table Header - Only show when there are services */}
          {services.length > 0 && (
          <View style={styles.tableHeader}>
            <Text style={[styles.tableText, styles.colDescription]}>DESCRIPTION</Text>
            <Text style={[styles.tableText, styles.colQtyPrice]}>QTY</Text>
            <Text style={[styles.tableText, styles.colQtyPrice]}>PRICE</Text>
            <Text style={[styles.tableText, styles.colAmount]}>AMOUNT</Text>
            <View style={styles.colRemovePlaceholder} />
          </View>
          )}

          {/* Editable Service Rows */}
          {services.map((item) => (
            <View style={styles.tableRow} key={item.id}>
              <TextInput
                  style={[styles.rowInput, styles.colDescription, { fontWeight: '600' }]}
                  value={item.description}
                  onChangeText={(text) => handleUpdateService(item.id, 'description', text)}
                  editable={isPatientSelected}
              />
              <View style={styles.qtyButtonContainer}>
                <TouchableOpacity 
                    style={[styles.qtyButton, !isPatientSelected && { opacity: 0.5 }]}
                    onPress={() => handleUpdateService(item.id, 'qty', Math.max(1, item.qty - 1).toString())}
                    disabled={!isPatientSelected}
                >
                    <Text style={styles.qtyButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyDisplay}>{item.qty}</Text>
                <TouchableOpacity 
                    style={[styles.qtyButton, !isPatientSelected && { opacity: 0.5 }]}
                    onPress={() => handleUpdateService(item.id, 'qty', (item.qty + 1).toString())}
                    disabled={!isPatientSelected}
                >
                    <Text style={styles.qtyButtonText}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.rowText, styles.colQtyPrice]}>
                  L.E {item.unitPrice}
              </Text>
              <Text style={[styles.rowText, styles.colAmount]}>
                  L.E {(item.qty * item.unitPrice).toFixed(2)}
              </Text>
              <TouchableOpacity 
                  style={styles.colRemove} 
                  onPress={() => handleRemoveService(item.id)}
                  disabled={!isPatientSelected}
              >
                  <Ionicons name="remove-circle-outline" size={20} color={!isPatientSelected ? BORDER_LIGHT : ERROR_COLOR} />
              </TouchableOpacity>
            </View>
          ))}
          
          <TouchableOpacity 
            style={[styles.addButton, !isPatientSelected && { borderColor: BORDER_LIGHT, backgroundColor: GRAY_BG }]} 
            onPress={handleAddService}
            disabled={!isPatientSelected}
          >
              <Ionicons name="add-circle-outline" size={18} color={!isPatientSelected ? TEXT_MEDIUM : PRIMARY_DARK} />
              <Text style={[styles.addButtonText, { color: !isPatientSelected ? TEXT_MEDIUM : PRIMARY_DARK }]}>Add Service Item</Text>
          </TouchableOpacity>

          {/* Service Selection Modal */}
          <Modal visible={showServiceModal} transparent animationType="fade" onRequestClose={() => setShowServiceModal(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Services</Text>
                <Text style={styles.modalSubtitle}>Choose one or more services to add to the invoice</Text>

                {serviceCategories.map((service) => (
                  <TouchableOpacity
                    key={service.name}
                    style={styles.serviceCheckbox}
                    onPress={() => handleToggleService(service.name)}
                  >
                    <View style={[styles.checkbox, selectedServiceNames.has(service.name) && styles.checkboxSelected]}>
                      {selectedServiceNames.has(service.name) && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <View style={styles.serviceInfo}>
                      <Text style={styles.serviceName}>{service.name}</Text>
                      <Text style={styles.servicePrice}>L.E {service.price}</Text>
                    </View>
                  </TouchableOpacity>
                ))}

                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setShowServiceModal(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton, selectedServiceNames.size === 0 && styles.disabledButton]}
                    onPress={handleConfirmServices}
                    disabled={selectedServiceNames.size === 0}
                  >
                    <Text style={styles.confirmButtonText}>Add {selectedServiceNames.size > 0 ? `(${selectedServiceNames.size})` : ''}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Export (Print/Download) Modal */}
          <Modal visible={showExportModal} transparent animationType="fade" onRequestClose={() => setShowExportModal(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Export Invoice</Text>
                <Text style={styles.modalSubtitle}>Choose how to export the invoice</Text>

                <TouchableOpacity
                  style={[styles.exportOptionButton, { marginBottom: 12 }]}
                  onPress={() => {
                    setShowExportModal(false);
                    handlePrint();
                  }}
                >
                  <Ionicons name="print-outline" size={24} color={PRIMARY_DARK} style={{ marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exportOptionTitle}>Print Invoice</Text>
                    <Text style={styles.exportOptionDesc}>Print to a connected printer</Text>
                  </View>
                  <Ionicons name="chevron-forward-outline" size={20} color={TEXT_MEDIUM} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.exportOptionButton}
                  onPress={() => {
                    setShowExportModal(false);
                    handleDownloadPDF();
                  }}
                >
                  <Ionicons name="download-outline" size={24} color={PRIMARY_DARK} style={{ marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exportOptionTitle}>Download PDF</Text>
                    <Text style={styles.exportOptionDesc}>Save invoice as PDF file</Text>
                  </View>
                  <Ionicons name="chevron-forward-outline" size={20} color={TEXT_MEDIUM} />
                </TouchableOpacity>

                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setShowExportModal(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Invoice Preview Modal (for printing) */}
          <Modal visible={showPrintPreview} transparent animationType="slide" onRequestClose={() => setShowPrintPreview(false)}>
            <View style={styles.previewContainer}>
              {/* Preview Header */}
              <View style={styles.previewHeader}>
                <Text style={styles.previewTitle}>Invoice Preview</Text>
                <TouchableOpacity onPress={() => setShowPrintPreview(false)}>
                  <Ionicons name="close-outline" size={28} color={PRIMARY_DARK} />
                </TouchableOpacity>
              </View>

              {/* Invoice Content (Scrollable) */}
              <ScrollView style={styles.previewContent} showsVerticalScrollIndicator={true}>
                {/* Invoice Header */}
                <View style={styles.previewInvoiceBox}>
                  <Text style={styles.invoiceNumber}>Invoice #{currentInvoiceId ? `INV-${String(currentInvoiceId).padStart(5, '0')}` : 'NEW'}</Text>
                  <Text style={styles.invoiceDate}>{new Date().toLocaleDateString()}</Text>

                  {/* Patient Info */}
                  <View style={styles.patientPreviewBox}>
                    <Text style={styles.previewLabel}>Patient Details</Text>
                    <Text style={styles.previewValue}>{selectedPatient?.name}</Text>
                    <Text style={styles.previewValue}>{selectedPatient?.phone}</Text>
                    <Text style={styles.previewValue}>Age: {selectedPatient?.age} | {selectedPatient?.gender}</Text>
                  </View>

                  {/* Services Table */}
                  <View style={styles.previewServicesBox}>
                    <Text style={styles.previewLabel}>Services</Text>
                    {services.map((item, index) => (
                      <View key={item.id} style={styles.previewServiceRow}>
                        <Text style={styles.previewServiceDesc}>{item.description}</Text>
                        <Text style={styles.previewServiceQty}>Qty: {item.qty}</Text>
                        <Text style={styles.previewServicePrice}>L.E {(item.qty * item.unitPrice).toFixed(2)}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Calculations */}
                  <View style={styles.previewCalculations}>
                    <View style={styles.previewCalcRow}>
                      <Text style={styles.previewCalcLabel}>Subtotal</Text>
                      <Text style={styles.previewCalcValue}>L.E {subtotal.toFixed(2)}</Text>
                    </View>
                    {numericDiscount > 0 && (
                      <View style={styles.previewCalcRow}>
                        <Text style={styles.previewCalcLabel}>Discount</Text>
                        <Text style={styles.previewCalcValue}>L.E {numericDiscount.toFixed(2)}</Text>
                      </View>
                    )}
                    {insuranceProvider && (
                      <>
                        <View style={styles.previewCalcRow}>
                          <Text style={styles.previewCalcLabel}>Insurance ({insuranceProvider})</Text>
                          <Text style={styles.previewCalcValue}>L.E {insuranceAmount.toFixed(2)}</Text>
                        </View>
                      </>
                    )}
                    <View style={[styles.previewCalcRow, styles.previewTotal]}>
                      <Text style={styles.previewTotalLabel}>TOTAL DUE</Text>
                      <Text style={styles.previewTotalValue}>L.E {total.toFixed(2)}</Text>
                    </View>
                  </View>

                  {/* Payment Details */}
                  <View style={styles.previewPaymentBox}>
                    <Text style={styles.previewLabel}>Payment Details</Text>
                    <View style={styles.previewDetailRow}>
                      <Text style={styles.previewDetailLabel}>Status:</Text>
                      <Text style={[styles.previewDetailValue, getStatusTextStyle(paymentStatus)]}>{paymentStatus}</Text>
                    </View>
                    <View style={styles.previewDetailRow}>
                      <Text style={styles.previewDetailLabel}>Method:</Text>
                      <Text style={styles.previewDetailValue}>{paymentMethod}</Text>
                    </View>
                  </View>
                </View>
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.previewButtonsContainer}>
                <TouchableOpacity 
                  style={[styles.previewButton, styles.previewCancelButton]}
                  onPress={() => setShowPrintPreview(false)}
                >
                  <Text style={styles.previewCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.previewButton, styles.previewConfirmButton]}
                  onPress={handleConfirmPrint}
                >
                  <Ionicons name="print-outline" size={20} color={WHITE} />
                  <Text style={styles.previewConfirmButtonText}>Print Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Summary */}
          {isPatientSelected && (
            <View style={styles.summary}>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryText}>Subtotal:</Text>
                    <Text style={styles.summaryTextValue}>L.E {subtotal.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryText}>Discount (L.E):</Text>
                    <TextInput
                        style={styles.discountInput}
                        value={discountAmount}
                        onChangeText={setDiscountAmount}
                        keyboardType="numeric"
                        placeholder="0"
                        editable={isPatientSelected}
                    />
                    <Text style={styles.summaryTextValue}>L.E {numericDiscount.toFixed(2)}</Text>
                </View>

                {/* ADDED FOR INSURANCE: show provider, coverage and insurance amount in left summary */}
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryText}>Insurance:</Text>
                    <Text style={styles.summaryTextValue}>{insuranceProvider ? insuranceProvider : 'None'}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryText}>Insurance Coverage (%):</Text>
                    <Text style={styles.summaryTextValue}>{insurancePercent}%</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryText}>Insurance Amount:</Text>
                    <Text style={styles.summaryTextValue}>L.E {insuranceAmount.toFixed(2)}</Text>
                </View>

                <View style={[styles.summaryRow, styles.totalRowBorder]}>
                    <Text style={styles.summaryTotal}>TOTAL DUE:</Text>
                    <Text style={styles.summaryTotalValue}>L.E {total.toFixed(2)}</Text>
                </View>
            </View>
          )}
        </View>

        {/* RIGHT COLUMN: SEARCH & PAYMENT CARD */}
        <View style={[styles.paymentCard, styles.cardShadow]}>
            <Text style={styles.sectionTitleSmall}>Search Patient</Text>
            
            {/* Search Box */}
            <View style={styles.searchBox}>
                <Feather name="search" size={18} color={TEXT_MEDIUM} />
                <TextInput
                placeholder="Search by Name or Phone..."
                style={styles.input}
                value={search}
                onChangeText={setSearch}
                editable={!isPatientSelected}
                />
            </View>

            {/* Patient Search Results */}
            {search.length > 0 && !isPatientSelected && (
                <View style={[styles.resultsContainerInner, styles.cardShadow]}>
                    {filteredPatients.map((patient, index) => (
                        <TouchableOpacity
                            key={(patient as EnhancedPatient).id || index} // Safely access ID for key
                            style={styles.resultItem}
                            onPress={() => handleSelectPatient(patient)}
                        >
                            <Text style={styles.resultItemText}>
                                <Ionicons name="person-outline" size={14} color={PRIMARY_DARK} /> {patient.name} - {patient.phone}
                            </Text>
                        </TouchableOpacity>
                    ))}
                    {filteredPatients.length === 0 && <Text style={styles.noResultsText}>No patients found.</Text>}
                </View>
            )}

            {isPatientSelected && (
                <>
                    <Text style={[styles.sectionTitleSmall, { marginTop: 20 }]}>Payment Processing</Text>

                    {/* #2: Payment Status Picker (Editable) */}
                    <Text style={styles.infoLabel}>Payment Status</Text>
                    <View style={styles.dropdownBox}>
                        <Picker
                            selectedValue={paymentStatus}
                            onValueChange={(value) => setPaymentStatus(value as PaymentStatus)}
                            style={styles.picker}
                            dropdownIconColor={PRIMARY_DARK}
                        >
                            <Picker.Item label="Pending Payment" value="Not Paid" />
                            <Picker.Item label="Paid - Finalized" value="Paid" />
                            <Picker.Item label="Canceled" value="Canceled" />
                        </Picker>
                    </View>
                    <Text style={[getStatusTextStyle(paymentStatus), { marginTop: 5 }]}>
                       Current: {paymentStatus === "Paid" ? "✅ Paid" : paymentStatus === "Canceled" ? "🚫 Canceled" : "🟡 Pending"}
                    </Text>


                    <Text style={styles.infoLabel}>Payment Method</Text>
                    <View style={styles.dropdownBox}>
                        <Picker
                            selectedValue={paymentMethod}
                            onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                            style={styles.picker}
                            dropdownIconColor={PRIMARY_DARK}
                            enabled={paymentStatus !== 'Paid'}
                        >
                            <Picker.Item label="Cash" value="Cash" />
                            <Picker.Item label="Visa / Card" value="Visa" />
                            <Picker.Item label="InstaPay / Transfer" value="InstaPay" />
                            <Picker.Item label="E-Wallet" value="E-Wallet" />
                        </Picker>
                    </View>

                    {/* ADDED FOR INSURANCE: Insurance Provider Picker */}
                    <Text style={styles.infoLabel}>Insurance Provider</Text>
                    <View style={styles.dropdownBox}>
                        <Picker
                            selectedValue={insuranceProvider}
                            onValueChange={(value) => setInsuranceProvider(value)}
                            style={styles.picker}
                            dropdownIconColor={PRIMARY_DARK}
                        >
                            <Picker.Item label="None" value="" />
                            <Picker.Item label="AXA Insurance" value="AXA Insurance" />
                            <Picker.Item label="MedNet" value="MedNet" />
                            <Picker.Item label="CarePlus" value="CarePlus" />
                        </Picker>
                    </View>

                    {/* ADDED FOR INSURANCE: Coverage input */}
                    {insuranceProvider !== '' && (
                        <>
                            <Text style={styles.infoLabel}>Insurance Coverage (%)</Text>
                            <TextInput
                                style={styles.discountInput}
                                value={insuranceCoverage}
                                onChangeText={setInsuranceCoverage}
                                placeholder="0"
                                keyboardType="numeric"
                            />
                        </>
                    )}

                    {/* #3: Save Changes Button */}
                    <TouchableOpacity 
                        style={[styles.payButton, { backgroundColor: PRIMARY_LIGHT, marginBottom: 10 }]} 
                        onPress={handleSaveInvoice}
                        disabled={total < 0}
                    >
                        <Text style={styles.payButtonText}>
                            <Ionicons name="save-outline" size={18} color={WHITE} /> Save Changes
                        </Text>
                    </TouchableOpacity>

                    {/* Back and Done Buttons */}
                    <View style={styles.actionButtonsContainer}>
                        <TouchableOpacity 
                            style={styles.backButton}
                            onPress={() => {
                                setSearch("");
                                setSelectedPatient(null);
                                setCurrentInvoiceId(null);
                                setServices([]);
                                setPaymentStatus("Not Paid");
                                setPaymentMethod("Cash");
                                setDiscountAmount("0");
                                setInsuranceProvider('');
                              setInsuranceCoverage('0');
                              setOriginalPatientSnapshot(null);
                            }}
                        >
                            <Ionicons name="arrow-back-outline" size={20} color={PRIMARY_DARK} />
                            <Text style={styles.backButtonText}>Back</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.doneButton, total <= 0 && { opacity: 0.5 }]}
                            onPress={() => {
                                handleSaveInvoice();
                                // Reset form after saving
                                setTimeout(() => {
                                    setSearch("");
                                    setSelectedPatient(null);
                                    setCurrentInvoiceId(null);
                                    setServices([]);
                                    setPaymentStatus("Not Paid");
                                    setPaymentMethod("Cash");
                                    setDiscountAmount("0");
                                    setInsuranceProvider('');
                                setInsuranceCoverage('0');
                                setOriginalPatientSnapshot(null);
                                }, 500);
                            }}
                            disabled={total <= 0}
                        >
                            <Ionicons name="checkmark-circle-outline" size={20} color={WHITE} />
                            <Text style={styles.doneButtonText}>Done</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Print / Download Button (single entry: prompts Print or Download for current invoice only) */}
                    <View style={styles.bottomButtons}>
                      <TouchableOpacity style={styles.iconButton} onPress={handlePrintOrDownload}>
                        <Ionicons name="print-outline" size={20} color={PRIMARY_DARK} />
                        <Text style={styles.iconText}>Print / Download</Text>
                      </TouchableOpacity>
                    </View>
                </>
            )}
        </View>
      </View>

      {/* PAYMENT HISTORY TABLE */}
      <View style={[styles.historyContainer, styles.cardShadow]}>
        <Text style={styles.sectionTitle}><Ionicons name="time-outline" size={18} color={PRIMARY_DARK} /> Recent Payment History</Text>
        
        {/* History Search Bar */}
        <View style={styles.historySearchBox}>
            <Feather name="search" size={18} color={TEXT_MEDIUM} />
            <TextInput
            placeholder="Search invoice ID or patient name..."
            style={styles.historyInput}
            value={historySearch}
            onChangeText={setHistorySearch}
            />
        </View>

        {/* History Table Header */}
        <View style={styles.historyTableHeader}>
            <Text style={[styles.historyTableText, styles.colHistoryID]}>INVOICE ID</Text>
            <Text style={[styles.historyTableText, styles.colHistoryPatient]}>PATIENT</Text>
            <Text style={[styles.historyTableText, styles.colHistoryDate]}>DATE</Text>
            <Text style={[styles.historyTableText, styles.colHistoryAmount]}>TOTAL</Text>
            <Text style={[styles.historyTableText, styles.colHistoryMethod]}>METHOD</Text>
            <Text style={[styles.historyTableText, styles.colHistoryStatus]}>STATUS</Text>
            <View style={styles.colHistoryActionPlaceholder} />
        </View>

        {/* History Table Rows */}
        {filteredHistory.map((item, index) => (
            <View style={[styles.historyTableRow, index % 2 === 0 ? styles.historyRowEven : {}]} key={item.invoiceId}>
                <Text style={[styles.historyRowText, styles.colHistoryID, { fontWeight: '600', color: PRIMARY_DARK }]}>{item.invoiceId}</Text>
                <Text style={[styles.historyRowText, styles.colHistoryPatient]}>{item.patientName}</Text>
                <Text style={[styles.historyRowText, styles.colHistoryDate, { color: TEXT_MEDIUM }]}>{item.date}</Text>
                <Text style={[styles.historyRowText, styles.colHistoryAmount, { fontWeight: '700' }]}>L.E {item.totalAmount.toFixed(2)}</Text>
                <Text style={[styles.historyRowText, styles.colHistoryMethod]}>{item.method}</Text>
                
                <View style={[styles.colHistoryStatus, {alignItems: 'center'}]}>
                    <View style={[styles.statusBadge, getStatusBadgeStyle(item.status)]}>
                        <Text style={styles.statusBadgeText}>{item.status}</Text>
                    </View>
                </View>

                {/* Edit Button (Eye Icon changed to Create/Edit icon) */}
                <TouchableOpacity 
                    style={styles.colHistoryAction}
                    onPress={() => handleLoadInvoiceForEdit(item)}
                >
                    <Ionicons name="create-outline" size={20} color={PRIMARY_DARK} />
                </TouchableOpacity>
            </View>
        ))}

        {filteredHistory.length === 0 && (
            <View style={{padding: 20, alignItems: 'center'}}><Text style={styles.noResultsText}>No payments found matching criteria.</Text></View>
        )}
      </View>
    </ScrollView>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GRAY_BG, padding: 20 },
  pageTitle: { fontSize: 24, fontWeight: "800", color: PRIMARY_DARK, marginBottom: 5, flexDirection: 'row', alignItems: 'center' },
  subtitle: { fontSize: 14, color: TEXT_MEDIUM, marginBottom: 20 },
  
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  
  // --- New Invoice Section Header ---
  invoiceCreationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  newInvoiceButton: {
    backgroundColor: PRIMARY_DARK,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  newInvoiceButtonText: {
    color: WHITE,
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 5,
  },
  
  // --- New Invoice Processing Layout ---
  sectionContainer: { flexDirection: "row", justifyContent: "space-between", gap: 20, marginBottom: 30 },
  invoiceCard: { backgroundColor: WHITE, borderRadius: 12, padding: 20, flex: 2 },
  paymentCard: { backgroundColor: WHITE, borderRadius: 12, padding: 20, flex: 1, minHeight: 400 },
  
  sectionTitle: { fontSize: 18, fontWeight: "700", color: PRIMARY_DARK, marginBottom: 15, flexDirection: 'row', alignItems: 'center' },
  sectionTitleSmall: { fontSize: 16, fontWeight: "700", color: TEXT_DARK, marginBottom: 15 },

  placeholderText: { fontSize: 14, color: TEXT_MEDIUM, fontStyle: 'italic', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: BORDER_LIGHT },

  // Patient Info in Invoice Card
  patientInfoBox: {
    borderLeftWidth: 3,
    borderLeftColor: PRIMARY_LIGHT,
    paddingLeft: 10,
    marginBottom: 15,
  },
  infoTextId: { fontSize: 12, fontWeight: '500', color: PRIMARY_DARK, marginBottom: 4 }, // Added style for ID
  infoTextName: { fontSize: 16, fontWeight: '700', color: TEXT_DARK },
  infoTextPhone: { fontSize: 14, color: TEXT_MEDIUM, marginTop: 2 },
  infoTextDetails: { fontSize: 12, color: TEXT_MEDIUM, marginTop: 4 },

  // --- Search & Results (In Payment Card) ---
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: GRAY_BG,
    paddingHorizontal: 15,
    borderRadius: 8,
    height: 45,
  },
  input: { marginLeft: 10, flex: 1, color: TEXT_DARK, fontSize: 15 },
  resultsContainerInner: { 
    backgroundColor: WHITE, 
    borderRadius: 10, 
    marginTop: 10, 
    position: 'absolute', 
    top: 90, 
    zIndex: 10, 
    width: '100%', 
    borderWidth: 1, 
    borderColor: BORDER_LIGHT,
    maxHeight: 200, 
    overflow: 'hidden'
  },
  resultItem: { paddingVertical: 10, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: BORDER_LIGHT, flexDirection: 'row', alignItems: 'center' },
  resultItemText: { fontSize: 15, color: TEXT_DARK, marginLeft: 5 },
  noResultsText: { color: TEXT_MEDIUM, fontStyle: 'italic', padding: 5 },
  
  // --- Table & Services ---
  tableHeader: { 
    flexDirection: "row", 
    borderBottomWidth: 1, 
    borderColor: PRIMARY_DARK, 
    paddingVertical: 10, 
    marginBottom: 5, 
    backgroundColor: GRAY_BG,
    borderRadius: 5,
    paddingHorizontal: 5
  },
  tableText: { fontWeight: "700", color: PRIMARY_DARK, fontSize: 12, textAlign: 'center' },
  tableRow: { flexDirection: "row", paddingVertical: 5, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: BORDER_LIGHT },
  rowInput: { 
    fontSize: 13, 
    color: TEXT_DARK, 
    textAlign: 'center',
    padding: 5,
    backgroundColor: WHITE,
    borderRadius: 4,
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: BORDER_LIGHT,
  },
  rowText: { fontSize: 13, color: TEXT_DARK, textAlign: 'right', paddingRight: 5 },
  
  qtyButtonContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 60,
    marginRight: 20,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: PRIMARY_DARK,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyButtonText: {
    color: WHITE,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  qtyDisplay: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_DARK,
    marginHorizontal: 8,
    minWidth: 20,
    textAlign: 'center',
  },
  
  colDescription: { flex: 2.5, textAlign: 'left', paddingLeft: 5 },
  colQtyPrice: { flex: 1, maxWidth: 60 },
  colAmount: { flex: 1, maxWidth: 80, fontWeight: '700' },
  colRemovePlaceholder: { width: 30 },
  colRemove: { width: 30, alignItems: 'center' },

  addButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 10, 
    borderWidth: 1, 
    borderColor: PRIMARY_DARK, 
    borderRadius: 8, 
    marginTop: 10 
  },
  addButtonText: { 
    color: PRIMARY_DARK, 
    fontWeight: '600', 
    marginLeft: 5 
  },

  // --- Summary ---
  summary: { marginTop: 15, borderTopWidth: 1, borderColor: BORDER_LIGHT, paddingTop: 10, paddingHorizontal: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  totalRowBorder: { borderTopWidth: 1, borderTopColor: BORDER_LIGHT, paddingTop: 10, marginTop: 10 },
  summaryText: { fontSize: 14, color: TEXT_MEDIUM },
  summaryTextValue: { fontSize: 14, color: TEXT_DARK, fontWeight: '600' },
  summaryTotal: { fontSize: 16, fontWeight: "800", color: PRIMARY_DARK },
  summaryTotalValue: { fontSize: 16, fontWeight: "800", color: PRIMARY_DARK },
  discountInput: {
    width: 60,
    height: 25,
    borderWidth: 1,
    borderColor: BORDER_LIGHT,
    borderRadius: 4,
    textAlign: 'center',
    fontSize: 14,
    color: TEXT_DARK,
    marginHorizontal: 10,
  },
  
  // --- Payment Details ---
  infoLabel: { fontSize: 14, fontWeight: "600", color: PRIMARY_DARK, marginTop: 15, marginBottom: 5 },
  notPaid: { backgroundColor: '#FCE8EF', color: ERROR_COLOR, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, alignSelf: "flex-start", fontWeight: '700' },
  paid: { backgroundColor: '#E8F9EC', color: SUCCESS_COLOR, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, alignSelf: "flex-start", fontWeight: '700' },
  canceled: { backgroundColor: '#FEF9E7', color: WARNING_COLOR, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, alignSelf: "flex-start", fontWeight: '700' },
  dropdownBox: { borderWidth: 1, borderColor: BORDER_LIGHT, borderRadius: 8, backgroundColor: WHITE },
  picker: { height: 45, color: TEXT_DARK },
  payButton: { backgroundColor: PRIMARY_DARK, borderRadius: 10, paddingVertical: 12, alignItems: "center", marginTop: 10 },
  payButtonDisabled: { backgroundColor: TEXT_MEDIUM },
  payButtonText: { color: WHITE, fontWeight: "bold", fontSize: 16, flexDirection: 'row', alignItems: 'center' },
  
  // --- Action Buttons (Back & Done) ---
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 15,
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: PRIMARY_DARK,
    backgroundColor: WHITE,
  },
  backButtonText: {
    color: PRIMARY_DARK,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 6,
  },
  doneButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: PRIMARY_DARK,
  },
  doneButtonText: {
    color: WHITE,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 6,
  },
  
  // --- Bottom Actions ---
  bottomButtons: { flexDirection: "row", justifyContent: "space-around", marginTop: 25, borderTopWidth: 1, borderTopColor: BORDER_LIGHT, paddingTop: 15 },
  iconButton: { flexDirection: "row", alignItems: "center", padding: 8 },
  iconText: { marginLeft: 5, color: PRIMARY_DARK, fontSize: 14, fontWeight: '500' },
  
  // --- Payment History Table Styles ---
  historyContainer: {
    backgroundColor: WHITE,
    borderRadius: 12,
    padding: 20,
  },
  historySearchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: GRAY_BG,
    paddingHorizontal: 15,
    borderRadius: 8,
    height: 40,
    marginBottom: 15,
    width: '50%',
  },
  historyInput: { marginLeft: 10, flex: 1, color: TEXT_DARK, fontSize: 14 },
  historyTableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderColor: PRIMARY_DARK,
    backgroundColor: GRAY_BG,
    borderRadius: 4,
    paddingHorizontal: 5,
  },
  historyTableText: {
    fontWeight: '700',
    color: PRIMARY_DARK,
    fontSize: 12,
    textAlign: 'left',
  },
  historyTableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: BORDER_LIGHT,
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  historyRowEven: {
    backgroundColor: '#FAFAFA',
  },
  historyRowText: {
    fontSize: 13,
    color: TEXT_DARK,
  },
  colHistoryID: { flex: 1.5, paddingLeft: 5 },
  colHistoryPatient: { flex: 2.5 },
  colHistoryDate: { flex: 1.5 },
  colHistoryAmount: { flex: 1.5, textAlign: 'right', paddingRight: 10 },
  colHistoryMethod: { flex: 1.5 },
  colHistoryStatus: { flex: 1.5 },
  colHistoryActionPlaceholder: { width: 40 },
  colHistoryAction: { width: 40, alignItems: 'center' },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    minWidth: 80,
    alignItems: 'center',
  },
  statusBadgeText: {
    fontWeight: '600',
    fontSize: 12,
    color: WHITE,
  },

  // --- Service Selection Modal ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: PRIMARY_DARK,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: TEXT_MEDIUM,
    marginBottom: 20,
  },
  serviceCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER_LIGHT,
    backgroundColor: GRAY_BG,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: PRIMARY_DARK,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: PRIMARY_DARK,
    borderColor: PRIMARY_DARK,
  },
  checkmark: {
    color: WHITE,
    fontSize: 14,
    fontWeight: 'bold',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_DARK,
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: 14,
    color: TEXT_MEDIUM,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: GRAY_BG,
    borderWidth: 1,
    borderColor: BORDER_LIGHT,
  },
  cancelButtonText: {
    color: TEXT_DARK,
    fontWeight: '600',
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: PRIMARY_DARK,
  },
  confirmButtonText: {
    color: WHITE,
    fontWeight: '600',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },

  // --- Export Modal Styles ---
  exportOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER_LIGHT,
    backgroundColor: GRAY_BG,
    marginBottom: 12,
  },
  exportOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_DARK,
    marginBottom: 4,
  },
  exportOptionDesc: {
    fontSize: 13,
    color: TEXT_MEDIUM,
  },

  // --- Invoice Preview Modal Styles ---
  previewContainer: {
    flex: 1,
    backgroundColor: WHITE,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: PRIMARY_DARK,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: WHITE,
  },
  previewContent: {
    flex: 1,
    padding: 20,
  },
  previewInvoiceBox: {
    backgroundColor: GRAY_BG,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: BORDER_LIGHT,
  },
  invoiceNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: PRIMARY_DARK,
    marginBottom: 4,
  },
  invoiceDate: {
    fontSize: 14,
    color: TEXT_MEDIUM,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_LIGHT,
    paddingBottom: 12,
  },
  patientPreviewBox: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_LIGHT,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: PRIMARY_DARK,
    marginBottom: 8,
  },
  previewValue: {
    fontSize: 14,
    color: TEXT_DARK,
    marginBottom: 4,
  },
  previewServicesBox: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_LIGHT,
  },
  previewServiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  previewServiceDesc: {
    flex: 2,
    fontSize: 13,
    color: TEXT_DARK,
  },
  previewServiceQty: {
    flex: 1,
    fontSize: 13,
    color: TEXT_MEDIUM,
    textAlign: 'center',
  },
  previewServicePrice: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: PRIMARY_DARK,
    textAlign: 'right',
  },
  previewCalculations: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_LIGHT,
  },
  previewCalcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  previewCalcLabel: {
    fontSize: 14,
    color: TEXT_MEDIUM,
  },
  previewCalcValue: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_DARK,
  },
  previewTotal: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    marginVertical: 8,
    borderRadius: 6,
    paddingHorizontal: 12,
  },
  previewTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: PRIMARY_DARK,
  },
  previewTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: PRIMARY_DARK,
  },
  previewPaymentBox: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
  },
  previewDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  previewDetailLabel: {
    fontSize: 13,
    color: TEXT_MEDIUM,
  },
  previewDetailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_DARK,
  },
  previewButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: WHITE,
    borderTopWidth: 1,
    borderTopColor: BORDER_LIGHT,
  },
  previewButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  previewCancelButton: {
    backgroundColor: GRAY_BG,
    borderWidth: 1,
    borderColor: BORDER_LIGHT,
  },
  previewCancelButtonText: {
    color: TEXT_DARK,
    fontWeight: '600',
    fontSize: 16,
  },
  previewConfirmButton: {
    backgroundColor: PRIMARY_DARK,
  },
  previewConfirmButtonText: {
    color: WHITE,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 6,
  },
});
