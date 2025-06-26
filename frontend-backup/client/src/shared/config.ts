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
  // Always use the live backend URL
  return 'https://backendmobile-4swg.onrender.com/api';
};

// Determine the appropriate Socket.IO URL
const getSocketUrl = () => {
  // Always use the live backend URL
  return 'https://backendmobile-4swg.onrender.com';
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
  // Always use the live backend URL
  config.API_BASE_URL = 'https://backendmobile-4swg.onrender.com/api';
  config.SOCKET_URL = 'https://backendmobile-4swg.onrender.com';
};

export default config; 