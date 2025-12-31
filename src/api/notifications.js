/**
 * Notifications API Service
 * 
 * Handles all notification-related API calls
 */

import api from './client';
import i18n from '../i18n/config';

/**
 * Get language parameter for API calls
 * Returns 'malay' for Malay, 'en' for English
 */
const getApiLanguage = () => {
  try {
    if (!i18n || !i18n.language) {
      return 'en';
    }
    const currentLang = i18n.language;
    return (typeof currentLang === 'string' && currentLang === 'malay') ? 'malay' : 'en';
  } catch (error) {
    // console.warn('⚠️ [notificationsAPI] Error getting language, defaulting to en:', error);
    return 'en';
  }
};

export const notificationsAPI = {
  /**
   * Get customer notifications
   * GET /api/jomfood/notifications/customer/:customerId
   * 
   * @param {string} customerId - Customer ID
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @param {string} params.status - Filter by status (e.g., 'unread', 'read')
   * @returns {Promise<Object>} Notifications response
   */
  getNotifications: async (customerId, params = {}) => {
    if (!customerId || typeof customerId !== 'string' || !/^[0-9a-fA-F]{24}$/.test(customerId)) {
      throw { 
        message: 'Invalid customer ID format', 
        error: 'INVALID_CUSTOMER_ID',
        customerId 
      };
    }

    const query = new URLSearchParams();
    
    // Add language parameter
    const lang = getApiLanguage();
    if (lang && typeof lang === 'string') {
      query.append('lang', lang);
    }
    
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));
    if (params.status) query.append('status', params.status);
    
    const queryString = query.toString();
    const endpoint = `/jomfood/notifications/customer/${customerId}${queryString ? `?${queryString}` : ''}`;
    const response = await api.get(endpoint);
    
    return response;
  },

  /**
   * Mark notification as read
   * PATCH /api/jomfood/notifications/customer/:notificationId/read
   * 
   * @param {string} notificationId - Notification ID
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Response
   */
  markAsRead: async (notificationId, customerId) => {
    if (!notificationId || typeof notificationId !== 'string' || !/^[0-9a-fA-F]{24}$/.test(notificationId)) {
      throw { 
        message: 'Invalid notification ID format', 
        error: 'INVALID_NOTIFICATION_ID',
        notificationId 
      };
    }
    if (!customerId || typeof customerId !== 'string' || !/^[0-9a-fA-F]{24}$/.test(customerId)) {
      throw { 
        message: 'Invalid customer ID format', 
        error: 'INVALID_CUSTOMER_ID',
        customerId 
      };
    }

    // Add language parameter
    const lang = getApiLanguage();
    const langParam = (lang && typeof lang === 'string') ? `?lang=${lang}` : '';
    
    const response = await api.patch(`/jomfood/notifications/customer/${notificationId}/read${langParam}`, {
      customerId
    });
    
    return response;
  },

  /**
   * Mark all notifications as read
   * PATCH /api/jomfood/notifications/customer/:customerId/read-all
   * 
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Response
   */
  markAllAsRead: async (customerId) => {
    if (!customerId || typeof customerId !== 'string' || !/^[0-9a-fA-F]{24}$/.test(customerId)) {
      throw { 
        message: 'Invalid customer ID format', 
        error: 'INVALID_CUSTOMER_ID',
        customerId 
      };
    }

    // Add language parameter
    const lang = getApiLanguage();
    const langParam = (lang && typeof lang === 'string') ? `?lang=${lang}` : '';
    
    const response = await api.patch(`/jomfood/notifications/customer/${customerId}/read-all${langParam}`);
    
    return response;
  },

  /**
   * Get unread notification count
   * GET /api/jomfood/notifications/customer/:customerId/unread-count
   * 
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Unread count response
   */
  getUnreadCount: async (customerId) => {
    if (!customerId || typeof customerId !== 'string' || !/^[0-9a-fA-F]{24}$/.test(customerId)) {
      throw { 
        message: 'Invalid customer ID format', 
        error: 'INVALID_CUSTOMER_ID',
        customerId 
      };
    }

    // Add language parameter
    const lang = getApiLanguage();
    const langParam = (lang && typeof lang === 'string') ? `?lang=${lang}` : '';
    
    const response = await api.get(`/jomfood/notifications/customer/${customerId}/unread-count${langParam}`);
    
    return response;
  },
};

export default notificationsAPI;

