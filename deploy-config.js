// Deployment Configuration for Production
// This file contains settings for deploying the app to a public URL

const config = {
  // Backend URL for production deployment
  // Replace with your actual deployed backend URL (e.g., Render, Heroku, etc.)
  BACKEND_URL: process.env.BACKEND_URL || 'https://your-backend-url.onrender.com',
  
  // Frontend URL for production deployment
  FRONTEND_URL: process.env.FRONTEND_URL || 'https://your-frontend-url.vercel.app',
  
  // Database configuration
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost:5432/mobile_repair_tracker',
  
  // JWT Secret (should be set in environment variables)
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  
  // Fast2SMS API Key
  FAST2SMS_API_KEY: process.env.FAST2SMS_API_KEY || 'your_fast2sms_api_key_here',
  
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Port configuration
  PORT: process.env.PORT || 5000,
  
  // CORS settings
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  
  // SSL settings for production
  SSL_ENABLED: process.env.SSL_ENABLED === 'true',
  
  // Logging level
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};

// Helper function to get the appropriate API base URL
function getApiBaseUrl() {
  if (config.NODE_ENV === 'production') {
    return config.BACKEND_URL;
  }
  
  // For development, use localhost with network access
  const host = process.env.HOST || '0.0.0.0';
  const port = config.PORT;
  return `http://${host}:${port}`;
}

// Helper function to get the appropriate frontend URL
function getFrontendUrl() {
  if (config.NODE_ENV === 'production') {
    return config.FRONTEND_URL;
  }
  
  // For development, use localhost
  return 'http://localhost:5173';
}

module.exports = {
  ...config,
  getApiBaseUrl,
  getFrontendUrl,
};

// Export for ES modules
export default {
  ...config,
  getApiBaseUrl,
  getFrontendUrl,
}; 