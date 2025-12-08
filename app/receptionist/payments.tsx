import React, { useState, useContext, useMemo, useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  Alert,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { PatientsContext, Patient } from "../context/PatientContext";
import * as Print from "expo-print";
import * as FileSystem from "expo-file-system";

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
};

type PaymentStatus = 'Paid' | 'Not Paid' | 'Canceled';
type PaymentMethod = 'Cash' | 'Visa' | 'InstaPay' | 'E-Wallet';

type InvoiceItem = {
    invoiceId: string;
    patientId: number;
    patientName: string;
    date: string;
    totalAmount: number;
    status: PaymentStatus;
    method: PaymentMethod;
    services: ServiceItem[];
    discountAmount: number;
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

// --- MOCK DATA ---
const defaultServices: ServiceItem[] = [
    { id: 1, description: "Laser Session", qty: 1, unitPrice: 450 },
    { id: 2, description: "Post-Treatment Cream", qty: 1, unitPrice: 75 },
];

const mockInvoiceHistory: InvoiceItem[] = [
    { invoiceId: 'INV-00101', patientId: 101, patientName: 'Ahmed Mohamed', date: 'Dec 07, 2025', totalAmount: 525.00, status: 'Paid', method: 'Cash', services: defaultServices, discountAmount: 0 },
    { invoiceId: 'INV-00102', patientId: 102, patientName: 'Mona Ali', date: 'Dec 07, 2025', totalAmount: 1100.00, status: 'Not Paid', method: 'Visa', 
        // **FIX APPLIED HERE** Removed duplicate 'unitPrice' property.
        services: [{ id: 1, description: "Full Body Treatment", qty: 1, unitPrice: 1200 }], discountAmount: 100 },
    { invoiceId: 'INV-00103', patientId: 103, patientName: 'Laila Hassan', date: 'Dec 06, 2025', totalAmount: 450.00, status: 'Paid', method: 'InstaPay', services: defaultServices, discountAmount: 75 },
    { invoiceId: 'INV-00104', patientId: 104, patientName: 'Youssef Karim', date: 'Dec 05, 2025', totalAmount: 750.00, status: 'Paid', method: 'E-Wallet', services: defaultServices, discountAmount: 0 },
    { invoiceId: 'INV-00105', patientId: 105, patientName: 'Fatima Essam', date: 'Dec 05, 2025', totalAmount: 300.00, status: 'Canceled', method: 'Cash', services: defaultServices, discountAmount: 225 },
];

const defaultNewServices: ServiceItem[] = [
    { id: 1, description: "New Service Item", qty: 1, unitPrice: 0 },
];


// --- COMPONENT START ---

export default function Payments() {
  const { patients } = useContext(PatientsContext);
  const [search, setSearch] = useState("");
  // Use EnhancedPatient in state
  const [selectedPatient, setSelectedPatient] = useState<EnhancedPatient | null>(null);
  
  // Invoice State
  const [currentInvoiceId, setCurrentInvoiceId] = useState<string>(''); 
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("Not Paid");
  const [discountAmount, setDiscountAmount] = useState<string>("0");
  const [services, setServices] = useState<ServiceItem[]>(defaultNewServices);
  
  const isPatientSelected = !!selectedPatient;
  const isEditingExisting = !!currentInvoiceId;

  // --- MOCK HISTORY DATA & Filtering ---
  const [historySearch, setHistorySearch] = useState('');
  const [invoiceHistory, setInvoiceHistory] = useState(mockInvoiceHistory); 
  
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
  const total = Math.max(0, subtotal - numericDiscount);

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
                    setCurrentInvoiceId('');
                    setServices(defaultNewServices);
                    setPaymentStatus("Not Paid");
                    setPaymentMethod("Cash");
                    setDiscountAmount("0");
                    Alert.alert("Reset Complete", "You are now ready to search for a patient to create a new invoice.");
                }
            }
        ]
    );
  };

  // Handler now expects EnhancedPatient
  const handleSelectPatient = (patient: EnhancedPatient) => {
    setSelectedPatient(patient);
    setCurrentInvoiceId('');
    setPaymentStatus("Not Paid");
    setPaymentMethod("Cash");
    setServices(defaultNewServices);
    setDiscountAmount("0");
    setSearch(""); 
  };
  
  // #5: Eye Icon Handler (Load Existing Invoice for Edit)
  const handleLoadInvoiceForEdit = (invoice: InvoiceItem) => {
    // Cast patient from context/mock to EnhancedPatient to satisfy state requirements
    const patientDetails = patients.find(p => (p as EnhancedPatient).id === invoice.patientId) as EnhancedPatient | undefined; 
    
    if (!patientDetails) {
        Alert.alert("Error", "Patient details for this invoice could not be found.");
        return;
    }

    setSelectedPatient(patientDetails);
    setCurrentInvoiceId(invoice.invoiceId);
    setPaymentStatus(invoice.status);
    setPaymentMethod(invoice.method);
    setDiscountAmount(invoice.discountAmount.toString());
    setServices(invoice.services);
    setSearch(""); 
  };
  
  // #3: Save Changes Handler
  const handleSaveInvoice = () => {
    if (!selectedPatient) return;
    
    // 1. Validation Check
    if (subtotal <= 0) {
        Alert.alert("Validation Error", "Invoice must contain services with a positive subtotal.");
        return;
    }

    const savedInvoiceData: InvoiceItem = {
        invoiceId: isEditingExisting ? currentInvoiceId : `INV-${Math.floor(Math.random() * 10000) + 100}`,
        patientId: selectedPatient.id, // ID is now safely accessed
        patientName: selectedPatient.name,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }),
        totalAmount: total,
        status: paymentStatus,
        method: paymentMethod,
        services: services,
        discountAmount: numericDiscount,
    };

    // 2. Mock Update/Creation Logic
    if (isEditingExisting) {
        setInvoiceHistory(prevHistory => 
            prevHistory.map(inv => inv.invoiceId === savedInvoiceData.invoiceId ? savedInvoiceData : inv)
        );
        Alert.alert("Success", `Invoice ${savedInvoiceData.invoiceId} updated successfully.`);
    } else {
        setInvoiceHistory(prevHistory => [savedInvoiceData, ...prevHistory]);
        setCurrentInvoiceId(savedInvoiceData.invoiceId);
        Alert.alert("Success", `New Invoice ${savedInvoiceData.invoiceId} created and saved.`);
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
    const newId = services.length > 0 ? Math.max(...services.map(s => s.id)) + 1 : 1;
    setServices(prevServices => [
        ...prevServices, 
        { id: newId, description: "New Service Item", qty: 1, unitPrice: 0 }
    ]);
  };

  const handleRemoveService = (id: number) => {
    if (services.length > 1) {
      setServices(prevServices => prevServices.filter(item => item.id !== id));
    } else {
      Alert.alert("Cannot Remove", "The invoice must contain at least one service item.");
    }
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
          <h2>Invoice #${currentInvoiceId || 'NEW'}</h2>
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
                <td>L.E ${numericDiscount.toFixed(2)}</td>
              </tr>
              <tr class="total-row">
                <td colspan="3">TOTAL DUE</td>
                <td>L.E ${total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          <p><strong>Payment Method:</strong> ${paymentMethod}</p>
        </body>
      </html>
    `;
  };

  const handlePrint = async () => {
    if (!isPatientSelected) {
        Alert.alert("Action Required", "Please select or create an invoice before printing.");
        return;
    }
    const html = generateInvoiceHTML();
    await Print.printAsync({ html });
  };

  const handleDownloadPDF = async () => {
    if (!isPatientSelected) {
        Alert.alert("Action Required", "Please select or create an invoice before downloading a PDF.");
        return;
    }

    try {
        const html = generateInvoiceHTML();
        const { uri } = await Print.printToFileAsync({ html });
        const fileName = `${selectedPatient.name.replace(/\s/g, '_')}_invoice_${currentInvoiceId || new Date().getTime()}.pdf`;
        
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
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.pageTitle}><Ionicons name="card-outline" size={24} color={PRIMARY_DARK} /> Payments Dashboard</Text>
      <Text style={styles.subtitle}>
        Process new invoices, edit existing records, and review comprehensive payment history.
      </Text>

      {/* NEW INVOICE SECTION HEADER */}
      <View style={[styles.invoiceCreationHeader, styles.cardShadow]}>
          <Text style={styles.sectionTitle}>
             <Ionicons name="document-text-outline" size={18} color={PRIMARY_DARK} /> 
             {isEditingExisting ? `Editing Invoice: ${currentInvoiceId}` : 'New Invoice & Processing'}
          </Text>
          <TouchableOpacity onPress={handleReset} style={styles.newInvoiceButton}>
              <Ionicons name="add-circle-outline" size={20} color={WHITE} />
              <Text style={styles.newInvoiceButtonText}>{isPatientSelected ? 'Clear & Start New' : 'Start New Invoice'}</Text>
          </TouchableOpacity>
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

          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableText, styles.colDescription]}>DESCRIPTION</Text>
            <Text style={[styles.tableText, styles.colQtyPrice]}>QTY</Text>
            <Text style={[styles.tableText, styles.colQtyPrice]}>PRICE</Text>
            <Text style={[styles.tableText, styles.colAmount]}>AMOUNT</Text>
            <View style={styles.colRemovePlaceholder} />
          </View>

          {/* Editable Service Rows */}
          {services.map((item) => (
            <View style={styles.tableRow} key={item.id}>
              <TextInput
                  style={[styles.rowInput, styles.colDescription, { fontWeight: '600' }]}
                  value={item.description}
                  onChangeText={(text) => handleUpdateService(item.id, 'description', text)}
                  editable={isPatientSelected}
              />
              <TextInput
                  style={[styles.rowInput, styles.colQtyPrice]}
                  value={item.qty.toString()}
                  onChangeText={(text) => handleUpdateService(item.id, 'qty', text)}
                  keyboardType="numeric"
                  editable={isPatientSelected}
              />
              <TextInput
                  style={[styles.rowInput, styles.colQtyPrice]}
                  value={item.unitPrice.toString()}
                  onChangeText={(text) => handleUpdateService(item.id, 'unitPrice', text)}
                  keyboardType="numeric"
                  editable={isPatientSelected}
              />
              <Text style={[styles.rowText, styles.colAmount]}>
                  L.E {(item.qty * item.unitPrice).toFixed(2)}
              </Text>
              <TouchableOpacity 
                  style={styles.colRemove} 
                  onPress={() => handleRemoveService(item.id)}
                  disabled={!isPatientSelected || services.length <= 1}
              >
                  <Ionicons name="remove-circle-outline" size={20} color={!isPatientSelected || services.length <= 1 ? BORDER_LIGHT : ERROR_COLOR} />
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

                    {/* Mark Paid Button */}
                    <TouchableOpacity 
                        style={[styles.payButton, paymentStatus === 'Paid' ? styles.payButtonDisabled : {}]} 
                        onPress={handleMarkPaid}
                        disabled={paymentStatus === 'Paid' || total <= 0}
                    >
                        <Text style={styles.payButtonText}>
                            <Ionicons name="checkmark-circle-outline" size={18} color={WHITE} /> {paymentStatus === 'Paid' ? 'Payment Completed' : 'Mark as Finalized/Paid'}
                        </Text>
                    </TouchableOpacity>

                    {/* Print / Download Buttons */}
                    <View style={styles.bottomButtons}>
                        <TouchableOpacity style={styles.iconButton} onPress={handlePrint}>
                            <Ionicons name="print-outline" size={20} color={PRIMARY_DARK} />
                            <Text style={styles.iconText}>Print Invoice</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.iconButton} onPress={handleDownloadPDF}>
                            <Ionicons name="download-outline" size={20} color={PRIMARY_DARK} />
                            <Text style={styles.iconText}>Download PDF</Text>
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
});