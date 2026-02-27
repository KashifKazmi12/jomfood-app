import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import authAPI from '../api/auth';
import useThemeColors from '../theme/useThemeColors';
import useThemeTypography from '../theme/useThemeTypography';
import { showToast } from '../components/toast';
import Logo from '../components/Logo';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const styles = getStyles(colors, typography);

  const [step, setStep] = useState('request'); // request -> verify -> reset
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef(null);
  const inputRefs = useRef([]);

  const otp = useMemo(() => otpDigits.join(''), [otpDigits]);

  const startTimer = () => {
    setCanResend(false);
    setCountdown(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async () => {
    if (!email.trim()) {
      showToast.error(t('common.error'), t('forgotPassword.emailRequired'));
      return;
    }

    setSubmitting(true);
    try {
      await authAPI.sendForgotPasswordOTP(email.trim());
      showToast.success(t('forgotPassword.otpSentTitle'), t('forgotPassword.otpSentMessage'));
      setStep('verify');
      setOtpDigits(['', '', '', '', '', '']);
      startTimer();
      setTimeout(() => inputRefs.current[0]?.focus(), 120);
    } catch (error) {
      showToast.error(t('forgotPassword.failedTitle'), error.message || t('forgotPassword.failedToSendOtp'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOtpChange = (value, index) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    const next = [...otpDigits];

    if (cleanValue.length > 1) {
      // Handle pasted code
      const chars = cleanValue.slice(0, 6).split('');
      chars.forEach((char, i) => {
        next[i] = char;
      });
      setOtpDigits(next);
      const focusIndex = Math.min(chars.length, 5);
      inputRefs.current[focusIndex]?.focus();
      return;
    }

    next[index] = cleanValue;
    setOtpDigits(next);

    if (cleanValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      showToast.error(t('common.error'), t('forgotPassword.invalidOtpLength'));
      return;
    }

    setSubmitting(true);
    try {
      await authAPI.verifyForgotPasswordOTP(email.trim(), otp);
      showToast.success(t('forgotPassword.verifiedTitle'), t('forgotPassword.verifiedMessage'));
      setStep('reset');
    } catch (error) {
      showToast.error(t('forgotPassword.verificationFailedTitle'), error.message || t('forgotPassword.invalidOtp'));
      setOtpDigits(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || resending) return;
    setResending(true);
    try {
      await authAPI.sendForgotPasswordOTP(email.trim());
      showToast.success(t('forgotPassword.codeSentTitle'), t('forgotPassword.resendSuccess'));
      setOtpDigits(['', '', '', '', '', '']);
      startTimer();
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (error) {
      showToast.error(t('forgotPassword.resendFailedTitle'), error.message || t('forgotPassword.resendFailedMessage'));
    } finally {
      setResending(false);
    }
  };

  const handleResetPassword = async () => {
    if (!password || password.length < 6) {
      showToast.error(t('common.error'), t('forgotPassword.passwordMinLength'));
      return;
    }
    if (password !== confirmPassword) {
      showToast.error(t('common.error'), t('forgotPassword.passwordMismatch'));
      return;
    }

    setSubmitting(true);
    try {
      await authAPI.resetForgotPassword(email.trim(), otp, password);
      showToast.success(t('common.success'), t('forgotPassword.passwordResetSuccess'));
      navigation.replace('Login');
    } catch (error) {
      showToast.error(t('forgotPassword.resetFailedTitle'), error.message || t('forgotPassword.resetFailedMessage'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      style={[styles.container, { flex: 1 }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.header}>
          <Logo size={122} height={35.5} style={styles.logo} />
          {/* <Text style={styles.title}>Forgot Password</Text> */}
          <Text style={styles.subtitle}>
            {step === 'request' && t('forgotPassword.requestSubtitle')}
            {step === 'verify' && t('forgotPassword.verifySubtitle')}
            {step === 'reset' && t('forgotPassword.resetSubtitle')}
          </Text>
        </View>

        <View style={styles.form}>
          {step === 'request' && (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('common.email')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('forgotPassword.emailPlaceholder')}
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!submitting}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, submitting && styles.buttonDisabled]}
                onPress={handleSendOtp}
                disabled={submitting}
              >
                {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>{t('forgotPassword.sendOtp')}</Text>}
              </TouchableOpacity>
            </>
          )}

          {step === 'verify' && (
            <>
              <Text style={styles.labelCenter}>{t('forgotPassword.otpCode')}</Text>
              <View style={styles.otpRow}>
                {otpDigits.map((digit, index) => (
                  <TextInput
                    key={`otp-${index}`}
                    ref={(ref) => {
                      inputRefs.current[index] = ref;
                    }}
                    style={styles.otpInput}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={(e) => handleOtpKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    textAlign="center"
                    editable={!submitting}
                  />
                ))}
              </View>
              <Text style={styles.helperText}>{t('forgotPassword.otpExpiry')}</Text>

              <TouchableOpacity
                style={[styles.button, (submitting || otp.length !== 6) && styles.buttonDisabled]}
                onPress={handleVerifyOtp}
                disabled={submitting || otp.length !== 6}
              >
                {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>{t('forgotPassword.verifyOtp')}</Text>}
              </TouchableOpacity>

              <View style={styles.resendContainer}>
                <TouchableOpacity onPress={handleResendOtp} disabled={!canResend || resending}>
                  <Text
                    style={[
                      styles.resendLink,
                      (!canResend || resending) && { color: colors.textMuted },
                    ]}
                  >
                    {resending
                      ? t('forgotPassword.sending')
                      : canResend
                        ? t('forgotPassword.resendOtp')
                        : t('forgotPassword.resendIn', { seconds: countdown })}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 'reset' && (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('common.newPassword')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('forgotPassword.newPasswordPlaceholder')}
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!submitting}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('setPassword.confirmPassword')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('forgotPassword.confirmPasswordPlaceholder')}
                  placeholderTextColor={colors.textMuted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!submitting}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, submitting && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={submitting}
              >
                {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>{t('forgotPassword.resetPassword')}</Text>}
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>{t('forgotPassword.backToLogin')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors, typography) =>
  StyleSheet.create({
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
      marginBottom: 24,
    },
    logo: {
      color: colors.primary,
      marginBottom: 4,
    },
    title: {
      color: colors.text,
      marginBottom: 6,
      fontFamily: typography.fontFamily.semiBold,
      fontSize: typography.fontSize['2xl'] || 24,
      textAlign: 'center',
    },
    subtitle: {
      color: colors.textMuted,
      textAlign: 'center',
      paddingHorizontal: 20,
      fontFamily: typography.fontFamily.regular,
      lineHeight: 20,
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
    labelCenter: {
      color: colors.text,
      marginBottom: 10,
      textAlign: 'center',
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
    otpRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
      marginBottom: 10,
    },
    otpInput: {
      width: 48,
      height: 52,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      backgroundColor: colors.white,
      color: colors.text,
      fontSize: 20,
      fontFamily: typography.fontFamily.semiBold,
      textAlign: 'center',
    },
    helperText: {
      color: colors.textMuted,
      textAlign: 'center',
      fontSize: 12,
      marginBottom: 16,
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
    resendContainer: {
      marginTop: 14,
      alignItems: 'center',
    },
    resendLink: {
      color: colors.primary,
      fontFamily: typography.fontFamily.semiBold,
    },
    backButton: {
      marginTop: 24,
      alignItems: 'center',
    },
    backButtonText: {
      color: colors.textMuted,
      fontSize: 14,
      textDecorationLine: 'underline',
      fontFamily: typography.fontFamily.regular,
    },
  });
