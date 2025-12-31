import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import useThemeColors from '../../theme/useThemeColors';
import { dealsAPI } from '../../api/deals';
import useThemeTypography from '../../theme/useThemeTypography';

const DealTile = React.memo(function DealTile({ deal, onView, onQuickClaim, colors, t }) {
  const img = deal?.deal_image ||
    (Array.isArray(deal?.deal_items) && deal.deal_items[0]?.product_image) ||
    (Array.isArray(deal?.deal_images) && deal.deal_images[0]) ||
    'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1200&auto=format&fit=crop';
  const name = deal?.deal_name || 'Deal';
  const price = deal?.deal_total ?? null;

  return (
    <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <TouchableOpacity activeOpacity={0.9} onPress={onView}>
        <Image source={{ uri: img }} style={styles.image} />
      </TouchableOpacity>
      <View style={styles.info}>
        <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>{name}</Text>
        <Text style={[styles.price, { color: colors.primary }]}>
          {price != null ? `RM${price.toFixed(2)}` : '—'}
        </Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.viewBtn, { backgroundColor: colors.primary }]} onPress={onView}>
            <Text style={[styles.viewText, { color: colors.white }]}>{t('common.view')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.addBtn, { borderColor: colors.primary }]} onPress={onQuickClaim}>
            <Text style={[styles.addText, { color: colors.primary }]}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

export default function HomeDealsSection({ title, params, onViewAll, onItemView, onQuickClaim }) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const stylesLocal = React.useMemo(() => getStyles(colors, typography), [colors, typography]);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['home-section', title, params],
    queryFn: async () => {
      const res = await dealsAPI.listActive({ ...params, page: 1, limit: 10 });
      return Array.isArray(res?.deals) ? res.deals : [];
    },
  });

  // Memoize callbacks to prevent re-renders
  const keyExtractor = useCallback((item) => item._id, []);
  const renderItem = useCallback(({ item }) => (
    <DealTile
      deal={item}
      colors={colors}
      t={t}
      onView={() => onItemView?.(item)}
      onQuickClaim={() => onQuickClaim?.(item)}
    />
  ), [colors, t, onItemView, onQuickClaim]);

  return (
    <View style={stylesLocal.wrap}>
      <View style={stylesLocal.headerRow}>
        <Text style={stylesLocal.headerText}>{title}</Text>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll}>
            <Text style={stylesLocal.viewAll}>{t('common.seeAll')} ›</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={data || []}
          keyExtractor={keyExtractor}
          contentContainerStyle={{ paddingHorizontal: 4 }}
          removeClippedSubviews={true}
          maxToRenderPerBatch={5}
          windowSize={5}
          initialNumToRender={5}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const getStyles = (colors, typography) => StyleSheet.create({
  wrap: { marginTop: 18 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  headerText: { fontSize: 16, fontFamily: typography.fontFamily.semiBold, color: colors.text },
  viewAll: { fontSize: 12, color: colors.primaryDark, fontFamily: typography.fontFamily.semiBold },
});

const styles = StyleSheet.create({
  card: { width: 160, marginRight: 12, borderRadius: 12, overflow: 'hidden', borderWidth: 1 },
  image: { width: '100%', height: 100 },
  info: { padding: 10 },
  title: { fontSize: 13, fontFamily: typography.fontFamily.semiBold },
  price: { marginTop: 4, fontSize: 12, fontFamily: typography.fontFamily.semiBold },
  actionsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 },
  viewBtn: { flex: 1, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  viewText: { fontSize: 12, fontFamily: typography.fontFamily.semiBold },
  addBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  addText: { fontSize: 18, fontFamily: typography.fontFamily.semiBold },
});


