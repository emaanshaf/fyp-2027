import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { smoothAngle, compassAccuracyLevel } from '../utils/qibla';

/**
 * @typedef {Object} DeviceHeadingState
 * @property {number|null} heading - smoothed heading in degrees, [0, 360),
 *   relative to TRUE north whenever the platform can supply it (see below).
 *   null when no compass is available (most browsers, some tablets/iPads
 *   with no magnetometer) — callers must not invent a value in that case.
 * @property {boolean} isTrueNorth - whether `heading` is already
 *   declination-corrected true north (see the note below) rather than raw
 *   magnetic north.
 * @property {number|null} rawAccuracy - the platform's own accuracy field,
 *   unconverted. Meaning differs by platform; use `accuracyLevel` for a
 *   comparable value.
 * @property {'unknown'|'low'|'medium'|'high'} accuracyLevel
 * @property {boolean} available - false once a subscription attempt has
 *   failed (no sensor / permission refused), so the UI can degrade instead
 *   of waiting forever.
 */

/**
 * The device's compass heading, corrected for true north where the platform
 * supports it, and smoothed against sensor jitter.
 *
 * True north vs magnetic north
 * -----------------------------
 * A magnetometer measures magnetic north, which differs from true (geographic)
 * north by the local magnetic declination — worth 10-20+ degrees in much of
 * the world, and the Qibla bearing (calculateQiblaBearing) is computed
 * relative to TRUE north, not magnetic. Getting this wrong is not a rounding
 * error, it is pointing the wrong way.
 *
 * Rather than shipping a declination model or calling an external service
 * (both duplicate work the OS already does, and the latter would mean a
 * network dependency and a would-be API key for a value the device already
 * knows from its own location fix), this hook uses expo-location's
 * `watchHeadingAsync`, whose `trueHeading` field is the OS's own
 * declination-corrected reading (iOS: CLHeading.trueHeading; Android:
 * GeomagneticField-corrected). That is preferred whenever it is valid.
 * `magHeading` (raw magnetic) is used only as a fallback when the platform
 * cannot supply a true heading for the current fix (trueHeading === -1),
 * and `isTrueNorth` tells the caller which case it got so the UI can be
 * honest about it rather than silently treating the two as equivalent.
 *
 * Smoothing
 * ---------
 * Raw sensor events jitter by a few degrees between reads and jump across
 * the 359->0 seam; every event is folded through smoothAngle() (an
 * angle-aware exponential moving average) before being published, so the
 * UI arrow eases rather than snaps, and never sweeps the "wrong way" around
 * the dial when crossing north.
 *
 * @returns {DeviceHeadingState}
 */
export function useDeviceHeading() {
  const [state, setState] = useState({
    heading: null,
    isTrueNorth: false,
    rawAccuracy: null,
    accuracyLevel: 'unknown',
    available: true,
  });

  // The running smoothed value lives in a ref, not state: sensor events can
  // arrive several times a second, and reading last-state-via-closure from
  // inside the subscription callback would race with React's batching.
  const smoothedRef = useRef(null);
  const lastPublishRef = useRef(0);

  useEffect(() => {
    let sub = null;
    let cancelled = false;

    (async () => {
      try {
        sub = await Location.watchHeadingAsync(h => {
          if (cancelled) return;

          const hasTrue = typeof h.trueHeading === 'number' && h.trueHeading >= 0;
          const raw = hasTrue ? h.trueHeading : h.magHeading;
          if (typeof raw !== 'number' || raw < 0) return;

          smoothedRef.current = smoothAngle(smoothedRef.current, raw);

          // Publishing on every event is unnecessary re-render churn for a
          // value the eye can't resolve past ~1deg anyway; a light time
          // gate keeps updates responsive (well above perceptible lag)
          // while cutting render volume during a fast sensor stream.
          const now = Date.now();
          if (now - lastPublishRef.current < 50) return;
          lastPublishRef.current = now;

          setState({
            heading: smoothedRef.current,
            isTrueNorth: hasTrue,
            rawAccuracy: typeof h.accuracy === 'number' ? h.accuracy : null,
            accuracyLevel: compassAccuracyLevel(h.accuracy, Platform.OS),
            available: true,
          });
        });
      } catch {
        // No compass on this device (common on the web, some tablets).
        if (!cancelled) setState(s => ({ ...s, available: false, heading: null }));
      }
    })();

    return () => {
      cancelled = true;
      sub?.remove?.();
    };
  }, []);

  return state;
}

export default useDeviceHeading;
