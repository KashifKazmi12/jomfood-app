/**
 * Notifications Screen
 * 
 * Full notifications history with pagination
 */

import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import notificationsAPI from '../api/notifications';
import { useNotifications } from '../context/NotificationContext';
import useThemeColors from '../theme/useThemeColors';
import useThemeTypography from '../theme/useThemeTypography';
import GradientBackground from '../components/GradientBackground';
import LoginPrompt from '../components/LoginPrompt';
import { Bell, BellOff, CheckCircle2, Clock, AlertCircle, Info, Gift, Sparkles } from 'lucide-react-native';

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const user = useSelector((state) => state.auth.user);
  const { refreshUnreadCount } = useNotifications();
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const styles = getStyles(colors, typography);

  const [page, setPage] = useState(1);
  const limit = 20;

  // Fetch notifications with infinite query for pagination
  const {
    data: notificationsData,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
    error,
  } = useInfiniteQuery({
    queryKey: ['notifications', user?._id],
    queryFn: async ({ pageParam = 1 }) => {
      if (!user || !user._id) {
        return { notifications: [], pagination: null };
      }
      
      try {
        // console.log('🔍 [NotificationsScreen] Fetching notifications, page:', pageParam);
        const response = await notificationsAPI.getNotifications(user._id, {
          page: pageParam,
          limit,
        });
        
        // console.log('📥 [NotificationsScreen] API Response:', JSON.stringify(response, null, 2));
        
        // According to API docs, response structure is:
        // { success: true, notifications: [...], pagination: {...}, unreadCount: 15 }
        // But API client might wrap it in { data: {...} }
        let notifications = [];
        let pagination = null;
        
        // Check if response has data wrapper
        if (response?.data) {
          // Response wrapped: { data: { success: true, notifications: [...], pagination: {...} } }
          if (response.data.notifications) {
            notifications = response.data.notifications;
            pagination = response.data.pagination;
          } else if (Array.isArray(response.data)) {
            // Response is just array: { data: [...] }
            notifications = response.data;
          }
        } else if (response?.notifications) {
          // Direct response: { success: true, notifications: [...], pagination: {...} }
          notifications = response.notifications;
          pagination = response.pagination;
        } else if (Array.isArray(response)) {
          // Response is just array
          notifications = response;
        }
        
        // Ensure notifications is an array
        if (!Array.isArray(notifications)) {
          // console.warn('⚠️ [NotificationsScreen] Notifications is not an array:', notifications);
          notifications = [];
        }
        
        // console.log('📋 [NotificationsScreen] Extracted notifications:', notifications.length);
        // console.log('📄 [NotificationsScreen] Pagination:', pagination);
        
        return {
          notifications,
          pagination,
        };
      } catch (err) {
        // console.error('❌ [NotificationsScreen] Error fetching notifications:', err);
        // Return empty structure on error
        return { notifications: [], pagination: null };
      }
    },
    enabled: !!user && !!user._id,
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      // Safety check: ensure lastPage exists
      if (!lastPage || !lastPage.pagination) {
        return undefined;
      }
      
      const pagination = lastPage.pagination;
      // Handle different pagination field names
      const currentPage = pagination.currentPage || pagination.page || pagination.current_page || 1;
      const totalPages = pagination.totalPages || pagination.total_pages || pagination.pages || 1;
      
      if (currentPage < totalPages) {
        return currentPage + 1;
      }
      return undefined;
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user || !user._id) return;
      return await notificationsAPI.markAllAsRead(user._id);
    },
    onSuccess: () => {
      refreshUnreadCount();
      refetch();
    },
  });

  // Mark single notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      if (!user || !user._id) return;
      return await notificationsAPI.markAsRead(notificationId, user._id);
    },
    onSuccess: () => {
      refreshUnreadCount();
      refetch();
    },
  });

  const queryClient = useQueryClient();

  // Flatten notifications from all pages
  // Safely handle undefined data - useInfiniteQuery might not have pages initially
  const notifications = (notificationsData?.pages && Array.isArray(notificationsData.pages))
    ? notificationsData.pages.flatMap((page) => {
        if (!page || !page.notifications) return [];
        return Array.isArray(page.notifications) ? page.notifications : [];
      })
    : [];

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  // Set up navigation header with "Mark All as Read" button
  useLayoutEffect(() => {
    if (!user || !user._id || notifications.length === 0) {
      navigation.setOptions({
        headerRight: () => null,
      });
      return;
    }

    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleMarkAllAsRead}
          disabled={markAllAsReadMutation.isPending}
          activeOpacity={0.7}
        >
          {markAllAsReadMutation.isPending ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <CheckCircle2 size={16} color={colors.primary} />
              <Text style={styles.headerButtonText}>{t('notifications.markAllAsRead')}</Text>
            </>
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, user, notifications.length, markAllAsReadMutation.isPending, colors.primary, t]);

  const handleNotificationPress = (notification) => {
    console.log('🔔 [NotificationsScreen] Notification clicked:', JSON.stringify(notification, null, 2));
    
    // Mark as read first
    if (!notification.is_read && notification._id) {
      console.log('📝 [NotificationsScreen] Marking notification as read:', notification._id);
      markAsReadMutation.mutate(notification._id);
    }
    
    // Navigate based on notification type
    // Check multiple possible field names for type and dealId
    const type = notification?.type || notification?.notificationType || notification?.data?.type;
    const dealId = notification?.dealId || notification?.deal_id || notification?.data?.dealId || notification?.data?.deal_id;
    
    console.log('🔍 [NotificationsScreen] Navigation check:', {
      type,
      dealId,
      hasType: !!type,
      hasDealId: !!dealId,
      notificationKeys: Object.keys(notification || {}),
    });
    
    if (type === 'deal' && dealId) {
      console.log('🚀 [NotificationsScreen] Navigating to DealDetail with dealId:', dealId);
      try {
        // Check if navigation is available
        if (navigation && typeof navigation.navigate === 'function') {
          // Navigate to DealDetail through RootTabs -> Home -> DealDetail
          navigation.navigate('RootTabs', {
            screen: 'Home',
            params: {
              screen: 'DealDetail',
              params: { id: dealId },
            },
          });
          console.log('✅ [NotificationsScreen] Navigation successful');
        } else {
          console.warn('⚠️ [NotificationsScreen] Navigation not available');
        }
      } catch (navError) {
        console.error('❌ [NotificationsScreen] Navigation error:', navError);
        // Stay on notifications screen if navigation fails
      }
    } else {
      console.log('📋 [NotificationsScreen] No deal type or dealId, staying on Notifications screen');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('notifications.justNow');
    if (diffMins < 60) return `${diffMins} ${t('notifications.minutesAgo')}`;
    if (diffHours < 24) return `${diffHours} ${t('notifications.hoursAgo')}`;
    if (diffDays < 7) return `${diffDays} ${t('notifications.daysAgo')}`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    const iconSize = 20;
    const iconColor = colors.primary;
    
    // You can customize icons based on notification type if available
    switch (type?.toLowerCase()) {
      case 'deal':
      case 'offer':
        return <Gift size={iconSize} color={iconColor} />;
      case 'alert':
      case 'warning':
        return <AlertCircle size={iconSize} color={iconColor} />;
      case 'info':
        return <Info size={iconSize} color={iconColor} />;
      default:
        return <Bell size={iconSize} color={iconColor} />;
    }
  };

  const renderNotificationItem = ({ item }) => {
    const isUnread = !item.is_read;
    
    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          isUnread && styles.notificationCardUnread,
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        {isUnread && <View style={styles.unreadIndicator} />}
        {isUnread && <View style={styles.unreadDot} />}
        <View style={styles.notificationIconContainer}>
          {getNotificationIcon(item.type)}
        </View>
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text 
              style={[
                styles.notificationTitle,
                isUnread && styles.notificationTitleUnread
              ]} 
              numberOfLines={2}
            >
              {item.title || item.message}
            </Text>
          </View>
          {item.message && item.message !== item.title && (
            <Text style={styles.notificationMessage} numberOfLines={3}>
              {item.message}
            </Text>
          )}
          <View style={styles.notificationFooter}>
            <Clock size={12} color={colors.textMuted} />
            <Text style={styles.notificationTime}>
              {formatDate(item.created_at || item.createdAt)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.emptyText}>{t('notifications.loading')}</Text>
        </View>
      );
    }

    if (error) {
      console.error('❌ [NotificationsScreen] Query error:', error);
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <AlertCircle size={48} color={colors.error} />
          </View>
          <Text style={styles.emptyTitle}>{t('notifications.errorLoading')}</Text>
          <Text style={styles.emptySubtext}>
            {error.message || t('common.tryAgainLater')}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <BellOff size={48} color={colors.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>{t('notifications.noNotifications')}</Text>
        <Text style={styles.emptySubtext}>
          {t('notifications.noNotificationsDesc')}
        </Text>
      </View>
    );
  };

  if (!user || !user._id) {
    return (
      <GradientBackground>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.container}>
            <LoginPrompt 
              message={t('notifications.pleaseSignInToView')}
              icon={Bell}
            />
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.container}>
          <FlatList
            data={notifications}
            renderItem={renderNotificationItem}
            keyExtractor={(item) => item._id || item.id}
            contentContainerStyle={notifications.length === 0 ? styles.emptyList : styles.list}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderFooter}
            showsVerticalScrollIndicator={false}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          />
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const getStyles = (colors, typography) => StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  headerButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.primary,
  },
  list: {
    padding: 16,
    paddingBottom: 100, // Space for bottom navigation
  },
  emptyList: {
    flex: 1,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border + '30',
    position: 'relative',
    overflow: 'hidden',
  },
  notificationCardUnread: {
    backgroundColor: colors.white,
    borderColor: colors.border,
  },
  unreadIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.primary,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  unreadDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E74C3C',
    zIndex: 1,
  },
  notificationIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  notificationTitle: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.text,
    lineHeight: 20,
  },
  notificationTitleUnread: {
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textDark || colors.text,
  },
  notificationMessage: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  notificationTime: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.border + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 12,
  },
  footerLoader: {
    padding: 20,
    alignItems: 'center',
  },
});

