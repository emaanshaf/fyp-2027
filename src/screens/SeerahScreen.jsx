import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, globalStyles } from '../theme';
import { SEERAH_EVENTS, SEERAH_PERIODS } from '../data/seerah';

// The dataset stores colour token names so the timeline follows the theme.
const EVENTS = SEERAH_EVENTS.map(e => ({ ...e, color: COLORS[e.color] || COLORS.gold }));


export default function SeerahScreen() {
  const [selected, setSelected] = useState(null);

  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View style={styles.headerCard}>
          <Ionicons name="person" size={32} color="#fff" />
          <Text style={styles.headerTitle}>Seerah of Prophet Muhammad ﷺ</Text>
          <Text style={styles.headerSub}>
            {EVENTS.length} events across {SEERAH_PERIODS.length} periods of his life
          </Text>
        </View>

        {/* Timeline */}
        <View style={{ paddingHorizontal: 16 }}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          {EVENTS.map((event, i) => {
            const isNewPeriod = i === 0 || EVENTS[i - 1].period !== event.period;
            return (
            <React.Fragment key={i}>
            {isNewPeriod && (
              <Text style={styles.periodLabel}>{event.period}</Text>
            )}
            <TouchableOpacity key={i} style={[styles.eventCard, selected === i && styles.eventActive]}
              onPress={() => setSelected(selected === i ? null : i)} activeOpacity={0.7}>
              <View style={styles.timelineRow}>
                <View style={[styles.timelineDot, { backgroundColor: event.color }]} />
                {i < EVENTS.length - 1 && <View style={styles.timelineLine} />}
              </View>
              <View style={styles.eventContent}>
                <Text style={styles.eventYear}>{event.year}</Text>
                <Text style={styles.eventTitle}>{event.title}</Text>
                {selected === i && <Text style={styles.eventDesc}>{event.desc}</Text>}
              </View>
            </TouchableOpacity>
            </React.Fragment>
            );
          })}
        </View>

        {/* Lessons */}
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <Text style={styles.sectionTitle}>Key Lessons from the Seerah</Text>
          {[
            'Patience in the face of persecution',
            'Justice even towards enemies',
            'Kindness to family and companions',
            'Trust in Allah in all circumstances',
            'Compassion for the poor and needy',
            'Forgiveness over revenge',
          ].map((lesson, i) => (
            <View key={i} style={styles.lessonCard}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.emerald} />
              <Text style={styles.lessonText}>{lesson}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  periodLabel: {
    color: COLORS.gold, fontSize: 11, fontWeight: '800',
    textTransform: 'uppercase', letterSpacing: 1.2,
    marginTop: 20, marginBottom: 10,
  },
  headerCard: {
    margin: 16, padding: 24, borderRadius: 24, alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 12, textAlign: 'center' },
  headerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4, textAlign: 'center' },
  sectionTitle: { color: COLORS.gold, fontSize: 17, fontWeight: '800', marginBottom: 12 },
  eventCard: {
    flexDirection: 'row', gap: 14, marginBottom: 4,
  },
  timelineRow: { width: 20, alignItems: 'center' },
  timelineDot: { width: 12, height: 12, borderRadius: 6, marginTop: 6 },
  timelineLine: { width: 2, flex: 1, backgroundColor: COLORS.glassBorder, marginTop: 4 },
  eventContent: { flex: 1, padding: 14, borderRadius: 14, backgroundColor: COLORS.glass,
    borderWidth: 1, borderColor: COLORS.glassBorder, marginBottom: 8 },
  eventActive: { borderColor: COLORS.gold },
  eventYear: { color: COLORS.gold, fontSize: 11, fontWeight: '800' },
  eventTitle: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '700', marginTop: 4 },
  eventDesc: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 8 },
  lessonCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, marginBottom: 6,
    borderRadius: 12, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  lessonText: { flex: 1, color: COLORS.textPrimary, fontSize: 13 },
});
