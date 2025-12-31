/**
 * Notification Initialization Utilities
 * 
 * Handles FCM token registration and management with backend
 */

import messaging from '../firebase-config';
import { requestNotificationPermission, getFCMToken } from '../firebase-config';
import { Platform } from 'react-native';
import api from '../api/client';

/**
 * Initialize Firebase notifications for a user
 * @param {string|null} customerId - Customer ID to associate with FCM token (optional)
 * @returns {Promise<{success: boolean, token: string|null, error: string|null}>}
 */
export async function initializeNotifications(customerId = null) {
  try {
    // 1. Request notification permission
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      return {
        success: false,
        token: null,
        error: "Notification permission denied",
      };
    }

    // 2. Get FCM token
    const token = await getFCMToken();
    if (!token) {
      return {
        success: false,
        token: null,
        error: "FCM token not generated",
      };
    }

    // 3. Save FCM token to backend
    try {
      const userAgent = Platform.OS; // 'ios' or 'android'
      const payload = {
        token: token.trim(),
        customerId: customerId || null,
        userAgent: userAgent,
      };

      await api.post(`/jomfood/fcm-token`, payload);
      console.log('✅ FCM token registered with backend');
    } catch (error) {
      console.warn('⚠️ Failed to save FCM token to backend:', error);
      // Don't fail - token is still valid for receiving notifications
    }

    return {
      success: true,
      token,
      error: null,
    };
  } catch (error) {
    console.error("❌ Error initializing notifications:", error);
    return {
      success: false,
      token: null,
      error: error.message,
    };
  }
}

/**
 * Updates existing FCM token with customerId (call after login)
 * @param {string} customerId - Customer ID to link with token
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function updateFCMTokenWithCustomerId(customerId) {
  if (!customerId) {
    console.warn('⚠️ [updateFCMTokenWithCustomerId] No customerId provided');
    return { success: false, error: "No customerId provided" };
  }

  try {
    console.log('🔄 [updateFCMTokenWithCustomerId] Starting update for customerId:', customerId);
    
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.warn('⚠️ [updateFCMTokenWithCustomerId] Notification permission not granted');
      return { success: false, error: "Notification permission not granted" };
    }

    const token = await getFCMToken();
    if (!token) {
      console.warn('⚠️ [updateFCMTokenWithCustomerId] No FCM token available');
      return { success: false, error: "No FCM token available" };
    }

    console.log('📱 [updateFCMTokenWithCustomerId] FCM token retrieved, length:', token.length);

    const payload = {
      token: token.trim(),
      customerId: customerId,
      userAgent: Platform.OS,
    };

    console.log('📤 [updateFCMTokenWithCustomerId] Sending payload to backend:', {
      tokenLength: payload.token.length,
      customerId: payload.customerId,
      userAgent: payload.userAgent,
    });

    const response = await api.post(`/jomfood/fcm-token`, payload);
    
    console.log('📥 [updateFCMTokenWithCustomerId] Backend response:', {
      hasData: !!response?.data,
      hasSuccess: !!(response?.data?.success || response?.success),
      responseKeys: Object.keys(response || {}),
    });
    
    if (response?.data?.success || response?.success) {
      console.log('✅ [updateFCMTokenWithCustomerId] FCM token updated successfully with customerId:', customerId);
      return { success: true, error: null };
    } else {
      console.warn('⚠️ [updateFCMTokenWithCustomerId] Unexpected backend response structure:', response);
      return { success: false, error: "Unexpected backend response" };
    }
  } catch (error) {
    console.error('❌ [updateFCMTokenWithCustomerId] Error updating FCM token with customerId:', {
      error: error.message,
      errorType: error.error,
      customerId,
    });
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Removes customerId from FCM token (call on logout)
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function removeCustomerIdFromFCMToken() {
  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      return { success: false, error: "Notification permission not granted" };
    }

    const token = await getFCMToken();
    if (!token) {
      return { success: false, error: "No FCM token available" };
    }

    const payload = {
      token: token.trim(),
      customerId: null,
      userAgent: Platform.OS,
    };

    const response = await api.post(`/jomfood/fcm-token`, payload);
    
    if (response?.data?.success || response?.success) {
      console.log('✅ CustomerId removed from FCM token');
      return { success: true, error: null };
    } else {
      return { success: false, error: "Unexpected backend response" };
    }
  } catch (error) {
    console.error('❌ Error removing customerId from FCM token:', error);
    return { success: false, error: error.message };
  }
}

