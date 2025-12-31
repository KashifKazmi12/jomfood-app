import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import useThemeColors from '../theme/useThemeColors';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import GradientBackground from '../components/GradientBackground';
import { useInfiniteQuery } from '@tanstack/react-query';
import { dealsAPI } from '../api/deals';
import { favoritesAPI } from '../api/favorites';
import { Clock, CheckCircle, XCircle, Calendar, ShoppingBag, Heart } from 'lucide-react-native';
import ClaimedDealBottomSheet from '../components/deals/ClaimedDealBottomSheet';
import useThemeTypography from '../theme/useThemeTypography';
import LoginPrompt from '../components/LoginPrompt';
import HeaderWithLogo from '../components/HeaderWithLogo';
import DealGridCard from '../components/deals/DealGridCard';
import DealGridCardSkeleton from '../components/deals/DealGridCardSkeleton';

export default function MyDealsScreen() {
  const { t } = useTranslation();
  const user = useSelector(state => state.auth.user);
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const styles = getStyles(colors, typography);
  const navigation = useNavigation();
  const [selectedClaim, setSelectedClaim] = React.useState(null);
  const [bottomSheetVisible, setBottomSheetVisible] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('claimed'); // 'claimed' or 'favorites'

  // Get user ID - try both _id and id
  const userId = user?._id;
  const isQueryEnabled = !!userId;

  // Force re-render when user state changes (fixes Google Sign-In state sync issue)
  useEffect(() => {
    // This ensures the component re-renders when user state changes
    // This is especially important after Google Sign-In when Redux state updates
  }, [user]);

  // Force re-render when screen comes into focus (fixes Google Sign-In state sync issue)
  useFocusEffect(
    React.useCallback(() => {
      // This will cause the component to re-render when the screen comes into focus
      // This ensures the user state is properly synced after Google Sign-In
    }, [user])
  );

  // Fetch claimed deals history with pagination
  const {
    data: claimHistoryData,
    isLoading: isLoadingHistory,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
    error: claimHistoryError,
  } = useInfiniteQuery({
    queryKey: ['claim-history', userId],
    queryFn: async ({ pageParam = 1 }) => {
      if (!userId) {
        return { claims: [], pagination: null };
      }
      // console.log('📋 [MyDealsScreen] Fetching claim history page:', pageParam);
      const result = await dealsAPI.getClaimHistory({ 
        customer_id: userId,
        page: pageParam,
        limit: 10 // 10 items per page
      });
      // console.log('📋 [MyDealsScreen] Claim history result:', result);
      return result;
    },
    getNextPageParam: (lastPage) => {
      try {
        if (!lastPage) return undefined;
        const pagination = lastPage?.pagination;
        if (!pagination || typeof pagination !== 'object') return undefined;
        
        // Safely check pagination properties
        const hasNext = pagination.has_next === true;
        const currentPage = Number(pagination.current_page) || 0;
        const totalPages = Number(pagination.total_pages) || 0;
        
        // Return next page number if there's a next page
        if (hasNext && currentPage > 0 && totalPages > 0 && currentPage < totalPages) {
          return currentPage + 1;
        }
        return undefined; // No more pages
      } catch (error) {
        // console.error('❌ [MyDealsScreen] Error in getNextPageParam:', error);
        return undefined;
      }
    },
    enabled: isQueryEnabled && activeTab === 'claimed',
    retry: 1,
    initialPageParam: 1,
  });

  // Fetch favorite deals with pagination
  const {
    data: favoriteDealsData,
    isLoading: isLoadingFavorites,
    isFetchingNextPage: isFetchingNextPageFavorites,
    hasNextPage: hasNextPageFavorites,
    fetchNextPage: fetchNextPageFavorites,
    refetch: refetchFavorites,
    isRefetching: isRefetchingFavorites,
    error: favoriteDealsError,
  } = useInfiniteQuery({
    queryKey: ['favorite-deals', userId],
    queryFn: async ({ pageParam = 1 }) => {
      if (!userId) {
        return { deals: [], pagination: null };
      }
      // console.log('❤️ [MyDealsScreen] Fetching favorite deals page:', pageParam);
      const result = await favoritesAPI.getFavoriteDeals({ 
        page: pageParam,
        limit: 12,
        sort_by: 'favorited_newest',
      });
      // console.log('❤️ [MyDealsScreen] Favorite deals result:', result);
      return result;
    },
    getNextPageParam: (lastPage) => {
      try {
        if (!lastPage) return undefined;
        const pagination = lastPage?.pagination;
        if (!pagination || typeof pagination !== 'object') return undefined;
        
        const hasNext = pagination.has_next === true;
        const currentPage = Number(pagination.current_page) || 0;
        const totalPages = Number(pagination.total_pages) || 0;
        
        if (hasNext && currentPage > 0 && totalPages > 0 && currentPage < totalPages) {
          return currentPage + 1;
        }
        return undefined;
      } catch (error) {
        // console.error('❌ [MyDealsScreen] Error in getNextPageParam (favorites):', error);
        return undefined;
      }
    },
    enabled: isQueryEnabled && activeTab === 'favorites',
    retry: 1,
    initialPageParam: 1,
  });

  // Flatten all pages of favorite deals
  const favoriteDeals = useMemo(() => {
    if (!favoriteDealsData?.pages || !Array.isArray(favoriteDealsData.pages)) {
      // console.log('⚠️ [MyDealsScreen] No pages in favoriteDealsData:', favoriteDealsData);
      return [];
    }
    const flattened = favoriteDealsData.pages.flatMap(page => {
      if (!page) {
        // console.log('⚠️ [MyDealsScreen] Empty page in favoriteDealsData');
        return [];
      }
      if (!Array.isArray(page.deals)) {
        // console.log('⚠️ [MyDealsScreen] page.deals is not an array:', page.deals, 'Type:', typeof page.deals);
        return [];
      }
      // console.log('✅ [MyDealsScreen] Found', page.deals.length, 'deals in page');
      return page.deals;
    });
    // console.log('✅ [MyDealsScreen] Total flattened favorite deals:', flattened.length);
    return flattened;
  }, [favoriteDealsData]);

  // Flatten all pages of claims and format for history display
  const claimHistory = useMemo(() => {
    if (!claimHistoryData?.pages || !Array.isArray(claimHistoryData.pages)) return [];
    // Flatten all pages into a single array
    const allClaims = claimHistoryData.pages.flatMap(page => {
      if (!page || !Array.isArray(page.claims)) return [];
      return page.claims;
    });
    return allClaims.map(claim => {
      if (!claim) return null;
      const deal = claim.deal_details || {};
      const businessName = claim.business_id?.company_name || claim.group_id?.name || 'Unknown Business';
      const dealName = deal.deal_name || claim.deal_name || 'Deal';
      const dealPrice = deal.deal_total || claim.deal_total || 0;
      
      // Format date
      const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      };

      return {
        id: claim._id,
        dealId: claim.deal_id?._id || claim.deal_id,
        dealName,
        businessName,
        price: dealPrice,
        status: claim.status || 'active',
        claimedAt: formatDate(claim.claimed_at),
        expiresAt: formatDate(claim.expires_at),
        redeemedAt: formatDate(claim.redeemed_at),
        // Store full claim object for bottom sheet
        fullClaim: claim,
      };
    }).filter(Boolean); // Remove any null entries
  }, [claimHistoryData]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return colors.success;
      case 'redeemed': return colors.info;
      case 'expired': return colors.textMuted;
      case 'cancelled': return colors.error;
      default: return colors.textMuted;
    }
  };

  const getStatusIcon = (status) => {
    const statusColor = getStatusColor(status);
    switch (status) {
      case 'active': return <Clock size={16} color={statusColor} />;
      case 'redeemed': return <CheckCircle size={16} color={statusColor} />;
      case 'expired': return <XCircle size={16} color={statusColor} />;
      case 'cancelled': return <XCircle size={16} color={statusColor} />;
      default: return <Clock size={16} color={statusColor} />;
    }
  };

  // Handle claim item press
  const handleClaimPress = (claim) => {
    console.log('🔍 [MyDealsScreen] Claim pressed:', {
      hasFullClaim: !!claim.fullClaim,
      qr_code_public_url: claim.fullClaim?.qr_code_public_url,
      qr_code_image: claim.fullClaim?.qr_code_image ? 'exists' : 'missing',
    });
    setSelectedClaim(claim.fullClaim);
    setBottomSheetVisible(true);
  };

  // Render history item
  const renderHistoryItem = ({ item: claim }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => handleClaimPress(claim)}
      activeOpacity={0.7}
    >
      <View style={styles.historyItemContent}>
        <View style={styles.historyItemHeader}>
          <Text style={styles.historyDealName} numberOfLines={1}>
            {claim.dealName}
          </Text>
          <View style={styles.statusBadgeContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(claim.status) + '20' }]}>
            {getStatusIcon(claim.status)}
            <Text style={[styles.statusText, { color: getStatusColor(claim.status) }]}>
              {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
            </Text>
          </View>
          </View>
        </View>
        
        <Text style={styles.historyBusinessName}>{claim.businessName}</Text>
        
        <View style={styles.historyItemFooter}>
          <View style={styles.historyPriceContainer}>
            <Text style={styles.historyPriceLabel}>{t('deals.price')}:</Text>
            <Text style={styles.historyPrice}>RM{claim.price.toFixed(2)}</Text>
          </View>
          
          <View style={styles.historyDateContainer}>
            <Calendar size={12} color={colors.textMuted} />
            <Text style={styles.historyDate}>{claim.claimedAt}</Text>
          </View>
        </View>
        
        {claim.status === 'active' && claim.expiresAt !== 'N/A' && (
          <View style={styles.expiryContainer}>
            <Text style={styles.expiryText}>
              {t('dealDetail.validUntil')}: {claim.expiresAt}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  // Render list footer (loading indicator for pagination)
  const renderListFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.loadMoreContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadMoreText}>{t('common.loading')}</Text>
      </View>
    );
  };


  // Render favorite deal item
  const renderFavoriteItem = ({ item: deal }) => (
    <DealGridCard
      deal={deal}
      onView={() => navigation.navigate('DealDetail', { id: deal._id })}
      onQuickClaim={() => {}}
    />
  );

  // Handle end reached for favorites
  const handleEndReachedFavorites = () => {
    if (hasNextPageFavorites && !isFetchingNextPageFavorites) {
      fetchNextPageFavorites();
    }
  };

  // Render list footer for favorites
  const renderListFooterFavorites = () => {
    if (!isFetchingNextPageFavorites) return null;
    return (
      <View style={styles.loadMoreContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadMoreText}>{t('common.loading')}</Text>
      </View>
    );
  };

  // Handle end reached (load more)
  const handleEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  if (!userId) {
    return (
      <GradientBackground>
        <View style={styles.safe}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.container}>
              <LoginPrompt 
                message={t('deals.myDeals')}
                icon={ShoppingBag}
              />
            </View>
          </ScrollView>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeContent} edges={['top']}>
      <View style={styles.safe}>
      <View style={styles.headerContainer}>
        <HeaderWithLogo 
          onAvatarPress={() => {}}
          onLogoPress={() => navigation.navigate('Home')}
          onSearchPress={() => navigation.navigate('Deals', { openFilters: true })}
          logoSize={112}
        />
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'claimed' && styles.tabActive]}
          onPress={() => setActiveTab('claimed')}
        >
          <ShoppingBag 
            size={18} 
            color={activeTab === 'claimed' ? colors.primary : colors.textMuted} 
          />
          <Text style={[
            styles.tabText,
            activeTab === 'claimed' && styles.tabTextActive
          ]}>
            {t('deals.claimed')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'favorites' && styles.tabActive]}
          onPress={() => setActiveTab('favorites')}
        >
          <Heart 
            size={18} 
            color={activeTab === 'favorites' ? colors.primary : colors.textMuted}
            fill={activeTab === 'favorites' ? colors.primary : 'transparent'}
          />
          <Text style={[
            styles.tabText,
            activeTab === 'favorites' && styles.tabTextActive
          ]}>
            {t('deals.favorites')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content based on active tab */}
      {activeTab === 'claimed' ? (
        claimHistoryError ? (
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          >
            <View style={styles.container}>
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t('common.error')}</Text>
                <Text style={styles.emptySubtext}>{claimHistoryError?.message || t('common.loading')}</Text>
              </View>
            </View>
          </ScrollView>
        ) : isLoadingHistory ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : claimHistory.length > 0 ? (
          <FlatList
            key={`claimed-deals-list-${activeTab}`}
            data={claimHistory}
            renderItem={renderHistoryItem}
            keyExtractor={(item) => item.id}
            ListFooterComponent={renderListFooter}
            contentContainerStyle={styles.listContent}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No claimed deals yet</Text>
                <Text style={styles.emptySubtext}>Start claiming deals to see them here!</Text>
              </View>
            }
          />
        ) : (
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          >
            <View style={styles.container}>
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t('deals.noClaimedDeals')}</Text>
                <Text style={styles.emptySubtext}>{t('deals.claimNow')}</Text>
              </View>
            </View>
          </ScrollView>
        )
      ) : (
        // Favorites Tab Content
        favoriteDealsError ? (
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefetchingFavorites}
                onRefresh={refetchFavorites}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          >
            <View style={styles.container}>
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t('common.error')}</Text>
                <Text style={styles.emptySubtext}>{favoriteDealsError?.message || t('common.loading')}</Text>
              </View>
            </View>
          </ScrollView>
        ) : isLoadingFavorites ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : favoriteDeals.length > 0 ? (
          <FlatList
            key={`favorite-deals-list-${activeTab}`}
            data={favoriteDeals}
            renderItem={renderFavoriteItem}
            keyExtractor={(item) => item._id}
            ListFooterComponent={renderListFooterFavorites}
            contentContainerStyle={styles.favoritesListContent}
            numColumns={2}
            columnWrapperStyle={styles.favoritesColumnWrapper}
            onEndReached={handleEndReachedFavorites}
            onEndReachedThreshold={0.5}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefetchingFavorites}
                onRefresh={refetchFavorites}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          />
        ) : (
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefetchingFavorites}
                onRefresh={refetchFavorites}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          >
            <View style={styles.container}>
              <View style={styles.emptyContainer}>
                <Heart size={48} color={colors.textMuted} style={{ marginBottom: 16 }} />
                <Text style={styles.emptyText}>{t('deals.noFavoriteDeals')}</Text>
                <Text style={styles.emptySubtext}>{t('deals.addToFavorites')}</Text>
              </View>
            </View>
          </ScrollView>
        )
      )}

      {/* Claimed Deal Bottom Sheet */}
        <ClaimedDealBottomSheet
          visible={bottomSheetVisible}
          onClose={() => {
            setBottomSheetVisible(false);
            setSelectedClaim(null);
          }}
          data={selectedClaim}
        />
      </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const getStyles = (colors, typography) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  safeContent: { flex: 1, backgroundColor: 'transparent' },
  scrollContent: {
    paddingBottom: 100, // Extra padding for floating tab bar
  },
  listContent: {
    paddingTop: 10,
    paddingBottom: 100, // Extra padding for floating tab bar
    paddingHorizontal: 20,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
  },
  tabTextActive: {
    fontFamily: typography.fontFamily.semiBold,
    color: colors.primary,
  },
  favoritesListContent: {
    paddingBottom: 100,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  favoritesColumnWrapper: {
    gap: 12,
    justifyContent: 'space-between',
  },
  loadMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  loadMoreText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
  },
  container: { 
    padding: 20,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.semiBold,
    marginBottom: 4,
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  historyItemContent: {
    gap: 1,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 0,
  },
  historyDealName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  statusBadgeContainer: {
    marginTop: 0,
    marginBottom: 0,
    position: 'relative'
  },
  statusBadge: {
    position: 'absolute',
    right: 0,
    top: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
  },
  historyBusinessName: {
    fontSize: typography.fontSize.base,
    // font weight bold
    fontWeight: "700",
    color: colors.textMuted,
    marginBottom: 0,
  },
  historyItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 0,
  },
  historyPriceContainer: {
    flexDirection: 'row',
    
    gap: 4,
  },
  historyPriceLabel: {
    fontSize: typography.fontSize.base,
    color: colors.textMuted,
  },
  historyPrice: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.primary,
  },
  historyDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyDate: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },
  expiryContainer: {
    marginTop: 0,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  expiryText: {
    fontSize: typography.fontSize.sm,
    color: colors.warning || colors.textMuted,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.text,
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.regular,
    marginBottom: 8,
  },
  emptySubtext: {
    color: colors.textMuted,
    fontSize: typography.fontSize.base,
    marginBottom: 16,
  },
});

