/**
 * Firebase Configuration
 * 
 * Handles Firebase Cloud Messaging (FCM) setup for push notifications
 */

import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';

/**
 * Request notification permission
 * @returns {Promise<boolean>} True if permission granted
 */
export const requestNotificationPermission = async () => {
  try {
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('✅ iOS: Notification permission granted');
        return true;
      } else {
        console.log('❌ iOS: Notification permission denied');
        return false;
      }
    } else {
      // Android permission is granted by default
      const authStatus = await messaging().requestPermission();
      return authStatus === messaging.AuthorizationStatus.AUTHORIZED;
    }
  } catch (error) {
    console.error('❌ Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Get FCM token
 * @returns {Promise<string|null>} FCM token or null if error
 */
export const getFCMToken = async () => {
  try {
    if (Platform.OS === 'ios') {
      await messaging().registerDeviceForRemoteMessages();
    }
    const token = await messaging().getToken();
    console.log('✅ FCM Token:', token);
    return token;
  } catch (error) {
    console.error('❌ Error getting FCM token:', error);
    return null;
  }
};

/**
 * Delete FCM token (on logout)
 * @returns {Promise<void>}
 */
export const deleteFCMToken = async () => {
  try {
    await messaging().deleteToken();
    console.log('✅ FCM token deleted');
  } catch (error) {
    console.error('❌ Error deleting FCM token:', error);
  }
};

export default messaging;

