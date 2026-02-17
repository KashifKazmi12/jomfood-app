import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, FlatList, RefreshControl, Modal, KeyboardAvoidingView, TouchableWithoutFeedback, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import useThemeColors from '../theme/useThemeColors';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import GradientBackground from '../components/GradientBackground';
import { useInfiniteQuery } from '@tanstack/react-query';
import { dealsAPI } from '../api/deals';
import { favoritesAPI } from '../api/favorites';
import { Clock, CheckCircle, XCircle, Calendar, ShoppingBag, Heart, X } from 'lucide-react-native';
import ClaimedDealBottomSheet from '../components/deals/ClaimedDealBottomSheet';
import useThemeTypography from '../theme/useThemeTypography';
import LoginPrompt from '../components/LoginPrompt';
import HeaderWithLogo from '../components/HeaderWithLogo';
import DealGridCard from '../components/deals/DealGridCard';
import DealGridCardSkeleton from '../components/deals/DealGridCardSkeleton';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { showToast } from '../components/toast';

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
  const [rescheduleVisible, setRescheduleVisible] = React.useState(false);
  const [rescheduleClaim, setRescheduleClaim] = React.useState(null);
  const [rescheduleDateValue, setRescheduleDateValue] = React.useState(null);
  const [rescheduleTimeValue, setRescheduleTimeValue] = React.useState(null);
  const [rescheduleError, setRescheduleError] = React.useState('');
  const [rescheduleSubmitting, setRescheduleSubmitting] = React.useState(false);
  const [iosPickerVisible, setIosPickerVisible] = React.useState(false);
  const [iosPickerMode, setIosPickerMode] = React.useState('date');
  const [iosPickerValue, setIosPickerValue] = React.useState(new Date());
  const [cancelConfirmVisible, setCancelConfirmVisible] = React.useState(false);
  const [cancelTarget, setCancelTarget] = React.useState(null);

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

      const formatServiceType = (serviceType) => {
        if (!serviceType) return 'N/A';
        const normalized = String(serviceType).toLowerCase().replace(/_/g, '-');
        if (normalized === 'dine-in' || normalized === 'dinein') return 'Dine-in';
        if (normalized === 'self-pickup' || normalized === 'pickup') return 'Self pickup';
        if (normalized === 'delivery') return 'Delivery';
        return serviceType;
      };

      const status = String(claim.status || 'active').toLowerCase();

      return {
        id: claim._id,
        dealId: claim.deal_id?._id || claim.deal_id,
        dealName,
        businessName,
        price: dealPrice,
        status,
        claimedAt: formatDate(claim.claimed_at),
        scheduledAt: formatDate(claim.preferred_datetime),
        preferredServiceType: formatServiceType(claim.preferred_service_type),
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

  const openRescheduleModal = (claim) => {
    setRescheduleClaim(claim);
    setRescheduleDateValue(null);
    setRescheduleTimeValue(null);
    setRescheduleError('');
    setRescheduleVisible(true);
  };

  const formatDateDisplay = (dateValue) => {
    if (!dateValue) return '';
    return dateValue.toLocaleDateString('en-US');
  };

  const formatTimeDisplay = (timeValue) => {
    if (!timeValue) return '';
    return timeValue.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const openDateTimePicker = (mode) => {
    if (Platform.OS === 'android') {
      const currentValue = mode === 'date'
        ? (rescheduleDateValue || new Date())
        : (rescheduleTimeValue || new Date());
      const minimumDate = mode === 'date' ? new Date() : undefined;
      DateTimePickerAndroid.open({
        value: currentValue,
        mode,
        is24Hour: false,
        minimumDate,
        onChange: (event, selectedDate) => {
          if (event.type !== 'set' || !selectedDate) return;
          if (mode === 'date') {
            setRescheduleDateValue(selectedDate);
          } else {
            setRescheduleTimeValue(selectedDate);
          }
          setRescheduleError('');
        },
      });
      return;
    }

    const currentValue = mode === 'date'
      ? (rescheduleDateValue || new Date())
      : (rescheduleTimeValue || new Date());
    setIosPickerMode(mode);
    setIosPickerValue(currentValue);
    setIosPickerVisible(true);
  };

  const buildRescheduleDatetime = () => {
    if (!rescheduleDateValue || !rescheduleTimeValue) return null;
    return new Date(
      rescheduleDateValue.getFullYear(),
      rescheduleDateValue.getMonth(),
      rescheduleDateValue.getDate(),
      rescheduleTimeValue.getHours(),
      rescheduleTimeValue.getMinutes(),
      0,
      0
    );
  };

  const submitReschedule = async () => {
    if (!rescheduleClaim?._id) {
      setRescheduleError('Missing claim information.');
      return;
    }
    if (!rescheduleDateValue || !rescheduleTimeValue) {
      setRescheduleError('Please select both date and time.');
      return;
    }
    const nextDate = buildRescheduleDatetime();
    if (!nextDate || Number.isNaN(nextDate.getTime())) {
      setRescheduleError('Invalid date or time.');
      return;
    }
    if (nextDate.getTime() <= Date.now()) {
      setRescheduleError('Please select a future date and time.');
      return;
    }

    setRescheduleSubmitting(true);
    try {
      const res = await dealsAPI.rescheduleClaim({
        claimId: rescheduleClaim._id,
        customerId: userId,
        preferredDatetime: nextDate.toISOString(),
      });
      const message = res?.message || res?.data?.message || 'Deal claim rescheduled successfully';
      showToast.success('Success', message);
      setRescheduleVisible(false);
      setRescheduleClaim(null);
      refetch();
    } catch (error) {
      showToast.error('Error', error?.message || 'Failed to reschedule deal');
    } finally {
      setRescheduleSubmitting(false);
    }
  };

  const cancelClaim = async (claim) => {
    if (!claim?._id) return;
    try {
      const res = await dealsAPI.cancelClaim({ claimId: claim._id, customerId: userId });
      const message = res?.message || res?.data?.message || 'Deal claim cancelled successfully';
      showToast.success('Success', message);
      refetch();
    } catch (error) {
      showToast.error('Error', error?.message || 'Failed to cancel deal');
    }
  };

  const openCancelConfirm = (claim) => {
    setCancelTarget(claim);
    setCancelConfirmVisible(true);
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelConfirmVisible(false);
    await cancelClaim(cancelTarget);
    setCancelTarget(null);
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

        {claim.preferredServiceType !== 'N/A' && (
          <View style={styles.historyMetaRow}>
            <Text style={styles.historyMetaLabel}>Preferred Service Type:</Text>
            <Text style={styles.historyMetaValue}>{claim.preferredServiceType}</Text>
          </View>
        )}

        {claim.scheduledAt !== 'N/A' && (
          <View style={styles.historyMetaRow}>
            <Text style={styles.historyMetaLabel}>Scheduled At:</Text>
            <Text style={styles.historyMetaValue}>{claim.scheduledAt}</Text>
          </View>
        )}
        
        {claim.status === 'active' && claim.expiresAt !== 'N/A' && (
          <View style={styles.expiryContainer}>
            <Text style={styles.expiryText}>
              {t('dealDetail.validUntil')}: {claim.expiresAt}
            </Text>
          </View>
        )}

        {/* {claim.status === 'active' && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.rescheduleButton}
              onPress={(event) => {
                event?.stopPropagation?.();
                openRescheduleModal(claim.fullClaim);
              }}
            >
              <Text style={styles.rescheduleButtonText}>Reschedule</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={(event) => {
                event?.stopPropagation?.();
                openCancelConfirm(claim.fullClaim);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )} */}
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
              {t('myDeals.tabLabel', 'My Deals')}
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

      {/* Reschedule Modal */}
      <Modal
        visible={rescheduleVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setRescheduleVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <TouchableWithoutFeedback onPress={() => setRescheduleVisible(false)}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>
          <View style={styles.rescheduleModalCard}>
            <View style={styles.rescheduleHeaderRow}>
              <Text style={styles.rescheduleTitle}>Reschedule Deal</Text>
              <TouchableOpacity onPress={() => setRescheduleVisible(false)}>
                <X size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.rescheduleSubtitle}>Choose a new date and time for your deal</Text>

            <Text style={styles.rescheduleSectionLabel}>Preferred Date *</Text>
            <TouchableOpacity
              style={styles.rescheduleInput}
              onPress={() => openDateTimePicker('date')}
            >
              <Text style={rescheduleDateValue ? styles.rescheduleInputText : styles.rescheduleInputPlaceholder}>
                {rescheduleDateValue ? formatDateDisplay(rescheduleDateValue) : 'Select date'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.rescheduleSectionLabel}>Preferred Time *</Text>
            <TouchableOpacity
              style={styles.rescheduleInput}
              onPress={() => openDateTimePicker('time')}
            >
              <Text style={rescheduleTimeValue ? styles.rescheduleInputText : styles.rescheduleInputPlaceholder}>
                {rescheduleTimeValue ? formatTimeDisplay(rescheduleTimeValue) : 'Select time'}
              </Text>
            </TouchableOpacity>

            {rescheduleError ? <Text style={styles.rescheduleError}>{rescheduleError}</Text> : null}

            <TouchableOpacity
              style={[styles.reschedulePrimaryButton, rescheduleSubmitting && styles.rescheduleButtonDisabled]}
              onPress={submitReschedule}
              disabled={rescheduleSubmitting}
            >
              <Text style={styles.reschedulePrimaryText}>
                {rescheduleSubmitting ? 'Rescheduling...' : 'Reschedule'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.rescheduleSecondaryButton}
              onPress={() => setRescheduleVisible(false)}
              disabled={rescheduleSubmitting}
            >
              <Text style={styles.rescheduleSecondaryText}>Close</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* iOS Date/Time Picker Modal */}
      <Modal
        visible={iosPickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIosPickerVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIosPickerVisible(false)}>
          <View style={styles.modalBackdrop} />
        </TouchableWithoutFeedback>
        <View style={styles.iosPickerCard}>
          <DateTimePicker
            value={iosPickerValue}
            mode={iosPickerMode}
            display="spinner"
            minimumDate={iosPickerMode === 'date' ? new Date() : undefined}
            onChange={(event, selectedDate) => {
              if (selectedDate) {
                setIosPickerValue(selectedDate);
              }
            }}
          />
          <View style={styles.iosPickerActions}>
            <TouchableOpacity
              style={styles.rescheduleSecondaryButton}
              onPress={() => setIosPickerVisible(false)}
            >
              <Text style={styles.rescheduleSecondaryText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reschedulePrimaryButton}
              onPress={() => {
                if (iosPickerMode === 'date') {
                  setRescheduleDateValue(iosPickerValue);
                } else {
                  setRescheduleTimeValue(iosPickerValue);
                }
                setRescheduleError('');
                setIosPickerVisible(false);
              }}
            >
              <Text style={styles.reschedulePrimaryText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        visible={cancelConfirmVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setCancelConfirmVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <TouchableWithoutFeedback onPress={() => setCancelConfirmVisible(false)}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>
          <View style={styles.confirmModalCard}>
            <Text style={styles.confirmTitle}>Cancel Deal?</Text>
            <Text style={styles.confirmSubtitle}>Are you sure you want to cancel this deal?</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.confirmNoButton}
                onPress={() => setCancelConfirmVisible(false)}
              >
                <Text style={styles.confirmNoText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmYesButton}
                onPress={confirmCancel}
              >
                <Text style={styles.confirmYesText}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    gap: 2,
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
  historyMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 0,
  },
  historyMetaLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },
  historyMetaValue: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontFamily: typography.fontFamily.semiBold,
  },
  expiryContainer: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  expiryText: {
    fontSize: typography.fontSize.sm,
    color: colors.warning || colors.textMuted,
    fontStyle: 'italic',
  },
  actionRow: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 10,
  },
  rescheduleButton: {
    flex: 1,
    backgroundColor: '#FE8100',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rescheduleButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semiBold,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.backgroundLight || '#F5F5F5',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semiBold,
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  rescheduleModalCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    width: '88%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  rescheduleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  rescheduleTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
  },
  rescheduleSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
    marginBottom: 16,
  },
  rescheduleSectionLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
    marginBottom: 8,
  },
  rescheduleInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.white,
    marginBottom: 14,
  },
  rescheduleInputText: {
    color: colors.text,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
  },
  rescheduleInputPlaceholder: {
    color: colors.textMuted,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
  },
  rescheduleError: {
    color: colors.error || '#d32f2f',
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
    marginBottom: 12,
  },
  reschedulePrimaryButton: {
    backgroundColor: '#FE8100',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  reschedulePrimaryText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semiBold,
  },
  rescheduleSecondaryButton: {
    backgroundColor: colors.backgroundLight || '#F5F5F5',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  rescheduleSecondaryText: {
    color: colors.text,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semiBold,
  },
  rescheduleButtonDisabled: {
    opacity: 0.7,
  },
  iosPickerCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  iosPickerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmModalCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  confirmTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
    marginBottom: 6,
  },
  confirmSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
    marginBottom: 16,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
  },
  confirmNoButton: {
    flex: 1,
    backgroundColor: colors.backgroundLight || '#F5F5F5',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  confirmNoText: {
    color: colors.text,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semiBold,
  },
  confirmYesButton: {
    flex: 1,
    backgroundColor: '#FE8100',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmYesText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semiBold,
  },
});
