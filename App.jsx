/**
 * JomFood App - Main Entry Point
 * 
 * This is the root component of your React Native app.
 * 
 * CONCEPTS EXPLAINED:
 * 1. react-native-gesture-handler: MUST be imported first (before React)
 *    - Handles touch gestures for navigation (swipe back, etc.)
 * 2. AppProviders: Wraps entire app with Redux (state) + React Query (API data)
 * 3. SafeAreaProvider: Ensures content respects device safe areas (notches, status bar)
 * 4. StatusBar: Controls the status bar appearance
 * 5. AppNavigator: Handles all screen navigation
 * 
 * Component Hierarchy:
 * App → AppProviders → SafeAreaProvider → StatusBar → AppNavigator → Screens
 */

import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { StatusBar, useColorScheme, Text, TextInput, Platform, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import AppProviders from './src/providers/AppProviders';
import SplashScreen from './src/screens/SplashScreen';
import GradientBackground from './src/components/GradientBackground';
import ErrorBoundary from './src/components/ErrorBoundary';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import typography from './src/constants/typography';
import colors from './src/constants/colors';
import { configureGoogleSignIn } from './src/utils/googleSignIn';
import { initializeNotifications } from './src/utils/initializeNotifications';

// Ensure icon fonts are loaded (Android sometimes needs explicit load)
Feather.loadFont();
MaterialCommunityIcons.loadFont();

// Apply global font family to all Text and TextInput components
// This ensures Poppins-Regular is the default font throughout the app
// You only need to specify fontFamily when using a different weight (semiBold, bold, etc.)
Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.style = { fontFamily: typography.fontFamily.default };

TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.style = { fontFamily: typography.fontFamily.default };

export default function App() {
  // Detect if device is in dark mode (Android/iOS)
  const isDarkMode = useColorScheme() === 'dark';
  const [showSplash, setShowSplash] = useState(true);

  // Configure Google Sign-In and initialize notifications when app starts
  useEffect(() => {
    // Handle unhandled promise rejections
    const rejectionHandler = (error) => {
      console.error('❌ [App] Unhandled promise rejection:', error);
      // Prevent app crash by catching the error
    };

    // Handle unhandled errors
    const errorHandler = (error, isFatal) => {
      console.error('❌ [App] Unhandled error:', error, 'isFatal:', isFatal);
      // Prevent app crash
    };

    // Set up global error handlers
    if (global.ErrorUtils) {
      const originalHandler = global.ErrorUtils.getGlobalHandler();
      global.ErrorUtils.setGlobalHandler((error, isFatal) => {
        errorHandler(error, isFatal);
        if (originalHandler) {
          originalHandler(error, isFatal);
        }
      });
    }

    // Handle promise rejections
    if (typeof Promise !== 'undefined' && Promise.reject) {
      const originalReject = Promise.reject;
      // Note: This is a workaround - React Native doesn't have a global unhandledrejection
    }

    // Configure Google Sign-In
    try {
      configureGoogleSignIn();
    } catch (err) {
      console.warn('⚠️ Failed to configure Google Sign-In:', err);
    }
    
    // Initialize notifications (without customerId if not logged in)
    initializeNotifications().catch(err => {
      console.warn('⚠️ Failed to initialize notifications:', err);
    });

    return () => {
      // Cleanup if needed
    };
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  // Show splash screen first (wrapped with providers for QueryClient access)
  if (showSplash) {
    return (
      <ErrorBoundary>
        <AppProviders>
          <SafeAreaProvider>
            <SplashScreen onComplete={handleSplashComplete} />
          </SafeAreaProvider>
        </AppProviders>
      </ErrorBoundary>
    );
  }

  // Show main app after splash
  return (
    <ErrorBoundary>
      <AppProviders>
        <SafeAreaProvider>
          <StatusBar 
            barStyle="dark-content"
            backgroundColor="#ffffff"
            translucent={false}
          />
          <GradientBackground style={{ flex: 1 }}>
            <AppNavigator />
          </GradientBackground>
          <ToastWithSafeArea />
        </SafeAreaProvider>
      </AppProviders>
    </ErrorBoundary>
  );
}

function ToastWithSafeArea() {
  const insets = useSafeAreaInsets();
  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : insets.top;
  
  // Calculate proper top offset: status bar + padding for better visibility
  // Use a more reliable calculation that works on both emulator and real devices
  const topOffset = Platform.OS === 'android' 
    ? Math.max(statusBarHeight + 12, 60) // Android: status bar + extra padding
    : Math.max(insets.top + 8, 50); // iOS: safe area + padding
  
  // Custom Toast configuration with app typography
  const toastConfig = {
    success: ({ text1, text2 }) => (
      <BaseToast
        text1={text1}
        text2={text2}
        style={{ borderLeftColor: colors.success }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{
          fontSize: typography.fontSize.md,
          fontFamily: typography.fontFamily.semiBold,
          color: colors.text,
        }}
        text2Style={{
          fontSize: typography.fontSize.base,
          fontFamily: typography.fontFamily.regular,
          color: colors.textMuted,
        }}
      />
    ),
    error: ({ text1, text2 }) => (
      <BaseToast
        text1={text1}
        text2={text2}
        style={{ borderLeftColor: colors.error }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{
          fontSize: typography.fontSize.md,
          fontFamily: typography.fontFamily.semiBold,
          color: colors.text,
        }}
        text2Style={{
          fontSize: typography.fontSize.base,
          fontFamily: typography.fontFamily.regular,
          color: colors.textMuted,
        }}
      />
    ),
    info: ({ text1, text2 }) => (
      <BaseToast
        text1={text1}
        text2={text2}
        style={{ borderLeftColor: colors.info }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{
          fontSize: typography.fontSize.md,
          fontFamily: typography.fontFamily.semiBold,
          color: colors.text,
        }}
        text2Style={{
          fontSize: typography.fontSize.base,
          fontFamily: typography.fontFamily.regular,
          color: colors.textMuted,
        }}
      />
    ),
  };
  
  return <Toast topOffset={topOffset} config={toastConfig} />;
}

// Base Toast component with app typography
function BaseToast({ text1, text2, style, contentContainerStyle, text1Style, text2Style }) {
  return (
    <View
      style={{
        height: 'auto',
        minHeight: 60,
        width: '90%',
        backgroundColor: colors.white,
        borderRadius: 8,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
        paddingVertical: 12,
        ...style,
      }}
    >
      <View style={{ flex: 1, paddingHorizontal: 15, justifyContent: 'center', ...contentContainerStyle }}>
        {text1 && (
          <Text
            style={{
              fontSize: typography.fontSize.md,
              fontFamily: typography.fontFamily.semiBold,
              color: colors.text,
              marginBottom: text2 ? 4 : 0,
              ...text1Style,
            }}
          >
            {text1}
          </Text>
        )}
        {text2 && (
          <Text
            style={{
              fontSize: typography.fontSize.base,
              fontFamily: typography.fontFamily.regular,
              color: colors.textMuted,
              ...text2Style,
            }}
          >
            {text2}
          </Text>
        )}
      </View>
    </View>
  );
}


