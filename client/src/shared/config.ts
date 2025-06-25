// API Configuration for different environments
const isDevelopment = import.meta.env.DEV;

// Get the current hostname for dynamic API URL detection
const getCurrentHost = () => {
  if (typeof window !== 'undefined') {
    return window.location.hostname;
  }
  return 'localhost';
};

// Determine the appropriate API base URL
const getApiBaseUrl = () => {
  if (isDevelopment) {
    // Use the same host as the frontend, different port for backend
    const hostname = getCurrentHost();
    
    // If accessing from Replit URL, use the same host with port 5000
    if (hostname.includes('replit.dev')) {
      return `${window.location.protocol}//${hostname.replace(':5000', '')}:5000/api`;
    }
    
    // Local development
    return 'http://localhost:5000/api';
  }
  
  // Production - using relative path since we're serving from same origin
  return '/api';
};

// Determine the appropriate Socket.IO URL
const getSocketUrl = () => {
  if (isDevelopment) {
    const hostname = getCurrentHost();
    
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return 'http://192.168.125.238:5000';
    }
    
    return 'http://localhost:5000';
  }
  
  // Production - using the exact deployed backend URL
  return 'https://mobileedrf-509mbr4dj-ritheshs-projects-2bddf162.vercel.app';
};

export const config = {
  // API base URL
  API_BASE_URL: getApiBaseUrl(),
  
  // Socket.IO URL
  SOCKET_URL: getSocketUrl(),
  
  // Environment
  IS_DEVELOPMENT: isDevelopment,
  
  // App name
  APP_NAME: 'Mobile Repair Tracker',
  
  // Version
  VERSION: '1.0.0',
  
  // Features
  FEATURES: {
    E_BILL: true,
    SMS: true,
    WHATSAPP: true,
    REAL_TIME_SYNC: true,
    AUTHENTICATION: true,
  },
};

// Helper function to update API URLs dynamically (useful for mobile testing)
export const updateApiUrls = (backendIp: string) => {
  if (isDevelopment) {
    config.API_BASE_URL = `http://${backendIp}:5000/api`;
    config.SOCKET_URL = `http://${backendIp}:5000`;
  }
};

export default config; 