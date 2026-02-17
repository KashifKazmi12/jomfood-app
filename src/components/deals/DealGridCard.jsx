import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import useThemeColors from '../../theme/useThemeColors';
import useThemeTypography from '../../theme/useThemeTypography';
import { MapPin, Phone, Store, Share2 } from 'lucide-react-native';
import { formatCurrency } from '../../utils/formatCurrency';
import { openWhatsApp } from '../../utils/whatsapp';
import { showToast } from '../toast';
import ShareDealModal from './ShareDealModal';

function DealGridCard({ deal, onView, onQuickClaim }) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const styles = useMemo(() => getStyles(colors, typography), [colors, typography]);

  const img = useMemo(() => 
    deal?.deal_image ||
    (Array.isArray(deal?.deal_items) && deal.deal_items[0]?.product_image) ||
    (Array.isArray(deal?.deal_images) && deal.deal_images[0]) ||
    'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1200&auto=format&fit=crop',
    [deal]
  );
  const name = deal?.deal_name || 'Deal';
  const desc = deal?.deal_description || '-';
  const price = deal?.deal_total ?? null;
  const originalPrice = deal?.original_total ?? null;
  const company = deal?.business_id?.company_name || deal?.group_id?.name || 'Restaurant';
  const area = deal?.business_id?.area || '';
  const latitude = deal?.business_id?.lat || '';
  const longitude = deal?.business_id?.lng || '';
  const officePhone = deal?.business_id?.office_phone || '';
  const [shareVisible, setShareVisible] = React.useState(false);

  const dealLink = deal?._id ? `https://jomfood.my/?dealId=${deal._id}&autoOpen=true` : 'https://jomfood.my';
  const shareMessage = `Hey! Check out this awesome deal I found for ${name} at ${company}! Check it out here: ${dealLink} Let's go together!`;

  const handleWhatsAppPress = useCallback(async (e) => {
    e.stopPropagation(); // Prevent card click
    
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
    e.stopPropagation(); // Prevent card click
    
    if (!latitude || !longitude) {
      showToast.error(t('common.noLocation'), t('common.locationNotAvailable'));
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
      showToast.error(t('common.error'), t('common.couldNotOpenMaps'));
    }
  }, [latitude, longitude, t]);

  const discountText = useMemo(() => {
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
    <View style={styles.card}>
      <TouchableOpacity activeOpacity={0.9} onPress={onView} style={styles.cardTouchable}>
        {/* Top Section: Text Information */}
        <View style={styles.topSection}>
          <Text numberOfLines={1} style={styles.title}>{name}</Text>
          {/* <Text numberOfLines={2} style={styles.desc}>{desc}</Text> */}
          
          {/* Restaurant Info with Action Buttons */}
          <View style={styles.restaurantRow}>
            <View style={styles.restaurantInfo}>
              <Store size={11} color={colors.primary} strokeWidth={2.5} />
              <Text numberOfLines={1} style={styles.restaurantText}>{company}</Text>
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
          {area ? (
            <View style={styles.areaRow}>
              <MapPin size={10} color={colors.textMuted} strokeWidth={2} />
              <Text numberOfLines={1} style={styles.areaText}>{area}</Text>
            </View>
          ) : null}
          <View style={styles.pricingRow}>
            <View style={styles.pricingContainer}>
              {price != null && (
                <Text style={styles.price}>{formatCurrency(price)}</Text>
              )}
              {originalPrice != null && (
                <Text style={styles.originalPrice}>{formatCurrency(originalPrice)}</Text>
              )}
            </View>
            {/* <View style={styles.ratingContainer}>
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  size={14} 
                  color="#FE8100" 
                  fill="#FE8100" 
                />
              ))}
            </View> */}
          </View>
        </View>

        {/* Bottom Section: Food Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: img }} style={styles.foodImage} resizeMode="cover" />
        </View>
      </TouchableOpacity>

      {/* Add Button - Overlapping bottom right */}
      {/* <TouchableOpacity 
        // onPress={onQuickClaim} 
        onPress={onView} 
        style={styles.addBtn}
        activeOpacity={0.8}
      >
        <Text style={styles.addText}>+</Text>
      </TouchableOpacity> */}
      <View style={styles.badgeRow}>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={(e) => {
            e.stopPropagation();
            setShareVisible(true);
          }}
          activeOpacity={0.8}
        >
          <Share2 size={14} color={colors.textMuted} />
        </TouchableOpacity>
        <View style={styles.dealTypeBadge}>
          <Text style={styles.dealTypeBadgeText}>{discountText}</Text>
        </View>
      </View>
      <ShareDealModal
        visible={shareVisible}
        onClose={() => setShareVisible(false)}
        link={dealLink}
        message={shareMessage}
      />
    </View>
  );
}

const getStyles = (colors, typography) => StyleSheet.create({
  card: {
    width: '48%',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    padding: 14,
    marginBottom: 16,
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
    fontSize: typography.fontSize.md,
    color: colors.textDark || colors.text,
    marginBottom: 0,
    fontFamily: typography.fontFamily.semiBold,
  },
  desc: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    height: 40,
    marginBottom: 2,
    lineHeight: 18,
    fontFamily: typography.fontFamily.regular,
  },
  // Restaurant Row - Clean & Minimal
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
    fontSize: typography.fontSize.xs,
    color: colors.text,
    fontFamily: typography.fontFamily.medium,
  },
  areaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLighter,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: -2,
    marginBottom: 6,
  },
  areaText: {
    fontSize: typography.fontSize.xxs,
    color: colors.textMuted,
    fontFamily: typography.fontFamily.regular,
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
    backgroundColor: colors.primaryLighter,
    fontFamily: "Manrope",
  },
  price: {
    fontSize: typography.fontSize['xs'],
    color: colors.primary,
    fontFamily: typography.fontFamily.semiBold,
  },
  originalPrice: {
    fontSize: typography.fontSize.xxs,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
    fontFamily: typography.fontFamily.regular,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
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
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  addText: {
    color: colors.white,
    fontSize: 24,
    lineHeight: 28,
    fontFamily: typography.fontFamily.semiBold,
  },
  badgeRow: {
    position: 'absolute',
    right: 14,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dealTypeBadge: {
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
  shareButton: {
    width: 22,
    height: 22,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
});

// Memoize component to prevent unnecessary re-renders
export default React.memo(DealGridCard, (prevProps, nextProps) => {
  // Only re-render if deal ID changes or handlers change
  return prevProps.deal?._id === nextProps.deal?._id &&
         prevProps.onView === nextProps.onView &&
         prevProps.onQuickClaim === nextProps.onQuickClaim;
});
