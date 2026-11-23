import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Easing,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Line, Path, G, Text as SvgText } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

import { useColors, useGlobalStyles, useThemedStyles } from '../theme';
import { useUserLocation } from '../hooks/useUserLocation';
import { useDeviceHeading } from '../hooks/useDeviceHeading';
import { getSavedPrayerCity, geocodeCity } from '../services/geocode';

import {
  qiblaBearing,
  distanceToKaaba,
  relativeAngle,
  compassPoint,
  alignment,
} from '../utils/qibla';

const DIAL = 260;

// --------------------------------------------------
// VALIDATE LOCATION
// --------------------------------------------------

function isValidPosition(latitude, longitude) {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

// --------------------------------------------------
// COMPASS DIAL
// --------------------------------------------------

function Dial({ heading, bearing, aligned }) {
  const COLORS = useColors();

  const c = DIAL / 2;
  const r = c - 14;

  const ticks = [];

  for (let deg = 0; deg < 360; deg += 15) {
    const major = deg % 45 === 0;

    const a = ((deg - heading) * Math.PI) / 180;

    const outer = r;
    const inner = r - (major ? 14 : 7);

    ticks.push(
      <Line
        key={deg}
        x1={c + outer * Math.sin(a)}
        y1={c - outer * Math.cos(a)}
        x2={c + inner * Math.sin(a)}
        y2={c - inner * Math.cos(a)}
        stroke={major ? COLORS.textSecondary : COLORS.divider}
        strokeWidth={major ? 1.6 : 1}
      />
    );
  }

  const cardinals = [['N', 0], ['E', 90], ['S', 180], ['W', 270]].map(
    ([label, deg]) => {
      const a = ((deg - heading) * Math.PI) / 180;
      const rr = r - 30;

      return (
        <SvgText
          key={label}
          x={c + rr * Math.sin(a)}
          y={c - rr * Math.cos(a) + 5}
          fontSize="14"
          fontWeight="800"
          textAnchor="middle"
          fill={label === 'N' ? COLORS.red : COLORS.textSecondary}
        >
          {label}
        </SvgText>
      );
    }
  );

  const qa = ((bearing - heading) * Math.PI) / 180;

  const qx = c + (r - 4) * Math.sin(qa);
  const qy = c - (r - 4) * Math.cos(qa);

  const accent = aligned ? COLORS.emerald : COLORS.gold;

  return (
    <Svg width={DIAL} height={DIAL}>
      <Circle
        cx={c}
        cy={c}
        r={r}
        stroke={COLORS.glassBorder}
        strokeWidth="1.5"
        fill="none"
      />

      <Circle
        cx={c}
        cy={c}
        r={r - 44}
        stroke={COLORS.divider}
        strokeWidth="1"
        fill="none"
      />

      <G>{ticks}</G>
      <G>{cardinals}</G>

      {/* Qibla direction */}
      <Line
        x1={c}
        y1={c}
        x2={qx}
        y2={qy}
        stroke={accent}
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      <Circle cx={qx} cy={qy} r="15" fill={accent} />

      <Path
        d={`M ${qx - 6} ${qy + 5} L ${qx - 6} ${qy - 3} L ${qx} ${qy - 7} L ${qx + 6} ${qy - 3} L ${qx + 6} ${qy + 5} Z`}
        fill={COLORS.bg}
      />

      {/* North indicator */}
      <Line
        x1={c}
        y1={c - r + 6}
        x2={c}
        y2={c - r + 22}
        stroke={COLORS.cyan}
        strokeWidth="3"
        strokeLinecap="round"
      />

      <Circle cx={c} cy={c} r="5" fill={accent} />
    </Svg>
  );
}

// --------------------------------------------------
// MAIN SCREEN
// --------------------------------------------------

export default function QiblaFinderScreen() {
  const COLORS = useColors();
  const globalStyles = useGlobalStyles();
  const styles = useThemedStyles(makeStyles);

  const {
    latitude,
    longitude,
    accuracy: gpsAccuracy,
    loading: locLoading,
    error: locError,
    permissionStatus,
    isAccuracyPoor: isGpsAccuracyPoor,
    refresh: locate,
  } = useUserLocation();

  const {
    heading,
    isTrueNorth,
    accuracyLevel: compassAccuracyLevel,
    available: compassAvailable,
  } = useDeviceHeading();

  const wasAligned = useRef(false);
  const pulse = useRef(new Animated.Value(0)).current;

  const [savedCity, setSavedCity] = useState(null);
  const [cityPlace, setCityPlace] = useState(null);

  const [cityLoading, setCityLoading] = useState(false);
  const [cityError, setCityError] = useState(null);

  const [retrying, setRetrying] = useState(false);

  // --------------------------------------------------
  // SAVED CITY
  // --------------------------------------------------

  useEffect(() => {
    let mounted = true;

    getSavedPrayerCity()
      .then((city) => {
        if (mounted) setSavedCity(city);
      })
      .catch((error) => {
        console.warn('Saved city error:', error?.message);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // --------------------------------------------------
  // GPS VALIDATION
  // --------------------------------------------------

  const gpsFix = isValidPosition(latitude, longitude);

  // Real GPS is always preferred.
  // Saved city is used only when GPS is unavailable.

  const place = gpsFix
    ? {
        latitude,
        longitude,
      }
    : cityPlace &&
      isValidPosition(cityPlace.latitude, cityPlace.longitude)
      ? cityPlace
      : null;

  const usingApprox = !gpsFix && place !== null;

  // --------------------------------------------------
  // QIBLA CALCULATIONS
  // --------------------------------------------------

  let bearing = null;
  let distance = null;

  if (place) {
    try {
      bearing = qiblaBearing(
        place.latitude,
        place.longitude
      );

      distance = distanceToKaaba(
        place.latitude,
        place.longitude
      );

      if (
        !Number.isFinite(bearing) ||
        !Number.isFinite(distance)
      ) {
        bearing = null;
        distance = null;
      }
    } catch (error) {
      console.warn('Qibla calculation error:', error?.message);
    }
  }

  const offset =
    bearing !== null && heading !== null
      ? relativeAngle(bearing, heading)
      : null;

  const align =
    offset !== null
      ? alignment(offset)
      : null;

  const isAligned =
    align?.state === 'aligned';

  // --------------------------------------------------
  // RETRY LOCATION
  // --------------------------------------------------

  const retryLocation = async () => {
    if (retrying) return;

    setRetrying(true);
    setCityPlace(null);
    setCityError(null);

    try {
      if (typeof locate === 'function') {
        await locate();
      }
    } catch (error) {
      console.warn('GPS retry error:', error?.message);
    } finally {
      setRetrying(false);
    }
  };

  // --------------------------------------------------
  // SAVED CITY FALLBACK
  // --------------------------------------------------

  const useSavedCity = async () => {
    if (!savedCity?.city || cityLoading) return;

    setCityLoading(true);
    setCityError(null);

    try {
      const result = await geocodeCity(savedCity.city);

      if (
        result &&
        isValidPosition(result.latitude, result.longitude)
      ) {
        setCityPlace(result);
      } else {
        setCityError(
          `Could not get coordinates for ${savedCity.city}.`
        );
      }
    } catch (error) {
      console.warn('City geocoding error:', error?.message);

      setCityError(
        `Could not look up ${savedCity.city}. Check your internet connection.`
      );
    } finally {
      setCityLoading(false);
    }
  };

  // --------------------------------------------------
  // STATUS
  // --------------------------------------------------

  const status = place && bearing !== null
    ? 'ready'
    : locLoading || retrying
      ? 'locating'
      : permissionStatus === 'denied'
        ? 'denied'
        : 'error';

  // --------------------------------------------------
  // HAPTIC FEEDBACK
  // --------------------------------------------------

  useEffect(() => {
    if (isAligned && !wasAligned.current) {
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      ).catch(() => {});

      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),

        Animated.timing(pulse, {
          toValue: 0,
          duration: 320,
          useNativeDriver: true,
        }),
      ]).start();
    }

    wasAligned.current = isAligned;
  }, [isAligned, pulse]);

  const accent = isAligned
    ? COLORS.emerald
    : COLORS.gold;

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.04],
  });

  // --------------------------------------------------
  // LOCATION LOADING SCREEN
  // --------------------------------------------------

  if (status === 'locating') {
    return (
      <SafeAreaView
        style={globalStyles.screen}
        edges={['bottom']}
      >
        <View style={styles.centre}>
          <ActivityIndicator
            color={COLORS.gold}
            size="large"
          />

          <Text style={styles.muted}>
            Finding your location...
          </Text>

          <Text style={styles.muted}>
            Please allow location access if requested.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // --------------------------------------------------
  // NO GPS SCREEN
  // --------------------------------------------------

  if (status !== 'ready') {
    return (
      <SafeAreaView
        style={globalStyles.screen}
        edges={['bottom']}
      >
        <View style={styles.centre}>
          <Ionicons
            name="location-outline"
            size={44}
            color={COLORS.textSecondary}
          />

          <Text style={styles.errTitle}>
            {status === 'denied'
              ? 'Location permission needed'
              : 'Could not find your location'}
          </Text>

          <Text style={styles.muted}>
            {locError ||
              'Your device has not provided a valid location yet.'}
          </Text>

          <TouchableOpacity
            onPress={retryLocation}
            style={styles.retryBtn}
            accessibilityRole="button"
          >
            <Ionicons
              name="refresh"
              size={16}
              color="#000"
            />

            <Text style={styles.retryText}>
              Try again
            </Text>
          </TouchableOpacity>

          {savedCity?.city && (
            <TouchableOpacity
              onPress={useSavedCity}
              disabled={cityLoading}
              style={styles.cityBtn}
            >
              {cityLoading ? (
                <ActivityIndicator
                  size="small"
                  color={COLORS.gold}
                />
              ) : (
                <Ionicons
                  name="business-outline"
                  size={16}
                  color={COLORS.gold}
                />
              )}

              <Text style={styles.cityBtnText}>
                {cityLoading
                  ? 'Looking up city...'
                  : `Use ${savedCity.city} (approximate)`}
              </Text>
            </TouchableOpacity>
          )}

          {!savedCity?.city && (
            <Text style={styles.note}>
              Location is needed to calculate the direction of
              the Qibla. Save your city in Prayer Times if
              your device cannot provide GPS.
            </Text>
          )}

          {!!cityError && (
            <Text style={styles.cityError}>
              {cityError}
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // --------------------------------------------------
  // MAIN QIBLA SCREEN
  // --------------------------------------------------

  return (
    <SafeAreaView
      style={globalStyles.screen}
      edges={['bottom']}
    >
      <View style={styles.container}>
        {/* COMPASS */}

        <Animated.View
          style={[
            styles.dialWrap,
            { transform: [{ scale }] },
          ]}
        >
          <Dial
            heading={heading ?? 0}
            bearing={bearing}
            aligned={isAligned}
          />

          <View
            style={styles.dialCentre}
            pointerEvents="none"
          >
            <Text
              style={[
                styles.bearingBig,
                { color: accent },
              ]}
            >
              {Math.round(bearing)}°
            </Text>

            <Text style={styles.bearingPoint}>
              {compassPoint(bearing)}
            </Text>
          </View>
        </Animated.View>

        {/* COMPASS STATUS */}

        {!compassAvailable ? (
          <View style={styles.noCompass}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={COLORS.amber}
            />

            <Text style={styles.noCompassText}>
              This device has no available compass sensor.
              Qibla is {Math.round(bearing)}°
              {' '}({compassPoint(bearing)}) from north.
              The dial cannot track your phone rotation.
            </Text>
          </View>
        ) : heading === null ? (
          <View style={styles.noCompass}>
            <ActivityIndicator
              color={COLORS.amber}
              size="small"
            />

            <Text style={styles.noCompassText}>
              Reading compass...
            </Text>
          </View>
        ) : (
          <View
            style={[
              styles.status,
              isAligned && {
                borderColor: COLORS.emerald,
              },
            ]}
          >
            <Ionicons
              name={
                isAligned
                  ? 'checkmark-circle'
                  : offset > 0
                    ? 'arrow-forward-circle'
                    : 'arrow-back-circle'
              }
              size={20}
              color={accent}
            />

            <Text
              style={[
                styles.statusText,
                { color: accent },
              ]}
            >
              {align?.label ?? 'Align toward Qibla'}
            </Text>

            {!isAligned && (
              <Text style={styles.statusOff}>
                {Math.abs(Math.round(offset))}° off
              </Text>
            )}
          </View>
        )}

        {/* APPROXIMATE CITY */}

        {usingApprox && (
          <View style={styles.approx}>
            <Ionicons
              name="business-outline"
              size={15}
              color={COLORS.amber}
            />

            <Text style={styles.approxText}>
              Using {cityPlace.name || savedCity?.city}
              {cityPlace.admin1
                ? `, ${cityPlace.admin1}`
                : ''}. This is an approximate city location,
              not GPS.
            </Text>
          </View>
        )}

        {/* INFORMATION */}

        <View style={styles.facts}>
          <View style={styles.fact}>
            <Text style={styles.factValue}>
              {Math.round(bearing)}°
            </Text>

            <Text style={styles.factLabel}>
              Qibla bearing
            </Text>
          </View>

          <View style={styles.factDivider} />

          <View style={styles.fact}>
            <Text style={styles.factValue}>
              {Math.round(distance).toLocaleString()}
            </Text>

            <Text style={styles.factLabel}>
              km to Kaaba
            </Text>
          </View>

          <View style={styles.factDivider} />

          <View style={styles.fact}>
            <Text style={styles.factValue}>
              {heading === null
                ? '—'
                : `${Math.round(heading)}°`}
            </Text>

            <Text style={styles.factLabel}>
              Facing
            </Text>
          </View>
        </View>

        {/* COORDINATES */}

        <Text style={styles.coords}>
          {usingApprox ? 'Approx. ' : ''}
          {place.latitude.toFixed(4)}°,
          {' '}
          {place.longitude.toFixed(4)}
          {gpsFix && gpsAccuracy
            ? ` · accuracy ±${Math.round(gpsAccuracy)} m`
            : ''}
          {compassAvailable && heading !== null
            ? ` · ${isTrueNorth ? 'true' : 'magnetic'} north`
            : ''}
        </Text>

        {/* GPS ACCURACY */}

        {gpsFix && isGpsAccuracyPoor && (
          <View style={styles.calibrate}>
            <Ionicons
              name="location-outline"
              size={14}
              color={COLORS.amber}
            />

            <Text style={styles.calibrateText}>
              Location accuracy is low
              {gpsAccuracy
                ? ` (±${Math.round(gpsAccuracy)} m)`
                : ''}.
              Move somewhere with a clearer view of the sky
              and update your location.
            </Text>
          </View>
        )}

        {/* COMPASS ACCURACY */}

        {compassAvailable &&
          heading !== null &&
          compassAccuracyLevel !== 'high' && (
            <View style={styles.calibrate}>
              <Ionicons
                name="sync-outline"
                size={14}
                color={COLORS.amber}
              />

              <Text style={styles.calibrateText}>
                {compassAccuracyLevel === 'unknown'
                  ? 'Compass accuracy is unknown. '
                  : 'Compass accuracy is low. '}

                Move the phone in a figure-eight to calibrate.
                Keep it away from magnets, speakers, laptops,
                and metal objects.

                {!isTrueNorth
                  ? ' The heading is relative to magnetic north rather than true north.'
                  : ''}
              </Text>
            </View>
          )}

        {/* REFRESH */}

        <TouchableOpacity
          onPress={retryLocation}
          style={styles.refresh}
          accessibilityRole="button"
        >
          <Ionicons
            name="locate-outline"
            size={15}
            color={COLORS.cyan}
          />

          <Text style={styles.refreshText}>
            {retrying
              ? 'Updating...'
              : usingApprox
                ? 'Use my GPS location'
                : 'Update location'}
          </Text>
        </TouchableOpacity>

        {/* EXPLANATION */}

        <Text style={styles.note}>
          Direction is the great-circle bearing to the Kaaba
          in Masjid al-Haram. A phone compass can be affected
          by nearby magnetic objects. If in doubt, confirm
          with your local mosque.
        </Text>
      </View>
    </SafeAreaView>
  );
}

// --------------------------------------------------
// STYLES
// --------------------------------------------------

const makeStyles = (COLORS) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      padding: 20,
    },

    centre: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      gap: 14,
    },

    muted: {
      color: COLORS.textSecondary,
      fontSize: 13,
      textAlign: 'center',
      lineHeight: 20,
    },

    errTitle: {
      color: COLORS.textPrimary,
      fontSize: 17,
      fontWeight: '800',
      textAlign: 'center',
    },

    retryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      marginTop: 4,
      backgroundColor: COLORS.gold,
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },

    retryText: {
      color: '#000',
      fontWeight: '800',
      fontSize: 13,
    },

    cityBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 2,
      borderWidth: 1,
      borderColor: COLORS.gold + '80',
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: COLORS.gold + '14',
    },

    cityBtnText: {
      color: COLORS.gold,
      fontWeight: '800',
      fontSize: 13,
    },

    cityError: {
      color: COLORS.amber,
      fontSize: 12,
      textAlign: 'center',
    },

    approx: {
      flexDirection: 'row',
      gap: 8,
      alignSelf: 'stretch',
      marginTop: 18,
      padding: 12,
      borderRadius: 12,
      backgroundColor: COLORS.amber + '12',
      borderWidth: 1,
      borderColor: COLORS.amber + '30',
    },

    approxText: {
      color: COLORS.textSecondary,
      fontSize: 12,
      lineHeight: 18,
      flex: 1,
    },

    dialWrap: {
      width: DIAL,
      height: DIAL,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
    },

    dialCentre: {
      position: 'absolute',
      alignItems: 'center',
    },

    bearingBig: {
      fontSize: 38,
      fontWeight: '900',
      letterSpacing: -1,
    },

    bearingPoint: {
      color: COLORS.textSecondary,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 2,
      marginTop: 2,
    },

    status: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      marginTop: 22,
      borderWidth: 1,
      borderColor: COLORS.glassBorder,
      borderRadius: 999,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },

    statusText: {
      fontSize: 14,
      fontWeight: '800',
    },

    statusOff: {
      color: COLORS.textSecondary,
      fontSize: 12,
    },

    noCompass: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 22,
      padding: 13,
      borderRadius: 12,
      backgroundColor: COLORS.amber + '12',
      borderWidth: 1,
      borderColor: COLORS.amber + '30',
    },

    noCompassText: {
      color: COLORS.textSecondary,
      fontSize: 12.5,
      lineHeight: 19,
      flex: 1,
    },

    facts: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'stretch',
      marginTop: 24,
      paddingVertical: 16,
      borderRadius: 16,
      backgroundColor: COLORS.bgSecondary,
      borderWidth: 1,
      borderColor: COLORS.glassBorder,
    },

    fact: {
      flex: 1,
      alignItems: 'center',
      gap: 3,
    },

    factValue: {
      color: COLORS.textPrimary,
      fontSize: 17,
      fontWeight: '900',
    },

    factLabel: {
      color: COLORS.textSecondary,
      fontSize: 10.5,
    },

    factDivider: {
      width: 1,
      height: 28,
      backgroundColor: COLORS.divider,
    },

    coords: {
      color: COLORS.textSecondary,
      fontSize: 11.5,
      marginTop: 12,
      textAlign: 'center',
    },

    calibrate: {
      flexDirection: 'row',
      gap: 7,
      marginTop: 14,
      padding: 11,
      borderRadius: 10,
      backgroundColor: COLORS.amber + '10',
      borderWidth: 1,
      borderColor: COLORS.amber + '2E',
    },

    calibrateText: {
      color: COLORS.textSecondary,
      fontSize: 11.5,
      lineHeight: 17,
      flex: 1,
    },

    refresh: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 16,
      borderWidth: 1,
      borderColor: COLORS.glassBorder,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },

    refreshText: {
      color: COLORS.cyan,
      fontSize: 12.5,
      fontWeight: '700',
    },

    note: {
      color: COLORS.textSecondary,
      fontSize: 11.5,
      lineHeight: 18,
      textAlign: 'center',
      marginTop: 18,
      opacity: 0.9,
    },
  });