import React, { useEffect, useMemo, useState, useRef } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import GradientBackground from '../components/GradientBackground';
import { cartAPI } from '../api/cart';
import { useCart } from '../context/CartContext';
import useThemeColors from '../theme/useThemeColors';
import useThemeTypography from '../theme/useThemeTypography';

export default function CartPaymentStatusScreen() {
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const styles = useMemo(() => getStyles(colors, typography), [colors, typography]);
  const { reload, clearCart } = useCart();
  const queryClient = useQueryClient();
  const clearedRef = useRef(false);

  const paymentId = route.params?.paymentId;
  const paymentUrl = route.params?.paymentUrl;
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let intervalId;
    const fetchStatus = async () => {
      if (!paymentId) return;
      try {
        const response = await cartAPI.getCartPaymentStatus(paymentId);
        const payload = response?.data?.data || response?.data || response || {};
        const nextStatus = payload?.status || 'pending';
        setStatus(nextStatus);
        if (nextStatus === 'paid' || nextStatus === 'failed' || nextStatus === 'cancelled') {
          clearInterval(intervalId);
          reload?.();
          if (nextStatus === 'paid' && !clearedRef.current) {
            clearedRef.current = true;
            clearCart?.();
            queryClient.invalidateQueries({ queryKey: ['claim-history'] });
          }
        }
      } catch (error) {
        console.error('Failed to get payment status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    intervalId = setInterval(fetchStatus, 3000);
    return () => clearInterval(intervalId);
  }, [paymentId, reload]);

  const isSuccess = status === 'paid';
  const isFailed = status === 'failed' || status === 'cancelled';

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.container}>
          <View style={styles.card}>
            {loading && (
              <>
                <View style={styles.iconWrap}>
                  <Loader2 size={40} color={colors.primary} />
                </View>
                <Text style={styles.title}>{t('cart.paymentProcessing', 'Payment processing')}</Text>
                <Text style={styles.subtitle}>{t('cart.paymentProcessingHint', "We're confirming your payment. Please wait...")}</Text>
              </>
            )}

            {!loading && isSuccess && (
              <>
                <View style={styles.iconWrap}>
                  <CheckCircle size={44} color={colors.primary} />
                </View>
                <Text style={styles.title}>{t('cart.paymentSuccess', 'Payment successful')}</Text>
                <Text style={styles.subtitle}>{t('cart.paymentSuccessHint', 'Payment confirmed. Your deals are ready.')}</Text>
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.primaryButton, styles.actionButton]}
                    onPress={() => {
                      clearCart?.();
                      queryClient.invalidateQueries({ queryKey: ['claim-history'] });
                      navigation.navigate('RootTabs', { screen: 'MyDeals' });
                    }}
                  >
                    <Text style={styles.primaryButtonText}>{t('cart.viewMyDeals', 'View My Deals')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.secondaryButton, styles.actionButton]}
                    onPress={() => {
                      clearCart?.();
                      queryClient.invalidateQueries({ queryKey: ['claim-history'] });
                      navigation.navigate('RootTabs', { screen: 'Home' });
                    }}
                  >
                    <Text style={styles.secondaryButtonText}>{t('cart.backToDeals', 'Back to Deals')}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {!loading && isFailed && (
              <>
                <View style={styles.iconWrap}>
                  <XCircle size={44} color={colors.error} />
                </View>
                <Text style={styles.title}>{t('cart.paymentFailed', 'Payment failed')}</Text>
                <Text style={styles.subtitle}>{t('cart.paymentFailedHint', 'Payment was not completed. Please try again.')}</Text>
                <View style={styles.actionRow}>
                  {paymentUrl ? (
                    <TouchableOpacity
                      style={[styles.primaryButton, styles.actionButton]}
                      onPress={() => Linking.openURL(paymentUrl)}
                    >
                      <Text style={styles.primaryButtonText}>{t('cart.tryAgain', 'Try Again')}</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity
                    style={[styles.secondaryButton, styles.actionButton]}
                    onPress={() => navigation.navigate('RootTabs', { screen: 'Home' })}
                  >
                    <Text style={styles.secondaryButtonText}>{t('cart.backToDeals', 'Back to Deals')}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {!loading && !isSuccess && !isFailed && (
              <>
                <View style={styles.iconWrap}>
                  <Loader2 size={40} color={colors.primary} />
                </View>
                <Text style={styles.title}>{t('cart.paymentProcessing', 'Payment processing')}</Text>
                <Text style={styles.subtitle}>{t('cart.paymentProcessingHint', "We're confirming your payment. Please wait...")}</Text>
                {paymentUrl ? (
                  <TouchableOpacity style={styles.primaryButton} onPress={() => Linking.openURL(paymentUrl)}>
                    <Text style={styles.primaryButtonText}>{t('cart.openPayment', 'Open Payment Page')}</Text>
                  </TouchableOpacity>
                ) : null}
              </>
            )}
          </View>
          {loading && (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 12 }} />
          )}
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const getStyles = (colors, typography) => StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.fontSize.lg,
    color: colors.text,
    fontFamily: typography.fontFamily.semiBold,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    fontFamily: typography.fontFamily.regular,
    textAlign: 'center',
  },
  actionRow: {
    width: '100%',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    width: '100%',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semiBold,
  },
  secondaryButton: {
    backgroundColor: colors.backgroundLight,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
  },
  secondaryButtonText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
});
