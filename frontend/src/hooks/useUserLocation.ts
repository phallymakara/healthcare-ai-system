import { useState, useEffect, useCallback, useRef } from 'react';

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

const STORAGE_KEY = 'carequeue_user_location';

export interface UseUserLocationOptions {
  watch?: boolean;
  enableHighAccuracy?: boolean;
}

export const useUserLocation = (options: UseUserLocationOptions = {}) => {
  const { watch = true, enableHighAccuracy = true } = options;

  const [location, setLocation] = useState<UserLocation | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.latitude === 'number' && typeof parsed?.longitude === 'number') {
          return parsed;
        }
      }
    } catch {}
    return null;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRealTimeActive, setIsRealTimeActive] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const lastLocationRef = useRef<UserLocation | null>(location);

  const updateLocation = useCallback((pos: GeolocationPosition) => {
    const coords: UserLocation = {
      latitude: Number(pos.coords.latitude.toFixed(5)),
      longitude: Number(pos.coords.longitude.toFixed(5)),
      accuracy: Math.round(pos.coords.accuracy),
      timestamp: pos.timestamp || Date.now(),
    };

    // Prevent redundant state re-renders if movement is negligible (< ~8-10m)
    const last = lastLocationRef.current;
    if (
      last &&
      Math.abs(last.latitude - coords.latitude) < 0.00008 &&
      Math.abs(last.longitude - coords.longitude) < 0.00008
    ) {
      return;
    }

    lastLocationRef.current = coords;
    setLocation(coords);
    setLoading(false);
    setError(null);
    setIsRealTimeActive(true);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(coords));
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(coords));
    } catch {}
  }, []);

  const requestLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setLoading(true);
    setError(null);

    // Initial position fetch with graceful fallback to standard accuracy
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateLocation(pos);
      },
      (err) => {
        if (err.code === 3 || err.code === 2) {
          navigator.geolocation.getCurrentPosition(
            (fallbackPos) => {
              updateLocation(fallbackPos);
            },
            (err2) => {
              setLoading(false);
              setError(err2.message || 'Unable to retrieve location.');
            },
            {
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 120000,
            }
          );
          return;
        }
        setLoading(false);
        setError(err.message || 'Unable to retrieve location.');
      },
      {
        enableHighAccuracy,
        timeout: 8000,
        maximumAge: 20000,
      }
    );
  }, [enableHighAccuracy, updateLocation]);

  // Set up real-time watch and permission listeners
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      return;
    }

    // Always fetch fresh real-time coordinates on mount
    requestLocation();

    // Start continuous real-time watch if enabled
    if (watch) {
      try {
        const id = navigator.geolocation.watchPosition(
          (pos) => {
            updateLocation(pos);
          },
          (err) => {
            if (!lastLocationRef.current) {
              setError(err.message || 'Unable to stream location.');
            }
          },
          {
            enableHighAccuracy,
            timeout: 15000,
            maximumAge: 10000,
          }
        );
        watchIdRef.current = id;
        setIsRealTimeActive(true);
      } catch (e) {
        console.warn('Geolocation watchPosition failed:', e);
      }
    }

    // Listen to browser permission state changes
    let permStatus: PermissionStatus | null = null;
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((status) => {
          permStatus = status;
          status.onchange = () => {
            if (status.state === 'granted') {
              requestLocation();
            } else if (status.state === 'denied') {
              setIsRealTimeActive(false);
              setError('Location permission was denied.');
            }
          };
        })
        .catch(() => {});
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (permStatus) {
        permStatus.onchange = null;
      }
    };
  }, [watch, enableHighAccuracy, requestLocation, updateLocation]);

  return {
    location,
    loading,
    error,
    isRealTimeActive,
    requestLocation,
    hasLocation: location !== null,
  };
};

