/**
 * Google Sign-In Utility
 * 
 * Handles Google Sign-In configuration and authentication flow
 */

import { GoogleSignin } from '@react-native-google-signin/google-signin';
import SECRETS from '../config/secrets';

/**
 * Configure Google Sign-In
 * Should be called once when app starts
 */
export const configureGoogleSignIn = () => {
  //check if in debug or release mode then according pass the google_client_id_debug or google_client_id
  GoogleSignin.configure({
    webClientId: __DEV__ ? SECRETS.google_client_id_debug : SECRETS.google_client_id, // From Google Cloud Console
    iosClientId: SECRETS.google_client_id, // Explicitly pass iOS Client ID for RNGoogleSignin
    offlineAccess: true, // If you want to access Google API on behalf of the user FROM YOUR SERVER
    forceCodeForRefreshToken: true, // [Android] related to `serverAuthCode`, read the docs link below *.
  });
};

/**
 * Sign in with Google
 * Always shows account selection by clearing cached session first
 * @returns {Promise<Object>} Google user info with idToken
 */
export const signInWithGoogle = async () => {
  try {
    // Check if Google Play Services are available
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    
    // Clear Google's cached session to always show account selection
    try {
      await GoogleSignin.signOut();
      await GoogleSignin.revokeAccess();
    } catch (clearError) {
      // Ignore errors when clearing (might not be signed in)
      console.log('Clearing Google session:', clearError);
    }
    
    // Always show account selection
    const userInfo = await GoogleSignin.signIn();
    
    // Get the ID token
    const idToken = userInfo.data?.idToken;
    
    if (!idToken) {
      throw new Error('No ID token received from Google');
    }

    // Extract user information
    const user = userInfo.data?.user || userInfo.user;
    
    return {
      idToken,
      email: user.email,
      name: user.name,
      picture: user.photo,
      given_name: user.givenName,
      family_name: user.familyName,
    };
  } catch (error) {
    // Handle user cancellation
    if (error.code === 'SIGN_IN_CANCELLED') {
      throw { message: 'Sign in was cancelled', cancelled: true };
    }
    
    // Handle developer error (usually SHA-1 fingerprint not configured)
    if (error.code === 'DEVELOPER_ERROR' || error.message?.includes('DEVELOPER_ERROR')) {
      throw { 
        message: 'Google Sign-In is not properly configured. Please contact support or check SHA-1 fingerprint in Google Cloud Console.', 
        developerError: true,
        error 
      };
    }
    
    // Handle other errors
    if (error.code === 'IN_PROGRESS') {
      throw { message: 'Sign in already in progress', inProgress: true };
    }
    
    if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
      throw { message: 'Google Play Services not available', playServicesError: true };
    }
    
    throw { message: error.message || 'Failed to sign in with Google', error };
  }
};

/**
 * Sign out from Google
 */
export const signOutFromGoogle = async () => {
  try {
    await GoogleSignin.signOut();
    await GoogleSignin.revokeAccess();
  } catch (error) {
    console.error('Google Sign-Out Error:', error);
  }
};

/**
 * Check if user is already signed in to Google
 */
export const isSignedIn = async () => {
  try {
    return await GoogleSignin.isSignedIn();
  } catch (error) {
    return false;
  }
};

/**
 * Get current Google user (if signed in)
 */
export const getCurrentGoogleUser = async () => {
  try {
    const isSignedIn = await GoogleSignin.isSignedIn();
    if (isSignedIn) {
      return await GoogleSignin.getCurrentUser();
    }
    return null;
  } catch (error) {
    return null;
  }
};

