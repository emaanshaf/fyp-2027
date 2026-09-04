import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { MIN_LOCATION_ACCURACY_M } from '../utils/qibla';

/**
 * @typedef {Object} UserLocationState
 * @property {number|null} latitude
 * @property {number|null} longitude
 * @property {number|null} accuracy - horizontal accuracy in metres, per
 *   expo-location. Lower is better.
 * @property {'idle'|'requesting'|'granted'|'denied'} permissionStatus
 * @property {boolean} loading
 * @property {string|null} error - a message safe to show the user, or null.
 * @property {boolean} isAccuracyPoor - true once a fix exists and it is
 *   looser than MIN_LOCATION_ACCURACY_M. Callers should warn rather than
 *   present the result as precise.
 * @property {() => Promise<void>} refresh - re-requests permission (if
 *   needed) and re-reads the position.
 */

/**
 * The device's current GPS position, with permission and accuracy handled
 * explicitly rather than left for each screen to reinvent.
 *
 * Nothing here calculates a bearing — a screen with no valid fix has no
 * honest direction to show, so callers should gate on `latitude !== null`
 * (or the convenience `loading`/`error` flags) before doing that maths.
 *
 * @returns {UserLocationState}
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

  const refresh = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      setState(s => ({ ...s, permissionStatus: 'requesting' }));
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setState(s => ({
          ...s,
          permissionStatus: 'denied',
          loading: false,
          error: 'Location permission is needed to work out the Qibla from where you are.',
        }));
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setState({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy ?? null,
        permissionStatus: 'granted',
        loading: false,
        error: null,
      });
    } catch (e) {
      setState(s => ({
        ...s,
        loading: false,
        error: e?.message || 'Could not read your location.',
      }));
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const isAccuracyPoor = state.accuracy !== null && state.accuracy > MIN_LOCATION_ACCURACY_M;

  return { ...state, isAccuracyPoor, refresh };
}

export default useUserLocation;
