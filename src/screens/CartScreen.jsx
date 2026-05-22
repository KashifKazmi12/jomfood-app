import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { ShoppingBag, Trash2, Truck, UtensilsCrossed } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import GradientBackground from '../components/GradientBackground';
import LoginPrompt from '../components/LoginPrompt';
import { showToast } from '../components/toast';
import { cartAPI } from '../api/cart';
import { useCart } from '../context/CartContext';
import useThemeColors from '../theme/useThemeColors';
import useThemeTypography from '../theme/useThemeTypography';
import { formatCurrency } from '../utils/formatCurrency';

export default function CartScreen() {
  const { t } = useTranslation();
  const user = useSelector(state => state.auth.user);
  const navigation = useNavigation();
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const styles = useMemo(() => getStyles(colors, typography), [colors, typography]);

  const { items, businessName, totals, updateItemQuantity, removeItem, clearCart, loading, reload } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponPreview, setCouponPreview] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const availableServiceTypes = useMemo(() => {
    if (!items.length) return [];
    const mapped = items.map((item) => item.consumptionType || []);
    const intersection = mapped.reduce((acc, list) => acc.filter((value) => list.includes(value)));
    if (intersection.length) return intersection;
    return Array.from(new Set(mapped.flat()));
  }, [items]);

  const confirmRemoveItem = (itemId, itemName) => {
    Alert.alert(
      t('cart.removeItemTitle', 'Remove Item'),
      t('cart.removeItemMessage', 'Are you sure you want to remove "{{name}}" from your cart?', { name: itemName }),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        { text: t('common.delete', 'Remove'), style: 'destructive', onPress: () => removeItem(itemId) },
      ]
    );
  };

  const confirmClearCart = () => {
    Alert.alert(
      t('cart.clearCartTitle', 'Clear Cart'),
      t('cart.clearCartMessage', 'Are you sure you want to remove all items from your cart?'),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        { text: t('cart.clear', 'Clear Cart'), style: 'destructive', onPress: () => clearCart() },
      ]
    );
  };

  const fetchCouponPreview = useCallback(async (code = null, showError = false) => {
    if (!user?._id || !items.length) {
      setCouponPreview(null);
      return null;
    }
    try {
      setCouponLoading(true);
      const response = await cartAPI.couponPreview(user._id, code || null);
      const data = response?.data?.data || response?.data || null;
      setCouponPreview(data);
      if (showError && data?.manual_coupon_error) {
        showToast.error('Error', data.manual_coupon_error);
      }
      return data;
    } catch (error) {
      if (showError) {
        showToast.error('Error', error?.response?.data?.message || error?.message || 'Invalid coupon');
      }
      setCouponPreview(null);
      return null;
    } finally {
      setCouponLoading(false);
    }
  }, [items.length, user?._id]);

  useEffect(() => {
    if (!user?._id || !items.length) {
      setCouponPreview(null);
      setCouponCode('');
      return;
    }
    fetchCouponPreview(null);
  }, [fetchCouponPreview, items.length, user?._id]);

  const handleCheckout = useCallback(async () => {
    if (!items.length) return;
    if (!user?._id) {
      showToast.info(t('common.login'), t('common.pleaseSignIn'));
      return;
    }
    if (!user?.phone || user.phone.trim() === '') {
      showToast.error(t('common.phoneRequired'), t('common.enterYourPhoneNumber'));
      navigation.navigate('Profile');
      return;
    }
    try {
      setSubmitting(true);
      const response = await cartAPI.checkoutCart(
        user._id,
        null,
        null,
        couponPreview?.applied_coupon?.source === 'manual'
          ? couponPreview?.applied_coupon?.coupon_code
          : null
      );

      const payload = response?.data?.data || response?.data || response || {};
      const success = response?.success === true || response?.data?.success === true || payload?.success === true;
      if (!success) {
        showToast.error('Error', payload?.message || 'Failed to start payment');
        reload?.();
        return;
      }

      const paymentUrl = payload?.payment_url;
      const paymentId = payload?.payment_id;
      if (paymentUrl) {
        navigation.navigate('CartPaymentWebView', { paymentId, paymentUrl });
        return;
      }
      if (paymentId) {
        navigation.navigate('CartPaymentStatus', { paymentId, paymentUrl });
        return;
      }
      showToast.error('Error', t('cart.claimFailed', 'Failed to start payment'));
    } catch (error) {
      showToast.error('Error', error?.message || 'Failed to start payment');
    } finally {
      setSubmitting(false);
    }
  }, [
    couponPreview?.applied_coupon?.coupon_code,
    couponPreview?.applied_coupon?.source,
    items.length,
    navigation,
    reload,
    t,
    user?._id,
    user?.phone,
  ]);

  if (!user) {
    return (
      <GradientBackground>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <LoginPrompt
            message={t('cart.loginRequired', 'Please sign in to view your cart')}
            onLogin={() => navigation.navigate('Login', { returnTo: 'Cart' })}
          />
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.container}>
            {businessName ? (
              <Text style={styles.businessLabel}>
                {t('cart.businessLabel', 'Restaurant:')} {businessName}
              </Text>
            ) : null}

            {loading ? (
              <View style={styles.centered}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.mutedText}>{t('common.loading')}</Text>
              </View>
            ) : items.length === 0 ? (
              <Text style={styles.mutedText}>{t('cart.empty', 'Your cart is empty.')}</Text>
            ) : (
              <>
                <View style={styles.itemsList}>
                  {items.map((item) => (
                    <View key={item.id} style={styles.itemCard}>
                      <View style={styles.itemImageWrap}>
                        {item.deal_image ? (
                          <Image source={{ uri: item.deal_image }} style={styles.itemImage} />
                        ) : null}
                      </View>
                      <View style={styles.itemInfo}>
                        <Text numberOfLines={2} style={styles.itemTitle}>
                          {item.deal_name}
                        </Text>
                        <View style={styles.qtyRow}>
                          <TouchableOpacity
                            style={[styles.qtyButton, Number(item.quantity || 1) <= 1 && styles.qtyButtonDisabled]}
                            onPress={() => updateItemQuantity(item.id, Number(item.quantity || 1) - 1)}
                            disabled={Number(item.quantity || 1) <= 1}
                          >
                            <Text style={styles.qtyButtonText}>-</Text>
                          </TouchableOpacity>
                          <Text style={styles.qtyValue}>{Number(item.quantity || 1)}</Text>
                          <TouchableOpacity
                            style={styles.qtyButton}
                            onPress={() => updateItemQuantity(item.id, Number(item.quantity || 1) + 1)}
                          >
                            <Text style={styles.qtyButtonText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View style={styles.itemMeta}>
                        <Text style={styles.itemPrice}>
                          {formatCurrency(Number(item.deal_total || 0) * Number(item.quantity || 1))}
                        </Text>
                        <TouchableOpacity onPress={() => confirmRemoveItem(item.id, item.deal_name)} style={styles.removeButton}>
                          <Trash2 size={16} color={colors.textMuted} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>

                {availableServiceTypes.length > 0 && (
                  <View style={styles.consumptionSection}>
                    <View style={styles.consumptionBadges}>
                      {availableServiceTypes.map((type) => {
                        const Icon = type === 'delivery' ? Truck : type === 'dine-in' ? UtensilsCrossed : ShoppingBag;
                        const label = type === 'delivery'
                          ? t('common.delivery')
                          : type === 'dine-in'
                            ? t('common.dineIn')
                            : t('common.selfPickup');
                        const badgeStyle = type === 'delivery'
                          ? styles.deliveryBadge
                          : type === 'dine-in'
                            ? styles.dineInBadge
                            : styles.pickupBadge;
                        const textStyle = type === 'delivery'
                          ? styles.deliveryText
                          : type === 'dine-in'
                            ? styles.dineInText
                            : styles.pickupText;
                        const iconColor = type === 'delivery'
                          ? '#2563EB'
                          : type === 'dine-in'
                            ? '#16A34A'
                            : '#EA580C';
                        return (
                          <View key={type} style={[styles.consumptionBadge, badgeStyle]}>
                            <Icon size={12} color={iconColor} />
                            <Text style={[styles.consumptionBadgeText, textStyle]}>{label}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}

                <View style={styles.preferences}>
                  {couponPreview?.applied_coupon?.source === 'first_time' ? (
                    <View style={styles.firstTimeBanner}>
                      <Text style={styles.firstTimeBannerText}>
                        {couponPreview?.first_time_message || 'Congratulations! First-time discount applied.'}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.couponWrap}>
                      <Text style={styles.sectionLabel}>{t('cart.couponCode', 'Coupon Code')}</Text>
                      <View style={styles.couponRow}>
                        <TextInput
                          value={couponCode}
                          onChangeText={(text) => setCouponCode((text || '').toUpperCase())}
                          placeholder={t('cart.enterCouponCode', 'Enter coupon code')}
                          placeholderTextColor={colors.textMuted}
                          autoCapitalize="characters"
                          style={styles.couponInput}
                        />
                        <TouchableOpacity
                          style={[styles.couponApplyButton, (couponLoading || !couponCode.trim()) && styles.checkoutButtonDisabled]}
                          disabled={couponLoading || !couponCode.trim()}
                          onPress={() => fetchCouponPreview(couponCode, true)}
                        >
                          <Text style={styles.couponApplyButtonText}>
                            {couponLoading ? '...' : t('cart.applyCoupon', 'Apply')}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      {couponPreview?.applied_coupon?.source === 'manual' ? (
                        <Text style={styles.couponAppliedText}>
                          {t('cart.couponApplied', 'Coupon applied')}: {couponPreview.applied_coupon.coupon_code}
                        </Text>
                      ) : null}
                    </View>
                  )}

                </View>

                <View style={styles.summary}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>{t('cart.subtotal', 'Subtotal')}</Text>
                    <Text style={styles.summaryValue}>
                      {formatCurrency(couponPreview?.subtotal_amount ?? totals.total)}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabelRed}>{t('cart.couponDiscount', 'Coupon Discount')}</Text>
                    <Text style={styles.summaryValueRed}>
                      - {formatCurrency(couponPreview?.coupon_discount_amount ?? 0)}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabelTotal}>{t('cart.total', 'Total')}</Text>
                    <Text style={styles.summaryValueTotal}>
                      {formatCurrency(
                        couponPreview?.total_after_coupon ??
                        ((couponPreview?.subtotal_amount ?? totals.total) - (couponPreview?.coupon_discount_amount ?? 0))
                      )}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.checkoutButton, submitting && styles.checkoutButtonDisabled]}
                    onPress={handleCheckout}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <Text style={styles.checkoutButtonText}>
                        {t('cart.claimDeals', 'Proceed to Payment')}
                      </Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.clearButton} onPress={confirmClearCart}>
                    <Text style={styles.clearButtonText}>{t('cart.clear', 'Clear Cart')}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const getStyles = (colors, typography) => StyleSheet.create({
  safe: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  title: {
    fontSize: typography.fontSize.lg,
    color: colors.text,
    fontFamily: typography.fontFamily.semiBold,
    marginBottom: 6,
  },
  businessLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    marginBottom: 10,
  },
  centered: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 6,
  },
  mutedText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
  },
  itemsList: {
    gap: 10,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  itemImageWrap: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: colors.backgroundLight,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemInfo: {
    flex: 1,
    gap: 8,
  },
  itemTitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontFamily: typography.fontFamily.semiBold,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyButtonDisabled: {
    opacity: 0.4,
  },
  qtyButtonText: {
    color: colors.text,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semiBold,
  },
  qtyValue: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontFamily: typography.fontFamily.semiBold,
  },
  itemMeta: {
    alignItems: 'flex-end',
    gap: 8,
  },
  itemPrice: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontFamily: typography.fontFamily.semiBold,
  },
  removeButton: {
    padding: 6,
  },
  preferences: {
    marginTop: 10,
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  couponWrap: {
    gap: 8,
  },
  couponRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  couponInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontFamily: typography.fontFamily.medium,
    backgroundColor: colors.backgroundLight,
  },
  couponApplyButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primaryLighter,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  couponApplyButtonText: {
    color: colors.primary,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semiBold,
  },
  couponAppliedText: {
    fontSize: typography.fontSize.xs,
    color: '#16a34a',
    fontFamily: typography.fontFamily.medium,
  },
  firstTimeBanner: {
    borderWidth: 1,
    borderColor: '#bbf7d0',
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  firstTimeBannerText: {
    color: '#15803d',
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontFamily: typography.fontFamily.semiBold,
  },
  consumptionSection: {
    marginTop: 10,
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
  serviceTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  serviceTypeButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLighter,
  },
  serviceTypeText: {
    fontSize: typography.fontSize.xs,
    color: colors.text,
    fontFamily: typography.fontFamily.medium,
  },
  serviceTypeTextActive: {
    color: colors.primary,
    fontFamily: typography.fontFamily.semiBold,
  },
  sectionLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    fontFamily: typography.fontFamily.regular,
  },
  dateTimeButtonFull: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundLight,
  },
  dateTimeButtonError: {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
  },
  dateTimeTextFull: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontFamily: typography.fontFamily.medium,
  },
  dateTimeTextError: {
    color: '#dc2626',
  },
  dateTimeErrorText: {
    marginTop: -4,
    fontSize: typography.fontSize.xs,
    color: '#dc2626',
    fontFamily: typography.fontFamily.medium,
  },
  deliveryNote: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.primaryLighter,
  },
  deliveryNoteText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontFamily: typography.fontFamily.medium,
  },
  iosPickerCard: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  iosPickerDone: {
    paddingVertical: 14,
    marginHorizontal: 12,
    marginBottom: 12,
    marginTop: 8,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  iosPickerDoneText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semiBold,
  },
  summary: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    fontFamily: typography.fontFamily.regular,
  },
  summaryLabelRed: {
    fontSize: typography.fontSize.sm,
    color: '#dc2626',
    fontFamily: typography.fontFamily.medium,
  },
  summaryLabelTotal: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontFamily: typography.fontFamily.semiBold,
  },
  summaryValue: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    fontFamily: typography.fontFamily.semiBold,
  },
  summaryValueRed: {
    fontSize: typography.fontSize.md,
    color: '#dc2626',
    fontFamily: typography.fontFamily.semiBold,
  },
  summaryValueTotal: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    fontFamily: typography.fontFamily.bold || typography.fontFamily.semiBold,
  },
  checkoutButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  checkoutButtonDisabled: {
    opacity: 0.7,
  },
  checkoutButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semiBold,
  },
  clearButton: {
    backgroundColor: colors.backgroundLight,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  clearButtonText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
});
