import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';
import { isOnline, onConnectivityChange } from '../services/cache';

/**
 * A thin bar that appears when the connection drops.
 *
 * The wording matters: the app keeps working offline, so this is reassurance
 * rather than an error. A generic "No internet connection" would read as a
 * failure and send people looking for a problem that isn't there.
 *
 * It also briefly confirms when the connection returns, so the bar's
 * disappearance is explained rather than just happening.
 */
export default function OfflineBanner() {
  const [online, setOnline] = useState(isOnline());
  const [visible, setVisible] = useState(false);
  const slide = useRef(new Animated.Value(0)).current;
  const restoreTimer = useRef(null);

  useEffect(() => {
    const unsubscribe = onConnectivityChange(next => {
      setOnline(next);
      if (!next) {
        clearTimeout(restoreTimer.current);
        setVisible(true);
      } else {
        // Hold the "back online" confirmation briefly, then retract.
        clearTimeout(restoreTimer.current);
        restoreTimer.current = setTimeout(() => setVisible(false), 2200);
      }
    });
    return () => {
      unsubscribe();
      clearTimeout(restoreTimer.current);
    };
  }, []);

  useEffect(() => {
    Animated.timing(slide, {
      toValue: visible ? 1 : 0,
      duration: 240,
      // Height/translate on the web renderer needs the JS driver.
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [visible, slide]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.bar,
        { backgroundColor: online ? COLORS.emerald + '22' : COLORS.amber + '22' },
        {
          opacity: slide,
          transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) }],
        },
      ]}
      accessibilityLiveRegion="polite"
    >
      <Ionicons
        name={online ? 'cloud-done-outline' : 'cloud-offline-outline'}
        size={14}
        color={online ? COLORS.emerald : COLORS.amber}
      />
      <Text style={[styles.text, { color: online ? COLORS.emerald : COLORS.amber }]}>
        {online
          ? 'Back online — syncing'
          : 'Offline — showing your saved content'}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  text: { fontSize: 12, fontWeight: '700' },
});
