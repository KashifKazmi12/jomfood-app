/**
 * HomeScreen - Main Landing Screen
 * 
 * CONCEPTS EXPLAINED:
 * 1. useNavigation: React Navigation hook to navigate between screens
 * 2. navigate(): Method to go to another screen
 * 3. TouchableOpacity: Button component that responds to touch
 * 
 * This screen has buttons to navigate to Login and Signup screens
 */

import React from 'react';
import {
  Alert,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Image,
  ScrollView,
  RefreshControl,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { Pressable } from 'react-native';
import HomeDealsGridSection from '../components/deals/HomeDealsGridSection';
import DealCarouselSection from '../components/deals/DealCarouselSection';
import LazyCategorySection from '../components/deals/LazyCategorySection';
import GradientBackground from '../components/GradientBackground';
import { dealsAPI } from '../api/deals';
import authAPI from '../api/auth';
import { clearUser, updateUser } from '../store/slices/authSlice';
import useThemeColors from '../theme/useThemeColors';
import useThemeTypography from '../theme/useThemeTypography';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import useLocation from '../hooks/useLocation';
import HeaderWithLogo from '../components/HeaderWithLogo';
import { SlidersHorizontal, ChevronDown } from 'lucide-react-native';
import RangeSlider from '../components/RangeSlider';
import { BottomNavigationSpace } from '../navigation/AppNavigator';
import { useTranslation } from 'react-i18next';
import { showToast } from '../components/toast';
import { useCart } from '../context/CartContext';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const user = useSelector(state => state.auth.user);
  const dispatch = useDispatch();
  const today = new Date();
  const dateStr = today.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
  const theme = useThemeColors();
  const typography = useThemeTypography();
  const styles = getStyles(theme, typography);
  const queryClient = useQueryClient();
  const { addItem, clearCart } = useCart();

  const handleQuickAdd = async (item) => {
    const result = await addItem(item);
    if (result?.ok) {
      showToast.success(t('cart.added', 'Added to cart'), t('cart.openHint', 'Open your cart to checkout.'));
      return;
    }
    if (result?.reason === 'not_logged_in') {
      showToast.info(t('common.login'), t('common.pleaseSignIn'));
      return;
    }
    if (result?.reason === 'different_restaurant') {
      Alert.alert(
        t('cart.replaceTitle', 'Replace cart items?'),
        t(
          'cart.replaceMessage',
          'Your cart can only include deals from one restaurant. Clear current cart and add this deal?'
        ),
        [
          { text: t('common.cancel', 'Cancel'), style: 'cancel' },
          {
            text: t('cart.replaceConfirm', 'Clear & Add'),
            style: 'destructive',
              onPress: async () => {
                await clearCart();
                const retry = await addItem(item, { skipBusinessCheck: true });
                if (retry?.ok) {
                  showToast.success(t('cart.added', 'Added to cart'), t('cart.openHint', 'Open your cart to checkout.'));
                }
              },
          },
        ]
      );
    }
  };
  const { location: currentLocation, loading: locationLoading, error: locationError } = useLocation();

  const [menuVisible, setMenuVisible] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [showFilters, setShowFilters] = React.useState(false);
  const [filters, setFilters] = React.useState({
    deal_type: '',
    min_price: 0,
    max_price: 500,
    min_discount: 0,
    max_discount: 100,
    text_search: '',
    tags: [],
  });
  const [tempFilters, setTempFilters] = React.useState(filters);
  const [availableTags, setAvailableTags] = React.useState([]);
  const [loadingTags, setLoadingTags] = React.useState(false);

  // Debug log for location
  // React.useEffect(() => {
  //   console.log('🏠 [HomeScreen] Location state:', {
  //     currentLocation,
  //     loading: locationLoading,
  //     error: locationError,
  //     hasLocation: !!currentLocation
  //   });
  // }, [currentLocation, locationLoading, locationError]);

  // Sync tempFilters when modal opens - use ref to track if we've synced
  const prevShowFiltersRef = React.useRef(false);
  React.useEffect(() => {
    if (showFilters && !prevShowFiltersRef.current) {
      // Only sync when modal is opening (transitioning from false to true)
      setTempFilters(filters);
    }
    prevShowFiltersRef.current = showFilters;
  }, [showFilters, filters]);

  // Fetch tags when filter drawer opens - lazy load after modal is visible
  React.useEffect(() => {
    if (showFilters && availableTags.length === 0) {
      // Only fetch if we don't have tags yet
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
  }, [showFilters, availableTags.length]);

  /**
   * Navigate to Signup screen
   */
  const goToSignup = () => {
    navigation.navigate('Signup');
  };

  const onAvatarPress = React.useCallback(() => {
    if (user) setMenuVisible(true);
    else navigation.navigate('Login');
  }, [user, navigation]);

  // Filter handler - memoized for performance
  const handleFilterPress = React.useCallback(() => {
    setShowFilters(true);
  }, []);

  // Close filter handler - memoized for performance
  const handleCloseFilters = React.useCallback(() => {
    setShowFilters(false);
  }, []);

  // Memoize navigation handlers
  const handleDealView = React.useCallback((item) => {
    navigation.navigate('DealDetail', { id: item._id });
  }, [navigation]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['home-grid'] }),
        queryClient.invalidateQueries({ queryKey: ['deal-of-the-day'] }),
        queryClient.invalidateQueries({ queryKey: ['jomfood-categories'] }),
        queryClient.invalidateQueries({ predicate: (q) => String(q.queryKey?.[0] || '').startsWith('home-') }),
        queryClient.invalidateQueries({ predicate: (q) => String(q.queryKey?.[0] || '').startsWith('category-') }),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  // Fetch deal of the day
  const { data: dealOfTheDay } = useQuery({
    queryKey: ['deal-of-the-day'],
    queryFn: () => dealsAPI.getDealOfTheDay(),
  });

  // Fetch deal categories from new endpoint (for category pills)
  const { data: dealCategories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['jomfood-categories'],
    queryFn: () => dealsAPI.getJomfoodCategories({ limit: 999999, is_active: true }),
  });

  // Fetch deal categories with show_category=true for dynamic sections
  const { data: categorySections } = useQuery({
    queryKey: ['deal-categories-sections'],
    queryFn: () => dealsAPI.getActiveDealCategories({ show_category: true }),
  });

  // Check if any filters are active - hide category sections when filters are applied
  const hasActiveFilters = React.useMemo(() => {
    return !!(
      filters.deal_type ||
      filters.min_price > 0 ||
      filters.max_price < 500 ||
      filters.min_discount > 0 ||
      filters.max_discount < 100 ||
      filters.text_search ||
      (filters.tags && filters.tags.length > 0)
    );
  }, [filters]);

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeContent} edges={['top']}>
        <View style={[styles.safeContent]}>
          <View style={styles.safeContent}>
            <View style={styles.headerContainer}>
              <HeaderWithLogo
                onAvatarPress={onAvatarPress}
                onLogoPress={() => navigation.navigate('Home')}
                onSearchPress={handleFilterPress}
                logoSize={112}
              />
            </View>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              showsVerticalScrollIndicator={false}
              style={{ backgroundColor: 'transparent' }}
            >
              <View style={styles.container}>
                {/* Banner from Figma (text baked into image) */}
                {/* <ImageBackground
          source={require('../assets/images/header-bg.jpg')}
          style={styles.hero}
          imageStyle={styles.heroImage}
        >
          <View style={styles.overlay} />

          <View style={styles.topHeader}>
            {user ? (
              <TouchableOpacity style={styles.avatar} onPress={onAvatarPress}>
                <Text style={styles.avatarText}>
                  {(user?.name || 'G').substring(0, 1).toUpperCase()}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.loginPill} onPress={goToLogin}>
                <Text style={styles.loginPillText}>Login</Text>
              </TouchableOpacity>
            )}
            // Absolutely centered title to avoid side-button width bias 
            <View style={styles.centerOverlay} pointerEvents="none">
              <Text style={styles.hello}>Hello, {user?.name ? user.name.split(' ')[0] : 'Guest'}</Text>
              <Text style={styles.dateText}>Today {dateStr}</Text>
            </View>
            <TouchableOpacity style={styles.iconBtn} onPress={() => {}} accessibilityLabel="Search">
              <Search size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          // Explore tabs (static for now) 
          <View style={styles.tabsRowOuter}>
            <View style={styles.tabsRowInner}>
              <View style={[styles.tabPill, { backgroundColor: theme.primary }]}>
                <Text style={[styles.tabTextActive, { color: theme.white }]}>Most Popular Deals</Text>
              </View>
              <View style={styles.tabPillGhost}>
                <Text style={styles.tabText}>Top Deals</Text>
              </View>
              <View style={styles.tabPillGhost}>
                <Text style={styles.tabText}>Deals Near Me</Text>
              </View>
            </View>
          </View>

          <View style={styles.chipsRow}>
            <View style={styles.chip}>
              <MapPin size={14} color={theme.text} />
              <Text style={styles.chipText}>Near me</Text>
            </View>
            <View style={styles.chip}>
              <Percent size={14} color={theme.text} />
              <Text style={styles.chipText}>Offers</Text>
            </View>
            <View style={styles.chipGhost}>
              <Text style={styles.chipGhostText}>Search dishes</Text>
            </View>
          </View>
        </ImageBackground> */}

                <View style={styles.hero}>
                  <Text style={styles.heroTitle}>{t('home.findYourFavouriteFood')}{'\n'}<Text style={styles.heroTitleHighlight}>{t('home.food')}</Text>, {t('home.fast')}</Text>
                  {dealOfTheDay && (
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => navigation.navigate('DealDetail', { id: dealOfTheDay.deal_id })}
                    >
                      <ImageBackground
                        source={{ uri: dealOfTheDay.image }}
                        style={styles.heroImage}
                        imageStyle={styles.heroImage}
                      >
                      </ImageBackground>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Filter Section - Text and Button */}
                {/* <View style={styles.filterSection}>
                  <Text style={styles.filterSectionText}>
                    Select any items by applying{' '}
                    <Text 
                      style={styles.filterLinkText}
                      onPress={() => setShowFilters(true)}
                    >
                      Filters
                    </Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => setShowFilters(true)}
                  >
                    <View style={styles.filterButtonIconContainer}>
                      <SlidersHorizontal size={20} color={theme.white} />
                      
                      {(filters.deal_type || filters.min_price > 0 || filters.max_price < 500 || filters.min_discount > 0 || filters.max_discount < 100 || filters.text_search) && (
                        <View style={styles.filterBadge} />
                      )}
                    </View>
                    <Text style={styles.filterButtonText}>Filters</Text>
                    <ChevronDown size={20} color={theme.white} />
                  </TouchableOpacity>
                </View> */}

                {/* Categories Section - Horizontal button pills */}
                {dealCategories && dealCategories.length > 0 && (
                  <View style={styles.categoriesSection}>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.categoriesScrollContent}
                    >
                      {dealCategories.map((category) => (
                        <TouchableOpacity
                          key={category._id}
                          style={styles.categoryPill}
                          onPress={() => navigation.navigate('Deals', {
                            screen: 'DealsMain',
                            params: {
                              initialFilters: {
                                category_id: category._id,
                                sort_by: 'newest',
                                page: 1,
                                limit: 12
                              },
                              screenTitle: category.name
                            }
                          })}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.categoryPillText}>{category.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Section: Hot Deals - Using Carousel */}
                <DealCarouselSection
                  title={t('home.hotDeals')}
                  params={{
                    sort_by: 'discount_desc',
                    is_hot_deal: true,
                    take_one_item_from_each_restaurant:true,
                    ...(currentLocation && {
                      latitude: currentLocation.latitude,
                      longitude: currentLocation.longitude,
                    }),
                    ...(filters.deal_type && { deal_type: filters.deal_type }),
                    ...(filters.min_price > 0 && { min_price: filters.min_price }),
                    ...(filters.tags && filters.tags.length > 0 && { tags: filters.tags }),
                    ...(filters.max_price < 500 && { max_price: filters.max_price }),
                    ...(filters.min_discount > 0 && { min_discount: filters.min_discount }),
                    ...(filters.max_discount < 100 && { max_discount: filters.max_discount }),
                    ...(filters.text_search && { text_search: filters.text_search }),
                  }}
                  onViewAll={() => navigation.navigate('Deals', {
                    screen: 'DealsMain',
                    params: {
                    initialFilters: {
                        sort_by: 'discount_desc',
                        is_hot_deal: true,
                        take_one_item_from_each_restaurant:true,
                        ...(currentLocation && {
                          latitude: currentLocation.latitude,
                          longitude: currentLocation.longitude,
                        }),
                      ...(filters.deal_type && { deal_type: filters.deal_type }),
                      ...(filters.min_price > 0 && { min_price: filters.min_price }),
                      ...(filters.max_price < 500 && { max_price: filters.max_price }),
                      ...(filters.min_discount > 0 && { min_discount: filters.min_discount }),
                      ...(filters.max_discount < 100 && { max_discount: filters.max_discount }),
                      ...(filters.text_search && { text_search: filters.text_search }),
                      page: 1,
                      limit: 12
                      },
                      screenTitle: t('home.hotDeals')
                    }
                  })}
                  onItemView={handleDealView}
                  onQuickClaim={handleQuickAdd}
                  autoSlide={true}
                  autoSlideInterval={4000}
                />

                {/* Section: Top deals Near Me - Using Carousel */}
                <DealCarouselSection
                  title={t('home.topDealsNearMe')}
                  params={{
                    sort_by: 'nearest',
                    ...(filters.deal_type && { deal_type: filters.deal_type }),
                    ...(filters.min_price > 0 && { min_price: filters.min_price }),
                    ...(filters.tags && filters.tags.length > 0 && { tags: filters.tags }),
                    ...(filters.max_price < 500 && { max_price: filters.max_price }),
                    ...(filters.min_discount > 0 && { min_discount: filters.min_discount }),
                    ...(filters.max_discount < 100 && { max_discount: filters.max_discount }),
                    ...(filters.text_search && { text_search: filters.text_search }),
                    ...(currentLocation && {
                      latitude: currentLocation.latitude,
                      longitude: currentLocation.longitude,
                    }),
                    radius_km: 20
                  }}
                  onViewAll={() => navigation.navigate('Deals', {
                    screen: 'DealsMain',
                    params: {
                    initialFilters: {
                      sort_by: 'nearest',
                      ...(filters.deal_type && { deal_type: filters.deal_type }),
                      ...(filters.min_price > 0 && { min_price: filters.min_price }),
                      ...(filters.max_price < 500 && { max_price: filters.max_price }),
                      ...(filters.min_discount > 0 && { min_discount: filters.min_discount }),
                      ...(filters.max_discount < 100 && { max_discount: filters.max_discount }),
                      ...(filters.text_search && { text_search: filters.text_search }),
                      ...(currentLocation && {
                        latitude: currentLocation.latitude,
                        longitude: currentLocation.longitude
                      }),
                      radius_km: 20,
                      page: 1,
                      limit: 12
                      }
                    }
                  })}
                  onItemView={handleDealView}
                  onQuickClaim={handleQuickAdd}
                  autoSlide={true}
                  autoSlideInterval={4500}
                />

                {/* Dynamic Category Sections - Lazy Loaded - Only show when no filters are active */}
                {!hasActiveFilters && categorySections && categorySections.length > 0 && categorySections.map((category) => (
                  <LazyCategorySection
                    key={category._id}
                    category={category}
                    currentLocation={currentLocation}
                    onItemView={handleDealView}
                    onQuickClaim={handleQuickAdd}
                    onViewAll={(category) => {
                      navigation.navigate('Deals', {
                        screen: 'DealsMain',
                        params: {
                          initialFilters: {
                            deal_category_id: category._id,
                            sort_by: 'discount_desc',
                            page: 1,
                            limit: 12
                          },
                          screenTitle: category.name
                        }
                      });
                    }}
                  />
                ))}

                <View style={{ height: BottomNavigationSpace }} />
              </View>
            </ScrollView>

            {/* Avatar Popup Menu */}
            <Modal transparent visible={menuVisible} animationType="fade" onRequestClose={() => setMenuVisible(false)}>
              <Pressable style={styles.menuBackdrop} onPress={() => setMenuVisible(false)}>
                <View style={styles.menuCard}>
                  <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); navigation.navigate('Profile'); }}>
                    <Text style={styles.menuText}>{t('common.profile')}</Text>
                  </TouchableOpacity>
                  <View style={styles.menuDivider} />
                  <TouchableOpacity style={styles.menuItem} onPress={async () => { setMenuVisible(false); await authAPI.logout(); dispatch(clearUser()); navigation.navigate('RootTabs'); }}>
                    <Text style={[styles.menuText, { color: theme.error || '#E74C3C' }]}>{t('common.logout')}</Text>
                  </TouchableOpacity>
                </View>
              </Pressable>
            </Modal>
          </View>
        </View>

      </SafeAreaView>

      {/* Filter Modal - Outside SafeAreaView like DealsScreen */}
      <Modal
        visible={showFilters}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseFilters}
      >
        <View style={styles.modalContainer}>
          <TouchableWithoutFeedback onPress={handleCloseFilters}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>
          <View style={styles.modalContent}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>{t('filters.title')}</Text>
              <TouchableOpacity onPress={handleCloseFilters}>
                <Text style={styles.filterClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.filterContent}
              showsVerticalScrollIndicator={false}
              bounces={true}
            >
              {/* Text Search */}
              <View style={styles.filterSection}>
                <Text style={styles.sectionLabel}>{t('filters.search')}</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder={t('filters.enterDealNameTagsRestaurant')}
                  placeholderTextColor={theme.textMuted}
                  value={tempFilters.text_search}
                  onChangeText={(text) => setTempFilters(f => ({ ...f, text_search: text }))}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                />
              </View>

              {/* Deal Type */}
              <View style={styles.filterSection}>
                <Text style={styles.sectionLabel}>{t('filters.dealType')}</Text>
                <Text style={styles.sectionDescription}>{t('filters.filterDealsByType')}</Text>
                <View style={styles.filterChipsRow}>
                  {['percentage', 'fixed_amount', 'combo'].map((type) => {
                    const getDisplayName = (typeValue) => {
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
                          deal_type: f.deal_type === type ? '' : type
                        }))}
                      >
                        <Text style={[
                          styles.filterChipText,
                          tempFilters.deal_type === type && styles.filterChipTextActive
                        ]}>
                          {getDisplayName(type)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Tags - Multi-select */}
              <View style={styles.filterSection}>
                <Text style={styles.sectionLabel}>{t('filters.specialOffers')}</Text>
                <Text style={styles.sectionDescription}>{t('filters.selectOneOrMoreTags')}</Text>
                {loadingTags ? (
                  <View style={{ marginTop: 8, alignItems: 'center' }}>
                    <Text style={styles.sectionDescription}>{t('filters.loadingTags')}</Text>
                  </View>
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
            </ScrollView>

            <View style={styles.filterFooter}>
              <TouchableOpacity
                style={styles.filterClearButton}
                onPress={() => {
                  const cleared = {
                    deal_type: '',
                    min_price: 0,
                    max_price: 500,
                    min_discount: 0,
                    max_discount: 100,
                    text_search: '',
                  };
                  setTempFilters(cleared);
                  setFilters(cleared);
                  handleCloseFilters();
                }}
              >
                <Text style={styles.filterClearText}>{t('common.clear')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.filterApplyButton}
                onPress={() => {
                  setFilters(tempFilters);
                  handleCloseFilters();
                }}
              >
                <Text style={styles.filterApplyText}>{t('common.apply')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </GradientBackground>
  );
}

const getStyles = (colors, typography) => StyleSheet.create({
  safeContent: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  container: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 0,
  },
  scrollContent: {
    // Bottom padding handled by withBottomSafeArea wrapper in RootTabs
  },
  centerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hello: {
    color: colors.text,
    fontFamily: typography.fontFamily.semiBold,
  },
  dateText: {
    marginTop: 4,
    color: colors.text,
    fontFamily: typography.fontFamily.regular,
  },
  greetingSubtitle: {
    marginTop: 4,
    color: colors.text,
    fontFamily: typography.fontFamily.regular,
  },
  banner: {
    marginTop: 16,
    marginHorizontal: -20, // bleed to screen edges for full width
    backgroundColor: colors.primaryLight,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  bannerContent: {
    padding: 20,
  },
  bannerTitle: {
    color: colors.white,
    fontFamily: typography.fontFamily.semiBold,
  },
  bannerText: {
    marginTop: 8,
    color: colors.white,
    opacity: 0.9,
    fontFamily: typography.fontFamily.regular,
  },
  bannerCta: {
    marginTop: 14,
    backgroundColor: colors.primaryDark,
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  bannerCtaText: {
    color: colors.white,
    fontFamily: typography.fontFamily.semiBold,
  },
  hero: {
    paddingTop: 6,
    paddingBottom: 14,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    gap: 8,
  },
  heroTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['2xl'],
    lineHeight: 27.25, // 109% of 25px
    letterSpacing: 0,
    color: colors.text,
  },
  heroTitleHighlight: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 25,
    lineHeight: 27.25,
    letterSpacing: 0,
    // color: colors.black,
  },
  heroImage: {
    borderRadius: 10,
    // borderBottomRightRadius: 28,
    width: '99.9%',
    height: 220,
    alignSelf: 'center',
  },
  
  // Categories Section - Horizontal pill buttons
  categoriesSection: {
    marginTop: 8,
    marginBottom: 0,
  },
  categoriesScrollContent: {
    paddingRight: 20,
    paddingBottom: 10,
    gap: 10,
  },
  categoryPill: {
    backgroundColor: colors.white,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryPillText: {
    color: colors.text,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
  
  overlay: {
    ...StyleSheet.absoluteFillObject,
    // backgroundColor: colors.primary,
    // opacity: 0.81,
  },
  tabsRowOuter: { marginTop: 18, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 16 },
  tabsRowInner: { flexDirection: 'row', padding: 6, gap: 8 },
  tabPill: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 999 },
  tabPillGhost: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.6)' },
  tabTextActive: {
    fontFamily: typography.fontFamily.semiBold,
  },
  tabText: { color: colors.text },
  chipsRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  chipText: { color: colors.text, fontFamily: typography.fontFamily.regular },
  chipGhost: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  chipGhostText: { color: colors.textMuted, fontFamily: typography.fontFamily.regular },
  // Popup menu styles
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
    elevation: 6,
    borderWidth: 1,
    borderColor: colors.border,
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
  title: {
    color: colors.primary,
    marginBottom: 8,
    fontFamily: typography.fontFamily.semiBold,
  },
  subtitle: {
    marginTop: 8,
    color: colors.textMuted,
    marginBottom: 40,
    fontFamily: typography.fontFamily.regular,
  },
  buttonContainer: {
    marginTop: 24,
    width: '100%',
    maxWidth: 320,
    alignSelf: 'center',
    gap: 12,
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  loginButtonText: {
    color: colors.white,
    fontFamily: typography.fontFamily.regular,
  },
  signupButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  signupButtonText: {
    color: colors.primary,
    fontFamily: typography.fontFamily.regular,
  },
  activeFiltersContainer: {
    marginTop: 8,
    marginBottom: 4,
    overflow: 'visible',
  },
  activeFiltersRow: {
    maxHeight: 50,
  },
  activeFiltersContent: {
    paddingHorizontal: 0,
    paddingVertical: 4,
    alignItems: 'center',
    minHeight: 40,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  activeFilterText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
  },
  activeFilterClose: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semiBold,
    marginLeft: 4,
  },
  filterSection: {
    marginBottom: 0,
    paddingHorizontal: 0,
  },
  filterSectionText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.text,
    marginBottom: 10,
    textAlign: 'left',
  },
  filterLinkText: {
    color: colors.primary,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semiBold,
    textDecorationLine: 'underline',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.primary,
    gap: 10,
  },
  filterButtonIconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
  },
  filterButtonText: {
    flex: 1,
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semiBold,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
  },
  filterClose: {
    fontSize: 24,
    color: colors.textMuted,
    fontWeight: 'bold',
  },
  filterContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: typography.fontSize['base'],
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
    marginBottom: 0,
  },
  sectionDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
    marginBottom: 8,
  },
  filterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingVertical: 4,
    paddingHorizontal: 8,
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
  filterFooter: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 2,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterClearButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: colors.backgroundLight,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterClearText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
  },
  filterApplyButton: {
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
  filterApplyText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.white,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 5,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.text,
    marginTop: 0,
  },
  textMuted: {
    color: colors.textMuted,
  },
  phoneModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  phoneModalCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
  },
  phoneModalTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
    marginBottom: 8,
  },
  phoneModalSubtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
    marginBottom: 16,
  },
  phoneInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: colors.text,
    backgroundColor: colors.white,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
  },
  phoneError: {
    marginTop: 6,
    color: colors.error || '#d32f2f',
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
  },
  phoneActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  phoneButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneLaterButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  phoneLaterText: {
    color: colors.text,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semiBold,
  },
  phoneSaveButton: {
    backgroundColor: colors.primary,
  },
  phoneSaveText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semiBold,
  },
});
