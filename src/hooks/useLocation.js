/**
 * useLocation Hook - Get Real-time GPS Location
 * 
 * Fetches current device location using GPS
 * Returns: { latitude, longitude, loading, error }
 */

import { useState, useEffect } from 'react';
import Geolocation from '@react-native-community/geolocation';

export default function useLocation() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const getLocation = async () => {
      try {
        console.log('📍 [useLocation] Starting location request...');
        setLoading(true);
        setError(null);

        // Request location permission and get current position
        Geolocation.getCurrentPosition(
          (position) => {
            if (isMounted) {
              const locationData = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              };
              console.log('✅ [useLocation] Location retrieved successfully:', locationData);
              setLocation(locationData);
              setLoading(false);
            }
          },
          (err) => {
            if (isMounted) {
              if (err.code === 1) {
                // 1 = PERMISSION_DENIED
                console.log('❌ [useLocation] Location permission denied by user');
              } else if (err.code === 3) {
                // 3 = TIMEOUT (common on emulators)
                console.log('⏱️ [useLocation] Location request timed out (common on emulators - location will work on real device)');
              } else {
                console.warn('⚠️ [useLocation] Location error:', {
                  code: err.code,
                  message: err.message
                });
                setError(err.message || 'Failed to get location');
              }
              setLoading(false);
            }
          },
          {
            enableHighAccuracy: true, // Use high accuracy to get mock location
            timeout: 30000, // Increased timeout for emulator
            maximumAge: 0, // Don't use cached location, always get fresh
          }
        );
      } catch (error) {
        if (isMounted) {
          console.error('❌ [useLocation] Location hook error:', error);
          setLoading(false);
        }
      }
    };

    getLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  return { location, loading, error };
}

