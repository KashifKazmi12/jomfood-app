/**
 * App Navigator - Main Navigation Setup
 * 
 * CONCEPTS EXPLAINED:
 * 1. Stack Navigator: Screen-based navigation (push/pop screens)
 * 2. Tab Navigator: Bottom tab navigation
 * 3. NavigationContainer: Root container for all navigation
 * 4. Custom Tab Bar: Control which screens show bottom tabs
 * 
 * This file contains ALL navigation logic in one place for easy management
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Platform, TouchableOpacity, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Home, MapPin, User, ShoppingBag, ShoppingCart } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useNotifications } from '../context/NotificationContext';
import InAppNotificationBanner from '../components/InAppNotificationBanner';

// Screens
import HomeScreen from '../screens/HomeScreen';
import DealsScreen from '../screens/DealsScreen';
import MyDealsScreen from '../screens/MyDealsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import VerificationScreen from '../screens/VerificationScreen';
import SetPasswordScreen from '../screens/SetPasswordScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import DealDetailScreen from '../screens/DealDetailScreen';
import RestaurantDetailsScreen from '../screens/RestaurantDetailsScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import CartScreen from '../screens/CartScreen';
import CartPaymentStatusScreen from '../screens/CartPaymentStatusScreen';
import CartPaymentWebViewScreen from '../screens/CartPaymentWebViewScreen';

// Theme
import useThemeColors from '../theme/useThemeColors';
import useThemeTypography from '../theme/useThemeTypography';
import typography from '../constants/typography';
import BottomSafeArea from '../components/BottomSafeArea';
import { useCart } from '../context/CartContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

export const BottomNavigationSpace = 100;

function HeaderCartButton() {
  const navigation = useNavigation();
  const colors = useThemeColors();
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + Number(item.quantity || 1), 0);

  const handlePress = () => {
    navigation.getParent()?.navigate('Cart');
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={{ marginRight: 4, padding: 6 }}
      accessibilityLabel="Open cart"
      testID="deal-header-cart-button"
    >
      <View style={{ position: 'relative' }}>
        <ShoppingCart size={20} color={colors.primary} />
        {cartCount > 0 && (
          <View
            style={{
              position: 'absolute',
              top: -6,
              right: -8,
              minWidth: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: '#FE8100',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 4,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 10, fontFamily: typography.fontFamily.semiBold }}>
              {cartCount}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ==========================================
// BOTTOM TAB BAR COMPONENT
// ==========================================
// Wrapper component to add bottom safe area + tab bar padding to screens with bottom tabs
function withBottomSafeArea(Component) {
  return function WrappedComponent(props) {
    const insets = useSafeAreaInsets();
    return (
      <View style={{ flex: 1, paddingBottom: 0, backgroundColor: 'transparent' }} >
        {/* paddingBottom removed - navigation now floats over content */}
        {/* paddingBottom: insets.bottom + 100 - Uncomment to reserve space for navigation */}
        <Component  {...props} />
        <BottomSafeArea />
      </View>
    );
  };
}

