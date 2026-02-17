import React, { useMemo, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import WebView from 'react-native-webview';
import GradientBackground from '../components/GradientBackground';
import useThemeColors from '../theme/useThemeColors';
import useThemeTypography from '../theme/useThemeTypography';

const extractPaymentId = (url) => {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/[?&]payment_id=([^&]+)/i);
  return match ? decodeURIComponent(match[1]) : null;
};

export default function CartPaymentWebViewScreen() {
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const styles = useMemo(() => getStyles(colors, typography), [colors, typography]);
  const paymentUrl = route.params?.paymentUrl;
  const paymentIdFromParams = route.params?.paymentId;
  const [loading, setLoading] = useState(true);

  const handleNavigationStateChange = (navState) => {
    const nextUrl = navState?.url;
    const paymentId = extractPaymentId(nextUrl) || paymentIdFromParams;
    if (nextUrl && nextUrl.includes('cart-payment') && paymentId) {
      navigation.replace('CartPaymentStatus', { paymentId, paymentUrl });
    }
  };

  if (!paymentUrl) {
    return (
      <GradientBackground>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{t('cart.paymentFailed', 'Payment failed')}</Text>
            <Text style={styles.emptySubtitle}>{t('cart.paymentFailedHint', 'Payment was not completed. Please try again.')}</Text>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.container}>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>{t('cart.paymentProcessing', 'Payment processing')}</Text>
            </View>
          )}
          <WebView
            source={{ uri: paymentUrl }}
            onLoadEnd={() => setLoading(false)}
            onNavigationStateChange={handleNavigationStateChange}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>{t('cart.paymentProcessing', 'Payment processing')}</Text>
              </View>
            )}
          />
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
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    margin: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.backgroundLight,
    alignItems: 'center',
    zIndex: 2,
  },
  loadingText: {
    marginTop: 6,
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text,
    fontFamily: typography.fontFamily.semiBold,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    fontFamily: typography.fontFamily.regular,
    textAlign: 'center',
  },
});
