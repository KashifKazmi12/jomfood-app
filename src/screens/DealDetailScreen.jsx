import React, { useState, useEffect } from 'react';
import { Alert, View, Text, TextInput, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Modal, Platform, KeyboardAvoidingView, TouchableWithoutFeedback, Linking } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import useThemeColors from '../theme/useThemeColors';
import useThemeTypography from '../theme/useThemeTypography';
import { dealsAPI } from '../api/deals';
import { favoritesAPI } from '../api/favorites';
import authAPI from '../api/auth';
import { updateUser } from '../store/slices/authSlice';
import { showToast } from '../components/toast';
import ClaimedDealModal from '../components/deals/ClaimedDealModal';
import { Star, Heart, ChevronLeft, ChevronRight, X, MapPin, Truck, UtensilsCrossed, ShoppingBag, Share2 } from 'lucide-react-native';
import { formatCurrency } from '../utils/formatCurrency';
import { openWhatsApp } from '../utils/whatsapp';
import Svg, { Path } from 'react-native-svg';
import { BottomNavigationSpace } from '../navigation/AppNavigator';
import { useCart } from '../context/CartContext';
import ShareDealModal from '../components/deals/ShareDealModal';

// if (fullDeal.max_quantity === 1) {
//   return 'One-time use only';
// } else if (fullDeal.max_quantity === 2) {
//   return 'Can be used twice';
// } else {
//   return `Can be used up to ${fullDeal.max_quantity} times`;
// }

export default function DealDetailScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const styles = getStyles(colors, typography);
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const user = useSelector(state => state.auth.user);
  const queryClient = useQueryClient();
  const { addItem, clearCart } = useCart();
  const { id } = (route?.params || {});

  // Phone prompt states
  const [showPhonePrompt, setShowPhonePrompt] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [pendingClaim, setPendingClaim] = useState(false); // Track if we need to claim after phone is saved

  const { data, isLoading } = useQuery({
    queryKey: ['deal', id],
    queryFn: () => {
      if (!id) {
        throw { message: 'Deal ID is required', error: 'MISSING_DEAL_ID' };
      }
      return dealsAPI.detail(id);
    },
    enabled: !!id && typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id), // Only run if valid ID
  });

  const deal = data || {};
  const name = deal?.deal_name || 'Deal';
  const description = deal?.deal_description || '';
  const company = deal?.business_id?.company_name || deal?.group_id?.name || '';
  const location = deal?.business_id?.address || '';
  const officePhone = deal?.business_id?.office_phone || '';
  const latitude = deal?.business_id?.lat || '';
  const longitude = deal?.business_id?.lng || '';
  const original = deal?.original_total ?? null;
  const price = deal?.deal_total ?? null;
  const discountPct = deal?.discount_percentage ?? null;
  const maxQuantity = deal?.max_quantity ?? null;
  const maxQuantityText = maxQuantity === 1 ? 'One-time use only' : maxQuantity === 2 ? 'Can be used twice' : `Can be used up to ${maxQuantity} times`;
  const rating = Number(deal?.rating ?? 5);
  const dealLink = id ? `https://jomfood.my/?dealId=${id}&autoOpen=true` : 'https://jomfood.my';
  const shareMessage = `Hey! Check out this awesome deal I found for ${name} at ${company}! Check it out here: ${dealLink} Let's go together!`;
