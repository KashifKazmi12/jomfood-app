import React, { useState } from 'react';
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
import { Eye, EyeOff } from 'lucide-react-native';

import authAPI from '../api/auth';
import { setUser, setLoading } from '../store/slices/authSlice';
import useThemeColors from '../theme/useThemeColors';
import useThemeTypography from '../theme/useThemeTypography';
import { showToast } from '../components/toast';
import { updateFCMTokenWithCustomerId } from '../utils/initializeNotifications';
import Logo from '../components/Logo';

export default function SetPasswordScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const colors = useThemeColors();
    const typography = useThemeTypography();
    const styles = getStyles(colors, typography);

    const { user } = route.params || {};

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSetPassword = async () => {
        if (!password || password.length < 6) {
            showToast.error(t('common.error'), t('setPassword.minLength'));
            return;
        }

        if (password !== confirmPassword) {
            showToast.error(t('common.error'), t('setPassword.mismatch'));
            return;
        }

        setIsSubmitting(true);
        dispatch(setLoading(true));

        try {
            const response = await authAPI.setPassword(password);

            const updatedUser = response?.user || response?.data?.user || user;

            if (updatedUser) {
                dispatch(setUser(updatedUser));
            }

            dispatch(setLoading(false));

            if (updatedUser?._id) {
                updateFCMTokenWithCustomerId(updatedUser._id).catch(() => {});
            }

            showToast.success(t('common.success'), t('setPassword.success'));

            navigation.reset({
                index: 0,
                routes: [{ name: 'RootTabs' }],
            });
        } catch (error) {
            dispatch(setLoading(false));
            const errorMessage = error.message || t('setPassword.failed');
            showToast.error(t('common.error'), errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <Logo size={100} height={30} style={styles.logo} />
                    <Text style={styles.title}>{t('setPassword.title')}</Text>
                    <Text style={styles.subtitle}>
                        {t('setPassword.subtitle')}
                    </Text>
                </View>

                <View style={styles.form}>
                    <Text style={styles.label}>{t('setPassword.newPassword')}</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            value={password}
                            onChangeText={setPassword}
                            placeholder={t('setPassword.newPasswordPlaceholder')}
                            placeholderTextColor={colors.textMuted}
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                            autoCorrect={false}
                            returnKeyType="next"
                        />
                        <TouchableOpacity
                            style={styles.eyeButton}
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? (
                                <EyeOff size={20} color={colors.textMuted} />
                            ) : (
                                <Eye size={20} color={colors.textMuted} />
                            )}
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.label}>{t('setPassword.confirmPassword')}</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder={t('setPassword.confirmPasswordPlaceholder')}
                            placeholderTextColor={colors.textMuted}
                            secureTextEntry={!showConfirmPassword}
                            autoCapitalize="none"
                            autoCorrect={false}
                            returnKeyType="done"
                        />
                        <TouchableOpacity
                            style={styles.eyeButton}
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                            {showConfirmPassword ? (
                                <EyeOff size={20} color={colors.textMuted} />
                            ) : (
                                <Eye size={20} color={colors.textMuted} />
                            )}
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.hint}>{t('setPassword.hint')}</Text>

                    <TouchableOpacity
                        style={[styles.button, isSubmitting && styles.buttonDisabled]}
                        onPress={handleSetPassword}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>{t('setPassword.submit')}</Text>
                        )}
                    </TouchableOpacity>
                </View>
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
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        marginBottom: 16,
    },
    passwordInput: {
        flex: 1,
        padding: 16,
        fontSize: 16,
        fontFamily: typography.fontFamily.regular,
        color: colors.text,
    },
    eyeButton: {
        padding: 16,
    },
    hint: {
        fontSize: 12,
        fontFamily: typography.fontFamily.regular,
        color: colors.textMuted,
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
});
