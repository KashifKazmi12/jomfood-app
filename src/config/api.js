/**
 * API Configuration
 * 
 * CONCEPTS EXPLAINED:
 * 1. Base URL: Centralized API endpoint - change in one place
 * 2. Environment-based: Different URLs for dev/prod
 * 
 * IMPORTANT FOR PRODUCTION BUILD:
 * Before building release APK, change BASE_URL to your production backend URL
 */

// Detect environment (__DEV__ is true in development mode)
const isDevelopment = __DEV__;

const API_CONFIG = {
  // Development URL (used when running in dev mode)
  DEV_BASE_URL: 'http://192.168.100.98:5055/api',
  
  // Production URL (used in release builds)
  // ⚠️ CHANGE THIS TO YOUR LIVE BACKEND URL BEFORE BUILDING RELEASE APK
  PROD_BASE_URL: 'https://jscapi.jomsmart.com/api', // TODO: Replace with your actual production URL
  
  // Automatically use the right URL based on environment
  BASE_URL: isDevelopment 
    ? 'http://192.168.100.98:5055/api'  // Development
    : 'https://jscapi.jomsmart.com/api', // Production - CHANGE THIS!
  
  // Timeout for requests (milliseconds)
  TIMEOUT: 10000,
};

export default API_CONFIG;