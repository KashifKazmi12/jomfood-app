/**
 * Notification Bell Component
 * 
 * Shows notification bell icon with red dot indicator
 * Opens dropdown with latest notifications
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { useNotifications } from '../context/NotificationContext';
import notificationsAPI from '../api/notifications';
import useThemeColors from '../theme/useThemeColors';
import useThemeTypography from '../theme/useThemeTypography';
import { useTranslation } from 'react-i18next';

export default function NotificationBell() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const user = useSelector((state) => state.auth.user);
  const { hasUnreadNotifications, unreadCount, refreshUnreadCount } = useNotifications();
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const styles = getStyles(colors, typography);

  const [modalVisible, setModalVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch latest notifications when modal opens
  useEffect(() => {
    if (modalVisible && user && user._id) {
      fetchLatestNotifications();
    }
  }, [modalVisible, user]);

  const fetchLatestNotifications = async () => {
    if (!user || !user._id) return;

    setLoading(true);
    try {
      const response = await notificationsAPI.getNotifications(user._id, {
        page: 1,
        limit: 5,
      });
      
      // According to API docs, response structure is:
      // { success: true, notifications: [...], pagination: {...} }
      // But API client might wrap it in { data: {...} }
      let notificationsList = [];
      
      if (response?.data?.notifications) {
        notificationsList = response.data.notifications;
      } else if (response?.notifications) {
        notificationsList = response.notifications;
      } else if (Array.isArray(response?.data)) {
        notificationsList = response.data;
      } else if (Array.isArray(response)) {
        notificationsList = response;
      }
      
      setNotifications(Array.isArray(notificationsList) ? notificationsList : []);
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBellPress = () => {
    if (!user || !user._id) {
      navigation.navigate('Login');
      return;
    }
    setModalVisible(true);
  };

  const handleViewAll = () => {
    setModalVisible(false);
    navigation.navigate('Notifications');
  };

  const handleNotificationPress = async (notification) => {
    console.log('🔔 [NotificationBell] Notification clicked:', JSON.stringify(notification, null, 2));
    
    // Mark as read first
    if (!notification.is_read && notification._id) {
      try {
        console.log('📝 [NotificationBell] Marking notification as read:', notification._id);
        await notificationsAPI.markAsRead(notification._id, user._id);
        refreshUnreadCount();
        console.log('✅ [NotificationBell] Notification marked as read');
      } catch (error) {
        console.error('❌ [NotificationBell] Error marking notification as read:', error);
      }
    }
    setModalVisible(false);
    
    // Navigate based on notification type
    // Check multiple possible field names for type and dealId
    const type = notification?.type || notification?.notificationType || notification?.data?.type;
    const dealId = notification?.dealId || notification?.deal_id || notification?.data?.dealId || notification?.data?.deal_id;
    
    console.log('🔍 [NotificationBell] Navigation check:', {
      type,
      dealId,
      hasType: !!type,
      hasDealId: !!dealId,
      notificationKeys: Object.keys(notification || {}),
    });
    
    if (type === 'deal' && dealId) {
      console.log('🚀 [NotificationBell] Navigating to DealDetail with dealId:', dealId);
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
          console.log('✅ [NotificationBell] Navigation successful');
        } else {
          console.warn('⚠️ [NotificationBell] Navigation not available');
        }
      } catch (navError) {
        console.error('❌ [NotificationBell] Navigation error:', navError);
        // Fallback: navigate to notifications screen
        try {
          if (navigation && typeof navigation.navigate === 'function') {
            navigation.navigate('Notifications');
          }
        } catch (fallbackError) {
          console.error('❌ [NotificationBell] Fallback navigation also failed:', fallbackError);
        }
      }
    } else {
      console.log('📋 [NotificationBell] No deal type or dealId, navigating to Notifications screen');
      try {
        if (navigation && typeof navigation.navigate === 'function') {
          navigation.navigate('Notifications');
        }
      } catch (navError) {
        console.error('❌ [NotificationBell] Navigation to Notifications failed:', navError);
      }
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

  return (
    <>
      <TouchableOpacity
        style={styles.bellButton}
        onPress={handleBellPress}
        accessibilityLabel="Notifications"
      >
        <Bell size={20} color={colors.primary} />
        {hasUnreadNotifications && (
          <View style={styles.redDot}>
            {unreadCount > 0 && unreadCount < 10 && (
              <Text style={styles.redDotText}>{unreadCount}</Text>
            )}
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('notifications.notifications')}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : notifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t('notifications.noNotifications')}</Text>
              </View>
            ) : (
              <ScrollView style={styles.notificationsList}>
                {notifications.map((notification) => (
                  <TouchableOpacity
                    key={notification._id}
                    style={[
                      styles.notificationItem,
                      !notification.is_read && styles.notificationItemUnread,
                    ]}
                    onPress={() => handleNotificationPress(notification)}
                  >
                    <View style={styles.notificationContent}>
                      <Text style={styles.notificationTitle}>
                        {notification.title || notification.message}
                      </Text>
                      {notification.message && notification.message !== notification.title && (
                        <Text style={styles.notificationMessage} numberOfLines={2}>
                          {notification.message}
                        </Text>
                      )}
                      <Text style={styles.notificationTime}>
                        {formatDate(notification.created_at || notification.createdAt)}
                      </Text>
                    </View>
                    {!notification.is_read && <View style={styles.unreadDot} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {notifications.length > 0 && (
              <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAll}>
                <Text style={styles.viewAllText}>{t('notifications.viewAll')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const getStyles = (colors, typography) => StyleSheet.create({
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  redDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.error || '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white || '#FFFFFF',
  },
  redDotText: {
    color: colors.white || '#FFFFFF',
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 16,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 12,
    width: 320,
    maxHeight: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.text,
  },
  closeButton: {
    fontSize: 24,
    color: colors.textMuted,
    fontWeight: '300',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
  },
  notificationsList: {
    maxHeight: 350,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  notificationItemUnread: {
    backgroundColor: colors.primary + '08',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: 8,
    marginTop: 4,
  },
  viewAllButton: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  viewAllText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.primary,
  },
});

