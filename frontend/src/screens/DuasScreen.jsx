import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Modal, ScrollView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { getItem, setItem } from '../firebase/syncedStorage';
import { useColors, useGlobalStyles, useThemedStyles } from '../theme';
import { DUAS, CATEGORIES, CAT_ICONS } from '../data/duas';
import { MANUAL_CONTEXTS, buildContextRecommendation } from '../services/contextDuas';
import { lookupCurrentPlace, watchDevicePosition, describeCoordinates } from '../services/placeLookup';
import { getWeatherAtPoint, getNearbyNature } from '../services/contextEnvironment';
import { backend } from '../services/backend';
import { hasAuthToken } from '../services/authToken';
import { useShare } from '../context/ShareContext';
import { APP_CONFIG } from '../config/appConfig';

/** Metres between two fixes; a flat-earth approximation is fine at this scale. */
function distanceMeters(a, b) {
  if (!a || !b || a.latitude == null || b.latitude == null) return Infinity;
  const rad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * rad;
  const dLng = (b.longitude - a.longitude) * rad;
  const lat = ((a.latitude + b.latitude) / 2) * rad;
  const x = dLng * Math.cos(lat);
  return Math.sqrt(dLat * dLat + x * x) * 6371000;
}

const ENV_REFRESH_MS = 10 * 60 * 1000;

