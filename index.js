/**
 * @format
 */

// Handle uncaught errors to prevent app crash
if (typeof ErrorUtils !== 'undefined') {
  const originalHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.error('❌ Global error handler:', error, 'isFatal:', isFatal);
    // Still call original handler for proper error reporting
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });
}

// Initialize i18n before app starts (with error handling)
try {
  require('./src/i18n/config');
} catch (error) {
  console.error('❌ Failed to initialize i18n:', error);
}

// Register background message handler (with error handling)
try {
  require('./src/messaging');
} catch (error) {
  console.error('❌ Failed to initialize messaging:', error);
  // Don't crash if messaging fails to initialize
}

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
