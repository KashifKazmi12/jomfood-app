/**
 * Verification Code Screen
 * 
 * Flow:
 * 1. User registers or login requires verification
 * 2. User enters 6-digit OTP
 * 3. On success, save tokens and navigate to success screen
 */

import React, { useState, useEffect, useRef } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

import authAPI from '../api/auth';
import { setUser, setLoading } from '../store/slices/authSlice';
import useThemeColors from '../theme/useThemeColors';
import useThemeTypography from '../theme/useThemeTypography';
import { showToast } from '../components/toast';
import { updateFCMTokenWithCustomerId } from '../utils/initializeNotifications';
import Logo from '../components/Logo';

export default function VerificationScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const colors = useThemeColors();
    const typography = useThemeTypography();
    const styles = getStyles(colors, typography);

    // Params
    const { userId, email } = route.params || {};

    // State
    const [otp, setOtp] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const [canResend, setCanResend] = useState(false);

    // Timer Ref
    const timerRef = useRef(null);

    useEffect(() => {
        startTimer();
        return () => clearInterval(timerRef.current);
    }, []);

    const startTimer = () => {
        setCanResend(false);
        setCountdown(60);
        clearInterval(timerRef.current);
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

    const handleVerify = async () => {
        if (otp.length !== 6) {
            showToast.error(t('common.error'), "Please enter a valid 6-digit code.");
            return;
        }

        setIsVerifying(true);
        dispatch(setLoading(true));

        try {
            const response = await authAPI.verifyEmail(userId, otp);

            // Verify success
            // API returns { success: true, data: { tokens: { ... }, user: { ... } } }
            // Or sometimes just { user: ... } depending on structure, but we standardised in auth.js

            const user = response?.data?.user || response?.user;
            const requiresPasswordSetup = response?.data?.requiresPasswordSetup === true;

            if (user) {
                dispatch(setLoading(false));

                if (requiresPasswordSetup) {
                    showToast.success(t('common.success'), t('verification.emailVerifiedSetPassword'));

                    navigation.replace('SetPassword', { user });
                } else {
                    dispatch(setUser(user));

                    if (user._id) {
                        updateFCMTokenWithCustomerId(user._id).catch(() => { });
                    }

                    showToast.success(t('common.success'), t('verification.emailVerifiedSuccess'));

                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'RootTabs' }],
                    });
                }
            } else {
                throw new Error("Invalid response from server");
            }

        } catch (error) {
            dispatch(setLoading(false));
            const errorMessage = error.message || "Invalid verification code.";
            showToast.error("Verification Failed", errorMessage);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResend = async () => {
        if (!canResend) return;

        setIsResending(true);
        try {
            await authAPI.resendOTP(userId);
            showToast.success("Code Sent", "A new verification code has been sent to your email.");
            startTimer();
        } catch (error) {
            showToast.error("Resend Failed", error.message || "Could not resend code. Please try again.");
        } finally {
            setIsResending(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
            style={[styles.container]}
        >
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <Logo size={100} height={30} style={styles.logo} />
                    <Text style={styles.title}>Verification Required</Text>
                    <Text style={styles.subtitle}>
                        We have sent a 6-digit code to your email associated with this account.
                    </Text>
                </View>

                <View style={styles.form}>
                    <Text style={styles.label}>Enter Verification Code</Text>
                    <TextInput
                        style={styles.input}
                        value={otp}
                        onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, ''))}
                        placeholder="123456"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="number-pad"
                        maxLength={6}
                        autoFocus
                    />

                    <TouchableOpacity
                        style={[styles.button, isVerifying && styles.buttonDisabled]}
                        onPress={handleVerify}
                        disabled={isVerifying}
                    >
                        {isVerifying ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Verify Email</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.resendContainer}>
                        <Text style={styles.resendText}>Didn't receive the code? </Text>
                        <TouchableOpacity
                            onPress={handleResend}
                            disabled={!canResend || isResending}
                        >
                            <Text style={[
                                styles.resendLink,
                                (!canResend || isResending) && { color: colors.textMuted }
                            ]}>
                                {isResending ? "Sending..." : canResend ? "Resend Code" : `Resend in ${countdown}s`}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backButtonText}>Back to parameters</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const getStyles = (colors, typography) => StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 24,
        flexGrow: 1,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logo: {
        marginBottom: 24,
        color: colors.primary,
    },
    title: {
        fontSize: 24,
        fontFamily: typography.fontFamily.bold,
        color: colors.text,
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        fontFamily: typography.fontFamily.regular,
        color: colors.textMuted,
        textAlign: 'center',
        lineHeight: 20,
        maxWidth: '80%',
    },
    form: {
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
    },
    label: {
        fontSize: 14,
        fontFamily: typography.fontFamily.medium,
        color: colors.text,
        marginBottom: 8,
    },
    input: {
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        padding: 16,
        fontSize: 24,
        fontFamily: typography.fontFamily.bold,
        color: colors.text,
        textAlign: 'center',
        letterSpacing: 8,
        marginBottom: 24,
    },
    button: {
        backgroundColor: colors.primary,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 24,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: typography.fontFamily.semiBold,
    },
    resendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    resendText: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily.regular,
    },
    resendLink: {
        color: colors.primary,
        fontFamily: typography.fontFamily.semiBold,
    },
    backButton: {
        marginTop: 40,
        alignItems: 'center',
    },
    backButtonText: {
        color: colors.textMuted,
        fontSize: 14,
        textDecorationLine: 'underline',
    },
});
