import React, { useCallback, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, ScrollView, Modal, TouchableWithoutFeedback, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import useThemeColors from '../theme/useThemeColors';
import useThemeTypography from '../theme/useThemeTypography';
import { dealsAPI } from '../api/deals';
import DealGridCard from '../components/deals/DealGridCard';
import DealGridCardSkeleton from '../components/deals/DealGridCardSkeleton';
import useLocation from '../hooks/useLocation';
import GradientBackground from '../components/GradientBackground';
import RangeSlider from '../components/RangeSlider';
import { ChevronDown, Package } from 'lucide-react-native';
import HeaderWithLogo from '../components/HeaderWithLogo';
import authAPI from '../api/auth';
import { clearUser } from '../store/slices/authSlice';
import { useDispatch } from 'react-redux';
import { BottomNavigationSpace } from '../navigation/AppNavigator';

export default function DealsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const user = useSelector(state => state.auth.user);
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const styles = getStyles(colors, typography);
  const { location: currentLocation } = useLocation();

  const initialFilters = route.params?.initialFilters || {};

  // Track the last applied filter params to avoid re-applying same filters
  const lastAppliedParamsRef = React.useRef(null);

  // Update filters when screen comes into focus with new params
  useFocusEffect(
    React.useCallback(() => {
    if (route.params?.initialFilters) {
        const incoming = route.params.initialFilters;
        const paramsKey = JSON.stringify(incoming);
        
        // Only apply if params are different from last time
        if (lastAppliedParamsRef.current !== paramsKey) {
          lastAppliedParamsRef.current = paramsKey;
          
      const newFilters = {
            // Reset to defaults first
            sort_by: incoming.sort_by || 'newest',
            deal_type: incoming.deal_type || '',
            min_price: incoming.min_price ? Number(incoming.min_price) : 0,
            max_price: incoming.max_price ? Number(incoming.max_price) : 500,
            min_discount: incoming.min_discount ? Number(incoming.min_discount) : 0,
            max_discount: incoming.max_discount ? Number(incoming.max_discount) : 100,
            category_id: incoming.category_id || '', // For jomfood-categories
            deal_category_id: incoming.deal_category_id || '', // For jomfood-deal-categories
            company_name: incoming.company_name || '',
            radius_km: incoming.radius_km || '',
            latitude: incoming.latitude || '',
            longitude: incoming.longitude || '',
            text_search: incoming.text_search || '',
            tags: incoming.tags && Array.isArray(incoming.tags) ? incoming.tags : [],
            is_hot_deal: incoming.is_hot_deal || false,
            page: incoming.page || 1,
            limit: incoming.limit || 12,
      };
      setFilters(newFilters);
      setTempFilters(newFilters);
    }
      }
    }, [route.params?.initialFilters])
  );

  const [menuVisible, setMenuVisible] = React.useState(false);
  const [filters, setFilters] = React.useState({
    sort_by: initialFilters.sort_by || 'newest',
    deal_type: initialFilters.deal_type || '',
    min_price: initialFilters.min_price ? Number(initialFilters.min_price) : 0,
    max_price: initialFilters.max_price ? Number(initialFilters.max_price) : 500,
    min_discount: initialFilters.min_discount ? Number(initialFilters.min_discount) : 0,
    max_discount: initialFilters.max_discount ? Number(initialFilters.max_discount) : 100,
    category_id: initialFilters.category_id || '', // For jomfood-categories
    deal_category_id: initialFilters.deal_category_id || '', // For jomfood-deal-categories
    company_name: initialFilters.company_name || '',
    radius_km: initialFilters.radius_km || '',
    latitude: initialFilters.latitude || '',
    longitude: initialFilters.longitude || '',
    text_search: initialFilters.text_search || '',
    tags: initialFilters.tags && Array.isArray(initialFilters.tags) ? initialFilters.tags : [],
    is_hot_deal: initialFilters.is_hot_deal || false,
    page: 1,
    limit: 12,
  });

  const [showFilters, setShowFilters] = React.useState(false);
  const [tempFilters, setTempFilters] = React.useState(filters);
  const [availableTags, setAvailableTags] = React.useState([]);
  const [loadingTags, setLoadingTags] = React.useState(false);

  // Fetch tags when filter drawer opens or language changes
  React.useEffect(() => {
    if (showFilters) {
      setLoadingTags(true);
      dealsAPI.getAllTags()
        .then(tags => {
          setAvailableTags(tags);
          setLoadingTags(false);
        })
        .catch(err => {
          // console.error('Error fetching tags:', err);
          setLoadingTags(false);
        });
    }
  }, [showFilters]);

  // Dynamic screen title based on current filter or passed param
  const screenTitle = route.params?.screenTitle 
    ? route.params.screenTitle 
    : (filters.sort_by === 'nearest' ? t('deals.nearMe') : t('deals.allDeals'));

  // If user toggles near me, fill in current coords when available
  React.useEffect(() => {
    if (!filters.latitude && currentLocation?.latitude && filters.sort_by === 'nearest') {
      setFilters(f => ({ ...f, latitude: currentLocation.latitude, longitude: currentLocation.longitude }));
    }
  }, [currentLocation, filters.sort_by]);

  const { 
    data, 
    isLoading, 
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['deals-list', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const cleaned = {
        ...filters,
        page: pageParam,
        // Only include non-zero/non-default values
        ...(filters.min_price > 0 ? { min_price: filters.min_price } : {}),
        ...(filters.max_price < 500 ? { max_price: filters.max_price } : {}),
        ...(filters.min_discount > 0 ? { min_discount: filters.min_discount } : {}),
        ...(filters.max_discount < 100 ? { max_discount: filters.max_discount } : {}),
        ...(filters.deal_type ? { deal_type: filters.deal_type } : {}),
        ...(filters.category_id ? { category_id: filters.category_id } : {}),
        ...(filters.deal_category_id ? { deal_category_id: filters.deal_category_id } : {}),
        ...(filters.company_name ? { company_name: filters.company_name } : {}),
        ...(filters.latitude ? { latitude: filters.latitude } : {}),
        ...(filters.longitude ? { longitude: filters.longitude } : {}),
        ...(filters.radius_km ? { radius_km: filters.radius_km } : {}),
        ...(filters.text_search ? { text_search: filters.text_search } : {}),
        ...(filters.tags && Array.isArray(filters.tags) && filters.tags.length > 0 ? { tags: filters.tags } : {}),
        ...(filters.is_hot_deal ? { is_hot_deal: true } : {}),
      };
      const res = await dealsAPI.listActive(cleaned);
      return res;
    },
    getNextPageParam: (lastPage) => {
      const pagination = lastPage?.pagination;
      if (pagination?.has_next && pagination?.current_page) {
        return pagination.current_page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });

  const items = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap(page => Array.isArray(page?.deals) ? page.deals : []);
  }, [data]);

  const onApplyFilters = useCallback(() => {
    setFilters(tempFilters);
    handleCloseFilters();
  }, [tempFilters, handleCloseFilters]);

  const onClearFilters = useCallback(() => {
    const cleared = {
      sort_by: 'newest',
      deal_type: '',
      min_price: 0,
      max_price: 500,
      min_discount: 0,
      max_discount: 100,
      category_id: '',
      deal_category_id: '',
      company_name: '',
      radius_km: '',
      latitude: '',
      longitude: '',
      text_search: '',
      tags: [],
      is_hot_deal: false,
      page: 1,
      limit: 12,
    };
    setTempFilters(cleared);
    setFilters(cleared);
    handleCloseFilters();
  }, [handleCloseFilters]);

  // Sync tempFilters when modal opens - use ref to track if we've synced
  const prevShowFiltersRef = React.useRef(false);
  React.useEffect(() => {
    if (showFilters && !prevShowFiltersRef.current) {
      // Only sync when modal is opening (transitioning from false to true)
    setTempFilters(filters);
    }
    prevShowFiltersRef.current = showFilters;
  }, [showFilters, filters]);

  // Auto-open filters if openFilters param is set
  React.useEffect(() => {
    if (route.params?.openFilters) {
      setShowFilters(true);
      // Clear the param after opening to prevent reopening on navigation
      navigation.setParams({ openFilters: undefined });
    }
  }, [route.params?.openFilters, navigation]);

  const onAvatarPress = useCallback(() => {
    if (user) setMenuVisible(true);
    else navigation.navigate('Login');
  }, [user, navigation]);

  // Filter handler - memoized for performance
  const handleFilterPress = useCallback(() => {
    setShowFilters(true);
  }, []);

  // Close filter handler - memoized for performance
  const handleCloseFilters = useCallback(() => {
    setShowFilters(false);
  }, []);

  // Memoize navigation handler
  const handleItemView = useCallback((item) => {
    navigation.navigate('DealDetail', { id: item._id });
  }, [navigation]);

  // Memoize key extractor
  const keyExtractor = useCallback((item) => item._id, []);

  // Memoize render item
  const renderItem = useCallback(({ item }) => (
    <DealGridCard
      deal={item}
      onView={() => handleItemView(item)}
      onQuickClaim={() => {}}
    />
  ), [handleItemView]);

  // Handle pagination - load more when reaching end
  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Render footer with loading indicator
  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }, [isFetchingNextPage, colors.primary, styles.footerLoader]);

  // Render header function for FlatList (title + active filters)
  const renderListHeader = useCallback(() => (
    <>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{screenTitle}</Text>
      </View>

      {/* Active Filters Display - Only show if there are active filters */}
      {((filters.sort_by !== 'newest') || 
        filters.deal_type || 
        (filters.min_price > 0 || filters.max_price < 500) || 
        (filters.min_discount > 0 || filters.max_discount < 100) ||
        filters.text_search ||
        (filters.tags && filters.tags.length > 0)) && (
        <View style={styles.activeFiltersContainer}>
          <ScrollView 
            horizontal 
            style={styles.activeFiltersRow} 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activeFiltersContent}
          >
            {filters.sort_by !== 'newest' && (() => {
              // Format display text for active filter chip
              const getSortDisplayText = (sortBy) => {
                switch (sortBy) {
                  case 'price_asc': return t('filters.priceLowToHigh');
                  case 'price_desc': return t('filters.priceHighToLow');
                  case 'discount_desc': return t('filters.bestDiscount');
                  case 'expiry_asc': return t('filters.expiringSoon');
                  case 'newest': return t('filters.newest');
                  case 'recommended': return t('filters.recommended');
                  case 'nearest': return t('filters.nearest');
                  default: return sortBy.charAt(0).toUpperCase() + sortBy.slice(1);
                }
              };

              return (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterText}>{t('filters.sort')}: {getSortDisplayText(filters.sort_by)}</Text>
                </View>
              );
            })()}
            {filters.deal_type && (() => {
              const getTypeDisplay = (type) => {
                switch (type) {
                  case 'percentage': return t('filters.percentage');
                  case 'fixed_amount': return t('filters.fixedAmount');
                  case 'combo': return t('filters.combo');
                  default: return type.replace('_', ' ');
                }
              };
              return (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterText}>{t('filters.type')}: {getTypeDisplay(filters.deal_type)}</Text>
                </View>
              );
            })()}
            {(filters.min_price > 0 || filters.max_price < 500) && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>{t('filters.price')}: {filters.min_price}-{filters.max_price}</Text>
              </View>
            )}
            {(filters.min_discount > 0 || filters.max_discount < 100) && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>{t('filters.discount')}: {filters.min_discount}%-{filters.max_discount}%</Text>
              </View>
            )}
            {filters.text_search && (
              <TouchableOpacity
                style={[styles.activeFilterChip, styles.activeFilterChipSearch]}
                onPress={() => setFilters(prev => ({ ...prev, text_search: '' }))}
              >
                <Text style={styles.activeFilterText} numberOfLines={1} ellipsizeMode="tail">{t('filters.search')}: {filters.text_search}</Text>
                <Text style={styles.activeFilterClose}> ×</Text>
              </TouchableOpacity>
            )}
            {filters.tags && filters.tags.length > 0 && filters.tags.map((tag, index) => (
              <TouchableOpacity
                key={index}
                style={styles.activeFilterChip}
                onPress={() => {
                  const newTags = filters.tags.filter(t => t !== tag);
                  setFilters(f => ({ ...f, tags: newTags }));
                }}
              >
                <Text style={styles.activeFilterText}>{tag}</Text>
                {/* <Text style={styles.activeFilterClose}> ×</Text> */}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </>
  ), [filters, t, setFilters, screenTitle, styles]);

  return (
    <GradientBackground >
      <SafeAreaView style={[styles.safeContent, { paddingBottom: BottomNavigationSpace }]} edges={['top']}>
    <View style={styles.safe}>
      <View style={styles.headerContainer}>
      <HeaderWithLogo 
        onAvatarPress={onAvatarPress}
        onLogoPress={() => navigation.navigate('Home')}
        onSearchPress={handleFilterPress}
        logoSize={112} 
      />
      </View>

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="fade"
        transparent={true}
        onRequestClose={handleCloseFilters}
      >
        <View style={styles.modalContainer}>
          <TouchableWithoutFeedback onPress={handleCloseFilters}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('filters.title')}</Text>
              <TouchableOpacity onPress={handleCloseFilters}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalBody} 
              showsVerticalScrollIndicator={false}
              bounces={true}
            >
              {/* Text Search */}
              <View style={styles.filterSection}>
                <Text style={styles.sectionLabel}>{t('filters.search')}</Text>
                <Text style={styles.sectionDescription}>{t('filters.enterDealNameTagsRestaurant')}</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder={t('filters.enterDealNameTagsRestaurant')}
                  placeholderTextColor={colors.textMuted}
                  value={tempFilters.text_search}
                  onChangeText={(text) => setTempFilters(f => ({ ...f, text_search: text }))}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                />
              </View>

              {/* Sort By */}
              <View style={styles.filterSection}>
                <Text style={styles.sectionLabel}>{t('filters.sortBy')}</Text>
                <View style={styles.filterChipsRow}>
                  {['newest', 'recommended', 'nearest', 'price_asc', 'price_desc', 'discount_desc', 'expiry_asc'].map((option) => {
                    // Format display text for better readability
                    const getDisplayText = (opt) => {
                      switch (opt) {
                        case 'price_asc': return t('filters.priceLowToHigh');
                        case 'price_desc': return t('filters.priceHighToLow');
                        case 'discount_desc': return t('filters.bestDiscount');
                        case 'expiry_asc': return t('filters.expiringSoon');
                        case 'newest': return t('filters.newest');
                        case 'recommended': return t('filters.recommended');
                        case 'nearest': return t('filters.nearest');
                        default: return opt.charAt(0).toUpperCase() + opt.slice(1);
                      }
                    };

                    return (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.filterChip,
                          tempFilters.sort_by === option && styles.filterChipActive
                        ]}
                        onPress={() => setTempFilters(f => ({ ...f, sort_by: option }))}
                      >
                        <Text style={[
                          styles.filterChipText,
                          tempFilters.sort_by === option && styles.filterChipTextActive
                        ]}>
                          {getDisplayText(option)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Deal Type */}
              <View style={styles.filterSection}>
                <Text style={styles.sectionLabel}>{t('filters.dealType')}</Text>
                <View style={styles.filterChipsRow}>
                  {['percentage', 'fixed_amount', 'combo'].map((type) => {
                    const getTypeDisplay = (typeValue) => {
                      switch (typeValue) {
                        case 'percentage': return t('filters.percentage');
                        case 'fixed_amount': return t('filters.fixedAmount');
                        case 'combo': return t('filters.combo');
                        default: return typeValue.replace('_', ' ');
                      }
                    };
                    return (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.filterChip,
                          tempFilters.deal_type === type && styles.filterChipActive
                        ]}
                        onPress={() => setTempFilters(f => ({ 
                          ...f, 
                          deal_type: tempFilters.deal_type === type ? '' : type 
                        }))}
                      >
                        <Text style={[
                          styles.filterChipText,
                          tempFilters.deal_type === type && styles.filterChipTextActive
                        ]}>
                          {getTypeDisplay(type)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Tags - Multi-select */}
              <View style={styles.filterSection}>
                <Text style={styles.sectionLabel}>{t('filters.specialOffers')}</Text>
                {/* <Text style={styles.sectionDescription}>Select one or more tags</Text> */}
                {loadingTags ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 8 }} />
                ) : (
                  <View style={styles.filterChipsRow}>
                    {availableTags.map((tag) => {
                      const isSelected = tempFilters.tags && tempFilters.tags.includes(tag);
                      return (
                        <TouchableOpacity
                          key={tag}
                          style={[
                            styles.filterChip,
                            isSelected && styles.filterChipActive
                          ]}
                          onPress={() => {
                            const currentTags = tempFilters.tags || [];
                            if (isSelected) {
                              setTempFilters(f => ({ 
                                ...f, 
                                tags: currentTags.filter(t => t !== tag)
                              }));
                            } else {
                              setTempFilters(f => ({ 
                                ...f, 
                                tags: [...currentTags, tag]
                              }));
                            }
                          }}
                        >
                          <Text style={[
                            styles.filterChipText,
                            isSelected && styles.filterChipTextActive
                          ]}>
                            {tag}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Price Range */}
              <View style={styles.filterSection}>
                <RangeSlider
                  label={t('filters.priceRange')}
                  min={0}
                  max={500}
                  minValue={tempFilters.min_price}
                  maxValue={tempFilters.max_price}
                  onMinChange={(val) => setTempFilters(f => ({ ...f, min_price: val }))}
                  onMaxChange={(val) => setTempFilters(f => ({ ...f, max_price: val }))}
                  step={10}
                />
              </View>

              {/* Discount Range */}
              <View style={styles.filterSection}>
                <RangeSlider
                  label={t('filters.discountRange')}
                  min={0}
                  max={100}
                  minValue={tempFilters.min_discount}
                  maxValue={tempFilters.max_discount}
                  onMinChange={(val) => setTempFilters(f => ({ ...f, min_discount: val }))}
                  onMaxChange={(val) => setTempFilters(f => ({ ...f, max_discount: val }))}
                  step={5}
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.clearButton} onPress={onClearFilters}>
                  <Text style={styles.clearButtonText}>{t('filters.clearAll')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.applyButton} onPress={onApplyFilters}>
                  <Text style={styles.applyButtonText}>{t('filters.applyFilters')}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Avatar Popup Menu */}
      <Modal transparent visible={menuVisible} animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); navigation.navigate('Profile'); }}>
              <Text style={styles.menuText}>{t('common.profile')}</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={async () => { setMenuVisible(false); await authAPI.logout(); dispatch(clearUser()); navigation.navigate('RootTabs'); }}>
              <Text style={[styles.menuText, { color: colors.error || '#E74C3C' }]}>{t('common.logout')}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Results */}
      {isLoading ? (
        <View style={styles.skeletonContainer}>
          {[...Array(8)].map((_, index) => (
            <DealGridCardSkeleton key={`skeleton-${index}`} />
          ))}
        </View>
      ) : items && items.length > 0 ? (
        <FlatList
          data={items}
          keyExtractor={keyExtractor}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          style={{ backgroundColor: 'transparent' }}
          ListHeaderComponent={renderListHeader}
          ListFooterComponent={renderFooter}
          renderItem={renderItem}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={10}
          updateCellsBatchingPeriod={50}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Package size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>{t('common.noDealsFound')}</Text>
          <Text style={styles.emptySubtext}>{t('common.tryAdjustingFilters')}</Text>
        </View>
      )}
    </View>
    </SafeAreaView>
    </GradientBackground>
  );
}

