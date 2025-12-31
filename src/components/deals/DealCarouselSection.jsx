import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image, Dimensions, Linking, Platform } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Package, MapPin, Phone, Store } from 'lucide-react-native';
import useThemeColors from '../../theme/useThemeColors';
import { dealsAPI } from '../../api/deals';
import useThemeTypography from '../../theme/useThemeTypography';
import { formatCurrency } from '../../utils/formatCurrency';
import { openWhatsApp } from '../../utils/whatsapp';
import { showToast } from '../toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 60) / 2; // Show 2 cards with spacing
const CARD_MARGIN = 8;

const getCardStyles = (colors, typography) => StyleSheet.create({
  card: {
    marginRight: CARD_MARGIN,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    padding: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    minHeight: 220,
  },
  cardTouchable: {},
  topSection: {
    flex: 1,
    paddingBottom: 8,
  },
  title: {
    fontSize: 15,
    marginBottom: 0,
  },
  desc: {
    fontSize: 12,
    height: 40,
    marginBottom: 2,
    lineHeight: 18,
  },
  restaurantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    width: '100%',
  },
  restaurantInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginRight: 6,
    minWidth: 0,
  },
  restaurantText: {
    flex: 1,
    fontSize: 11,
  },
  iconButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexShrink: 0,
  },
  iconButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  pricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 0,
  },
  pricingContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontFamily: "Manrope",
  },
  price: {
    fontSize: 11,
  },
  originalPrice: {
    fontSize: 10,
    textDecorationLine: 'line-through',
  },
  imageContainer: {
    height: 110,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
  },
  foodImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  addBtn: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 32,
    height: 32,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  addText: {
    fontSize: 24,
    lineHeight: 28,
  },
  dealTypeBadge: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 1,
    // borderRadius: 8,
    //correct property for border radius right
    borderTopLeftRadius: 7,
    borderBottomRightRadius: 7,
  },
  dealTypeBadgeText: {
    color: colors.white,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semiBold,
  },
});

