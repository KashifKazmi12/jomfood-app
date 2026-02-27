/**
 * Auth API Service
 * 
 * CONCEPTS EXPLAINED:
 * 1. Service Layer: Organized API calls by feature
 * 2. Authentication: Login, Signup, Google OAuth
 * 3. Token Management: Automatically stores tokens after login
 * 
 * Based on your web app:
 * - Signup: POST /auth/customer/register
 * - Login: POST /auth/customer/login (assumed, adjust if different)
 * - Google OAuth: Custom endpoint (adjust as needed)
 * 
 * Usage:
 * import authAPI from '../api/auth';
 * const result = await authAPI.login(email, password);
 */

import api from './client';
import { authStorage } from '../utils/authStorage';
import i18n from '../i18n/config';

const authAPI = {
  /**
   * Customer Login
   * 
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User data and tokens
   * 
   * Expected Response:
   * {
   *   user: { id, name, email, ... },
   *   tokens: {
   *     access_token: "...",
   *     refresh_token: "..."
   *   }
   * }
   */
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/customer/login', {
        email: email.trim(),
        password,
      });

      // API tokens can be at root or under data
      const accessToken = response?.data?.token ?? response?.token;
      const refreshToken = response?.data?.refreshToken ?? response?.refreshToken;

      if (accessToken) {
        await authStorage.setAccessToken(accessToken);
      }
      if (refreshToken) {
        await authStorage.setRefreshToken(refreshToken);
      }

      // Fetch current user profile after login
      let user = null;
      try {
        const meResponse = await api.get('/auth/customer/me');
        // Some backends return 200 with an auth error payload
        const isInvalid = meResponse?.status === false || meResponse?.token === 'expired';
        if (isInvalid) {
          throw { message: meResponse?.message || 'Unauthorized', error: 'UNAUTHORIZED' };
        }
        // Support multiple possible response shapes
        user = meResponse?.user || meResponse?.data?.user || meResponse?.data || meResponse || null;
      } catch (e) {
        // If /me fails, still return tokens so UI can decide what to do
      }

      return { user, tokens: { access_token: accessToken, refresh_token: refreshToken } };
    } catch (error) {
      // Re-throw error so caller can handle it
      throw error;
    }
  },

  /**
   * Customer Signup/Register
   * 
   * @param {Object} userData - User registration data
   * @param {string} userData.name - Full name
   * @param {string} userData.email - Email address
   * @param {string} userData.password - Password
   * @param {string} [userData.phone] - Phone number (optional)
   * @returns {Promise<Object>} User data
   * 
   * Expected Response:
   * {
   *   user: { id, name, email, phone, ... }
   * }
   * Note: Signup doesn't return tokens - user must login after signup
   */
  signup: async (userData) => {
    try {
      const payload = {
        name: userData.name.trim(),
        email: userData.email.trim(),
      };

      if (userData.password) {
        payload.password = userData.password;
      }

      if (userData.phone && userData.phone.trim()) {
        payload.phone = userData.phone.trim();
      }

      const response = await api.post('/auth/customer/register', payload);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Google OAuth Authentication
   * 
   * @param {Object} userInfo - Google user info from OAuth
   * @returns {Promise<Object>} User data and tokens
   * 
   * Expected Response:
   * {
   *   success: true,
   *   data: {
   *     user: { ... },
   *     tokens: {
   *       access_token: "...",
   *       refresh_token: "..."
   *     }
   *   }
   * }
   * 
   * TODO: Adjust endpoint and payload based on your Google OAuth API
   */
  googleOAuth: async (userInfo) => {
    try {
      const response = await api.post('/auth/customer/google', {
        idToken: userInfo.idToken,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        given_name: userInfo.given_name,
        family_name: userInfo.family_name,
        is_mobile: true,
      });

      // API tokens can be at root or under data
      const accessToken = response?.data?.tokens?.access_token ?? response?.data?.token ?? response?.token;
      const refreshToken = response?.data?.tokens?.refresh_token ?? response?.data?.refreshToken ?? response?.refreshToken;

      if (accessToken) {
        await authStorage.setAccessToken(accessToken);
      }
      if (refreshToken) {
        await authStorage.setRefreshToken(refreshToken);
      }

      // Fetch current user profile after Google OAuth (same as email/password login)
      // This ensures we have the complete user object with _id and all fields
      let user = null;
      try {
        const meResponse = await api.get('/auth/customer/me');
        // Some backends return 200 with an auth error payload
        const isInvalid = meResponse?.status === false || meResponse?.token === 'expired';
        if (isInvalid) {
          throw { message: meResponse?.message || 'Unauthorized', error: 'UNAUTHORIZED' };
        }
        // Support multiple possible response shapes
        user = meResponse?.user || meResponse?.data?.user || meResponse?.data || meResponse || null;
      } catch (e) {
        // If /me fails, fall back to user from OAuth response
        user = response.data?.user || response.user || null;
      }

      // Return user and tokens in consistent format
      return {
        user,
        tokens: { access_token: accessToken, refresh_token: refreshToken },
      };
    } catch (error) {
      // Handle specific error codes (matching your web app)
      const errorCode = error.error || error.data?.error;

      switch (errorCode) {
        case 'MISSING_FIELDS':
          throw { ...error, message: 'Please provide all required information' };
        case 'INVALID_TOKEN':
          throw { ...error, message: 'Invalid Google token. Please try again.' };
        case 'EMAIL_MISMATCH':
          throw { ...error, message: 'Email verification failed' };
        case 'GOOGLE_ACCOUNT_CONFLICT':
          throw { ...error, message: 'This email is already linked to a different Google account.' };
        case 'SERVER_ERROR':
          throw { ...error, message: 'Server error. Please try again later.' };
        default:
          throw error;
      }
    }
  },

  /**
   * Apple OAuth Authentication
   *
   * @param {Object} userInfo - Apple user info from Sign in with Apple
   * @returns {Promise<Object>} User data and tokens
   */
  appleOAuth: async (userInfo) => {
    try {
      const response = await api.post('/auth/customer/apple', {
        identityToken: userInfo.identityToken,
        authorizationCode: userInfo.authorizationCode,
        email: userInfo.email,
        name: userInfo.name,
        is_mobile: true,
      });

      const accessToken = response?.data?.tokens?.access_token ?? response?.data?.token ?? response?.token;
      const refreshToken = response?.data?.tokens?.refresh_token ?? response?.data?.refreshToken ?? response?.refreshToken;

      if (accessToken) {
        await authStorage.setAccessToken(accessToken);
      }
      if (refreshToken) {
        await authStorage.setRefreshToken(refreshToken);
      }

      let user = null;
      try {
        const meResponse = await api.get('/auth/customer/me');
        const isInvalid = meResponse?.status === false || meResponse?.token === 'expired';
        if (isInvalid) {
          throw { message: meResponse?.message || 'Unauthorized', error: 'UNAUTHORIZED' };
        }
        user = meResponse?.user || meResponse?.data?.user || meResponse?.data || meResponse || null;
      } catch (e) {
        user = response.data?.user || response.user || null;
      }

      return {
        user,
        tokens: { access_token: accessToken, refresh_token: refreshToken },
      };
    } catch (error) {
      const errorCode = error.error || error.data?.error;

      switch (errorCode) {
        case 'MISSING_FIELDS':
          throw { ...error, message: 'Please provide all required information' };
        case 'INVALID_TOKEN':
          throw { ...error, message: 'Invalid Apple token. Please try again.' };
        case 'EMAIL_REQUIRED':
          throw { ...error, message: 'Email is required. Please allow email sharing with Apple Sign-In.' };
        case 'APPLE_ACCOUNT_CONFLICT':
          throw { ...error, message: 'This email is already linked to a different Apple account.' };
        case 'SERVER_ERROR':
          throw { ...error, message: 'Server error. Please try again later.' };
        default:
          throw error;
      }
    }
  },

  /**
   * Logout - Clear tokens
   */
  logout: async () => {
    await authStorage.clearAll();
  },

  /**
   * Delete account
   * DELETE /auth/customer/delete
   */
  deleteAccount: async () => {
    try {
      // Add language parameter
      const lang = i18n?.language || 'en';
      const langValue = (typeof lang === 'string' && lang === 'malay') ? 'malay' : 'en';
      const langParam = `?lang=${langValue}`;
      const response = await api.delete(`/auth/customer/delete${langParam}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get current user profile
   * GET /auth/customer/me
   * 
   * @returns {Promise<Object>} User profile data
   * 
   * Expected Response:
   * {
   *   _id: "...",
   *   name: "...",
   *   email: "...",
   *   phone: "..." | null,
   *   image: "..." | null,
   *   authProvider: "email" | "google" | "both",
   *   canUseGoogle: true | false,
   *   canUsePassword: true | false,
   * }
   */
  getMe: async () => {
    try {
      // Add language parameter
      const lang = i18n?.language || 'en';
      const langValue = (typeof lang === 'string' && lang === 'malay') ? 'malay' : 'en';
      const langParam = `?lang=${langValue}`;
      const response = await api.get(`/auth/customer/me${langParam}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Change password
   * PUT /auth/customer/change-password
   * 
   * @param {string} oldPassword - Current password
   * @param {string} newPassword - New password (min 6 characters)
   * @returns {Promise<Object>} Success response
   * 
   * Expected Response:
   * {
   *   success: true,
   *   message: "Password changed successfully"
   * }
   */
  changePassword: async (oldPassword, newPassword) => {
    try {
      const lang = i18n?.language || 'en';
      const langValue = (typeof lang === 'string' && lang === 'malay') ? 'malay' : 'en';
      const langParam = `?lang=${langValue}`;
      const response = await api.put(`/auth/customer/change-password${langParam}`, {
        oldPassword,
        newPassword,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  setPassword: async (password) => {
    try {
      const response = await api.put('/auth/customer/set-password', { password });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Edit profile
   * PUT /auth/customer/profile
   * 
   * @param {Object} profileData - Profile data to update
   * @param {string} [profileData.name] - User name
   * @param {string} [profileData.phone] - Phone number (can be null to clear)
   * @param {string} [profileData.image] - Image URL (can be null to clear)
   * @returns {Promise<Object>} Updated user data
   * 
   * Expected Response:
   * {
   *   success: true,
   *   message: "Profile updated successfully",
   *   user: { _id, name, email, phone, image, authProvider, canUseGoogle, canUsePassword }
   * }
   */
  editProfile: async (profileData) => {
    try {
      // Add language parameter
      const lang = i18n?.language || 'en';
      const langValue = (typeof lang === 'string' && lang === 'malay') ? 'malay' : 'en';
      const langParam = `?lang=${langValue}`;
      const response = await api.put(`/auth/customer/profile${langParam}`, profileData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Verify Email
   * POST /auth/customer/verify-email
   * 
   * @param {string} userId - User ID
   * @param {string} otp - 6-digit OTP code
   * @returns {Promise<Object>} User data and tokens
   */
  verifyEmail: async (userId, otp) => {
    try {
      const response = await api.post('/auth/customer/verify-email', {
        userId,
        otp,
      });

      // Handle tokens if present (successful verification)
      const accessToken = response?.data?.tokens?.token || response?.data?.tokens?.access_token || response?.token;
      const refreshToken = response?.data?.tokens?.refreshToken || response?.data?.tokens?.refresh_token || response?.refreshToken;

      if (accessToken) {
        await authStorage.setAccessToken(accessToken);
      }
      if (refreshToken) {
        await authStorage.setRefreshToken(refreshToken);
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Resend OTP
   * POST /auth/customer/resend-otp
   * 
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Success message
   */
  resendOTP: async (userId) => {
    try {
      const response = await api.post('/auth/customer/resend-otp', {
        userId,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Forgot Password - Send OTP
   * POST /auth/customer/forgot-password/send-otp
   */
  sendForgotPasswordOTP: async (email) => {
    try {
      const response = await api.post('/auth/customer/forgot-password/send-otp', {
        email: email.trim(),
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Forgot Password - Verify OTP
   * POST /auth/customer/forgot-password/verify-otp
   */
  verifyForgotPasswordOTP: async (email, otp) => {
    try {
      const response = await api.post('/auth/customer/forgot-password/verify-otp', {
        email: email.trim(),
        otp: String(otp).trim(),
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Forgot Password - Reset Password
   * POST /auth/customer/forgot-password/reset
   */
  resetForgotPassword: async (email, otp, password) => {
    try {
      const response = await api.post('/auth/customer/forgot-password/reset', {
        email: email.trim(),
        otp: String(otp).trim(),
        password,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
};

export default authAPI;

