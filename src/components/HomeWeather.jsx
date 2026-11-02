import { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, AppState, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useThemedStyles } from '../theme';
import { getHomeWeather, WEATHER_TTL_MS } from '../services/weather';

/**
 * The current conditions line inside the Home hero.
 *
 * It reads the city the prayer screen saved, so it never asks for a location
 * of its own and shows nothing at all until a city is chosen. A tap forces a
 * refresh; the reading itself is cached for half an hour.
 */
export default function HomeWeather({ city }) {
  const COLORS = useColors();
  const styles = useThemedStyles(makeStyles);
  const [weather, setWeather] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let alive = true;

    const sync = async () => {
      try {
        const next = await getHomeWeather();
        if (alive && next) setWeather(next);
        // With nothing cached and no connection, the previous reading stays
        // on screen and the row keeps its last honest label.
      } catch {
        // Storage failure — the hero still renders without weather.
      }
    };

    sync();
    // Home stays mounted while the user reads other tabs, so a stale reading
    // has to be refreshed by the component rather than by a remount.
    const timer = setInterval(sync, WEATHER_TTL_MS);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') sync();
    });

    return () => {
      alive = false;
      clearInterval(timer);
      subscription?.remove?.();
    };
  }, [city]);

  const refresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const next = await getHomeWeather({ force: true });
      if (next) setWeather(next);
    } catch {
      // Tapping a reading that cannot refresh must not clear it.
    } finally {
      setRefreshing(false);
    }
  };

  if (!weather) return null;

  const high = weather.highC;
  const low = weather.lowC;
  const hasRange = high !== null && low !== null;
  const spoken = [
    `${weather.city}: ${weather.temperatureC} degrees Celsius, ${weather.condition.toLowerCase()}`,
    hasRange ? `High ${high}, low ${low}` : null,
    weather.stale ? 'Last saved reading, currently offline' : null,
    'Double tap to refresh',
  ].filter(Boolean).join('. ');

  return (
    <TouchableOpacity
      style={styles.weatherRow}
      onPress={refresh}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={spoken}
      accessibilityHint="Refreshes the current weather"
    >
      <Ionicons name={weather.icon} size={19} color={COLORS.gold} />
      <Text style={styles.temp}>{weather.temperatureC}°</Text>
      <Text style={styles.condition} numberOfLines={1}>{weather.condition}</Text>
      <View style={{ flex: 1 }} />
      {weather.stale ? (
        <Ionicons name="cloud-offline-outline" size={12} color="rgba(255,255,255,0.65)" />
      ) : null}
      {refreshing ? (
        <ActivityIndicator size="small" color="rgba(255,255,255,0.8)" />
      ) : hasRange ? (
        <Text style={styles.range}>H {high}° · L {low}°</Text>
      ) : null}
    </TouchableOpacity>
  );
}

const makeStyles = () => StyleSheet.create({
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  temp: { color: '#fff', fontSize: 18, fontWeight: '900' },
  condition: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12.5,
    fontWeight: '600',
    flexShrink: 1,
  },
  range: { color: 'rgba(255,255,255,0.72)', fontSize: 11, fontWeight: '700' },
});
