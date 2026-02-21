/**
 * Login Screen
 * 
 * CONCEPTS EXPLAINED:
 * 1. TextInput: React Native's text input component (like <input> in web)
 * 2. useState: Manages form state (email, password)
 * 3. useDispatch: Access Redux store to update user state
 * 4. useNavigation: React Navigation hook to navigate between screens
 * 5. Alert: Built-in popup for showing messages (we'll add Toast later)
 * 6. Form Handling: Controlled inputs (value + onChange)
 * 
 * Based on your web app LoginPage component
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { showToast } from '../components/toast';
import { useNavigation, useRoute } from '@react-navigation/native';
import { setUser, setLoading, updateUser } from '../store/slices/authSlice';
import authAPI from '../api/auth';
import useThemeColors from '../theme/useThemeColors';
import Logo from '../components/Logo';
import { signInWithGoogle } from '../utils/googleSignIn';
import { signInWithApple, isAppleSignInAvailable } from '../utils/appleSignIn';
import Svg, { Path } from 'react-native-svg';
import useThemeTypography from '../theme/useThemeTypography';
import { useTranslation } from 'react-i18next';
import { updateFCMTokenWithCustomerId } from '../utils/initializeNotifications';
import { useQueryClient } from '@tanstack/react-query';

export default function LoginScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const styles = getStyles(colors, typography);

  // Get return navigation params if coming from DealDetail
  const returnTo = route.params?.returnTo;
  const returnParams = route.params?.returnParams;

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [isSubmittingGoogle, setIsSubmittingGoogle] = useState(false);
  const [isSubmittingApple, setIsSubmittingApple] = useState(false);

  // Phone prompt state
  const [showPhonePrompt, setShowPhonePrompt] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null); // Store user temporarily for phone prompt

  /**
   * Navigate to appropriate screen after login
   */
  const navigateAfterLogin = () => {
    if (returnTo === 'DealDetail' && returnParams) {
      navigation.replace('RootTabs', {
        screen: 'Home',
        params: {
          screen: 'DealDetail',
          params: returnParams,
        },
      });
      return;
    }
    if (returnTo && returnTo !== 'DealDetail') {
      navigation.replace(returnTo, returnParams);
      return;
    } else {
      navigation.replace('RootTabs');
    }
  };

  /**
   * Handle phone save after login
   */
  const handlePhoneSave = async () => {
    if (!phoneInput.trim()) {
      setPhoneError(t('common.phoneRequired'));
      return;
    }
    setPhoneError('');
    setPhoneSaving(true);
    try {
      const response = await authAPI.editProfile({
        name: loggedInUser?.name,
        phone: phoneInput.trim(),
      });
      if (response?.user) {
        dispatch(updateUser(response.user));
        queryClient.setQueryData(['user-profile'], response.user);
      }
      setShowPhonePrompt(false);
      showToast.success(t('common.loggedIn'), t('common.welcomeBackMessage'));
      navigateAfterLogin();
    } catch (error) {
      showToast.error(t('common.updateFailed'), error.message || t('common.failedToUpdateProfile'));
    } finally {
      setPhoneSaving(false);
    }
  };

  /**
   * Skip phone prompt and navigate
   */
  const handleSkipPhone = () => {
    setShowPhonePrompt(false);
    showToast.success(t('common.loggedIn'), t('common.welcomeBackMessage'));
    navigateAfterLogin();
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    // Validation
    if (!email.trim() || !password) {
      showToast.error(t('common.error'), t('common.emailAndPasswordRequired'));
      return;
    }

    setIsSubmittingForm(true);
    dispatch(setLoading(true));

    try {
      // Call login API
      const response = await authAPI.login(email.trim(), password);

      // Update Redux with user data
      if (response.user) {
        dispatch(setUser(response.user));
        dispatch(setLoading(false));

        // Update FCM token with customerId after email/password login
        if (response.user._id) {
          try {
            // console.log('🔄 [LoginScreen] Updating FCM token with customerId:', response.user._id);
            const fcmResult = await updateFCMTokenWithCustomerId(response.user._id);
            // if (fcmResult.success) {
            //   console.log('✅ [LoginScreen] FCM token updated successfully');
            // } else {
            //   console.warn('⚠️ [LoginScreen] FCM token update failed:', fcmResult.error);
            // }
          } catch (err) {
            // console.warn('⚠️ [LoginScreen] Failed to update FCM token:', err);
            // Don't block login if FCM update fails
          }
        }

        // Check if user has phone number
        if (!response.user.phone) {
          // Show phone prompt
          setLoggedInUser(response.user);
          setPhoneInput('');
          setPhoneError('');
          setShowPhonePrompt(true);
        } else {
          // Show success message and navigate
          showToast.success(t('common.loggedIn'), t('common.welcomeBackMessage'));
          navigateAfterLogin();
        }
      }
    } catch (error) {
      dispatch(setLoading(false));

      // Handle Email Not Verified
      if (error.error === 'EMAIL_NOT_VERIFIED' || error.message?.includes('verify')) {
        const userId = error.data?.data?.userId || error.data?.userId;

        if (userId) {
          showToast.error(t('common.loginFailed'), "Please verify your email first.");
          navigation.navigate('Verification', {
            userId: userId,
            email: email.trim()
          });
          return;
        }
      }

      // Show error message
      const errorMessage = error.message || t('common.loginFailedMessage');
      showToast.error(t('common.loginFailed'), errorMessage);
    } finally {
      setIsSubmittingForm(false);
    }
  };

  /**
   * Navigate to Signup screen
   */
  const navigateToSignup = () => {
    navigation.navigate('Signup');
  };

  /**
   * Handle Google Sign-In
   */
  const handleGoogleSignIn = async () => {
    if (isSubmittingForm || isSubmittingGoogle) {
      return;
    }

    setIsSubmittingGoogle(true);
    dispatch(setLoading(true));

    try {
      // Get Google user info and ID token
      const googleUserInfo = await signInWithGoogle();

      // Call backend API with Google credentials
      const response = await authAPI.googleOAuth(googleUserInfo);

      // Update Redux with user data
      if (response.user) {
        dispatch(setUser(response.user));
        dispatch(setLoading(false));

        // Update FCM token with customerId after Google login
        if (response.user._id) {
          try {
            // console.log('🔄 [LoginScreen] Updating FCM token with customerId (Google):', response.user._id);
            const fcmResult = await updateFCMTokenWithCustomerId(response.user._id);
            // if (fcmResult.success) {
            //   console.log('✅ [LoginScreen] FCM token updated successfully (Google)');
            // } else {
            //   console.warn('⚠️ [LoginScreen] FCM token update failed (Google):', fcmResult.error);
            // }
          } catch (err) {
            // console.warn('⚠️ [LoginScreen] Failed to update FCM token (Google):', err);
            // Don't block login if FCM update fails
          }
        }

        // Check if user has phone number (Google users typically don't)
        if (!response.user.phone) {
          // Show phone prompt
          setLoggedInUser(response.user);
          setPhoneInput('');
          setPhoneError('');
          setShowPhonePrompt(true);
        } else {
          // Show success message and navigate
          showToast.success(t('common.loggedIn'), t('common.welcomeBackMessage'));
          navigateAfterLogin();
        }
      }
    } catch (error) {
      dispatch(setLoading(false));

      // Don't show error if user cancelled
      if (error.cancelled) {
        return;
      }

      // Show error message
      const errorMessage = error.message || t('common.failedToSignInWithGoogle');
      showToast.error(t('common.googleSignInFailed'), errorMessage);
    } finally {
      setIsSubmittingGoogle(false);
    }
  };

  const handleAppleSignIn = async () => {
    if (isSubmittingForm || isSubmittingGoogle || isSubmittingApple) return;

    setIsSubmittingApple(true);
    dispatch(setLoading(true));

    try {
      const appleUserInfo = await signInWithApple();
      const response = await authAPI.appleOAuth(appleUserInfo);

      if (response.user) {
        dispatch(setUser(response.user));
        dispatch(setLoading(false));

        if (response.user._id) {
          try {
            await updateFCMTokenWithCustomerId(response.user._id);
          } catch (err) {
            // Don't block login if FCM update fails
          }
        }

        if (!response.user.phone) {
          setLoggedInUser(response.user);
          setPhoneInput('');
          setPhoneError('');
          setShowPhonePrompt(true);
        } else {
          showToast.success(t('common.loggedIn'), t('common.welcomeBackMessage'));
          navigateAfterLogin();
        }
      }
    } catch (error) {
      dispatch(setLoading(false));
      if (error.cancelled) return;
      const errorMessage = error.message || t('common.failedToSignInWithApple');
      showToast.error(t('common.appleSignInFailed'), errorMessage);
    } finally {
      setIsSubmittingApple(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      style={[styles.container, { flex: 1 }]}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      enabled
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Logo/Title Section */
        }
        <View style={styles.header}>
          <Logo size={122} height={35.5} style={styles.logo} />
          {/* <Text style={[styles.welcomeText, { color: colors.text, fontFamily: typography.fontFamily.semiBold }]}>{t('login.welcomeBack')}</Text> */}
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{t('login.loginToAccount')}</Text>
        </View>

        {/* Login Form */}
        <View style={styles.form}>
          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>{t('login.email')}</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.white }]}
              placeholder={t('login.emailPlaceholder')}
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              blurOnSubmit={false}
              editable={!isSubmittingForm && !isSubmittingGoogle}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>{t('login.password')}</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.white }]}
              placeholder={t('login.passwordPlaceholder')}
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              editable={!isSubmittingForm && !isSubmittingGoogle}
            />
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }, isSubmittingForm && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmittingForm || isSubmittingGoogle}
          >
            {isSubmittingForm ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>{t('common.login')}</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={[styles.dividerText, { color: colors.textMuted }]}>{t('common.orContinueWith')}</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign In Button */}
          <TouchableOpacity
            style={[styles.googleButton, isSubmittingGoogle && styles.buttonDisabled]}
            onPress={handleGoogleSignIn}
            disabled={isSubmittingForm || isSubmittingGoogle || isSubmittingApple}
          >
            {isSubmittingGoogle ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <View style={styles.googleButtonContent}>
                <View style={styles.googleIconContainer}>
                  <GoogleIconSVG />
                </View>
                <View style={styles.googleButtonTextContainer}>
                  <Text style={styles.googleButtonText}>{t('common.continueWithGoogle')}</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>

          {/* Apple Sign In Button */}
          {isAppleSignInAvailable() && (
            <TouchableOpacity
              style={[styles.appleButton, isSubmittingApple && styles.buttonDisabled]}
              onPress={handleAppleSignIn}
              disabled={isSubmittingForm || isSubmittingGoogle || isSubmittingApple}
            >
              {isSubmittingApple ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <View style={styles.appleButtonContent}>
                  <View style={styles.appleIconContainer}>
                    <AppleIconSVG />
                  </View>
                  <View style={styles.appleButtonTextContainer}>
                    <Text style={styles.appleButtonText}>{t('common.continueWithApple')}</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* Signup Link */}
          <View style={styles.signupContainer}>
            <Text style={[styles.signupText, { color: colors.textMuted }]}>
              {t('common.dontHaveAccount')}{' '}
              <Text style={[styles.signupLink, { color: colors.primary }]} onPress={navigateToSignup}>
                {t('common.signUp')}
              </Text>
            </Text>
          </View>

          {/* Privacy Policy Link */}
          <View style={styles.privacyContainer}>
            <Text
              style={[styles.privacyLink, { color: colors.textMuted }]}
              onPress={() => navigation.navigate('PrivacyPolicy')}
            >
              {t('privacyPolicy.privacyPolicyLink')}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Phone Required Modal - shows after login if no phone number */}
      <Modal
        visible={showPhonePrompt}
        transparent
        animationType="fade"
        onRequestClose={handleSkipPhone}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.phoneModalContainer}
        >
          <View style={styles.phoneModalBackdrop} />
          <View style={styles.phoneModalCard}>
            <Text style={styles.phoneModalTitle}>{t('common.addPhoneTitle')}</Text>
            <Text style={styles.phoneModalSubtitle}>{t('common.addPhoneSubtitle')}</Text>

            <TextInput
              style={styles.phoneInput}
              placeholder={t('common.enterYourPhoneNumber')}
              placeholderTextColor={colors.textMuted}
              value={phoneInput}
              onChangeText={(value) => {
                setPhoneInput(value);
                setPhoneError('');
              }}
              keyboardType="phone-pad"
            />
            {phoneError ? <Text style={styles.phoneError}>{phoneError}</Text> : null}

            <View style={styles.phoneActions}>
              <TouchableOpacity
                style={[styles.phoneButton, styles.phoneLaterButton]}
                onPress={handleSkipPhone}
                disabled={phoneSaving}
              >
                <Text style={styles.phoneLaterText}>{t('common.doItLater')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.phoneButton, styles.phoneSaveButton]}
                onPress={handlePhoneSave}
                disabled={phoneSaving}
              >
                {phoneSaving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.phoneSaveText}>{t('common.save')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// Google Icon SVG - Always renders correctly
function GoogleIconSVG() {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}

function AppleIconSVG() {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24">
      <Path
        d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

const getStyles = (colors, typography) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  logo: {
    color: colors.primary,
    marginBottom: 4,
  },
  welcomeText: {
    color: colors.text,
    marginBottom: 4,
    fontFamily: typography.fontFamily.semiBold,
  },
  subtitle: {
    color: colors.textMuted,
    textAlign: 'center',
    fontFamily: typography.fontFamily.regular,
  },
  form: {
    flex: 1,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    color: colors.text,
    marginBottom: 6,
    fontFamily: typography.fontFamily.regular,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: colors.text,
    backgroundColor: colors.white,
    fontFamily: typography.fontFamily.regular,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 48,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.white,
    fontFamily: typography.fontFamily.regular,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: 12,
    color: colors.textMuted,
    fontFamily: typography.fontFamily.regular,
  },
  googleButton: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#4285F4',
    minHeight: 48,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  googleIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: colors.white,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E8F0FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonTextContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    letterSpacing: 0.1,
    fontFamily: typography.fontFamily.regular,
  },
  appleButton: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#000000',
    minHeight: 48,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginTop: 12,
  },
  appleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  appleIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#000000',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleButtonTextContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    letterSpacing: 0.1,
    fontFamily: typography.fontFamily.regular,
  },
  signupContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  signupText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
  },
  signupLink: {
    color: colors.primary,
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
  },
  privacyContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  privacyLink: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    textDecorationLine: 'underline',
  },

  // Phone Modal Styles
  phoneModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  phoneModalCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  phoneModalTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
    marginBottom: 8,
  },
  phoneModalSubtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
    marginBottom: 16,
  },
  phoneInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: colors.text,
    backgroundColor: colors.white,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
  },
  phoneError: {
    marginTop: 6,
    color: colors.error || '#d32f2f',
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
  },
  phoneActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  phoneButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneLaterButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  phoneLaterText: {
    color: colors.text,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semiBold,
  },
  phoneSaveButton: {
    backgroundColor: colors.primary,
  },
  phoneSaveText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semiBold,
  },
});

