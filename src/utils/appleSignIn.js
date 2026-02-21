/**
 * Apple Sign-In Utility
 *
 * Handles Apple Sign-In authentication flow for iOS.
 * Uses @invertase/react-native-apple-authentication
 */

import { Platform } from 'react-native';

let appleAuth;
try {
  if (Platform.OS === 'ios') {
    appleAuth = require('@invertase/react-native-apple-authentication').default;
  }
} catch (e) {
  // Package not installed or not available
}

/**
 * Check if Apple Sign-In is available on this device
 * Only available on iOS 13+
 */
export const isAppleSignInAvailable = () => {
  if (Platform.OS !== 'ios' || !appleAuth) return false;
  return appleAuth.isSupported;
};

/**
 * Sign in with Apple
 * @returns {Promise<Object>} Apple user info with identityToken
 */
export const signInWithApple = async () => {
  if (!appleAuth) {
    throw { message: 'Apple Sign-In is not available on this device', cancelled: false };
  }

  try {
    const appleAuthRequestResponse = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
    });

    const credentialState = await appleAuth.getCredentialStateForUser(
      appleAuthRequestResponse.user,
    );

    if (credentialState !== appleAuth.State.AUTHORIZED) {
      throw { message: 'Apple Sign-In was not authorized', cancelled: false };
    }

    const { identityToken, authorizationCode, email, fullName } = appleAuthRequestResponse;

    if (!identityToken) {
      throw { message: 'No identity token received from Apple', cancelled: false };
    }

    // Apple only provides name on the first sign-in
    let name = null;
    if (fullName) {
      const parts = [fullName.givenName, fullName.familyName].filter(Boolean);
      if (parts.length > 0) {
        name = parts.join(' ');
      }
    }

    return {
      identityToken,
      authorizationCode,
      email,
      name,
    };
  } catch (error) {
    if (error.code === '1001' || error.code === 'ERR_CANCELED') {
      throw { message: 'Sign in was cancelled', cancelled: true };
    }
    throw { message: error.message || 'Failed to sign in with Apple', error };
  }
};
