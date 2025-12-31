import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import useThemeColors from '../../theme/useThemeColors';

function getDealImage(deal) {
  const firstItem = Array.isArray(deal?.deal_items) && deal.deal_items.length > 0 ? deal.deal_items[0] : null;
  const candidate = firstItem?.product_image;
  return candidate || 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1200&auto=format&fit=crop';
}

function DealCard({ deal, onView, onQuickClaim }) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const img = useMemo(() => getDealImage(deal), [deal]);

  const name = deal?.deal_name || 'Delicious deal';
  const company = deal?.business_id?.company_name || deal?.group_id?.name || 'Restaurant';
  const original = deal?.original_total ?? null;
  const price = deal?.deal_total ?? null;
  const discountPct = deal?.discount_percentage ?? null;

  return (
    <View style={styles.card}>
      <TouchableOpacity activeOpacity={0.9} onPress={onView}>
        <Image source={{ uri: img }} style={styles.image} />
      </TouchableOpacity>
      <View style={styles.info}>
        <Text numberOfLines={1} style={styles.title}>{name}</Text>
        <Text numberOfLines={1} style={styles.subtitle}>{company}</Text>
        <View style={styles.row}>
          {price != null && <Text style={styles.price}>${price.toFixed(2)}</Text>}
          {original != null && <Text style={styles.original}>${original.toFixed(2)}</Text>}
          {discountPct != null && <Text style={styles.badge}>-{discountPct}%</Text>}
        </View>
        <View style={styles.ctaRow}>
          <TouchableOpacity style={styles.viewBtn} onPress={onView}>
            <Text style={styles.viewText}>{t('common.viewDetails')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickClaim} onPress={onView}>
            <Text style={styles.quickClaimIcon}>★</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  image: { width: '100%', height: 140 },
  info: { padding: 12 },
  title: { color: colors.text },
  subtitle: { marginTop: 2, color: colors.textMuted },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  price: { color: colors.primary },
  original: { color: colors.textMuted, textDecorationLine: 'line-through' },
  badge: { marginLeft: 'auto', color: colors.white, backgroundColor: colors.primaryDark, paddingVertical: 2, paddingHorizontal: 6, borderRadius: 8 },
  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  viewBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  viewText: { color: colors.white },
  quickClaim: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  quickClaimIcon: { color: colors.primary },
});

// Memoize component to prevent unnecessary re-renders
export default React.memo(DealCard, (prevProps, nextProps) => {
  // Only re-render if deal ID changes or handlers change
  return prevProps.deal?._id === nextProps.deal?._id &&
    prevProps.onView === nextProps.onView &&
    prevProps.onQuickClaim === nextProps.onQuickClaim;
});

