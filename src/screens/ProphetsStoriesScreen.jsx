import React, { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useGlobalStyles, useThemedStyles } from '../theme';
import { PROPHETS as PROPHET_DATA } from '../data/prophets';
export default function ProphetsStoriesScreen({ route }) {
  // ── Live theme hooks (replaces frozen module-level COLORS) ────────────
  const COLORS = useColors();
  const globalStyles = useGlobalStyles();
  const styles = useThemedStyles(makeStyles);

// The dataset stores colour names; resolve them against the active theme.
const PROPHETS = PROPHET_DATA.map(p => ({ ...p, color: COLORS[p.color] || COLORS.gold }));

  const [selected, setSelected] = useState(null);
  const listRef = useRef(null);

  // Search hits pass `{ id }`; expand that prophet and bring the card into
  // view instead of leaving the user at the top of a long list.
  useEffect(() => {
    const id = route?.params?.id;
    if (!id) return undefined;
    const index = PROPHETS.findIndex(p => String(p.id) === String(id));
    if (index < 0) return undefined;
    setSelected(PROPHETS[index].id);
    const timer = setTimeout(() => {
      listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.1 });
    }, 250);
    return () => clearTimeout(timer);
  }, [route?.params?.id]);

  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      <FlatList
        ref={listRef}
        data={PROPHETS}
        keyExtractor={p => p.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
        onScrollToIndexFailed={info => {
          listRef.current?.scrollToOffset({
            offset: info.averageItemLength * info.index,
            animated: true,
          });
        }}
        ListHeaderComponent={() => (
          <View style={styles.headerCard}>
            <Ionicons name="people" size={32} color="#fff" />
            <Text style={styles.headerTitle}>Stories of the Prophets</Text>
            <Text style={styles.headerSub}>{PROPHETS.length} prophets mentioned in the Quran</Text>
          </View>
        )}
        renderItem={({ item: prophet }) => (
          <TouchableOpacity style={[styles.prophetCard, selected === prophet.id && { borderColor: prophet.color }]}
            onPress={() => setSelected(selected === prophet.id ? null : prophet.id)} activeOpacity={0.7}>
            <View style={[styles.prophetIcon, { backgroundColor: prophet.color + '18' }]}>
              <Ionicons name={prophet.icon} size={24} color={prophet.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.prophetName}>{prophet.name}</Text>
              <Text style={styles.prophetTitle}>{prophet.title}</Text>
            </View>
            <Ionicons name={selected === prophet.id ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textSecondary} />
            {selected === prophet.id && (
              <View style={styles.prophetDetail}>
                <Text style={styles.prophetDesc}>{prophet.desc}</Text>
                <View style={styles.lessonBox}>
                  <Ionicons name="bulb" size={14} color={COLORS.gold} />
                  <Text style={styles.lessonText}>{prophet.lesson}</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const makeStyles = (COLORS) => StyleSheet.create({
  headerCard: {
    padding: 24, borderRadius: 24, alignItems: 'center', marginBottom: 16,
    backgroundColor: COLORS.primary, borderWidth: 1, borderColor: COLORS.primary,
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 12 },
  headerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4 },
  prophetCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, marginBottom: 8,
    borderRadius: 18, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder,
    flexWrap: 'wrap',
  },
  prophetIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  prophetName: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '800' },
  prophetTitle: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  prophetDetail: { width: '100%', marginTop: 12 },
  prophetDesc: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 },
  lessonBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, padding: 12,
    borderRadius: 12, backgroundColor: 'rgba(255, 255, 255,0.08)', borderWidth: 1, borderColor: 'rgba(255, 255, 255,0.2)',
  },
  lessonText: { flex: 1, color: COLORS.gold, fontSize: 12, fontWeight: '600', lineHeight: 18 },
});