export default function DuasScreen({ route }) {
  // ── Live theme hooks (replaces frozen module-level COLORS) ────────────
  const COLORS = useColors();
  const globalStyles = useGlobalStyles();
  const styles = useThemedStyles(makeStyles);
  const { share } = useShare();

  const [category, setCategory] = useState('Morning');
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [selected, setSelected] = useState(null);

  // ── Context card: clock + optional place/speed + user's own chips ──────
  const [manualContexts, setManualContexts] = useState([]);
  const [place, setPlace] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationNote, setLocationNote] = useState('');
  const [recommendation, setRecommendation] = useState(() => buildContextRecommendation());

  // ── Live surroundings: weather, dry spell and nearby landscape ─────────
  const [weather, setWeather] = useState(null);
  const [nature, setNature] = useState(null);
  const [live, setLive] = useState(false);
  const [envNote, setEnvNote] = useState('');

  const mountedRef = useRef(true);
  const watchRef = useRef(null);
  const lastFixRef = useRef(null);
  const lastEnvAtRef = useRef(0);
  const envRequestRef = useRef(0);

  async function refreshEnvironment(fix, { force = false } = {}) {
    if (!fix || fix.latitude == null || fix.longitude == null) return;
    const requestId = ++envRequestRef.current;
    const [nextWeather, nextNature] = await Promise.all([
      getWeatherAtPoint({ latitude: fix.latitude, longitude: fix.longitude }),
      getNearbyNature({ latitude: fix.latitude, longitude: fix.longitude }),
    ]);
    if (!mountedRef.current || requestId !== envRequestRef.current) return;

    lastEnvAtRef.current = Date.now();
    setWeather(nextWeather);
    setNature(nextNature);
    if (force) {
      setEnvNote(nextWeather
        ? ''
        : 'Weather details are unavailable right now — the dua still follows your time and place.');
    }
  }

  async function applyFix(fix, { force = false } = {}) {
    if (!fix || fix.latitude == null || fix.longitude == null) return;

    const moved = distanceMeters(lastFixRef.current, fix) > 250;
    const stale = Date.now() - lastEnvAtRef.current > ENV_REFRESH_MS;
    if (!moved && !force && !stale) return;

    const previous = lastFixRef.current;
    lastFixRef.current = { latitude: fix.latitude, longitude: fix.longitude };
    setPlace(prev => ({ ...(prev || {}), ...fix, outcome: 'ok' }));

    if (moved || force || stale) refreshEnvironment(fix, { force });

    // Re-naming every 300 m would spam the device geocoder; only do it on a
    // real move, and the coordinates stay on the phone.
    if (moved && Platform.OS !== 'web' && previous) {
      const address = await describeCoordinates(fix.latitude, fix.longitude);
      if (mountedRef.current && address) {
        setPlace(prev => (prev ? { ...prev, address } : prev));
      }
    }
  }

  async function startWatching() {
    if (watchRef.current) return;
    const subscription = await watchDevicePosition(fix => { applyFix(fix); });
    if (!mountedRef.current) {
      subscription?.remove?.();
      return;
    }
    if (subscription) {
      watchRef.current = subscription;
      setLive(true);
    }
  }

  function stopWatching() {
    watchRef.current?.remove?.();
    watchRef.current = null;
    setLive(false);
  }

  useEffect(() => {
    loadFavorites();
  }, []);

  // With an existing grant this follows the user quietly and refreshes the sky
  // every ten minutes. With no grant it resolves as "skipped" without any
  // system dialog — the chips still work.
  useEffect(() => {
    mountedRef.current = true;
    let timer;
    (async () => {
      const result = await lookupCurrentPlace({ prompt: false });
      if (!mountedRef.current) return;
      if (result.outcome === 'skipped' || result.outcome === 'denied') return;
      if (result.outcome === 'ok' || result.outcome === 'unsupported') {
        setPlace(result);
        if (result.latitude != null) {
          lastFixRef.current = { latitude: result.latitude, longitude: result.longitude };
          refreshEnvironment(result);
        }
        await startWatching();
        timer = setInterval(() => {
          if (lastFixRef.current) refreshEnvironment(lastFixRef.current);
        }, ENV_REFRESH_MS);
      }
    })();
    return () => {
      mountedRef.current = false;
      clearInterval(timer);
      watchRef.current?.remove?.();
      watchRef.current = null;
    };
  }, []);

  useEffect(() => {
    setRecommendation(buildContextRecommendation({
      manualContexts,
      place,
      speedMps: place?.speedMps ?? null,
      weather,
      nature,
    }));
  }, [manualContexts, place, weather, nature]);

  const toggleContext = id => setManualContexts(prev => (
    prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
  ));

  const handleUseLocation = async () => {
    if (locating) return;
    setLocating(true);
    setLocationNote('');
    setEnvNote('');
    try {
      const result = await lookupCurrentPlace();
      if (result.outcome === 'ok' || result.outcome === 'unsupported') {
        setPlace(result);
        if (result.latitude != null) {
          lastFixRef.current = { latitude: result.latitude, longitude: result.longitude };
          refreshEnvironment(result, { force: true });
        }
        await startWatching();
      }
      if (result.message) setLocationNote(result.message);
    } catch {
      setLocationNote('Could not read your location. Choose a place below instead.');
    } finally {
      setLocating(false);
    }
  };

  // `/duas/12` and a search hit both carry the dua id. Open that dua's detail
  // sheet even when the user's current category would not list it.
  useEffect(() => {
    const id = Number(route?.params?.id);
    if (!id) return;
    const dua = DUAS.find(d => Number(d.id) === id);
    if (dua) setSelected(dua);
  }, [route?.params?.id]);

  const loadFavorites = async () => {
    try {
      const hasToken = await hasAuthToken();
      if (hasToken) {
        try {
          const apiFavs = await backend.getFavorites();
          const favIds = (apiFavs || []).map(f => parseInt(f.dua_id));
          setFavorites(favIds);
          return;
        } catch { /* fall through to local */ }
      }
      getItem('qitab_fav_duas').then(v => v && setFavorites(JSON.parse(v)));
    } catch {
      getItem('qitab_fav_duas').then(v => v && setFavorites(JSON.parse(v)));
    }
  };

  const saveFav = async (id) => {
    const next = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
    setFavorites(next);
    await setItem('qitab_fav_duas', JSON.stringify(next));

    // Also save to backend if logged in
    const hasToken = await hasAuthToken();
    if (hasToken) {
      try {
        const dua = DUAS.find(d => d.id === id);
        if (next.includes(id)) {
          await backend.addFavorite({
            dua_id: id.toString(),
            dua_title: dua?.title,
            dua_text: dua?.arabic,
            dua_category: dua?.category,
            source: 'duas_screen',
          });
        } else {
          await backend.deleteFavoriteByDuaId(id.toString());
        }
      } catch { /* backend unavailable */ }
    }
  };

  const filtered = DUAS.filter(d => {
    if (category === 'Favorites') return favorites.includes(d.id);
    return d.category === category && (!search || d.title.toLowerCase().includes(search.toLowerCase()) || d.translation.toLowerCase().includes(search.toLowerCase()));
  });

  const speak = (text) => Speech.speak(text, { language: 'ar-SA', rate: 0.75 });

  const shareDua = (dua) => {
    if (!dua) return;
    const parts = [dua.arabic];
    if (dua.transliteration) parts.push(dua.transliteration);
    parts.push(dua.translation);
    share({
      title: dua.title,
      message: parts.join('\n\n'),
      url: APP_CONFIG.shareUrl(`/duas/${dua.id}`),
    });
  };

  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      <FlatList
        data={filtered}
        keyExtractor={d => d.id.toString()}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={(
          <>
            {/* Contextual recommendation */}
            {recommendation?.dua && (
              <View style={styles.recommendCard}>
                <View style={[globalStyles.row, { gap: 8, marginBottom: 4 }]}>
                  <Ionicons name="sparkles" size={16} color={COLORS.gold} />
                  <Text style={styles.recommendReason}>{recommendation.reason}</Text>
                  {weather ? (
                    <View style={styles.weatherChip}>
                      <Ionicons name={weather.icon} size={13} color={COLORS.gold} />
                      <Text style={styles.weatherChipText}>
                        {weather.temperatureC}° {weather.label}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {recommendation.placeLabel ? (
                  <View style={[globalStyles.row, { gap: 6, marginBottom: 8 }]}>
                    <Ionicons name="location-outline" size={12} color={COLORS.textSecondary} />
                    <Text style={styles.contextMeta}>
                      Near {recommendation.placeLabel}, named by your device
                    </Text>
                  </View>
                ) : null}

                {nature && nature.kinds?.length ? (
                  <View style={[globalStyles.row, { gap: 6, marginBottom: 8 }]}>
                    <Ionicons name="leaf-outline" size={12} color={COLORS.emerald} />
                    <Text style={styles.contextMeta}>
                      {nature.elevation != null ? `${nature.elevation} m` : ''}
                      {nature.elevation != null && nature.kinds.length ? ' · ' : ''}
                      {nature.kinds.join(', ')} within a few kilometres
                    </Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setSelected(recommendation.dua)}
                  accessibilityRole="button"
                  accessibilityLabel={`Read ${recommendation.dua.title}`}
                >
                  <Text style={styles.recommendTitle}>{recommendation.dua.title}</Text>
                  <Text style={styles.recommendArabic} numberOfLines={1}>{recommendation.dua.arabic}</Text>
                  <View style={[globalStyles.row, { marginTop: 10, gap: 4 }]}>
                    <Text style={{ color: COLORS.gold, fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>READ NOW</Text>
                    <Ionicons name="chevron-forward" size={13} color={COLORS.gold} />
                  </View>
                </TouchableOpacity>

                {/* GPS can name a mosque or a market, but never a mood or the
                    rain. These chips are the honest way to correct it. */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginTop: 14 }}
                  contentContainerStyle={{ gap: 8, paddingRight: 4 }}
                >
                  {MANUAL_CONTEXTS.map(context => {
                    const active = manualContexts.includes(context.id);
                    return (
                      <TouchableOpacity
                        key={context.id}
                        onPress={() => toggleContext(context.id)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        accessibilityLabel={context.label}
                        style={[styles.contextChip, active && styles.contextChipActive]}
                      >
                        <Ionicons
                          name={context.icon}
                          size={13}
                          color={active ? COLORS.gold : COLORS.textSecondary}
                        />
                        <Text style={[styles.contextChipText, active && { color: COLORS.gold }]}>
                          {context.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <View style={[globalStyles.row, { marginTop: 12, justifyContent: 'space-between', gap: 12 }]}>
                  <TouchableOpacity
                    onPress={handleUseLocation}
                    disabled={locating}
                    accessibilityRole="button"
                    accessibilityLabel="Use my location to suggest a dua"
                    style={styles.contextAction}
                  >
                    <Ionicons
                      name={locating ? 'hourglass-outline' : 'navigate-outline'}
                      size={13}
                      color={COLORS.gold}
                    />
                    <Text style={styles.contextActionText}>
                      {locating
                        ? 'Checking\u2026'
                        : place?.latitude != null ? 'Update location' : 'Use my location'}
                    </Text>
                  </TouchableOpacity>

                  {live ? (
                    <TouchableOpacity
                      onPress={stopWatching}
                      accessibilityRole="button"
                      accessibilityLabel="Pause live location updates"
                      style={[globalStyles.row, { gap: 5 }]}
                    >
                      <View style={styles.liveDot} />
                      <Text style={styles.liveText}>Live · updates as you move</Text>
                      <Text style={styles.livePause}>Pause</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.contextPrivacy}>Weather & map services see only coordinates</Text>
                  )}
                </View>

                {locationNote ? <Text style={styles.contextNote}>{locationNote}</Text> : null}
                {envNote ? <Text style={styles.contextNote}>{envNote}</Text> : null}
              </View>
            )}

            {/* Search */}
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={16} color={COLORS.textSecondary} />
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Search duas..."
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            {/* Category tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow} contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}>
              {CATEGORIES.map(c => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setCategory(c)}
                  style={[styles.catChip, category === c && styles.catChipActive]}
                >
                  <Ionicons name={CAT_ICONS[c]} size={14} color={category === c ? COLORS.gold : COLORS.textSecondary} />
                  <Text style={[styles.catText, category === c && { color: COLORS.gold }]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}
        ListEmptyComponent={(
          <View style={[globalStyles.center, { paddingVertical: 48 }]}>
            <Ionicons name="heart-outline" size={48} color={COLORS.glassBorder} />
            <Text style={{ color: COLORS.textSecondary, marginTop: 12 }}>No duas found</Text>
          </View>
        )}
        renderItem={({ item: dua }) => (
          <TouchableOpacity
            onPress={() => setSelected(dua)}
            activeOpacity={0.8}
            style={styles.duaCard}
          >
            <View style={globalStyles.spaceBetween}>
              <View style={globalStyles.chip}>
                <Text style={globalStyles.chipText}>{dua.category}</Text>
              </View>
              <TouchableOpacity onPress={() => saveFav(dua.id)}>
                <Ionicons name={favorites.includes(dua.id) ? 'star' : 'star-outline'} size={18} color={favorites.includes(dua.id) ? COLORS.gold : COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.duaTitle}>{dua.title}</Text>
            <Text style={styles.arabicPreview} numberOfLines={2}>{dua.arabic}</Text>
            <Text style={styles.translationPreview} numberOfLines={2}>{dua.translation}</Text>
            <View style={[globalStyles.row, { marginTop: 12, gap: 16, justifyContent: 'flex-end' }]}>
              <TouchableOpacity onPress={() => speak(dua.arabic)}>
                <Ionicons name="volume-high-outline" size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => shareDua(dua)}
                accessibilityRole="button"
                accessibilityLabel={`Share ${dua.title}`}
              >
                <Ionicons name="share-outline" size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Detail Modal */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.75)' }}>
          <View style={styles.detailModal}>
            <View style={[globalStyles.spaceBetween, { marginBottom: 20 }]}>
              <View style={globalStyles.chip}>
                <Text style={globalStyles.chipText}>{selected?.category}</Text>
              </View>
              <View style={[globalStyles.row, { gap: 16 }]}>
                <TouchableOpacity onPress={() => saveFav(selected?.id)}>
                  <Ionicons name={favorites.includes(selected?.id) ? 'star' : 'star-outline'} size={20} color={COLORS.gold} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setSelected(null)}>
                  <Ionicons name="close" size={22} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.detailTitle}>{selected?.title}</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.arabicFull}>{selected?.arabic}</Text>

              <Text style={globalStyles.label}>TRANSLITERATION</Text>
              <Text style={styles.translitText}>{selected?.transliteration}</Text>

              <View style={globalStyles.divider} />
              <Text style={globalStyles.label}>TRANSLATION</Text>
              <Text style={styles.translationFull}>{selected?.translation}</Text>

              <View style={styles.benefitBox}>
                <Text style={[globalStyles.label, { color: COLORS.emerald }]}>BENEFIT & VIRTUE</Text>
                <Text style={{ color: COLORS.textPrimary, marginTop: 6, lineHeight: 22 }}>{selected?.benefit}</Text>
              </View>

              <View style={[globalStyles.row, { gap: 12, marginTop: 20 }]}>
                <TouchableOpacity style={[globalStyles.btnPrimary, { flex: 1 }]} onPress={() => selected && speak(selected.arabic)}>
                  <Ionicons name="volume-high-outline" size={18} color="#000" />
                  <Text style={globalStyles.btnPrimaryText}>Listen Arabic</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[globalStyles.btnPrimary, { flex: 1, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder }]}
                  onPress={() => shareDua(selected)}
                >
                  <Ionicons name="share-social-outline" size={18} color={COLORS.gold} />
                  <Text style={{ color: COLORS.textPrimary, fontWeight: '700' }}>Share</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (COLORS) => StyleSheet.create({
  recommendCard: {
    margin: 12,
    marginBottom: 4,
    padding: 16,
    borderRadius: 18,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  recommendReason: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600', flex: 1 },
  weatherChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    backgroundColor: COLORS.bgSecondary,
  },
  weatherChipText: { color: COLORS.textSecondary, fontSize: 10, fontWeight: '700' },
  contextMeta: { color: COLORS.textSecondary, fontSize: 11, flex: 1 },
  contextChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    backgroundColor: COLORS.glass,
  },
  contextChipActive: { borderColor: COLORS.gold, backgroundColor: COLORS.bgSecondary },
  contextChipText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '700' },
  contextAction: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4 },
  contextActionText: { color: COLORS.gold, fontSize: 12, fontWeight: '800' },
  contextPrivacy: { color: COLORS.textSecondary, fontSize: 10, flexShrink: 1, textAlign: 'right' },
  contextNote: { color: COLORS.amber, fontSize: 11, marginTop: 8, lineHeight: 16 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.emerald },
  liveText: { color: COLORS.emerald, fontSize: 10, fontWeight: '700', flexShrink: 1 },
  livePause: { color: COLORS.textSecondary, fontSize: 10, fontWeight: '800', textDecorationLine: 'underline' },
  recommendTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '800', marginBottom: 6 },
  recommendArabic: { textAlign: 'right', writingDirection: 'rtl', color: COLORS.gold, fontSize: 17, fontFamily: 'AmiriQuran', lineHeight: 32 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
    backgroundColor: COLORS.glass,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: { flex: 1, color: COLORS.textPrimary, fontSize: 14 },
  catRow: { maxHeight: 52, marginBottom: 4 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    backgroundColor: COLORS.glass,
  },
  catChipActive: { borderColor: COLORS.gold, backgroundColor: COLORS.bgSecondary },
  catText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '700' },
  duaCard: {
    marginHorizontal: 12,
    marginBottom: 10,
    backgroundColor: COLORS.glass,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: 16,
  },
  duaTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '800', marginTop: 10, marginBottom: 8 },
  arabicPreview: {
    textAlign: 'right',
    writingDirection: 'rtl',
    color: COLORS.gold,
    fontSize: 18,
    fontFamily: 'AmiriQuran',
    lineHeight: 34,
    marginBottom: 8,
  },
  translationPreview: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 },
  detailModal: {
    backgroundColor: COLORS.bgSecondary,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '90%',
    borderTopWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  detailTitle: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '900', marginBottom: 20 },
  arabicFull: {
    textAlign: 'right',
    writingDirection: 'rtl',
    color: COLORS.gold,
    fontSize: 24,
    fontFamily: 'AmiriQuran',
    lineHeight: 46,
    marginBottom: 24,
  },
  translitText: { color: COLORS.textSecondary, fontStyle: 'italic', fontSize: 15, lineHeight: 24, marginTop: 6, marginBottom: 16 },
  translationFull: { color: COLORS.textPrimary, fontSize: 16, lineHeight: 26, marginTop: 6 },
  benefitBox: {
    marginTop: 20,
    padding: 16,
    backgroundColor: COLORS.glass,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
});
