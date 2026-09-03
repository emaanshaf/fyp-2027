import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, globalStyles } from '../theme';
import { learning, TOPICS } from '../services/learningEngine';
import { deckSummaries, enrollDeck, enrollAll } from '../services/decks';
import { LEVELS, withProgress, levelProgress, nextLesson } from '../data/curriculum';

/**
 * The learning hub.
 *
 * Three things stacked by usefulness: what's due right now, what the engine
 * thinks you should do next, and the curriculum itself. Progress is persisted
 * through the learning engine — the previous version kept completion in
 * component state, so it vanished the moment you navigated away.
 */
export default function LearningPathScreen({ navigation }) {
  const [selectedLevel, setSelectedLevel] = useState('beginner');
  const [completed, setCompleted] = useState({});
  const [stats, setStats] = useState(null);
  const [recs, setRecs] = useState([]);
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    // First run seeds the built-in decks; enroll is idempotent, so returning
    // users keep every bit of their scheduling history.
    await enrollAll();
    const [profile, s, r, d] = await Promise.all([
      learning.profile(),
      learning.stats(),
      learning.recommendations(),
      deckSummaries(),
    ]);
    setCompleted(profile.completed || {});
    setStats(s);
    setRecs(r);
    setDecks(d);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const toggleLesson = async (lesson) => {
    const updated = await learning.completeLesson(lesson.id, !completed[lesson.id]);
    setCompleted(updated);
    if (lesson.deck) await enrollDeck(lesson.deck);
    const [s, r, d] = await Promise.all([
      learning.stats(),
      learning.recommendations(),
      deckSummaries(),
    ]);
    setStats(s); setRecs(r); setDecks(d);
  };

  const openLesson = async (lesson) => {
    if (lesson.deck) await enrollDeck(lesson.deck);
    if (lesson.screen) navigation.navigate(lesson.screen);
  };

  if (loading) {
    return (
      <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
        <View style={[{ flex: 1 }, globalStyles.center]}>
          <ActivityIndicator color={COLORS.gold} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const lessons = withProgress(completed);
  const levels = levelProgress(completed);
  const next = nextLesson(completed);
  const visible = lessons.filter(l => l.level === selectedLevel);

  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />
        }
      >
        {/* ── Today ─────────────────────────────────────────────────────── */}
        <View style={styles.hero}>
          <View style={globalStyles.spaceBetween}>
            <View>
              <Text style={styles.heroLabel}>Your learning</Text>
              <Text style={styles.heroValue}>{Math.round(stats.overall * 100)}% mastered</Text>
            </View>
            <View style={styles.streakChip}>
              <Ionicons name="flame" size={14} color={COLORS.amber} />
              <Text style={styles.streakText}>{stats.streak} day{stats.streak === 1 ? '' : 's'}</Text>
            </View>
          </View>

          <View style={styles.masteryTrack}>
            <View style={[styles.masteryFill, { width: `${Math.round(stats.overall * 100)}%` }]} />
          </View>

          <View style={styles.statRow}>
            <Stat value={stats.due} label="due now" color={stats.due ? COLORS.gold : COLORS.textSecondary} />
            <Stat value={stats.learned} label="in progress" color={COLORS.blue} />
            <Stat value={stats.mastered} label="mastered" color={COLORS.emerald} />
            <Stat value={stats.total} label="total cards" color={COLORS.textSecondary} />
          </View>

          <TouchableOpacity
            style={[styles.reviewBtn, !stats.due && styles.reviewBtnMuted]}
            onPress={() =>
              navigation.navigate('ReviewSession', { mode: stats.due ? 'due' : 'new' })
            }
            activeOpacity={0.85}
          >
            <Ionicons
              name={stats.due ? 'play' : 'add-circle-outline'}
              size={18}
              color={stats.due ? COLORS.bg : COLORS.gold}
            />
            <Text style={[styles.reviewBtnText, !stats.due && { color: COLORS.gold }]}>
              {stats.due ? `Review ${stats.due} card${stats.due === 1 ? '' : 's'}` : 'Learn new cards'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── What to do next ───────────────────────────────────────────── */}
        {recs.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Suggested next</Text>
            {recs.map((r, i) => (
              <TouchableOpacity
                key={i}
                style={styles.recCard}
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate('ReviewSession', {
                    topic: r.topic,
                    mode: r.kind === 'learn' ? 'new' : 'due',
                  })
                }
              >
                <View
                  style={[
                    styles.recIcon,
                    { backgroundColor: (TOPICS[r.topic]?.color || COLORS.gold) + '18' },
                  ]}
                >
                  <Ionicons
                    name={r.kind === 'review' ? 'refresh' : r.kind === 'strengthen' ? 'trending-up' : 'add'}
                    size={18}
                    color={TOPICS[r.topic]?.color || COLORS.gold}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.recTitle}>{r.title}</Text>
                  <Text style={styles.recDetail}>{r.detail}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* ── Decks ─────────────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Decks</Text>
        <View style={styles.deckRow}>
          {decks.map(d => (
            <TouchableOpacity
              key={d.id}
              style={styles.deckCard}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('ReviewSession', { topic: d.topic })}
            >
              <View style={globalStyles.spaceBetween}>
                <Ionicons name={d.icon || 'albums'} size={18} color={d.color || COLORS.gold} />
                {d.due > 0 && (
                  <View style={styles.dueBadge}>
                    <Text style={styles.dueBadgeText}>{d.due}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.deckLabel}>{d.label}</Text>
              <Text style={styles.deckMeta}>
                {d.learned}/{d.total} learned
              </Text>
              <View style={styles.deckTrack}>
                <View
                  style={[
                    styles.deckFill,
                    { width: `${Math.round(d.progress * 100)}%`, backgroundColor: d.color || COLORS.gold },
                  ]}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Curriculum ────────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Learning path</Text>

        {next && (
          <View style={styles.nextBanner}>
            <Ionicons name="navigate" size={16} color={COLORS.gold} />
            <Text style={styles.nextText}>
              Next up: <Text style={styles.nextBold}>{next.title}</Text>
            </Text>
          </View>
        )}

        <View style={styles.tabRow}>
          {levels.map(level => (
            <TouchableOpacity
              key={level.id}
              style={[styles.tab, selectedLevel === level.id && { borderColor: level.color }]}
              onPress={() => setSelectedLevel(level.id)}
            >
              <Text style={[styles.tabText, selectedLevel === level.id && { color: level.color }]}>
                {level.name}
              </Text>
              <Text style={styles.tabProgress}>{level.done}/{level.total}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {visible.map(lesson => (
          <View
            key={lesson.id}
            style={[
              styles.lessonCard,
              lesson.done && styles.lessonDone,
              !lesson.unlocked && styles.lessonLocked,
            ]}
          >
            <TouchableOpacity
              onPress={() => lesson.unlocked && toggleLesson(lesson)}
              disabled={!lesson.unlocked}
              hitSlop={8}
            >
              <Ionicons
                name={lesson.done ? 'checkmark-circle' : lesson.unlocked ? 'ellipse-outline' : 'lock-closed'}
                size={24}
                color={lesson.done ? COLORS.emerald : lesson.unlocked ? COLORS.textSecondary : COLORS.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={{ flex: 1 }}
              activeOpacity={lesson.unlocked && lesson.screen ? 0.7 : 1}
              onPress={() => lesson.unlocked && openLesson(lesson)}
            >
              <View style={styles.lessonTitleRow}>
                <Ionicons name={lesson.icon} size={14} color={COLORS.textSecondary} />
                <Text style={[styles.lessonTitle, lesson.done && styles.lessonTitleDone]}>
                  {lesson.title}
                </Text>
              </View>
              <Text style={styles.lessonDesc}>{lesson.desc}</Text>

              {!lesson.unlocked ? (
                <Text style={styles.lessonLockedNote}>
                  Unlocks after {lesson.blockedBy.join(' and ')}
                </Text>
              ) : (
                <View style={styles.lessonMetaRow}>
                  <Text style={styles.lessonMeta}>~{lesson.minutes} min</Text>
                  {lesson.screen && (
                    <Text style={[styles.lessonMeta, { color: COLORS.gold }]}>Open module →</Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ value, label, color }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    padding: 20, borderRadius: 24, marginBottom: 24,
    backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.gold + '30',
  },
  heroLabel: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  heroValue: { color: COLORS.gold, fontSize: 26, fontWeight: '900', marginTop: 2 },
  streakChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
    backgroundColor: COLORS.amber + '18',
  },
  streakText: { color: COLORS.amber, fontSize: 12, fontWeight: '700' },
  masteryTrack: {
    height: 6, borderRadius: 3, marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden',
  },
  masteryFill: { height: '100%', borderRadius: 3, backgroundColor: COLORS.gold },
  statRow: { flexDirection: 'row', marginTop: 18 },
  stat: { flex: 1 },
  statValue: { fontSize: 19, fontWeight: '900' },
  statLabel: { color: COLORS.textSecondary, fontSize: 10, marginTop: 2 },
  reviewBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.gold, borderRadius: 14, paddingVertical: 14, marginTop: 20,
  },
  reviewBtnMuted: {
    backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.gold + '55',
  },
  reviewBtnText: { color: COLORS.bg, fontWeight: '800', fontSize: 15 },

  sectionTitle: {
    color: COLORS.textPrimary, fontSize: 16, fontWeight: '800', marginBottom: 12, marginTop: 4,
  },

  recCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 8,
    borderRadius: 16, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  recIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  recTitle: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '700' },
  recDetail: { color: COLORS.textSecondary, fontSize: 11, marginTop: 2 },

  deckRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  deckCard: {
    flexGrow: 1, flexBasis: '30%', minWidth: 140, padding: 14, borderRadius: 16,
    backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  deckLabel: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '700', marginTop: 10 },
  deckMeta: { color: COLORS.textSecondary, fontSize: 11, marginTop: 2 },
  deckTrack: {
    height: 4, borderRadius: 2, marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden',
  },
  deckFill: { height: '100%', borderRadius: 2 },
  dueBadge: {
    minWidth: 20, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999,
    backgroundColor: COLORS.gold, alignItems: 'center',
  },
  dueBadgeText: { color: COLORS.bg, fontSize: 10, fontWeight: '900' },

  nextBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 14,
    backgroundColor: COLORS.gold + '12', borderWidth: 1, borderColor: COLORS.gold + '30',
    marginBottom: 14,
  },
  nextText: { color: COLORS.textSecondary, fontSize: 13, flex: 1 },
  nextBold: { color: COLORS.gold, fontWeight: '800' },

  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: {
    flex: 1, paddingVertical: 12, borderRadius: 14, backgroundColor: COLORS.glass,
    borderWidth: 1, borderColor: COLORS.glassBorder, alignItems: 'center',
  },
  tabText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '700' },
  tabProgress: { color: COLORS.textSecondary, fontSize: 10, marginTop: 2 },

  lessonCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16, marginBottom: 8,
    borderRadius: 16, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  lessonDone: { borderColor: COLORS.emerald + '30' },
  lessonLocked: { opacity: 0.5 },
  lessonTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lessonTitle: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '700', flex: 1 },
  lessonTitleDone: { color: COLORS.emerald },
  lessonDesc: { color: COLORS.textSecondary, fontSize: 11, marginTop: 4, lineHeight: 16 },
  lessonMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  lessonMeta: { color: COLORS.textSecondary, fontSize: 10, fontWeight: '600' },
  lessonLockedNote: { color: COLORS.amber, fontSize: 10, marginTop: 8, fontStyle: 'italic' },
});
