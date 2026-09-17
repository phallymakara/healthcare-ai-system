import { useState, useEffect, useCallback } from 'react';

export interface UserLocation {
  latitude: number;
  longitude: number;
}

const STORAGE_KEY = 'carequeue_user_location';

export const useUserLocation = () => {
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

  const requestLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setLoading(true);
    setError(null);

    const saveCoords = (pos: GeolocationPosition) => {
      const coords: UserLocation = {
        latitude: Number(pos.coords.latitude.toFixed(5)),
        longitude: Number(pos.coords.longitude.toFixed(5)),
      };
      setLocation(coords);
      setLoading(false);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(coords));
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(coords));
      } catch {}
    };

    navigator.geolocation.getCurrentPosition(
      saveCoords,
      (err) => {
        // If high accuracy timed out or failed on mobile/simulator, retry once with standard accuracy
        if (err.code === 3 || err.code === 2) {
          navigator.geolocation.getCurrentPosition(
            saveCoords,
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
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000,
      }
    );
  }, []);

  // Request automatically on first load if not cached
  useEffect(() => {
    if (!location) {
      requestLocation();
    }
  }, [location, requestLocation]);

  return {
    location,
    loading,
    error,
    requestLocation,
    hasLocation: location !== null,
  };
};
