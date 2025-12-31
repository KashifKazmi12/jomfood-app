/**
 * Notification Context
 * 
 * Provides global notification state and functions
 */

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import messaging from '@react-native-firebase/messaging';
import { Platform, AppState } from 'react-native';
import { useSelector } from 'react-redux';
import notificationsAPI from '../api/notifications';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const user = useSelector((state) => state.auth.user);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentNotification, setCurrentNotification] = useState(null);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const listenerSetupRef = useRef(false);

  // Fetch unread count from API
  const fetchUnreadCount = useCallback(async () => {
    if (!user || !user._id) {
      setUnreadCount(0);
      setHasUnreadNotifications(false);
      return;
    }

    try {
      const customerId = user._id;
      const response = await notificationsAPI.getUnreadCount(customerId);

      // According to API docs: { success: true, unreadCount: 15 }
      // But API client might wrap it in { data: {...} }
      const count = response?.data?.unreadCount ||
        response?.unreadCount ||
        response?.data?.data?.unreadCount ||
        0;

      setUnreadCount(count);
      setHasUnreadNotifications(count > 0);
    } catch (error) {
      console.error('❌ Error fetching unread count:', error);
      // Don't set error state, just log it
    }
  }, [user]);

  // Fetch unread count when user changes
  useEffect(() => {
    fetchUnreadCount();

    // Set up interval to periodically check for new notifications (every 30 seconds)
    const interval = setInterval(() => {
      if (user && user._id) {
        fetchUnreadCount();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [user, fetchUnreadCount]);

  // Set up foreground message listener
  useEffect(() => {
    if (listenerSetupRef.current) return;

    let unsubscribe;
    try {
      unsubscribe = messaging().onMessage(async (remoteMessage) => {
        try {
          console.log('📬 Foreground notification received:', remoteMessage);

          // Show in-app notification banner
          setCurrentNotification(remoteMessage);

          // Show red dot indicator when notification arrives
          setHasUnreadNotifications(true);

          // Refresh unread count from API
          if (user && user._id) {
            fetchUnreadCount();
          }
        } catch (error) {
          console.error('❌ [NotificationContext] Error handling foreground message:', error);
        }
      });

      listenerSetupRef.current = true;
    } catch (error) {
      console.error('❌ [NotificationContext] Error setting up foreground listener:', error);
      listenerSetupRef.current = false;
    }

    return () => {
      try {
        if (unsubscribe && typeof unsubscribe === 'function') {
          unsubscribe();
        }
      } catch (error) {
        console.error('❌ [NotificationContext] Error cleaning up foreground listener:', error);
      }
      listenerSetupRef.current = false;
    };
  }, [user, fetchUnreadCount]);

  // Handle notification when app is opened from background/quit state
  useEffect(() => {
    let unsubscribe;
    
    try {
      // Check if app was opened from a notification
      messaging()
        .getInitialNotification()
        .then(remoteMessage => {
          try {
            if (remoteMessage) {
              console.log('📬 App opened from notification:', remoteMessage);
              setHasUnreadNotifications(true);
              if (user && user._id) {
                fetchUnreadCount();
              }
              // Store notification for navigation handling (app opened from closed state)
              setPendingNavigation(remoteMessage);
            }
          } catch (error) {
            console.error('❌ [NotificationContext] Error handling initial notification:', error);
          }
        })
        .catch(error => {
          console.error('❌ [NotificationContext] Error getting initial notification:', error);
        });

      // Handle notification when app is in background
      unsubscribe = messaging().onNotificationOpenedApp(remoteMessage => {
        try {
          console.log('📬 Notification opened app from background:', remoteMessage);
          setHasUnreadNotifications(true);
          if (user && user._id) {
            fetchUnreadCount();
          }
          // Store notification for navigation (app opened from background)
          setPendingNavigation(remoteMessage);
        } catch (error) {
          console.error('❌ [NotificationContext] Error handling background notification:', error);
        }
      });
    } catch (error) {
      console.error('❌ [NotificationContext] Error setting up notification handlers:', error);
    }

    return () => {
      try {
        if (unsubscribe && typeof unsubscribe === 'function') {
          unsubscribe();
        }
      } catch (error) {
        console.error('❌ [NotificationContext] Error cleaning up notification handlers:', error);
      }
    };
  }, [user, fetchUnreadCount]);

  // Refresh when app comes to foreground
  useEffect(() => {
    let subscription;
    try {
      subscription = AppState.addEventListener('change', nextAppState => {
        try {
          if (nextAppState === 'active' && user && user._id) {
            fetchUnreadCount();
          }
        } catch (error) {
          console.error('❌ [NotificationContext] Error in AppState handler:', error);
        }
      });
    } catch (error) {
      console.error('❌ [NotificationContext] Error setting up AppState listener:', error);
    }

    return () => {
      try {
        if (subscription && typeof subscription.remove === 'function') {
          subscription.remove();
        }
      } catch (error) {
        console.error('❌ [NotificationContext] Error removing AppState listener:', error);
      }
    };
  }, [user, fetchUnreadCount]);

  const markAsRead = () => {
    setHasUnreadNotifications(false);
  };

  const refreshUnreadCount = () => {
    fetchUnreadCount();
  };

  const handleNotificationDismiss = () => {
    setCurrentNotification(null);
  };

  const handleNotificationPress = (notification) => {
    setCurrentNotification(null);
    // Navigation will be handled by the component that has navigation context
  };

  const value = {
    hasUnreadNotifications,
    unreadCount,
    markAsRead,
    setHasUnreadNotifications,
    refreshUnreadCount,
    currentNotification,
    pendingNavigation,
    handleNotificationDismiss,
    handleNotificationPress,
    setPendingNavigation,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    return {
      hasUnreadNotifications: false,
      unreadCount: 0,
      markAsRead: () => { },
      setHasUnreadNotifications: () => { },
      refreshUnreadCount: () => { },
      currentNotification: null,
      pendingNavigation: null,
      handleNotificationDismiss: () => { },
      handleNotificationPress: () => { },
      setPendingNavigation: () => { },
    };
  }
  return context;
};

export default NotificationContext;