const DealCard = React.memo(function DealCard({ deal, onView, onQuickClaim, colors, typography }) {
  const styles = getCardStyles(colors, typography);
  const { t } = useTranslation();
  const img = deal?.deal_image ||
    (Array.isArray(deal?.deal_items) && deal.deal_items[0]?.product_image) ||
    (Array.isArray(deal?.deal_images) && deal.deal_images[0]) ||
    'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1200&auto=format&fit=crop';
  const name = deal?.deal_name || 'Deal';
  const desc = deal?.deal_description || '-';
  const price = deal?.deal_total ?? null;
  const originalPrice = deal?.original_total ?? null;
  const deal_type = deal?.deal_type || 'Deal';
  const discountPercentage = deal?.discount_percentage ?? 0;
  const discountAmount = deal?.discount_amount ?? 0;

  const company = deal?.business_id?.company_name || deal?.group_id?.name || 'Restaurant';
  const latitude = deal?.business_id?.lat || '';
  const longitude = deal?.business_id?.lng || '';
  const officePhone = deal?.business_id?.office_phone || '';

  const handleWhatsAppPress = useCallback(async (e) => {
    e.stopPropagation();

    if (!officePhone) {
      showToast.error(t('common.noPhone'), t('common.phoneNumberNotAvailable'));
      return;
    }

    try {
      // Same implementation as Web - uses https://wa.me/ URL
      await openWhatsApp(officePhone);
    } catch (error) {
      console.error('WhatsApp open error:', error);
      showToast.error(t('common.error'), t('common.couldNotOpenWhatsApp'));
    }
  }, [officePhone, t]);

  const handleMapPress = useCallback(async (e) => {
    e.stopPropagation();

    if (!latitude || !longitude) {
      showToast.error(t('common.noLocation'), t('common.locationNotAvailable'));
      return;
    }

    try {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      const url = Platform.select({
        ios: `maps://app?daddr=${lat},${lng}&directionsmode=driving`,
        android: `google.navigation:q=${lat},${lng}`,
      });

      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

      const canOpen = await Linking.canOpenURL(url || '');
      if (canOpen && url) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(googleMapsUrl);
      }
    } catch (error) {
      showToast.error(t('common.error'), t('common.couldNotOpenMaps'));
    }
  }, [latitude, longitude, t]);

  //capitalize the first letter of the deal type and remove the underscore and add a space between the words
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

  return (
    <View style={[styles.card, { width: CARD_WIDTH }]}>
      <TouchableOpacity activeOpacity={0.9} onPress={onView} style={styles.cardTouchable}>
        {/* Top Section: Text Information */}
        <View style={styles.topSection}>
          <Text numberOfLines={1} style={[styles.title, { color: colors.textDark || colors.text, fontFamily: typography.fontFamily.semiBold }]}>{name}</Text>
          {/* <Text numberOfLines={2} style={[styles.desc, { color: colors.textMuted, fontFamily: typography.fontFamily.regular }]}>{desc}</Text> */}

          {/* Restaurant Info with Action Buttons */}
          <View style={styles.restaurantRow}>
            <View style={styles.restaurantInfo}>
              <Store size={11} color={colors.primary} strokeWidth={2.5} />
              <Text numberOfLines={1} style={[styles.restaurantText, { color: colors.text, fontFamily: typography.fontFamily.medium }]}>{company}</Text>
            </View>
            {(officePhone || (latitude && longitude)) && (
              <View style={styles.iconButtons}>
                {officePhone && (
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={handleWhatsAppPress}
                    activeOpacity={0.7}
                  >
                    <Phone size={11} color="#25D366" strokeWidth={2} />
                  </TouchableOpacity>
                )}
                {latitude && longitude && (
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={handleMapPress}
                    activeOpacity={0.7}
                  >
                    <MapPin size={11} color="#4285F4" strokeWidth={2} />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
          <View style={styles.pricingRow}>
            <View style={[styles.pricingContainer, { backgroundColor: colors.primaryLighter }]}>
              {price != null && (
                <Text style={[styles.price, { color: colors.primary, fontFamily: typography.fontFamily.semiBold }]}>{formatCurrency(price)}</Text>
              )}
              {originalPrice != null && (
                <Text style={[styles.originalPrice, { color: colors.textMuted, fontFamily: typography.fontFamily.regular }]}>{formatCurrency(originalPrice)}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Bottom Section: Food Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: img }} style={styles.foodImage} resizeMode="cover" />
        </View>
      </TouchableOpacity>

      {/* Add Button - Overlapping bottom right */}
      {/* <TouchableOpacity 
        onPress={onView} 
        style={[styles.addBtn, { backgroundColor: colors.primary }]}
        activeOpacity={0.8}
      >
        <Text style={[styles.addText, { color: colors.white, fontFamily: typography.fontFamily.semiBold }]}>+</Text>
      </TouchableOpacity> */}
      {/* //TODO: Add bedge for deal type */}
      <View style={styles.dealTypeBadge}>
        <Text style={styles.dealTypeBadgeText}>{discountText}</Text>
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  // Only re-render if deal ID changes or handlers change
  return prevProps.deal?._id === nextProps.deal?._id &&
    prevProps.onView === nextProps.onView &&
    prevProps.onQuickClaim === nextProps.onQuickClaim;
});

export default function DealCarouselSection({
  title,
  dealCategoryId = null,
  params = {},
  onViewAll,
  onItemView,
  onQuickClaim,
  autoSlide = true,
  autoSlideInterval = 3000,
  hideWhenEmpty = false // New prop: if true, don't render section when no deals
}) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const stylesLocal = React.useMemo(() => getStyles(colors, typography), [colors, typography]);
  const flatListRef = useRef(null);
  const currentIndexRef = useRef(0);
  const autoSlideTimerRef = useRef(null);

  // Fetch deals - either by category or with general params
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: dealCategoryId
      ? ['category-deals', dealCategoryId, JSON.stringify(params)]
      : ['home-section', title, JSON.stringify(params)],
    queryFn: async () => {
      let res;
      if (dealCategoryId) {
        res = await dealsAPI.getDealsByCategory(dealCategoryId, { ...params, limit: 10 });
      } else {
        res = await dealsAPI.listActive({ ...params, page: 1, limit: 10 });
      }
      return Array.isArray(res?.deals) ? res.deals : [];
    },
    enabled: true,
  });

  // Auto-slide functionality
  useEffect(() => {
    if (!autoSlide || !data || data.length <= 2) {
      return; // Don't auto-slide if disabled or not enough items
    }

    const startAutoSlide = () => {
      autoSlideTimerRef.current = setInterval(() => {
        if (flatListRef.current && data && data.length > 0) {
          currentIndexRef.current = (currentIndexRef.current + 1) % data.length;
          try {
            flatListRef.current.scrollToIndex({
              index: currentIndexRef.current,
              animated: true,
            });
          } catch (e) {
            // Ignore scroll errors (can happen when component is unmounting or not visible)
          }
        }
      }, autoSlideInterval);
    };

    startAutoSlide();

    return () => {
      if (autoSlideTimerRef.current) {
        clearInterval(autoSlideTimerRef.current);
      }
    };
  }, [autoSlide, autoSlideInterval, data]);

  // Handle scroll to index failures gracefully
  const onScrollToIndexFailed = useCallback((info) => {
    // Scroll to a safe offset instead
    const offset = info.averageItemLength * info.index;
    flatListRef.current?.scrollToOffset({ offset, animated: true });
  }, []);

  // Get item layout for better scroll performance
  const getItemLayout = useCallback((data, index) => ({
    length: CARD_WIDTH + CARD_MARGIN,
    offset: (CARD_WIDTH + CARD_MARGIN) * index,
    index,
  }), []);

  const handleScroll = useCallback((event) => {
    if (!data || data.length === 0) return;
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (CARD_WIDTH + CARD_MARGIN));
    currentIndexRef.current = index;
  }, [data]);

  // Memoize callbacks
  const keyExtractor = useCallback((item, index) => item._id || `deal-${index}`, []);
  const renderItem = useCallback(({ item }) => (
    <DealCard
      deal={item}
      colors={colors}
      typography={typography}
      onView={() => onItemView?.(item)}
      onQuickClaim={() => onQuickClaim?.(item)}
    />
  ), [colors, typography, onItemView, onQuickClaim]);

  if (isLoading) {
    return (
      <View style={stylesLocal.wrap}>
        <View style={stylesLocal.headerRow}>
          <View style={stylesLocal.headerTextContainer}>
            <Text style={stylesLocal.headerText}>{title}</Text>
          </View>
        </View>
        <View style={stylesLocal.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!data || data.length === 0) {
    // If hideWhenEmpty is true, don't render anything
    if (hideWhenEmpty) {
      return null;
    }

    // Otherwise show empty state
    return (
      <View style={stylesLocal.wrap}>
        <View style={stylesLocal.headerRow}>
          <View style={stylesLocal.headerTextContainer}>
            <Text style={stylesLocal.headerText}>{title}</Text>
          </View>
        </View>
        <View style={stylesLocal.emptyContainer}>
          <Package size={40} color={colors.textMuted} />
          <Text style={stylesLocal.emptyText}>{t('common.noDealsAvailable')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={stylesLocal.wrap}>
      <View style={stylesLocal.headerRow}>
        <View style={stylesLocal.headerTextContainer}>
          <Text style={stylesLocal.headerText}>{title}</Text>
        </View>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll} style={stylesLocal.viewAllButton}>
            <Text style={stylesLocal.viewAll}>{t('common.seeAll')} ›</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        data={data}
        keyExtractor={keyExtractor}
        contentContainerStyle={stylesLocal.flatListContent}
        snapToInterval={CARD_WIDTH + CARD_MARGIN}
        decelerationRate="fast"
        snapToAlignment="start"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={renderItem}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        windowSize={5}
        initialNumToRender={5}
        getItemLayout={getItemLayout}
        onScrollToIndexFailed={onScrollToIndexFailed}
      />
    </View>
  );
}

const getStyles = (colors, typography) => StyleSheet.create({
  wrap: {
    marginTop: 8,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
    paddingHorizontal: 0,
    gap: 12,
  },
  headerTextContainer: {
    flex: 1,
    flexShrink: 1,
    marginRight: 8,
  },
  headerText: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
    flexWrap: 'wrap',
  },
  viewAllButton: {
    flexShrink: 0,
  },
  viewAll: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontFamily: typography.fontFamily.semiBold,
  },
  flatListContent: {
    paddingHorizontal: 0,
    paddingVertical: 4,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    marginTop: 12,
  },
});

