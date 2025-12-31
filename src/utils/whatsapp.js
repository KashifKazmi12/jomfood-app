import { Linking } from 'react-native';

/**
 * Get WhatsApp URL - Same implementation as Web version
 * Removes all non-numeric characters and creates wa.me URL
 * 
 * @param {string} officePhone - Phone number with possible formatting
 * @returns {string|null} - WhatsApp URL or null if invalid
 */
export const getWhatsAppUrl = (officePhone) => {
  if (!officePhone) {
    return null;
  }
  
  // Remove all non-numeric characters (spaces, hyphens, parentheses, dots, plus signs, etc.)
  // Phone numbers should already include country code (e.g., 60 for Malaysia, 92 for Pakistan)
  const phoneNumber = officePhone.replace(/\D/g, '');
  
  if (!phoneNumber || phoneNumber.length === 0) {
    return null;
  }
  
  return `https://wa.me/${phoneNumber}`;
};

/**
 * Open WhatsApp - Same URL format as Web version
 * Uses Linking.openURL() which automatically:
 * - Opens WhatsApp app if installed
 * - Falls back to WhatsApp Web if app not installed
 * - Works on both iOS and Android
 * 
 * @param {string} officePhone - Phone number with possible formatting
 * @returns {Promise<void>}
 */
export const openWhatsApp = async (officePhone) => {
  const url = getWhatsAppUrl(officePhone);
  
  if (!url) {
    throw new Error('Invalid phone number');
  }
  
  try {
    // Same https://wa.me/ URL as web - Linking handles it automatically
    await Linking.openURL(url);
  } catch (error) {
    console.error('Error opening WhatsApp:', error);
    throw error;
  }
};

