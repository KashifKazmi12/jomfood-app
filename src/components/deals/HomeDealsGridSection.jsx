import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Package } from 'lucide-react-native';
import useThemeColors from '../../theme/useThemeColors';
import { dealsAPI } from '../../api/deals';
import DealGridCard from './DealGridCard';
import DealGridCardSkeleton from './DealGridCardSkeleton';
import useThemeTypography from '../../theme/useThemeTypography';

export default function HomeDealsGridSection({ title, params, onItemView, onQuickClaim, onViewAll }) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const styles = useMemo(() => getStyles(colors, typography), [colors, typography]);

  const { data, isLoading } = useQuery({
    queryKey: ['home-grid', title, JSON.stringify(params)],
    queryFn: async () => {
      // console.log('📋 [HomeDealsGridSection] Query running with params:', params);
      const res = await dealsAPI.listActive({ ...params, page: 1, limit: 6 });
      return Array.isArray(res?.deals) ? res.deals : [];
    },
  });

  // Memoize callbacks
  const keyExtractor = useCallback((item) => item._id, []);
  const renderItem = useCallback(({ item }) => (
    <DealGridCard
      deal={item}
      onView={() => onItemView?.(item)}
      onQuickClaim={() => onQuickClaim?.(item)}
    />
  ), [onItemView, onQuickClaim]);

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.headerText}>{title}</Text>
        {!isLoading && (
          <Text style={styles.viewAll} onPress={() => onViewAll?.(params)}>{t('common.seeAll')} ›</Text>
        )}
      </View>
      {isLoading ? (
        <View style={styles.skeletonContainer}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <DealGridCardSkeleton key={i} />
          ))}
        </View>
      ) : data && data.length > 0 ? (
        <FlatList
          data={data}
          keyExtractor={keyExtractor}
          numColumns={2}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          removeClippedSubviews={true}
          maxToRenderPerBatch={6}
          windowSize={3}
          initialNumToRender={6}
          renderItem={renderItem}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Package size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>{t('common.noDealsFound')}</Text>
          <Text style={styles.emptySubtext}>{t('common.tryAdjustingFilters')}</Text>
        </View>
      )}
    </View>
  );
}

const getStyles = (colors, typography) => StyleSheet.create({
  wrap: { marginTop: 0 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  headerText: { 
    color: colors.text,
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.semiBold,
  },
  viewAll: { color: colors.primaryDark },
  columnWrapper: { 
    gap: 12,
    justifyContent: 'space-between',
  },
  listContent: { 
    paddingBottom: 6,
    gap: 0,
  },
  skeletonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  emptyContainer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
  },
  emptyText: {
    color: colors.text,
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    textAlign: 'center',
  },
});


