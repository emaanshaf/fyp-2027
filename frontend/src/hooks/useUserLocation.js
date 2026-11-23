
import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { MIN_LOCATION_ACCURACY_M } from '../utils/qibla';

/**
 * @typedef {Object} UserLocationState
 * @property {number|null} latitude
 * @property {number|null} longitude
 * @property {number|null} accuracy
 * @property {'idle'|'requesting'|'granted'|'denied'} permissionStatus
 * @property {boolean} loading
 * @property {string|null} error
 * @property {boolean} isAccuracyPoor
 * @property {() => Promise<void>} refresh
 */

export function useUserLocation() {
  const [state, setState] = useState({
    latitude: null,
    longitude: null,
    accuracy: null,
    permissionStatus: 'idle',
    loading: true,
    error: null,
  });

  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    if (mounted.current) {
      setState(s => ({
        ...s,
        loading: true,
        error: null,
      }));
    }

    try {
      // 1. Check existing permission
      let permission = await Location.getForegroundPermissionsAsync();

      // 2. Request permission if not already granted
      if (!permission.granted) {
        permission = await Location.requestForegroundPermissionsAsync();
      }

      if (!permission.granted) {
        if (mounted.current) {
          setState(s => ({
            ...s,
            permissionStatus: 'denied',
            loading: false,
            error:
              'Location permission is needed to work out the Qibla from where you are.',
          }));
        }
        return;
      }

      if (mounted.current) {
        setState(s => ({
          ...s,
          permissionStatus: 'granted',
          error: null,
        }));
      }

      // 3. Check whether location services are enabled
      const servicesEnabled =
        await Location.hasServicesEnabledAsync();

      if (!servicesEnabled) {
        throw new Error(
          'Your phone location services are turned off. Please turn on GPS.'
        );
      }

      // 4. Try obtaining a fresh high-accuracy GPS position
      let pos = null;

      try {
        pos = await Promise.race([
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          }),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error('GPS request timed out')),
              15000
            )
          ),
        ]);
      } catch (gpsError) {
        console.log('Fresh GPS failed:', gpsError.message);

        // 5. Try last known position if fresh GPS fails
        pos = await Location.getLastKnownPositionAsync({
          maxAge: 120000,
          requiredAccuracy: 1000,
        });
      }

      if (!pos || !pos.coords) {
        throw new Error(
          'GPS could not find your location. Move near a window or outdoors and try again.'
        );
      }

      // 6. Validate coordinates
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const acc = pos.coords.accuracy ?? null;

      if (
        typeof lat !== 'number' ||
        typeof lon !== 'number' ||
        !Number.isFinite(lat) ||
        !Number.isFinite(lon) ||
        lat < -90 ||
        lat > 90 ||
        lon < -180 ||
        lon > 180
      ) {
        throw new Error('GPS returned invalid coordinates.');
      }

      // 7. Save valid coordinates
      if (mounted.current) {
        setState({
          latitude: lat,
          longitude: lon,
          accuracy: acc,
          permissionStatus: 'granted',
          loading: false,
          error: null,
        });
      }
    } catch (e) {
      console.error('Qibla location error:', e);

      if (mounted.current) {
        setState(s => ({
          ...s,
          loading: false,
          error:
            e?.message ||
            'Could not read your location. Please try again.',
        }));
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;

    refresh();

    return () => {
      mounted.current = false;
    };
  }, [refresh]);

  const isAccuracyPoor =
    state.accuracy !== null &&
    state.accuracy > MIN_LOCATION_ACCURACY_M;

  return {
    ...state,
    isAccuracyPoor,
    refresh,
    locate: refresh,
  };
}

export default useUserLocation;
