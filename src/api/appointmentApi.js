// src/api/appointmentApi.js
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

/**
 * Get all patients for patient selection dropdown
 * @returns {Promise<Object>} List of patients
 */
export const getPatients = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/patients/`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error fetching patients:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch patients'
    };
  }
};

/**
 * Get all doctors for doctor selection dropdown
 * @returns {Promise<Object>} List of doctors
 */
export const getDoctors = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/doctors/`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch doctors'
    };
  }
};

/**
 * Get all services for service selection dropdown
 * @returns {Promise<Object>} List of services
 */
export const getServices = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/services/`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error fetching services:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch services'
    };
  }
};

/**
 * Create a new appointment
 * @param {Object} appointmentData - The appointment data
 * @param {number} appointmentData.patient - Patient ID
 * @param {number} appointmentData.doctor - Doctor ID
 * @param {string} appointmentData.type - Appointment type/service name
 * @param {string} appointmentData.date - Date in YYYY-MM-DD format
 * @param {string} appointmentData.time - Time in HH:MM format (24-hour)
 * @param {string} appointmentData.status - Status (booked, checked_in, completed, cancelled)
 * @param {string} appointmentData.notes - Optional notes
 * @returns {Promise<Object>} Created appointment
 */
export const createAppointment = async (appointmentData) => {
  try {
    console.log('Creating appointment with data:', appointmentData);
    console.log('Posting to:', `${API_BASE_URL}/appointments/`);
    
    const response = await axios.post(`${API_BASE_URL}/appointments/`, appointmentData);
    
    console.log('Appointment created successfully:', response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error creating appointment:', error);
    console.error('Error response:', error.response);
    console.error('Error response data:', error.response?.data);
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data || 'Failed to create appointment'
    };
  }
};

/**
 * Get all appointments with optional filters
 * @param {Object} params - Query parameters (date, status, doctor, patient)
 * @returns {Promise<Object>} List of appointments
 */
export const getAppointments = async (params = {}) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/appointments/`, { params });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch appointments'
    };
  }
};

/**
 * Get a single appointment by ID
 * @param {number} appointmentId - The appointment ID
 * @returns {Promise<Object>} Appointment details
 */
export const getAppointment = async (appointmentId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/appointments/${appointmentId}/`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch appointment'
    };
  }
};

/**
 * Update an appointment
 * @param {number} appointmentId - The appointment ID
 * @param {Object} updateData - The data to update
 * @returns {Promise<Object>} Updated appointment
 */
export const updateAppointment = async (appointmentId, updateData) => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/appointments/${appointmentId}/`, updateData);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error updating appointment:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to update appointment'
    };
  }
};

/**
 * Delete an appointment
 * @param {number} appointmentId - The appointment ID
 * @returns {Promise<Object>} Deletion result
 */
export const deleteAppointment = async (appointmentId) => {
  try {
    await axios.delete(`${API_BASE_URL}/appointments/${appointmentId}/`);
    return {
      success: true,
      data: { message: 'Appointment deleted successfully' }
    };
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to delete appointment'
    };
  }
};

/**
 * Add a service to an appointment
 * @param {number} appointmentId - The appointment ID
 * @param {number} serviceId - The service ID
 * @param {number} cost - Optional cost override
 * @returns {Promise<Object>} Result
 */
export const addServiceToAppointment = async (appointmentId, serviceId, cost = null) => {
  try {
    const data = { service_id: serviceId };
    if (cost !== null) {
      data.appo_cost = cost;
    }
    const response = await axios.post(`${API_BASE_URL}/appointments/${appointmentId}/add_service/`, data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error adding service to appointment:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to add service'
    };
  }
};

/**
 * Convert 12-hour time format to 24-hour format
 * @param {string} time12h - Time in "HH:MM AM/PM" format
 * @returns {string} Time in "HH:MM:SS" format
 */
export const convertTo24Hour = (time12h) => {
  if (!time12h) return '09:00:00'; // Default fallback
  
  console.log('Converting time:', time12h);
  
  // If already in 24-hour format (contains no AM/PM)
  if (!time12h.includes('AM') && !time12h.includes('PM')) {
    // Already 24-hour format, just ensure seconds
    if (time12h.includes(':')) {
      const parts = time12h.split(':');
      if (parts.length === 2) {
        return `${parts[0].padStart(2, '0')}:${parts[1]}:00`;
      }
      return time12h;
    }
    return '09:00:00';
  }
  
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');
  
  hours = parseInt(hours, 10);
  
  if (modifier === 'PM' && hours !== 12) {
    hours += 12;
  } else if (modifier === 'AM' && hours === 12) {
    hours = 0;
  }
  
  const result = `${hours.toString().padStart(2, '0')}:${minutes}:00`;
  console.log('Converted to:', result);
  return result;
};

/**
 * Convert 24-hour time format to 12-hour format
 * @param {string} time24h - Time in "HH:MM:SS" format
 * @returns {string} Time in "HH:MM AM/PM" format
 */
export const convertTo12Hour = (time24h) => {
  if (!time24h) return '';
  
  const [hours24, minutes] = time24h.split(':');
  let hours = parseInt(hours24, 10);
  const modifier = hours >= 12 ? 'PM' : 'AM';
  
  if (hours === 0) {
    hours = 12;
  } else if (hours > 12) {
    hours -= 12;
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes} ${modifier}`;
};
