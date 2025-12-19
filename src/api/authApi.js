// src/api/authApi.js
import axios from 'axios';

// Base URL for the backend API
const API_BASE_URL = 'http://127.0.0.1:8000/api';

/**
 * Login function to authenticate doctors and receptionists
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<Object>} - Returns user data with role
 */
export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/login/`, {
      email,
      password
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    if (error.response) {
      // Server responded with error status
      return {
        success: false,
        error: error.response.data.error || 'Invalid email or password'
      };
    } else if (error.request) {
      // Request made but no response received
      return {
        success: false,
        error: 'Unable to connect to server. Please check if the backend is running.'
      };
    } else {
      // Other errors
      return {
        success: false,
        error: 'An unexpected error occurred'
      };
    }
  }
};

export default {
  login
};
