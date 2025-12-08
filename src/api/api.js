import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000/api/'; // change if running on device/emulator

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

// --- Patients
export const getPatients = () => api.get('patients/');
export const getPatient = (id) => api.get(`patients/${id}/`);
export const createPatient = (data) => api.post('patients/', data);
export const updatePatient = (id, data) => api.put(`patients/${id}/`, data);
export const partialUpdatePatient = (id, data) => api.patch(`patients/${id}/`, data);
export const deletePatient = (id) => api.delete(`patients/${id}/`);

// --- Doctors
export const getDoctors = () => api.get('doctors/');
export const getDoctor = (id) => api.get(`doctors/${id}/`);

// --- Receptionists
export const getReceptionists = () => api.get('receptionists/');

// --- Services
export const getServices = () => api.get('services/');

// --- Appointments
export const getAppointments = (params = {}) => api.get('appointments/', { params });
export const getAppointment = (id) => api.get(`appointments/${id}/`);
export const createAppointment = (data) => api.post('appointments/', data);
export const updateAppointment = (id, data) => api.put(`appointments/${id}/`, data);
export const patchAppointment = (id, data) => api.patch(`appointments/${id}/`, data);
export const deleteAppointment = (id) => api.delete(`appointments/${id}/`);

// --- Appointment Services
export const getAppointmentServices = () => api.get('appointment-services/');
export const createAppointmentService = (data) => api.post('appointment-services/', data);

// --- Invoices
export const getInvoices = () => api.get('invoices/');
export const createInvoice = (data) => api.post('invoices/', data);

// --- Medical Records
export const getRecords = (params = {}) => api.get('records/', { params });
export const createRecord = (data) => api.post('records/', data);

// --- Medications
export const getMedications = () => api.get('medications/');

// --- Prescriptions
export const getPrescriptions = (params = {}) => api.get('prescriptions/', { params });
export const getPrescription = (id) => api.get(`prescriptions/${id}/`);
export const createPrescription = (data) => api.post('prescriptions/', data);
export const addPrescriptionMedication = (prescriptionId, data) => api.post(`prescriptions/${prescriptionId}/medications/`, data);

// --- Prescription-Medications
export const getPrescriptionMedications = () => api.get('prescription-medications/');

// --- Treatment Plans & Sessions
export const getTreatmentPlans = () => api.get('treatment-plans/');
export const getTreatmentSessions = (params = {}) => api.get('treatment-sessions/', { params });
export const createTreatmentSession = (data) => api.post('treatment-sessions/', data);

// --- Allergies
export const getAllergies = () => api.get('allergies/');
export const createAllergy = (data) => api.post('allergies/', data);

// --- Patient Allergies
export const getPatientAllergies = (params = {}) => api.get('patient-allergies/', { params });
export const createPatientAllergy = (data) => api.post('patient-allergies/', data);

export default api;
