import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, SlidersHorizontal } from 'lucide-react-native';
import Logo from './Logo';
import NotificationBell from './NotificationBell';
import useThemeColors from '../theme/useThemeColors';
import useThemeTypography from '../theme/useThemeTypography';
import { useCart } from '../context/CartContext';

function headerAvatarInitials(user) {
  const name = (user?.name || '').trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
  const email = (user?.email || '').trim();
  if (email) {
    return email.substring(0, 2).toUpperCase();
  }
  return 'G';
}

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
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + Number(item.quantity || 1), 0);

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

  const avatarUri = useMemo(() => {
    const raw = user?.image || user?.profileImage || user?.profile_picture;
    if (typeof raw !== 'string') return '';
    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed : '';
  }, [user?.image, user?.profileImage, user?.profile_picture]);

  return (
    <View style={styles.topHeader}>
      {user ? (
        <TouchableOpacity style={styles.avatar} onPress={handleAvatarPress}>
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.avatarText}>{headerAvatarInitials(user)}</Text>
          )}
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
        {/*{user && <NotificationBell />}*/}
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.navigate('Cart')}
          activeOpacity={0.7}
          accessibilityLabel={t('cart.open', 'Open cart')}
          testID="cart-button"
        >
          <ShoppingCart size={20} color={colors.primary} />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
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
  cartBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FE8100',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontFamily: typography.fontFamily.semiBold,
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
    overflow: 'hidden',
    zIndex: 10,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: colors.primary,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semiBold,
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
