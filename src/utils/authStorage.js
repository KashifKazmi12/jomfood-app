/**
 * Auth Storage Utility - React Native Version
 * 
 * CONCEPTS EXPLAINED:
 * 1. AsyncStorage: React Native's equivalent to localStorage (web)
 *    - Stores data asynchronously (non-blocking)
 *    - Persists data even after app closes
 *    - Returns Promises (use await or .then())
 * 
 * 2. Token Storage: Access token for API auth, Refresh token for getting new tokens
 * 
 * 3. Why separate files? Organized code, easy to maintain
 * 
 * Usage:
 * import { authStorage } from '../utils/authStorage';
 * await authStorage.setAccessToken(token);
 * const token = await authStorage.getAccessToken();
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const LAST_GOOGLE_EMAIL_KEY = 'lastGoogleEmail';

export const authStorage = {
  /**
   * Get access token from storage
   * @returns {Promise<string|null>} Token or null if not found
   */
  getAccessToken: async () => {
    try {
      const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      return token || null;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  },

  /**
   * Save access token to storage
   * @param {string} token - Access token to save
   */
  setAccessToken: async (token) => {
    try {
      if (token) {
        await AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
      } else {
        await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
      }
    } catch (error) {
      console.error('Error setting access token:', error);
    }
  },

  /**
   * Remove access token from storage
   */
  clearAccessToken: async () => {
    try {
      await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('Error clearing access token:', error);
    }
  },

  /**
   * Get refresh token from storage
   * @returns {Promise<string|null>} Refresh token or null if not found
   */
  getRefreshToken: async () => {
    try {
      const token = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      return token || null;
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  },

  /**
   * Save refresh token to storage
   * @param {string} token - Refresh token to save
   */
  setRefreshToken: async (token) => {
    try {
      if (token) {
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
      } else {
        await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
      }
    } catch (error) {
      console.error('Error setting refresh token:', error);
    }
  },

  /**
   * Remove refresh token from storage
   */
  clearRefreshToken: async () => {
    try {
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error clearing refresh token:', error);
    }
  },

  /**
   * Clear all tokens (logout)
   */
  clearAll: async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
        AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
      ]);
      // Note: We keep lastGoogleEmail so user can auto-login to same account
    } catch (error) {
      console.error('Error clearing all tokens:', error);
    }
  },

  /**
   * Get last logged-in Google email
   */
  getLastGoogleEmail: async () => {
    try {
      return await AsyncStorage.getItem(LAST_GOOGLE_EMAIL_KEY);
    } catch (error) {
      console.error('Error getting last Google email:', error);
      return null;
    }
  },

  /**
   * Save last logged-in Google email
   */
  setLastGoogleEmail: async (email) => {
    try {
      if (email) {
        await AsyncStorage.setItem(LAST_GOOGLE_EMAIL_KEY, email);
      } else {
        await AsyncStorage.removeItem(LAST_GOOGLE_EMAIL_KEY);
      }
    } catch (error) {
      console.error('Error setting last Google email:', error);
    }
  },

  /**
   * Clear last Google email (when user wants to switch accounts)
   */
  clearLastGoogleEmail: async () => {
    try {
      await AsyncStorage.removeItem(LAST_GOOGLE_EMAIL_KEY);
    } catch (error) {
      console.error('Error clearing last Google email:', error);
    }
  },
};

export default authStorage;