// Custom Tab Bar Component with rounded corners and margins
function CustomTabBar({ state, descriptors, navigation }) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const insets = useSafeAreaInsets();
  const styles = getTabBarStyles(colors, typography, insets);

  return (

    <View style={styles.tabBarContainer}>
      {/* Custom background color behind navigation (only affects this area) */}
      <View style={styles.tabBarBackground} />
      <View style={[styles.tabBarWrapper, { backgroundColor: 'white' }]}>
        <View style={styles.tabBarContent}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

            // Skip rendering if tabBarButton is explicitly set to null (hidden tabs like DealDetail)
            if (options.tabBarButton === null || (typeof options.tabBarButton === 'function' && options.tabBarButton() === null)) {
              return null;
            }

            const getMainScreenForTab = (tabName) => {
              if (tabName === 'Home') return 'HomeMain';
              if (tabName === 'Deals') return 'DealsMain';
              if (tabName === 'MyDeals') return 'MyDealsMain';
              if (tabName === 'Profile') return 'ProfileMain';
              return undefined;
            };

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!event.defaultPrevented) {
                const mainScreen = getMainScreenForTab(route.name);
                if (mainScreen) {
                  // Always reset to each tab's root screen to avoid reopening stale detail pages.
                  navigation.navigate(route.name, { screen: mainScreen });
                } else {
                  navigation.navigate(route.name);
                }
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            const color = isFocused ? colors.primary : colors.textMuted;
            let Icon = Home;
            let label = t('navigation.home');

            if (route.name === 'Deals') {
              Icon = MapPin;
              label = t('navigation.nearMe');
            } else if (route.name === 'MyDeals') {
              Icon = ShoppingBag;
              label = t('navigation.myDeals');
            } else if (route.name === 'Profile') {
              Icon = User;
              label = t('navigation.profile');
            }

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.tabButton}
              >
                <Icon color={color} size={24} />
                <Text
                  style={[styles.tabLabel, { color }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.8}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ==========================================
// NESTED STACK FOR EACH TAB (gives each tab its own navigation stack)
// ==========================================
// Each tab gets its own Stack Navigator so screens can have top navigation + bottom tabs

// Home Stack
function HomeStackNavigator() {
  const colors = useThemeColors();
  const HomeStack = createNativeStackNavigator();

  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { color: colors.text },
        headerBackButtonDisplayMode: 'minimal',
        headerTransparent: false,
        headerShadowVisible: false,
      }}
    >
      <HomeStack.Screen
        name="HomeMain"
        component={withBottomSafeArea(HomeScreen)}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="DealDetail"
        component={withBottomSafeArea(DealDetailScreen)}
        options={{
          title: 'Deal',
          headerBackTitleVisible: false,
          headerRight: () => <HeaderCartButton />,
        }}
      />
      <HomeStack.Screen
        name="RestaurantDetails"
        component={withBottomSafeArea(RestaurantDetailsScreen)}
        options={{
          headerShown: false,
        }}
      />
    </HomeStack.Navigator>
  );
}

// Deals Stack
function DealsStackNavigator() {
  const colors = useThemeColors();
  const DealsStack = createNativeStackNavigator();

  return (
    <DealsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { color: colors.text },
        headerBackButtonDisplayMode: 'minimal',
        headerTransparent: false,
        headerShadowVisible: false,
      }}
    >
      <DealsStack.Screen
        name="DealsMain"
        component={withBottomSafeArea(DealsScreen)}
        options={{ headerShown: false }}
        initialParams={{ initialFilters: { sort_by: 'nearest' } }}
      />
      <DealsStack.Screen
        name="DealDetail"
        component={withBottomSafeArea(DealDetailScreen)}
        options={{
          title: 'Deal',
          headerBackTitleVisible: false,
          headerRight: () => <HeaderCartButton />,
        }}
      />
      <DealsStack.Screen
        name="RestaurantDetails"
        component={withBottomSafeArea(RestaurantDetailsScreen)}
        options={{
          headerShown: false,
        }}
      />
    </DealsStack.Navigator>
  );
}

// MyDeals Stack
function MyDealsStackNavigator() {
  const colors = useThemeColors();
  const MyDealsStack = createNativeStackNavigator();

  return (
    <MyDealsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { color: colors.text },
        headerBackButtonDisplayMode: 'minimal',
        headerTransparent: false,
        headerShadowVisible: false,
      }}
    >
      <MyDealsStack.Screen
        name="MyDealsMain"
        component={withBottomSafeArea(MyDealsScreen)}
        options={{ headerShown: false }}
      />
      <MyDealsStack.Screen
        name="DealDetail"
        component={withBottomSafeArea(DealDetailScreen)}
        options={{
          title: 'Deal',
          headerBackTitleVisible: false,
          headerRight: () => <HeaderCartButton />,
        }}
      />
      <MyDealsStack.Screen
        name="RestaurantDetails"
        component={withBottomSafeArea(RestaurantDetailsScreen)}
        options={{
          headerShown: false,
        }}
      />
    </MyDealsStack.Navigator>
  );
}

