// Custom Hooks - Reusable logic hooks
import { useState, useEffect, useCallback, useRef } from 'react';
import { Keyboard, Dimensions, Animated } from 'react-native';
import { storage } from '../services/storage';
import { StorageKeys } from '../services/storage';
import { useColors, useSpacing } from '../hooks/useTheme';

// Debounce hook
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Local storage hook
export function useStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = storage.get(key);
      return item !== null ? item : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = async (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      await storage.set(key, valueToStore);
    } catch (error) {
      console.warn(`Error setting storage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

// JSON storage hook
export function useStorageJSON(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      return storage.getJSON(key, initialValue);
    } catch {
      return initialValue;
    }
  });

  const setValue = async (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      await storage.setJSON(key, valueToStore);
    } catch (error) {
      console.warn(`Error setting storage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

// Async storage hook with loading state
export function useAsyncStorage(key, initialValue) {
  const [value, setValue] = useState(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    storage.getJSON(key).then(result => {
      if (mounted) {
        setValue(result !== null ? result : initialValue);
        setLoading(false);
      }
    }).catch(err => {
      if (mounted) {
        setError(err);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [key]);

  const setStoredValue = async (newValue) => {
    try {
      const valueToStore = newValue instanceof Function ? newValue(value) : newValue;
      setValue(valueToStore);
      await storage.setJSON(key, valueToStore);
    } catch (err) {
      setError(err);
    }
  };

  return [value, setStoredValue, loading, error];
}

// Prayer times hook
export function usePrayerTimes(city = 'Islamabad', country = 'Pakistan') {
  const [timings, setTimings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nextPrayer, setNextPrayer] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchPrayerTimes = async () => {
      try {
        // Try cache first
        const cached = await storage.getWithTimestamp(
          StorageKeys.PRAYER_TIMINGS,
          3600000 // 1 hour
        );

        if (cached && mounted) {
          setTimings(cached);
          setLoading(false);
          return;
        }

        const { prayerApi } = await import('../services/api');
        const data = await prayerApi.getTimingsByCity(city, country);

        if (mounted) {
          setTimings(data.timings);
          await storage.setWithTimestamp(StorageKeys.PRAYER_TIMINGS, data.timings);
        }
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchPrayerTimes();
    return () => { mounted = false; };
  }, [city, country]);

  // Calculate next prayer
  useEffect(() => {
    if (!timings) return;

    const updateNextPrayer = () => {
      const now = new Date();
      const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
      let next = null;

      for (const prayer of prayers) {
        const [h, m] = timings[prayer].split(':').map(Number);
        const prayerTime = new Date();
        prayerTime.setHours(h, m, 0, 0);

        if (prayerTime > now) {
          next = { name: prayer, time: timings[prayer] };
          break;
        }
      }

      if (!next) {
        const [h, m] = timings.Fajr.split(':').map(Number);
        const fajr = new Date();
        fajr.setDate(fajr.getDate() + 1);
        fajr.setHours(h, m, 0, 0);
        next = { name: 'Fajr', time: timings.Fajr };
      }

      const diff = next ? new Date().setHours(...next.time.split(':').map(Number), 0, 0) - Date.now() : 0;
      setNextPrayer({
        ...next,
        remaining: diff > 0 ? formatDuration(diff) : '00:00:00',
      });
    };

    updateNextPrayer();
    const interval = setInterval(updateNextPrayer, 1000);
    return () => clearInterval(interval);
  }, [timings]);

  return { timings, loading, error, nextPrayer };
}

function formatDuration(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(total / 3600)).padStart(2, '0');
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// Keyboard hook
export function useKeyboard() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setVisible(true);
    });

    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
      setVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return { keyboardHeight, visible };
}

// Network status hook
export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        await fetch('https://www.google.com', { method: 'HEAD', cache: 'no-cache' });
        setIsConnected(true);
      } catch {
        setIsConnected(false);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  return isConnected;
}

// Orientation hook
export function useOrientation() {
  const [orientation, setOrientation] = useState('portrait');

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setOrientation(window.width > window.height ? 'landscape' : 'portrait');
    });

    return () => subscription?.remove();
  }, []);

  return orientation;
}

// Safe area hook - returns default insets (use react-native-safe-area-context for real insets)
export function useSafeArea() {
  return { top: 0, bottom: 0, left: 0, right: 0 };
}

// Animation hook
export function useAnimation(initialValue = 0) {
  const anim = useRef(new Animated.Value(initialValue)).current;
  return anim;
}

// Intersection observer hook (for web)
export function useIntersectionObserver(options = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [options]);

  return [elementRef, isIntersecting];
}

// Previous value hook
export function usePrevious(value) {
  const ref = useRef();
  useEffect(() => { ref.current = value; }, [value]);
  return ref.current;
}

// Toggle hook
export function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);
  const toggle = useCallback(() => setValue(v => !v), []);
  return [value, toggle, setValue];
}

// Counter hook
export function useCounter(initialValue = 0, step = 1) {
  const [count, setCount] = useState(initialValue);
  const increment = useCallback(() => setCount(c => c + step), [step]);
  const decrement = useCallback(() => setCount(c => c - step), [step]);
  const reset = useCallback(() => setCount(initialValue), [initialValue]);
  return { count, increment, decrement, reset, setCount };
}