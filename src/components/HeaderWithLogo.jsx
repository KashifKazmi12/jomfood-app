import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { SlidersHorizontal } from 'lucide-react-native';
import Logo from './Logo';
import NotificationBell from './NotificationBell';
import useThemeColors from '../theme/useThemeColors';
import useThemeTypography from '../theme/useThemeTypography';
import { Image } from 'react-native';

/**
 * HeaderWithLogo Component
 * 
 * A reusable header component with:
 * - Avatar/Login button on the left
 * - Centered JomFood logo
 * - Search icon on the right
 * 
 * Props:
 * - onAvatarPress: Function to call when avatar is pressed (optional)
 * - onLogoPress: Function to call when logo is pressed (optional)
 * - onSearchPress: Function to call when search icon is pressed (optional)
 * - logoSize: Size of the logo (default: 80)
 */
function HeaderWithLogo({ 
  onAvatarPress, 
  onLogoPress,
  onSearchPress,
  logoSize = 80 
}) {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const user = useSelector(state => state.auth.user);
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const styles = getStyles(colors, typography);

  const handleAvatarPress = useCallback(() => {
    if (onAvatarPress) {
      onAvatarPress();
    }
  }, [onAvatarPress]);

  const handleLoginPress = useCallback(() => {
    navigation.navigate('Login');
  }, [navigation]);

  const handleSearchPress = useCallback(() => {
    if (onSearchPress) {
      onSearchPress();
    }
  }, [onSearchPress]);

  const handleLogoPress = useCallback(() => {
    if (onLogoPress) {
      onLogoPress();
    }
  }, [onLogoPress]);

  return (
    <View style={styles.topHeader}>
      {user ? (
        <TouchableOpacity style={styles.avatar} onPress={handleAvatarPress}>
          <Text style={styles.avatarText}>
            {((user?.name || user?.email || 'G').substring(0, 1) || 'G').toUpperCase()}
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.loginPill} onPress={handleLoginPress}>
          <Text style={styles.loginPillText}>{t('common.login')}</Text>
        </TouchableOpacity>
      )}

      {/* Centered Logo */}
      <View style={styles.logoContainer} pointerEvents="box-none">
        <TouchableOpacity 
          onPress={handleLogoPress}
          activeOpacity={0.7}
        >
          {/* add image with native image */}
          <Image 
            source={require('../assets/images/jomfood.png')} 
            style={styles.logoImage}
            resizeMode="contain"
            onError={(error) => {
              console.warn('⚠️ [HeaderWithLogo] Failed to load logo image:', error);
            }}
          />
        </TouchableOpacity>
      </View>

      {/* Right side actions: Notification Bell (only if logged in) + Filter */}
      <View style={styles.rightActions}>
        {user && <NotificationBell />}
        <TouchableOpacity 
          style={styles.iconBtn} 
          onPress={handleSearchPress}
          activeOpacity={0.7}
          accessibilityLabel={t('header.filter')}
          testID="filter-button"
        >
          <SlidersHorizontal size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = (colors, typography) => StyleSheet.create({
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 10,
  },
  logoContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
    pointerEvents: 'box-none',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    zIndex: 10,
    position: 'relative',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border, 
  },
  avatarText: {
    color: colors.primary,
  },
  loginPill: {
    // width: 64,
    paddingLeft:6,
    paddingRight:6,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  loginPillText: {
    color: colors.primary,
    fontSize: typography.fontSize['xs'],
    fontFamily: typography.fontFamily.semiBold,
  },
  logoImage: {
    width: 110,
    height: 32.5,
  },
});

export default HeaderWithLogo;
