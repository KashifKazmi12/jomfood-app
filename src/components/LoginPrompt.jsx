/**
 * LoginPrompt - Reusable component for displaying login prompt when user is not authenticated
 * 
 * Used in screens that require authentication (Profile, My Deals, etc.)
 * Provides consistent UI with icon, message, and login button
 * 
 * Usage:
 * import LoginPrompt from '../components/LoginPrompt';
 * 
 * if (!user) {
 *   return <LoginPrompt message="Please sign in to view your profile" />;
 * }
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { User } from 'lucide-react-native';
import useThemeColors from '../theme/useThemeColors';
import useThemeTypography from '../theme/useThemeTypography';

export default function LoginPrompt({ 
  message,
  icon: Icon = User,
  iconSize = 48,
  onLogin,
}) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const styles = getStyles(colors, typography);
  const navigation = useNavigation();
  
  const defaultMessage = message || t('common.pleaseSignIn');

  return (
    <View style={styles.container}>
      <Icon size={iconSize} color={colors.textMuted} />
      <Text style={styles.message}>{defaultMessage}</Text>
      <TouchableOpacity 
        style={styles.loginButton}
        onPress={() => {
          if (onLogin) {
            onLogin();
            return;
          }
          navigation.navigate('Login');
        }}
      >
        <Text style={styles.loginButtonText}>{t('common.login')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (colors, typography) => StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  message: {
    color: colors.textMuted,
    fontSize: typography.fontSize.md,
    marginTop: 16,
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: typography.fontFamily.regular,
  },
  loginButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.semiBold,
  },
});