const getStyles = (colors, typography) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  safeContent: { flex: 1, backgroundColor: 'transparent' },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerRow: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20, 
    paddingBottom: 0,
  },
  title: { 
    paddingTop: 8,
    color: colors.text,
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.semiBold,
   },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  filterButtonText: {
    color: colors.primary,
    fontSize: typography.fontSize['sm'],
    fontFamily: typography.fontFamily.regular,
  },
  activeFiltersContainer: {
    backgroundColor: 'transparent',
    zIndex: 10,
    elevation: 2,
    overflow: 'visible',
  },
  activeFiltersRow: {
    maxHeight: 50,
    overflow: 'visible',
  },
  activeFiltersContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    minHeight: 40,
  },
  activeFilterChip: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  activeFilterChipSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '90%', // Flexible width for search chip only
  },
  activeFilterText: {
    color: colors.white,
    fontSize: typography.fontSize['xs'],
  },
  activeFilterClose: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semiBold,
    marginLeft: 4,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.text,
    marginTop: 8,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: typography.fontSize['xl'],
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
  },
  modalClose: {
    fontSize: 24,
    color: colors.textMuted,
  },
  modalBody: {
    paddingHorizontal: 20,
  },
  filterSection: {
    marginVertical: 16,
  },
  sectionLabel: {
    fontSize: typography.fontSize['base'],
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
    marginBottom: 3,
  },
  filterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    color: colors.text,
    fontSize: typography.fontSize['sm'],
  },
  filterChipTextActive: {
    color: colors.white,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 0,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: colors.backgroundLight,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    color: colors.text,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semiBold,
  },
  applyButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  applyButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semiBold,
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  menuCard: {
    marginTop: 70,
    marginLeft: 20,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 160,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  menuItem: {
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  menuText: {
    color: colors.text,
    fontFamily: typography.fontFamily.regular,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  columnWrapper: { gap: 12, justifyContent: 'space-between', paddingHorizontal: 16 },
  listContent: { paddingTop: 0, gap: 0 }, // Bottom padding handled by withBottomSafeArea wrapper
  emptyContainer: {
    paddingVertical: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
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
  skeletonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 70,
    gap: 12,
    justifyContent: 'space-between',
    zIndex: 1,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});


