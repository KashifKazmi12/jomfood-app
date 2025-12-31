/**
 * Background Message Handler
 * 
 * This file must be imported in index.js to handle background notifications
 * IMPORTANT: Must be outside React component lifecycle
 */

import messaging from '@react-native-firebase/messaging';

// Background message handler (must be outside React component)
// Wrap in try-catch to prevent app crash if Firebase isn't initialized
try {
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('📬 Background notification received:', remoteMessage);
    
    // Handle background notification
    // React Native automatically shows the notification
    // You can add custom logic here if needed (e.g., update local storage, etc.)
  });
} catch (error) {
  console.warn('⚠️ Failed to set background message handler:', error);
  // Don't crash the app if Firebase messaging isn't available
}

