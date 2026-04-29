import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Gift } from 'lucide-react-native';
import api from '../../api/client';
import useThemeColors from '../../theme/useThemeColors';
import useThemeTypography from '../../theme/useThemeTypography';

const DEFAULT_CONFIG = {
  is_enabled: true,
  registration_window_value: 30,
  registration_window_unit: 'days',
  minimum_order_amount: 20,
  currency: 'MYR',
  discountType: {
    type: 'fixed',
    value: 10,
  },
};

export default function FirstOrderDiscountModal({ visible, onClose }) {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const styles = useMemo(() => getStyles(colors, typography), [colors, typography]);

  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  useEffect(() => {
    if (!visible) return;

    const loadConfig = async () => {
      setLoading(true);
      try {
        const response = await api.get('/coupon/first-time-config');
        if (response && typeof response === 'object') {
          setConfig({
            ...DEFAULT_CONFIG,
            ...response,
            discountType: {
              ...DEFAULT_CONFIG.discountType,
              ...(response.discountType || {}),
            },
          });
        }
      } catch (error) {
        setConfig(DEFAULT_CONFIG);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [visible]);

  if (!visible) return null;

  const discountType = config?.discountType?.type === 'percentage' ? 'percentage' : 'fixed';
  const discountValue = Number(config?.discountType?.value || 0);
  const discountText = discountType === 'percentage'
    ? `${discountValue}%`
    : `${config?.currency || 'MYR'} ${discountValue.toFixed(2)}`;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Gift size={26} color="#1f9d4d" />
          </View>

          <Text style={styles.title}>Congratulations!</Text>
          <Text style={styles.bodyText}>
            Your account is ready. Place your first order and enjoy a special discount.
          </Text>

          <View style={styles.offerBox}>
            <Text style={styles.offerTitle}>{discountText} OFF on your first order</Text>
            <Text style={styles.offerLine}>
              No coupon code needed. It is automatically applied at checkout.
            </Text>
            <Text style={styles.offerLine}>
              Minimum order: {config?.currency || 'MYR'} {Number(config?.minimum_order_amount || 0).toFixed(2)}
            </Text>
            <Text style={styles.offerLine}>
              Valid for {Number(config?.registration_window_value || 30)} {config?.registration_window_unit || 'days'} from registration.
            </Text>
            <Text style={styles.offerLine}>T&C Applied.</Text>
          </View>

          <Text style={styles.expiryText}>
            Place your first order before the offer expires.
          </Text>

          <TouchableOpacity style={styles.button} onPress={onClose} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Start Ordering</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (colors, typography) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#e9f8ef',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    color: colors.text,
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    marginBottom: 8,
  },
  bodyText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    lineHeight: 20,
    marginBottom: 14,
  },
  offerBox: {
    backgroundColor: '#f0f8f4',
    borderColor: '#cdeed9',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  offerTitle: {
    color: '#1f9d4d',
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semiBold,
    marginBottom: 6,
  },
  offerLine: {
    color: colors.text,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    lineHeight: 18,
  },
  expiryText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    marginBottom: 14,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buttonText: {
    color: '#fff',
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semiBold,
  },
});
