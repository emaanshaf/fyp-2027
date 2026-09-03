import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, globalStyles } from '../theme';
import { PROPHETS as PROPHET_DATA } from '../data/prophets';

// The dataset stores colour names; resolve them against the active theme.
const PROPHETS = PROPHET_DATA.map(p => ({ ...p, color: COLORS[p.color] || COLORS.gold }));


export default function ProphetsStoriesScreen() {
  const [selected, setSelected] = useState(null);

  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      <FlatList
        data={PROPHETS}
        keyExtractor={p => p.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
        ListHeaderComponent={() => (
          <View style={styles.headerCard}>
            <Ionicons name="people" size={32} color={COLORS.gold} />
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

const styles = StyleSheet.create({
  headerCard: {
    padding: 24, borderRadius: 24, alignItems: 'center', marginBottom: 16,
    backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.gold + '30',
  },
  headerTitle: { color: COLORS.gold, fontSize: 20, fontWeight: '900', marginTop: 12 },
  headerSub: { color: COLORS.textSecondary, fontSize: 13, marginTop: 4 },
  prophetCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, marginBottom: 8,
    borderRadius: 18, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder,
    flexWrap: 'wrap',
  },
  prophetIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
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