// Profile Stack
function ProfileStackNavigator() {
  const colors = useThemeColors();
  const ProfileStack = createNativeStackNavigator();

  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { color: colors.text },
        headerBackButtonDisplayMode: 'minimal',
        headerTransparent: false,
        headerShadowVisible: false,
      }}
    >
      <ProfileStack.Screen
        name="ProfileMain"
        component={withBottomSafeArea(ProfileScreen)}
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        name="DealDetail"
        component={withBottomSafeArea(DealDetailScreen)}
        options={{
          title: 'Deal',
          headerBackTitleVisible: false,
          headerRight: () => <HeaderCartButton />,
        }}
      />
      <ProfileStack.Screen
        name="RestaurantDetails"
        component={withBottomSafeArea(RestaurantDetailsScreen)}
        options={{
          headerShown: false,
        }}
      />
    </ProfileStack.Navigator>
  );
}

// ==========================================
// TAB NAVIGATOR (Bottom Tabs with Nested Stacks)
// ==========================================
function RootTabsWithStack() {
  const colors = useThemeColors();

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      detachInactiveScreens={true}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          height: 0,
          elevation: 0,
          shadowOpacity: 0,
          borderTopWidth: 0,
          backgroundColor: 'transparent',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="Deals"
        component={DealsStackNavigator}
        options={{ tabBarLabel: 'Near Me' }}
      />
      <Tab.Screen
        name="MyDeals"
        component={MyDealsStackNavigator}
        options={{ tabBarLabel: 'My Deals' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

// ==========================================
// MAIN STACK NAVIGATOR (All Screens)
// ==========================================

export default function AppNavigator() {
  const colors = useThemeColors();
  const typography = useThemeTypography();

  return (
    <NavigationContainer
      theme={{
        dark: false,
        colors: {
          primary: colors.primary,
          background: 'transparent',
          card: 'transparent',
          text: colors.text,
          border: 'transparent',
          notification: colors.primary,
        },
        fonts: {
          regular: {
            fontFamily: typography.fontFamily.regular,
            fontWeight: '400',
          },
          medium: {
            fontFamily: typography.fontFamily.medium,
            fontWeight: '500',
          },
          bold: {
            fontFamily: typography.fontFamily.bold,
            fontWeight: '700',
          },
          heavy: {
            fontFamily: typography.fontFamily.bold,
            fontWeight: '900',
          },
        },
      }}
    >
      <AppNavigatorContent />
    </NavigationContainer>
  );
}

function AppNavigatorContent() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { currentNotification, pendingNavigation, handleNotificationDismiss, setPendingNavigation } = useNotifications();

  // Handle navigation when app opens from notification (closed/background state)
  useEffect(() => {
    if (pendingNavigation) {
      console.log('🔔 [AppNavigator] Handling pending navigation:', JSON.stringify(pendingNavigation, null, 2));

      const notificationData = pendingNavigation?.data || pendingNavigation;
      const type = notificationData?.type || notificationData?.notificationType || pendingNavigation?.type;
      const dealId = notificationData?.dealId || notificationData?.deal_id || pendingNavigation?.dealId || pendingNavigation?.deal_id;

      console.log('🔍 [AppNavigator] Pending navigation check:', {
        type,
        dealId,
        hasType: !!type,
        hasDealId: !!dealId,
        notificationDataKeys: Object.keys(notificationData || {}),
        pendingNavigationKeys: Object.keys(pendingNavigation || {}),
      });

      // Small delay to ensure navigation is ready
      const timer = setTimeout(() => {
        try {
          if (type === 'deal' && dealId) {
            console.log('🚀 [AppNavigator] Navigating to DealDetail with dealId:', dealId);
            try {
              // Check if navigation is available
              if (navigation && typeof navigation.navigate === 'function') {
                navigation.navigate('RootTabs', {
                  screen: 'Home',
                  params: {
                    screen: 'DealDetail',
                    params: { id: dealId },
                  },
                });
                console.log('✅ [AppNavigator] Pending navigation successful');
              } else {
                console.warn('⚠️ [AppNavigator] Navigation not available');
              }
            } catch (navError) {
              console.error('❌ [AppNavigator] Pending navigation error:', navError);
              // Fallback: navigate to notifications screen
              try {
                if (navigation && typeof navigation.navigate === 'function') {
                  navigation.navigate('Notifications');
                }
              } catch (fallbackError) {
                console.error('❌ [AppNavigator] Fallback navigation also failed:', fallbackError);
              }
            }
          } else {
            console.log('📋 [AppNavigator] No deal type or dealId, navigating to Notifications screen');
            try {
              if (navigation && typeof navigation.navigate === 'function') {
                navigation.navigate('Notifications');
              }
            } catch (navError) {
              console.error('❌ [AppNavigator] Navigation to Notifications failed:', navError);
            }
          }
        } catch (error) {
          console.error('❌ [AppNavigator] Error in pending navigation handler:', error);
        } finally {
          // Clear pending navigation after handling
          setPendingNavigation(null);
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [pendingNavigation, navigation, setPendingNavigation]);

  const handleNotificationPress = (notification) => {
    console.log('🔔 [AppNavigator] Notification banner clicked:', JSON.stringify(notification, null, 2));

    handleNotificationDismiss();

    // Check notification type and navigate accordingly
    // For push notifications, data is in notification.data
    // For API notifications, data might be directly on notification object
    const notificationData = notification?.data || notification;
    const type = notificationData?.type || notificationData?.notificationType || notification?.type;
    const dealId = notificationData?.dealId || notificationData?.deal_id || notification?.dealId || notification?.deal_id;

    console.log('🔍 [AppNavigator] Navigation check:', {
      type,
      dealId,
      hasType: !!type,
      hasDealId: !!dealId,
      notificationDataKeys: Object.keys(notificationData || {}),
      notificationKeys: Object.keys(notification || {}),
    });

    try {
      if (type === 'deal' && dealId) {
        console.log('🚀 [AppNavigator] Navigating to DealDetail with dealId:', dealId);
        try {
          // Check if navigation is available
          if (navigation && typeof navigation.navigate === 'function') {
            navigation.navigate('RootTabs', {
              screen: 'Home',
              params: {
                screen: 'DealDetail',
                params: { id: dealId },
              },
            });
            console.log('✅ [AppNavigator] Navigation successful');
          } else {
            console.warn('⚠️ [AppNavigator] Navigation not available');
          }
        } catch (navError) {
          console.error('❌ [AppNavigator] Navigation error:', navError);
          // Fallback: navigate to notifications screen
          try {
            if (navigation && typeof navigation.navigate === 'function') {
              navigation.navigate('Notifications');
            }
          } catch (fallbackError) {
            console.error('❌ [AppNavigator] Fallback navigation also failed:', fallbackError);
          }
        }
      } else {
        console.log('📋 [AppNavigator] No deal type or dealId, navigating to Notifications screen');
        try {
          if (navigation && typeof navigation.navigate === 'function') {
            navigation.navigate('Notifications');
          }
        } catch (navError) {
          console.error('❌ [AppNavigator] Navigation to Notifications failed:', navError);
        }
      }
    } catch (error) {
      console.error('❌ [AppNavigator] Error in notification press handler:', error);
    }
  };

  return (
    <>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            color: colors.text,
          },
          headerBackButtonDisplayMode: 'minimal',
          headerTransparent: false,
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: colors.surface,
            paddingBottom: insets.bottom, // Apply bottom safe area to ALL stack screens
          },
        }}
      >
        {/* ==========================================
            SCREENS WITH BOTTOM TAB NAVIGATION
            ========================================== */}

        {/* Root Tabs (Home, Deals, MyDeals, Profile + DealDetail) - HAS BOTTOM TABS */}
        <Stack.Screen
          name="RootTabs"
          component={RootTabsWithStack}
          options={{
            headerShown: false,
            contentStyle: {
              backgroundColor: 'transparent',
            },
            animation: 'none', // Prevent animation issues with transparent background
          }}
        />

        {/* ==========================================
            SCREENS WITHOUT BOTTOM TAB NAVIGATION
            ========================================== */}

        {/* Login Screen - NO BOTTOM TABS */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            title: 'Login',
            headerBackTitleVisible: false, // iOS: Hide "Back" text
          }}
        />

        {/* Signup Screen - NO BOTTOM TABS */}
        <Stack.Screen
          name="Signup"
          component={SignupScreen}
          options={{
            title: 'SignUp',
            headerBackTitleVisible: false,
          }}
        />

        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPasswordScreen}
          options={{
            title: 'Forgot Password',
            headerBackTitleVisible: false,
          }}
        />

        {/* Verification Screen - NO BOTTOM TABS */}
        <Stack.Screen
          name="Verification"
          component={VerificationScreen}
          options={{
            headerShown: false,
          }}
        />

        {/* Set Password Screen - NO BOTTOM TABS */}
        <Stack.Screen
          name="SetPassword"
          component={SetPasswordScreen}
          options={{
            headerShown: false,
          }}
        />

        {/* Privacy Policy Screen - NO BOTTOM TABS */}
        <Stack.Screen
          name="PrivacyPolicy"
          component={PrivacyPolicyScreen}
          options={{
            title: 'Privacy Policy',
            headerBackTitleVisible: false,
          }}
        />

        {/* Notifications Screen - NO BOTTOM TABS */}
        <Stack.Screen
          name="Notifications"
          component={NotificationsScreen}
          options={{
            title: t('notifications.notifications'),
            headerBackTitleVisible: false,
          }}
        />
        <Stack.Screen
          name="Cart"
          component={CartScreen}
          options={{
            title: t('cart.title', 'Your Cart'),
            headerBackTitleVisible: false,
          }}
        />
        <Stack.Screen
          name="CartPaymentStatus"
          component={CartPaymentStatusScreen}
          options={{
            title: t('cart.paymentProcessing', 'Payment'),
            headerBackTitleVisible: false,
          }}
        />
        <Stack.Screen
          name="CartPaymentWebView"
          component={CartPaymentWebViewScreen}
          options={{
            title: t('cart.paymentProcessing', 'Payment'),
            headerBackTitleVisible: false,
          }}
        />

        {/* ==========================================
            FLEXIBLE NAVIGATION STRUCTURE:
            
            Each tab has its own Stack Navigator for maximum flexibility:
            
            ✅ TAB MAIN SCREENS (Home, Deals, MyDeals, Profile):
            - No top header (headerShown: false)
            - Bottom navigation visible
            - Custom headers via components
            
            ✅ TAB DETAIL SCREENS (DealDetail accessible from any tab):
            - Top header with back button (headerShown: true)
            - Bottom navigation still visible
            - Can navigate to DealDetail from any tab
            - Back button returns to the tab you came from
            
            ❌ NON-TAB SCREENS (Login, Signup):
            - Pure stack screens (no bottom tabs)
            - Standard top navigation
            
            TO ADD A SCREEN WITH TOP + BOTTOM NAVIGATION:
            - Add it to the relevant Stack Navigator (e.g., HomeStackNavigator)
            - It will automatically get top header + bottom tabs
            
            CURRENT STRUCTURE:
            📱 Home → [HomeMain, DealDetail]
            📱 Deals → [DealsMain, DealDetail]
            📱 MyDeals → [MyDealsMain, DealDetail]
            📱 Profile → [ProfileMain, DealDetail]
            🔐 Login, Signup (no tabs)
            ========================================== */}
      </Stack.Navigator>
      <InAppNotificationBanner
        notification={currentNotification}
        onDismiss={handleNotificationDismiss}
        onPress={() => handleNotificationPress(currentNotification)}
      />
    </>
  );
}

// ==========================================
// STYLES FOR BOTTOM TAB BAR
// ==========================================
const getTabBarStyles = (colors, typography, insets) => StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 12),
    paddingTop: 140,
    backgroundColor: 'transparent',
  },
  // Custom background behind the navigation bar (change this color only)
  tabBarBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100, // Covers area behind navigation
    backgroundColor: 'transparent', // Transparent - gradient shows through
    // backgroundColor: 'rgba(254,129,0,0.2)', // Uncomment for cream/orange color
    // backgroundColor: '#FFF8F0', // Uncomment for solid light cream
  },
  tabBarWrapper: {
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  tabBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    marginTop: 4,
    textAlign: 'center',
    maxWidth: '100%',
  },
});
