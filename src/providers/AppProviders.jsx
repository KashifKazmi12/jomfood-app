import React, { useEffect, useState } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { AppState } from 'react-native';
import { store } from '../store/store';
import Toast from 'react-native-toast-message';
import api from '../api/client';
import { authStorage } from '../utils/authStorage';
import { setUser, clearUser, setLoading } from '../store/slices/authSlice';
import { NotificationProvider } from '../context/NotificationContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
    },
  },
});

// Bridge React Native AppState to React Query focusManager
focusManager.setEventListener(handleFocus => {
  const subscription = AppState.addEventListener('change', state => {
    handleFocus(state === 'active');
  });
  return () => subscription.remove();
});

export default function AppProviders({ children }) {
  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          <AuthBootstrap />
          {children}
        </NotificationProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
}

function AuthBootstrap() {
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      try {
        // If there is an access token, attempt to load current user
        const token = await authStorage.getAccessToken();
        if (token) {
          store.dispatch(setLoading(true));
          try {
            const meResponse = await api.get('/auth/customer/me');
            const isInvalid = meResponse?.status === false || meResponse?.token === 'expired';
            if (isInvalid) {
              throw new Error(meResponse?.message || 'Unauthorized');
            }
            const user = meResponse?.user || meResponse?.data?.user || meResponse?.data || meResponse || null;
            if (isMounted && user) {
              store.dispatch(setUser(user));
            } else if (isMounted) {
              store.dispatch(clearUser());
            }
          } catch (e) {
            // If /me fails, clear tokens
            await authStorage.clearAll();
            if (isMounted) store.dispatch(clearUser());
          } finally {
            if (isMounted) store.dispatch(setLoading(false));
          }
        } else {
          if (isMounted) store.dispatch(clearUser());
        }
      } finally {
        if (isMounted) setBootstrapped(true);
      }
    };
    run();
    return () => {
      isMounted = false;
    };
  }, []);

  // Could render a splash/loading screen until bootstrapped
  return null;
}