console.log('Company is:', company)

  const openCartScreen = () => {
    const parentNavigation = navigation.getParent?.();
    if (parentNavigation?.navigate) {
      parentNavigation.navigate('Cart');
      return;
    }
    navigation.navigate('Cart');
  };

  const handleAddToCart = async () => {
    try {
      setIsClaiming(true);
      const result = await addItem(deal);
      if (result?.ok) {
        showToast.success(t('cart.added', 'Added to cart'), t('cart.openHint', 'Open your cart to checkout.'));
        openCartScreen();
        return;
      }
      if (result?.reason === 'not_logged_in') {
        setLoginModalVisible(true);
        return;
      }
      if (result?.reason === 'different_restaurant') {
        Alert.alert(
          t('cart.replaceTitle', 'Replace cart items?'),
          t(
            'cart.replaceMessage',
            'Your cart can only include deals from one restaurant. Clear current cart and add this deal?'
          ),
          [
            { text: t('common.cancel', 'Cancel'), style: 'cancel' },
            {
              text: t('cart.replaceConfirm', 'Clear & Add'),
              style: 'destructive',
                onPress: async () => {
                  await clearCart();
                  const retry = await addItem(deal, { skipBusinessCheck: true });
                  if (retry?.ok) {
                    showToast.success(t('cart.added', 'Added to cart'), t('cart.openHint', 'Open your cart to checkout.'));
                    openCartScreen();
                  }
                },
              },
          ]
        );
      }
    } finally {
      setIsClaiming(false);
    }
  };

  // Calculate discount text based on deal_type (matching web implementation)
  const discountText = React.useMemo(() => {
    const dealType = deal?.deal_type;
    if (dealType === 'percentage') {
      return `${deal?.discount_percentage ?? 0}% OFF`;
    }
    if (dealType === 'fixed_amount') {
      return `RM ${(deal?.discount_amount ?? 0).toFixed(2)} OFF`;
    }
    if (dealType === 'combo') {
      return 'COMBO DEAL';
    }
    return 'DEAL';
  }, [deal]);
  // const ratingsCount = deal?.ratings_count ?? 157;
  // const boughtCount = deal?.bought_count ?? 4084;

  // Build image list - deal_image as first image if it exists
  const images = React.useMemo(() => {
    const dealImage = deal?.deal_image ? [deal.deal_image] : [];
    const fromDeal = Array.isArray(deal?.deal_images) ? deal.deal_images.filter(Boolean) : [];
    const fromItems = Array.isArray(deal?.deal_items)
      ? deal.deal_items.map(i => i?.product_image).filter(Boolean)
      : [];
    // Combine: deal_image first (if exists), then deal_images, then item images
    const list = [...dealImage, ...fromDeal, ...fromItems];
    return list.length > 0
      ? list
      : ['https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1200&auto=format&fit=crop'];
  }, [deal]);

  const [imgIndex, setImgIndex] = React.useState(0);
  const [isFavorite, setIsFavorite] = React.useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = React.useState(false);
  const [timeRemaining, setTimeRemaining] = React.useState(null);

  // Check if deal is expired based on end_date
  const isDealExpired = React.useMemo(() => {
    if (!deal?.end_date) return false;
    const now = new Date().getTime();
    const endTime = new Date(deal.end_date).getTime();
    return endTime <= now;
  }, [deal?.end_date]);

  // Calculate total quantity from deal_items
  const totalQuantity = React.useMemo(() => {
    if (!Array.isArray(deal?.deal_items)) return 1;
    return deal.deal_items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }, [deal]);

  const nextImage = () => {
    setImgIndex((idx) => (idx + 1) % images.length);
  };

  const prevImage = () => {
    setImgIndex((idx) => (idx - 1 + images.length) % images.length);
  };

  const [claimVisible, setClaimVisible] = React.useState(false);
  const [claimData, setClaimData] = React.useState(null);
  const [isClaiming, setIsClaiming] = React.useState(false);
  const [loginModalVisible, setLoginModalVisible] = React.useState(false);
  const [preferencesVisible, setPreferencesVisible] = React.useState(false);
  const [preferredServiceType, setPreferredServiceType] = React.useState('');
  const [preferredDateValue, setPreferredDateValue] = React.useState(null);
  const [preferredTimeValue, setPreferredTimeValue] = React.useState(null);
  const [preferenceError, setPreferenceError] = React.useState('');
  const [iosPickerVisible, setIosPickerVisible] = React.useState(false);
  const [iosPickerMode, setIosPickerMode] = React.useState('date');
  const [iosPickerValue, setIosPickerValue] = React.useState(new Date());
  const [shareVisible, setShareVisible] = React.useState(false);

  const consumptionTypes = React.useMemo(() => {
    const types = deal?.consumptionType || deal?.consumption_type || [];
    return Array.isArray(types) ? types : [];
  }, [deal?.consumptionType, deal?.consumption_type]);

  const serviceTypeOptions = React.useMemo(() => {
    const normalizeType = (type) => {
      if (!type || typeof type !== 'string') return '';
      const normalized = type.trim().toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
      if (normalized === 'dine_in' || normalized === 'dinein') return 'dine_in';
      if (normalized === 'self_pickup' || normalized === 'pickup') return 'self_pickup';
      if (normalized === 'delivery') return 'delivery';
      return normalized;
    };
    const normalized = consumptionTypes.map(normalizeType).filter(Boolean);
    const unique = Array.from(new Set(normalized));
    return unique.length > 0 ? unique : ['dine_in', 'delivery', 'self_pickup'];
  }, [consumptionTypes]);

  // Check favorite status on mount and when user changes
  React.useEffect(() => {
    if (id && user?._id) {
      favoritesAPI.checkFavoriteStatus(id)
        .then((result) => {
          console.log('❤️ [DealDetailScreen] Favorite status result:', result);
          console.log('❤️ [DealDetailScreen] is_favorite value:', result.is_favorite);
          setIsFavorite(result.is_favorite === true);
        })
        .catch((error) => {
          console.error('❌ [DealDetailScreen] Error checking favorite status:', error);
          setIsFavorite(false);
        });
    } else {
      setIsFavorite(false);
    }
  }, [id, user?._id]);

  // Countdown timer for deals
  React.useEffect(() => {
    if (!deal?.end_date) return;

    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const endTime = new Date(deal.end_date).getTime();
      const difference = endTime - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeRemaining({
          days: String(days).padStart(2, '0'),
          hours: String(hours).padStart(2, '0'),
          minutes: String(minutes).padStart(2, '0'),
          seconds: String(seconds).padStart(2, '0'),
          total: difference
        });
      } else {
        setTimeRemaining({ expired: true });
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [deal?.end_date]);

  // Listen for navigation focus to check if user logged in
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // If user is now logged in and modal was showing, close it
      if (user?._id && loginModalVisible) {
        setLoginModalVisible(false);
      }
      // Re-check favorite status when screen is focused
      if (id && user?._id) {
        favoritesAPI.checkFavoriteStatus(id)
          .then((result) => {
            console.log('❤️ [DealDetailScreen] Favorite status on focus:', result);
            setIsFavorite(result.is_favorite === true);
          })
          .catch(() => {
            setIsFavorite(false);
          });
      }
    });

    return unsubscribe;
  }, [navigation, user, loginModalVisible, id]);

  const handleLoginPress = () => {
    setLoginModalVisible(false);
    // Navigate to login with return params
    navigation.navigate('Login', {
      returnTo: 'DealDetail',
      returnParams: { id: id }
    });
  };

  const handleFavoriteToggle = async () => {
    if (!user?._id) {
      setLoginModalVisible(true);
      return;
    }

    if (isTogglingFavorite || !id) {
      return;
    }

    setIsTogglingFavorite(true);
    const previousFavoriteState = isFavorite;

    // Optimistic update - update UI immediately
    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);

    try {
      const result = await favoritesAPI.toggleFavorite(id);
      console.log('🔄 [DealDetailScreen] Toggle favorite result:', result);

      // Response structure: { success: true, data: { is_favorite: true, message: "..." } }
      if (result?.success && result?.data) {
        const isFavoriteNow = result.data.is_favorite === true;
        setIsFavorite(isFavoriteNow);

        // Show success message
        const message = result.data.message || (isFavoriteNow ? 'Added to favorites' : 'Removed from favorites');
        showToast.success(
          isFavoriteNow ? 'Added to favorites' : 'Removed from favorites',
          message
        );

        // Invalidate favorites queries to refresh lists
        queryClient.invalidateQueries({ queryKey: ['favorite-deals'] });
      } else {
        // Revert on unexpected response
        setIsFavorite(previousFavoriteState);
        console.warn('⚠️ [DealDetailScreen] Unexpected toggle response:', result);
        showToast.error('Error', result?.message || 'Failed to update favorite');
      }
    } catch (error) {
      // Revert on error
      setIsFavorite(previousFavoriteState);
      console.error('❌ [DealDetailScreen] Toggle favorite error:', error);
      const errorMessage = error?.message || error?.response?.data?.message || 'Failed to update favorite';
      if (errorMessage.toLowerCase().includes('authentication') || errorMessage.toLowerCase().includes('unauthorized')) {
        setLoginModalVisible(true);
      } else {
        showToast.error('Error', errorMessage);
      }
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const handleWhatsAppPress = async () => {
    if (!officePhone) {
      showToast.error('No phone number', 'Phone number not available');
      return;
    }

    try {
      // Same implementation as Web - uses https://wa.me/ URL
      const dealLink = id ? `https://jomfood.my/?dealId=${id}&autoOpen=true` : 'https://jomfood.my';
      const message = `Hi, I am interested in the deal ${name}.\nLink: ${dealLink}`;
      await openWhatsApp(officePhone, message);
    } catch (error) {
      console.error('WhatsApp open error:', error);
      showToast.error('Error', 'Could not open WhatsApp');
    }
  };

  const handleMapPress = async () => {
    if (!latitude || !longitude) {
      showToast.error('No location', 'Location coordinates not available');
      return;
    }

    try {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      // Open Google Maps with the coordinates
      const url = Platform.select({
        ios: `maps://app?daddr=${lat},${lng}&directionsmode=driving`,
        android: `google.navigation:q=${lat},${lng}`,
      });

      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

      // Try to open native maps app first
      const canOpen = await Linking.canOpenURL(url || '');
      if (canOpen && url) {
        await Linking.openURL(url);
      } else {
        // Fallback to Google Maps web
        await Linking.openURL(googleMapsUrl);
      }
    } catch (error) {
      showToast.error('Error', 'Could not open maps');
    }
  };

  // Handle phone save and then continue with claim
  const handlePhoneSave = async () => {
    if (!phoneInput.trim()) {
      setPhoneError(t('common.phoneRequired'));
      return;
    }
    setPhoneError('');
    setPhoneSaving(true);
    try {
      const response = await authAPI.editProfile({
        name: user?.name,
        phone: phoneInput.trim(),
      });
      if (response?.user) {
        dispatch(updateUser(response.user));
        queryClient.setQueryData(['user-profile'], response.user);
      }
      setShowPhonePrompt(false);

      // If we were trying to claim, continue with the claim
      if (pendingClaim) {
        setPendingClaim(false);
        // Proceed with preferences after phone is saved
        openPreferencesModal();
      }
    } catch (error) {
      showToast.error(t('common.updateFailed'), error.message || t('common.failedToUpdateProfile'));
    } finally {
      setPhoneSaving(false);
    }
  };

  const openPreferencesModal = () => {
    setPreferredServiceType('');
    setPreferredDateValue(null);
    setPreferredTimeValue(null);
    setPreferenceError('');
    setPreferencesVisible(true);
  };

  const buildPreferredDatetime = () => {
    if (!preferredDateValue || !preferredTimeValue) return null;
    const combined = new Date(
      preferredDateValue.getFullYear(),
      preferredDateValue.getMonth(),
      preferredDateValue.getDate(),
      preferredTimeValue.getHours(),
      preferredTimeValue.getMinutes(),
      0,
      0
    );
    return combined.toISOString();
  };

  const formatDateDisplay = (dateValue) => {
    if (!dateValue) return '';
    return dateValue.toLocaleDateString('en-US');
  };

  const formatTimeDisplay = (timeValue) => {
    if (!timeValue) return '';
    return timeValue.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const openDateTimePicker = (mode) => {
    if (Platform.OS === 'android') {
      const currentValue = mode === 'date'
        ? (preferredDateValue || new Date())
        : (preferredTimeValue || new Date());
      DateTimePickerAndroid.open({
        value: currentValue,
        mode,
        is24Hour: false,
        onChange: (event, selectedDate) => {
          if (event.type !== 'set' || !selectedDate) return;
          if (mode === 'date') {
            setPreferredDateValue(selectedDate);
          } else {
            setPreferredTimeValue(selectedDate);
          }
          setPreferenceError('');
        },
      });
      return;
    }

    const currentValue = mode === 'date'
      ? (preferredDateValue || new Date())
      : (preferredTimeValue || new Date());
    setIosPickerMode(mode);
    setIosPickerValue(currentValue);
    setIosPickerVisible(true);
  };

  // Actual claim logic
  const performClaim = async (preferences = {}) => {
    setIsClaiming(true);
    try {
      const res = await dealsAPI.claim({
        dealId: id,
        customerId: user._id,
        preferredServiceType: preferences.preferredServiceType,
        preferredDatetime: preferences.preferredDatetime,
      });
      setClaimData(res);
      setClaimVisible(true);
      showToast.success('Deal claimed', 'QR code is ready');
    } catch (e) {
      showToast.error('Failed to claim', e.message || 'Please try again');
    } finally {
      setIsClaiming(false);
    }
  };

  const claim = async () => {
    if (!user?._id) {
      setLoginModalVisible(true);
      return;
    }

    // Check if user has phone number
    if (!user.phone) {
      setPhoneInput('');
      setPhoneError('');
      setPendingClaim(true);
      setShowPhonePrompt(true);
      return;
    }

    // Prevent multiple clicks
    if (isClaiming) {
      return;
    }

    openPreferencesModal();
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { flex: 1, backgroundColor: colors.white }]}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: BottomNavigationSpace }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Carousel Section */}
        <View style={styles.imageSection}>
          <Image source={{ uri: images[imgIndex] }} style={styles.mainImage} />

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <TouchableOpacity style={styles.arrowLeft} onPress={prevImage}>
                <ChevronLeft size={24} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.arrowRight} onPress={nextImage}>
                <ChevronRight size={24} color={colors.text} />
              </TouchableOpacity>
            </>
          )}

          {/* Close Button */}
          {/* <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
            <X size={24} color={colors.text} />
          </TouchableOpacity> */}
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          {/* Title Row with Badge and Heart */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>{name}</Text>
            <View style={styles.saveBadge}>
              <Text style={styles.saveBadgeText}>{discountText}</Text>
            </View>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={() => setShareVisible(true)}
            >
              <Share2 size={22} color={colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.heartButton}
              onPress={handleFavoriteToggle}
              disabled={isTogglingFavorite}
            >
              <Heart
                size={24}
                color={isFavorite ? '#E74C3C' : colors.textMuted}
                fill={isFavorite ? '#E74C3C' : 'transparent'}
              />
            </TouchableOpacity>
          </View>

          {/* Description */}
          {description && <Text style={styles.description}>{description}</Text>}

          {/* Tags Section */}
          {Array.isArray(deal?.tags) && deal.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {deal.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Price and Timer Row */}
          <View style={styles.priceRatingRow}>
            <View style={styles.priceContainer}>
              {price != null && (
                <Text style={styles.price}>{formatCurrency(price)}</Text>
              )}
              {original != null && (
                <Text style={styles.originalPrice}>{formatCurrency(original)}</Text>
              )}
            </View>
            {/* Countdown Timer */}
            {timeRemaining && !timeRemaining.expired && (
              <View style={styles.timerContainer}>
                <View style={styles.timerDisplay}>
                  <View style={styles.timerSegment}>
                    <Text style={styles.timerNumber}>{timeRemaining.days}</Text>
                    <Text style={styles.timerUnit}>{t('common.days')}</Text>
                  </View>
                  <Text style={styles.timerColon}>:</Text>
                  <View style={styles.timerSegment}>
                    <Text style={styles.timerNumber}>{timeRemaining.hours}</Text>
                    <Text style={styles.timerUnit}>{t('common.hours')}</Text>
                  </View>
                  <Text style={styles.timerColon}>:</Text>
                  <View style={styles.timerSegment}>
                    <Text style={styles.timerNumber}>{timeRemaining.minutes}</Text>
                    <Text style={styles.timerUnit}>{t('common.minutes')}</Text>
                  </View>
                  <Text style={styles.timerColon}>:</Text>
                  <View style={styles.timerSegment}>
                    <Text style={styles.timerNumber}>{timeRemaining.seconds}</Text>
                    <Text style={styles.timerUnit}>{t('common.seconds')}</Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Consumption Types Section */}
          {consumptionTypes.length > 0 && (
            <View style={styles.consumptionSection}>
              <View style={styles.consumptionBadges}>
                {consumptionTypes.includes('delivery') && (
                  <View style={[styles.consumptionBadge, styles.deliveryBadge]}>
                    <Truck size={12} color="#2563EB" />
                    <Text style={[styles.consumptionBadgeText, styles.deliveryText]}>
                      {t('common.delivery')}
                    </Text>
                  </View>
                )}
                {consumptionTypes.includes('dine-in') && (
                  <View style={[styles.consumptionBadge, styles.dineInBadge]}>
                    <UtensilsCrossed size={12} color="#16A34A" />
                    <Text style={[styles.consumptionBadgeText, styles.dineInText]}>
                      {t('common.dineIn')}
                    </Text>
                  </View>
                )}
                {consumptionTypes.includes('self_pickup') && (
                  <View style={[styles.consumptionBadge, styles.pickupBadge]}>
                    <ShoppingBag size={12} color="#EA580C" />
                    <Text style={[styles.consumptionBadgeText, styles.pickupText]}>
                      {t('common.selfPickup')}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
          {timeRemaining?.expired && (
            <View style={styles.expiredContainer}>
              <Text style={styles.expiredText}>This deal has expired</Text>
            </View>
          )}

          {/* Restaurant Section */}
          <View style={styles.restaurantSection}>
            <Text style={styles.restaurantLabel}>Restaurant</Text>
            <View style={styles.restaurantInfoRow}>
              <View style={styles.restaurantLogo}>
                <Text style={styles.restaurantLogoText}>{company?.substring(0, 2).toUpperCase() || 'R'}</Text>
              </View>
              <View style={styles.restaurantDetails}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    const bizId = deal?.business_id?._id;
                    if (bizId) {
                      navigation.navigate('RestaurantDetails', { id: bizId });
                    }
                  }}
                >
                  <Text style={styles.restaurantName}>{company || 'Restaurant'}</Text>
                  <Text style={styles.restaurantLinkLabel}>
                    {t('dealDetail.viewMoreFromRestaurant', 'View more from {{restaurant}}', {
                      restaurant: company || 'Restaurant',
                    })}
                  </Text>
                </TouchableOpacity>
                {location && (
                  <Text style={styles.restaurantLocation}>{location}</Text>
                )}
              </View>
              {/* Action Icons - Vertical Stack */}
              <View style={styles.restaurantActions}>
                {officePhone && (
                  <TouchableOpacity
                    style={[styles.actionIconButton, styles.whatsappBg]}
                    onPress={handleWhatsAppPress}
                    activeOpacity={0.7}
                  >
                    <WhatsAppIconSVG />
                  </TouchableOpacity>
                )}
                {latitude && longitude && (
                  <TouchableOpacity
                    style={[styles.actionIconButton, styles.mapBg]}
                    onPress={handleMapPress}
                    activeOpacity={0.7}
                  >
                    <MapPin size={22} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Deal Items Section */}
          {Array.isArray(deal?.deal_items) && deal.deal_items.length > 0 && (
            <View style={styles.dealItemsSection}>
              <Text style={styles.dealItemsLabel}>What's Included ({deal.deal_items.length} items)</Text>
              <View style={styles.dealItemsCard}>
                {deal.deal_items.map((item, idx) => (
                  <View key={idx}>
                    <View style={styles.dealItemRow}>
                      {/* Product Image */}
                      {item.product_image ? (
                        <Image
                          source={{ uri: item.product_image }}
                          style={styles.dealItemImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.dealItemImagePlaceholder}>
                          <Text style={styles.dealItemImagePlaceholderText}>
                            {(item.product_name || 'Item').substring(0, 1).toUpperCase()}
                          </Text>
                        </View>
                      )}

                      {/* Product Info */}
                      <View style={styles.dealItemInfo}>
                        <Text style={styles.dealItemName}>{item.product_name || 'Item'}</Text>
                        <View style={styles.dealItemMeta}>
                          <View style={styles.dealItemQuantityBadge}>
                            <Text style={styles.dealItemQuantityText}>Qty: {item.quantity || 1}</Text>
                          </View>
                          {item.product_price != null && (
                            <Text style={styles.dealItemPricePerUnit}>
                              RM{Number(item.product_price).toFixed(2)} each
                            </Text>
                          )}
                        </View>
                      </View>

                      {/* Product Price */}
                      {item.product_price != null && (
                        <View style={styles.dealItemPriceContainer}>
                          <Text style={styles.dealItemPrice}>
                            RM{(Number(item.product_price) * (item.quantity || 1)).toFixed(2)}
                          </Text>
                        </View>
                      )}
                    </View>
                    {idx < deal.deal_items.length - 1 && <View style={styles.dealItemDivider} />}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Quantity Section (Display Only) */}
          {/*{maxQuantity != null && <View style={styles.quantitySection}>
            <Text style={styles.quantityLabel}>Usage Limit</Text>
            <Text style={styles.quantityValue}>{maxQuantityText}</Text>
          </View>}*/}

          {/* Pricing Summary */}
          {(original != null || price != null) && (
            <View style={styles.pricingSection}>
              <Text style={styles.pricingLabel}>Deal Summary</Text>
              <View style={styles.pricingCard}>
                {original != null && (
                  <View style={styles.pricingRow}>
                    <Text style={styles.pricingLabelText}>Regular Price:</Text>
                    <Text style={styles.pricingValueMuted}>RM{original.toFixed(2)}</Text>
                  </View>
                )}
                {deal?.discount_amount != null && (
                  <View style={styles.pricingRow}>
                    <View style={styles.pricingLabelWithBadge}>
                      <Text style={styles.pricingLabelText}>You Save:</Text>
                    </View>
                    <Text style={[styles.pricingValueDiscount, { color: '#27AE60' }]}>
                      -RM{deal.discount_amount.toFixed(2)}
                    </Text>
                  </View>
                )}
                {price != null && (
                  <>
                    {/* <View style={styles.pricingDivider} /> */}
                    <View style={styles.pricingRowTotal}>
                      <Text style={styles.pricingLabelTotal}>Deal Total:</Text>
                      <Text style={styles.pricingValueTotal}>RM{price.toFixed(2)}</Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          )}

            {/* Add to Cart Button - Only show if deal is not expired */}
            {!isDealExpired && !timeRemaining?.expired && (
              <View style={styles.bottomButtonContainer}>
                <TouchableOpacity
                  style={[styles.claimButton, isClaiming && styles.claimButtonDisabled]}
                  onPress={handleAddToCart}
                  disabled={isClaiming}
                >
                  {isClaiming ? (
                    <View style={styles.claimButtonLoading}>
                      <ActivityIndicator size="small" color={colors.white} style={{ marginRight: 8 }} />
                      <Text style={styles.claimButtonText}>{t('cart.adding', 'Adding...')}</Text>
                    </View>
                  ) : (
                    <Text style={styles.claimButtonText}>{t('cart.add', 'Add to Cart')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
        </View>
      </ScrollView >

      <ClaimedDealModal
        visible={claimVisible}
        onClose={() => setClaimVisible(false)}
        data={claimData}
      />
      <ShareDealModal
        visible={shareVisible}
        onClose={() => setShareVisible(false)}
        link={dealLink}
        message={shareMessage}
      />

      {/* Login Required Modal */}
      <Modal
        visible={loginModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setLoginModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <TouchableWithoutFeedback onPress={() => setLoginModalVisible(false)}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>
          <View style={styles.loginModalContent}>
            <Text style={styles.loginModalTitle}>Login Required</Text>
            <Text style={styles.loginModalMessage}>
              Please login to claim this deal
            </Text>
            <View style={styles.loginModalButtons}>
              <TouchableOpacity
                style={[styles.loginModalButton, styles.loginModalCancelButton]}
                onPress={() => setLoginModalVisible(false)}
              >
                <Text style={styles.loginModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.loginModalButton, styles.loginModalLoginButton]}
                onPress={handleLoginPress}
              >
                <Text style={styles.loginModalLoginText}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Preferences Modal */}
      <Modal
        visible={preferencesVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setPreferencesVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <TouchableWithoutFeedback onPress={() => setPreferencesVisible(false)}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>
          <View style={styles.preferenceModalCard}>
            <View style={styles.preferenceHeaderRow}>
              <Text style={styles.preferenceTitle}>Set Your Preferences</Text>
              <TouchableOpacity onPress={() => setPreferencesVisible(false)}>
                <X size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.preferenceSubtitle}>All fields are required</Text>

            <Text style={styles.preferenceSectionLabel}>Preferred Service Type *</Text>
            <View style={styles.preferenceOptionsRow}>
              {serviceTypeOptions.map((type) => {
                const label = type === 'dine_in' ? 'Dine-in' : type === 'self_pickup' ? 'Self pickup' : 'Delivery';
                const isSelected = preferredServiceType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[styles.preferenceOption, isSelected && styles.preferenceOptionSelected]}
                    onPress={() => setPreferredServiceType(isSelected ? '' : type)}
                  >
                    <Text style={[styles.preferenceOptionText, isSelected && styles.preferenceOptionTextSelected]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.preferenceSectionLabel}>Preferred Date *</Text>
            <TouchableOpacity
              style={styles.preferenceInput}
              onPress={() => openDateTimePicker('date')}
            >
              <Text style={preferredDateValue ? styles.preferenceInputText : styles.preferenceInputPlaceholder}>
                {preferredDateValue ? formatDateDisplay(preferredDateValue) : 'Select date'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.preferenceSectionLabel}>Preferred Time *</Text>
            <TouchableOpacity
              style={styles.preferenceInput}
              onPress={() => openDateTimePicker('time')}
            >
              <Text style={preferredTimeValue ? styles.preferenceInputText : styles.preferenceInputPlaceholder}>
                {preferredTimeValue ? formatTimeDisplay(preferredTimeValue) : 'Select time'}
              </Text>
            </TouchableOpacity>

            {preferenceError ? <Text style={styles.preferenceError}>{preferenceError}</Text> : null}

            <TouchableOpacity
              style={[styles.preferencePrimaryButton, isClaiming && styles.preferenceButtonDisabled]}
              disabled={isClaiming}
              onPress={() => {
                if (!preferredServiceType) {
                  setPreferenceError('Please select a service type.');
                  return;
                }
                if (!preferredDateValue || !preferredTimeValue) {
                  setPreferenceError('Please select both date and time.');
                  return;
                }
                const preferredDatetime = buildPreferredDatetime();
                setPreferencesVisible(false);
                performClaim({
                  preferredServiceType,
                  preferredDatetime,
                });
              }}
            >
              {isClaiming ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.preferencePrimaryText}>Claim Deal</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.preferenceSecondaryButton}
              onPress={() => setPreferencesVisible(false)}
              disabled={isClaiming}
            >
              <Text style={styles.preferenceSecondaryText}>Close</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* iOS Date/Time Picker Modal */}
      <Modal
        visible={iosPickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIosPickerVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIosPickerVisible(false)}>
          <View style={styles.modalBackdrop} />
        </TouchableWithoutFeedback>
        <View style={styles.iosPickerCard}>
          <DateTimePicker
            value={iosPickerValue}
            mode={iosPickerMode}
            display="spinner"
            onChange={(event, selectedDate) => {
              if (selectedDate) {
                setIosPickerValue(selectedDate);
              }
            }}
          />
          <View style={styles.iosPickerActions}>
            <TouchableOpacity
              style={styles.preferenceSecondaryButton}
              onPress={() => setIosPickerVisible(false)}
            >
              <Text style={styles.preferenceSecondaryText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.preferencePrimaryButton}
              onPress={() => {
                if (iosPickerMode === 'date') {
                  setPreferredDateValue(iosPickerValue);
                } else {
                  setPreferredTimeValue(iosPickerValue);
                }
                setPreferenceError('');
                setIosPickerVisible(false);
              }}
            >
              <Text style={styles.preferencePrimaryText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Phone Required Modal - shows when claiming without phone number */}
      <Modal
        visible={showPhonePrompt}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowPhonePrompt(false);
          setPendingClaim(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <TouchableWithoutFeedback onPress={() => {
            setShowPhonePrompt(false);
            setPendingClaim(false);
          }}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>
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
                onPress={() => {
                  setShowPhonePrompt(false);
                  setPendingClaim(false);
                }}
                disabled={phoneSaving}
              >
                <Text style={styles.phoneLaterText}>{t('common.cancel')}</Text>
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
    </View >
  );
}

const getStyles = (colors, typography) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Image Section
  imageSection: {
    position: 'relative',
    width: '100%',
    height: 300,
    backgroundColor: colors.white,
  },
  mainImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  arrowLeft: {
    position: 'absolute',
    left: 12,
    top: '50%',
    marginTop: -12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowRight: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Content Section
  contentSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  titleRow: {
    flexDirection: 'row',
    // align items to the top
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 20,
    color: colors.textDark || colors.text,
    fontFamily: typography.fontFamily.semiBold,
  },
  saveBadge: {
    backgroundColor: '#27AE60',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  saveBadgeText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semiBold,
  },
  timerConsumptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 20,
    gap: 12,
  },
  timerContainer: {
    alignItems: 'center',
    flexShrink: 1,
  },
  timerDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerSegment: {
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 3,
    minWidth: 28,
  },
  timerNumber: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.text,
    lineHeight: 14,
    marginBottom: 1,
  },
  timerUnit: {
    fontSize: 7,
    fontFamily: typography.fontFamily.medium,
    color: colors.textMuted,
    textAlign: 'center',
  },
  timerColon: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.textMuted,
    marginHorizontal: 2,
    alignSelf: 'center',
  },
  expiredContainer: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  expiredText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semiBold,
    color: '#C62828',
  },
  heartButton: {
    padding: 4,
  },
  shareButton: {
    padding: 6,
  },
  description: {
    fontSize: typography.fontSize.base,
    color: colors.textMuted,
    marginBottom: 16,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(254, 129, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(254, 129, 0, 0.2)',
  },
  tagText: {
    fontSize: typography.fontSize.xs,
    color: colors.primaryLight || '#FE8100',
    fontFamily: typography.fontFamily.medium,
  },
  priceRatingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    flex: 1,
  },
  price: {
    fontSize: typography.fontSize.lg,
    color: colors.primaryLight,
    fontFamily: typography.fontFamily.semiBold,
  },
  originalPrice: {
    fontSize: typography.fontSize.base,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
    fontFamily: typography.fontFamily.regular,
    marginLeft: 8,
  },
  ratingContainer: {
    alignItems: 'flex-end',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 4,
  },
  ratingText: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    fontFamily: typography.fontFamily.regular,
  },
  quantitySection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: '',
    marginBottom: 24,
    paddingVertical: 12,
  },
  quantityLabel: {
    fontSize: typography.fontSize.base,
    color: colors.textDark || colors.text,
    fontFamily: typography.fontFamily.semiBold,
  },
  quantityValue: {
    fontSize: typography.fontSize.base,
    color: colors.textDark || colors.text,
    fontFamily: typography.fontFamily.default,
  },
  consumptionSection: {
    flex: 1,
    flexShrink: 1,
    marginBottom: 8
  },
  consumptionLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.textMuted,
    marginBottom: 8,
  },
  consumptionBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  consumptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  deliveryBadge: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  dineInBadge: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  pickupBadge: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  consumptionBadgeText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
  },
  deliveryText: {
    color: '#2563EB',
  },
  dineInText: {
    color: '#16A34A',
  },
  pickupText: {
    color: '#EA580C',
  },
  dealImageContainer: {
    width: Dimensions.get('window').width - 40, // Full width minus horizontal padding (20*2)
    height: Dimensions.get('window').width - 40, // Square: same as width
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dealImage: {
    width: '100%',
    height: '100%',
  },
  restaurantSection: {
    marginBottom: 24,
  },
  restaurantLabel: {
    fontSize: typography.fontSize.base,
    color: colors.textDark || colors.text,
    marginBottom: 12,
    fontFamily: typography.fontFamily.semiBold,
  },
  restaurantInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  restaurantLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restaurantLogoText: {
    color: colors.white,
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
  },
  restaurantDetails: {
    flex: 1,
    flexDirection: 'column',
    gap: 4,
  },
  restaurantName: {
    fontSize: typography.fontSize.base,
    color: colors.textDark || colors.text,
    fontFamily: typography.fontFamily.semiBold,
  },
  restaurantLinkLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontFamily: typography.fontFamily.medium,
    marginTop: 2,
  },
  restaurantLocation: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    fontFamily: typography.fontFamily.regular,
    lineHeight: 18,
  },
  restaurantActions: {
    flexDirection: 'column',
    gap: 8,
    alignItems: 'center',
  },
  actionIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  whatsappBg: {
    backgroundColor: '#25D366',
  },
  mapBg: {
    backgroundColor: '#4285F4',
  },

  // Deal Items Section
  dealItemsSection: {
    marginBottom: 24,
  },
  dealItemsLabel: {
    fontSize: typography.fontSize.base,
    color: colors.textDark || colors.text,
    marginBottom: 16,
    fontFamily: typography.fontFamily.semiBold,
  },
  dealItemsCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 0,
    borderWidth: 1,
    borderColor: colors.border,
    // shadowColor: '#000',
    // shadowOpacity: 0.05,
    // shadowRadius: 8,
    // shadowOffset: { width: 0, height: 2 },
    // elevation: 2,
    overflow: 'hidden',
  },
  dealItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  dealItemImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: colors.backgroundLight,
    marginRight: 12,
  },
  dealItemImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: colors.primaryLight || '#FE8100',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dealItemImagePlaceholderText: {
    color: colors.white,
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.semiBold,
  },
  dealItemInfo: {
    flex: 1,
    marginRight: 12,
  },
  dealItemName: {
    fontSize: typography.fontSize.base,
    color: colors.textDark || colors.text,
    marginBottom: 8,
    fontFamily: typography.fontFamily.semiBold,
  },
  dealItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dealItemQuantityBadge: {
    backgroundColor: colors.primaryLight || '#FE8100',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dealItemQuantityText: {
    fontSize: typography.fontSize.xs,
    color: colors.white,
    fontFamily: typography.fontFamily.semiBold,
  },
  dealItemPricePerUnit: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    fontFamily: typography.fontFamily.regular,
  },
  dealItemPriceContainer: {
    alignItems: 'flex-end',
  },
  dealItemPrice: {
    fontSize: typography.fontSize.lg,
    color: colors.primary || '#C40C0C',
    fontFamily: typography.fontFamily.semiBold,
  },
  dealItemDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 88, // 60 (image) + 12 (margin) + 16 (padding)
  },

  // Pricing Section
  pricingSection: {
    marginBottom: 24,
  },
  pricingLabel: {
    fontSize: typography.fontSize.lg,
    color: colors.textDark || colors.text,
    marginBottom: 16,
    fontFamily: typography.fontFamily.semiBold,
  },
  pricingCard: {
    backgroundColor: colors.cardBackground || '#FFF8F3',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pricingLabelText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    fontFamily: typography.fontFamily.regular,
  },
  pricingLabelWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  discountBadge: {
    backgroundColor: '#27AE60',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountBadgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.white,
    fontFamily: typography.fontFamily.semiBold,
  },
  pricingValueMuted: {
    fontSize: typography.fontSize.base,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
    fontFamily: typography.fontFamily.regular,
  },
  pricingValueDiscount: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semiBold,
  },
  pricingDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
    marginHorizontal: -4,
  },
  pricingRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: colors.border,
  },
  pricingLabelTotal: {
    fontSize: typography.fontSize.lg,
    color: colors.textDark || colors.text,
    fontFamily: typography.fontFamily.semiBold,
  },
  pricingValueTotal: {
    fontSize: typography.fontSize['2xl'],
    color: colors.primary || '#C40C0C',
    fontFamily: typography.fontFamily.semiBold,
  },

  // Bottom Button (Normal Flow)
  bottomButtonContainer: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  claimButton: {
    backgroundColor: '#FE8100',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimButtonDisabled: {
    opacity: 0.7,
  },
  claimButtonLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.semiBold,
  },
  // Login Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  loginModalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  loginModalTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  loginModalMessage: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  loginModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  loginModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginModalCancelButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loginModalCancelText: {
    color: colors.text,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
  },
  loginModalLoginButton: {
    backgroundColor: colors.primary,
  },
  loginModalLoginText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semiBold,
  },

  // Phone Modal Styles
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
    borderRadius: 6,
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

  // Preferences Modal Styles
  preferenceModalCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    width: '88%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  preferenceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  preferenceTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
  },
  preferenceSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
    marginBottom: 16,
  },
  preferenceSectionLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
    marginBottom: 8,
  },
  preferenceOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  preferenceOption: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.white,
  },
  preferenceOptionSelected: {
    borderColor: '#27AE60',
    backgroundColor: '#FE8100',
  },
  preferenceOptionText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.text,
  },
  preferenceOptionTextSelected: {
    color: colors.white,
    fontFamily: typography.fontFamily.semiBold,
  },
  preferenceInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.white,
    marginBottom: 14,
  },
  preferenceInputText: {
    color: colors.text,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
  },
  preferenceInputPlaceholder: {
    color: colors.textMuted,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
  },
  preferenceError: {
    color: colors.error || '#d32f2f',
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
    marginBottom: 12,
  },
  preferencePrimaryButton: {
    backgroundColor: '#FE8100',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  preferencePrimaryText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semiBold,
  },
  preferenceSecondaryButton: {
    backgroundColor: colors.backgroundLight || '#F5F5F5',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  preferenceSecondaryText: {
    color: colors.text,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semiBold,
  },
  preferenceButtonDisabled: {
    opacity: 0.7,
  },
  iosPickerCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  iosPickerActions: {
    flexDirection: 'row',
    gap: 12,
  },
});

// WhatsApp Icon SVG - Real WhatsApp icon
function WhatsAppIconSVG() {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}
