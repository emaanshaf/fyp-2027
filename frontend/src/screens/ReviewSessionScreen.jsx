import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors, useGlobalStyles, useThemedStyles } from '../theme';
import { learning, GRADES, TOPICS } from '../services/learningEngine';
import { allItems } from '../services/decks';

/**
 * One spaced-repetition session.
 *
 * The interaction is deliberately two-step — see the prompt, commit to an
 * answer in your head, then reveal and grade yourself. Self-grading is what
 * makes SM-2 work; showing the answer alongside the prompt would turn the
 * whole thing into passive reading.
 */
export default function ReviewSessionScreen({ navigation, route }) {
  // ── Live theme hooks (replaces frozen module-level COLORS) ────────────
  const COLORS = useColors();
  const globalStyles = useGlobalStyles();
  const styles = useThemedStyles(makeStyles);

  const topic = route?.params?.topic ?? null;
  const mode = route?.params?.mode ?? 'due'; // 'due' | 'new'

  const [queue, setQueue] = useState(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [choice, setChoice] = useState(null);
  const [tally, setTally] = useState({ correct: 0, total: 0 });

  const shownAt = useRef(Date.now());
  const fade = useRef(new Animated.Value(0)).current;
  const items = useMemo(() => allItems(), []);

  const load = useCallback(async () => {
    const cards =
      mode === 'new'
        ? await learning.fresh({ limit: 15, topic })
        : await learning.due({ limit: 25, topic });
    // A card can outlive the content that produced it (a dua removed from the
    // dataset, say); drop those rather than rendering a blank prompt.
    setQueue(cards.filter(c => items[c.id]));
    setIndex(0);
    setRevealed(false);
    setChoice(null);
  }, [mode, topic, items]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    shownAt.current = Date.now();
  }, [index, fade]);

  const card = queue?.[index];
  const item = card ? items[card.id] : null;

  const reveal = () => {
    setRevealed(true);
    Haptics.selectionAsync().catch(() => {});
  };

  const answerQuiz = (i) => {
    if (revealed) return;
    setChoice(i);
    setRevealed(true);
    const right = i === item.correctIndex;
    Haptics.notificationAsync(
      right ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning
    ).catch(() => {});
  };

  const grade = async (key) => {
    if (!card) return;
    await learning.review(card.id, key, Date.now() - shownAt.current);
    setTally(t => ({
      correct: t.correct + (GRADES[key].quality >= 3 ? 1 : 0),
      total: t.total + 1,
    }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setRevealed(false);
    setChoice(null);
    setIndex(i => i + 1);
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (queue === null) {
    return (
      <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
        <View style={[{ flex: 1 }, globalStyles.center]}>
          <ActivityIndicator color={COLORS.gold} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  // ── Session finished (or nothing was due) ─────────────────────────────────
  if (!card) {
    const done = tally.total > 0;
    const accuracy = done ? Math.round((tally.correct / tally.total) * 100) : 0;
    return (
      <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
        <View style={[{ flex: 1, padding: 24 }, globalStyles.center]}>
          <View style={styles.doneRing}>
            <Ionicons
              name={done ? 'checkmark-done' : 'sparkles'}
              size={44}
              color={COLORS.gold}
            />
          </View>
          <Text style={styles.doneTitle}>
            {done ? 'Session complete' : 'Nothing due right now'}
          </Text>
          <Text style={styles.doneSub}>
            {done
              ? `${tally.correct} of ${tally.total} recalled — ${accuracy}% accuracy.`
              : 'Everything scheduled for today is done. Come back tomorrow, or start something new.'}
          </Text>

          {done && (
            <Text style={styles.doneNote}>
              Cards you found hard will come back sooner; the ones you knew are
              scheduled further out.
            </Text>
          )}

          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.primaryBtnText}>Back to Learning</Text>
          </TouchableOpacity>

          {!done && mode === 'due' && (
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => navigation.replace('ReviewSession', { topic, mode: 'new' })}
            >
              <Ionicons name="add-circle-outline" size={16} color={COLORS.gold} />
              <Text style={styles.secondaryBtnText}>Learn new cards</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ── A card ────────────────────────────────────────────────────────────────
  const topicMeta = TOPICS[card.topic] || {};
  const progress = (index / queue.length) * 100;
  const isQuiz = item.type === 'quiz';

  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="close" size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.counter}>
          {index + 1}/{queue.length}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24, flexGrow: 1 }}>
        <Animated.View style={{ opacity: fade, flex: 1 }}>
          <View style={[styles.topicPill, { backgroundColor: (topicMeta.color || COLORS.gold) + '18' }]}>
            <Ionicons name={topicMeta.icon || 'book'} size={12} color={topicMeta.color || COLORS.gold} />
            <Text style={[styles.topicPillText, { color: topicMeta.color || COLORS.gold }]}>
              {topicMeta.label || card.topic}
            </Text>
            {card.lapses > 2 && (
              <Text style={styles.troubleTag}>· needs work</Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.promptLabel}>
              {isQuiz ? 'Question' : item.type === 'name' ? 'Which Name is this?' : 'Recall'}
            </Text>
            <Text style={[styles.prompt, item.type === 'name' && styles.promptArabic]}>
              {item.prompt}
            </Text>
            {item.subPrompt ? <Text style={styles.subPrompt}>{item.subPrompt}</Text> : null}

            {isQuiz ? (
              <View style={styles.options}>
                {item.options.map((opt, i) => {
                  const isAnswer = i === item.correctIndex;
                  const picked = choice === i;
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.option,
                        revealed && isAnswer && styles.optionCorrect,
                        revealed && picked && !isAnswer && styles.optionWrong,
                      ]}
                      onPress={() => answerQuiz(i)}
                      disabled={revealed}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.optionText, revealed && isAnswer && { color: COLORS.emerald }]}>
                        {opt}
                      </Text>
                      {revealed && isAnswer && (
                        <Ionicons name="checkmark-circle" size={18} color={COLORS.emerald} />
                      )}
                      {revealed && picked && !isAnswer && (
                        <Ionicons name="close-circle" size={18} color={COLORS.red} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : revealed ? (
              <View style={styles.answerBox}>
                <View style={globalStyles.divider} />
                <Text style={[styles.answer, item.type === 'dua' && styles.answerArabic]}>
                  {item.answer}
                </Text>
                {item.transliteration ? (
                  <Text style={styles.translit}>{item.transliteration}</Text>
                ) : null}
                {item.detail ? <Text style={styles.detail}>{item.detail}</Text> : null}
              </View>
            ) : (
              <TouchableOpacity style={styles.revealBtn} onPress={reveal} activeOpacity={0.85}>
                <Ionicons name="eye-outline" size={18} color={COLORS.bg} />
                <Text style={styles.revealBtnText}>Show answer</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </ScrollView>

      {revealed && (
        <View style={styles.gradeBar}>
          <Text style={styles.gradeHint}>How well did you recall it?</Text>
          <View style={styles.gradeRow}>
            {Object.entries(GRADES).map(([key, g]) => (
              <TouchableOpacity
                key={key}
                style={[styles.gradeBtn, { borderColor: g.color + '55' }]}
                onPress={() => grade(key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.gradeLabel, { color: g.color }]}>{g.label}</Text>
                <Text style={styles.gradeSub}>{g.hint}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const makeStyles = (COLORS) => StyleSheet.create({
  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  progressTrack: {
    flex: 1, height: 5, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: COLORS.gold },
  counter: { color: COLORS.textSecondary, fontSize: 12, fontVariant: ['tabular-nums'] },

  topicPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, marginBottom: 12,
  },
  topicPillText: { fontSize: 11, fontWeight: '700' },
  troubleTag: { fontSize: 11, color: COLORS.amber },

  card: {
    backgroundColor: COLORS.glass, borderRadius: 22, padding: 20,
    borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  promptLabel: {
    color: COLORS.textSecondary, fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
  },
  prompt: { color: COLORS.textPrimary, fontSize: 19, fontWeight: '700', lineHeight: 28 },
  promptArabic: { fontSize: 34, textAlign: 'center', lineHeight: 58, marginVertical: 8 },
  subPrompt: { color: COLORS.textSecondary, fontSize: 13, marginTop: 6 },

  revealBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.gold, borderRadius: 14, paddingVertical: 14, marginTop: 22,
  },
  revealBtnText: { color: COLORS.bg, fontWeight: '800', fontSize: 15 },

  answerBox: { marginTop: 16 },
  answer: { color: COLORS.textPrimary, fontSize: 17, lineHeight: 26, marginTop: 10 },
  answerArabic: { fontSize: 24, lineHeight: 44, textAlign: 'right' },
  translit: { color: COLORS.goldLight, fontSize: 13, fontStyle: 'italic', marginTop: 10, lineHeight: 20 },
  detail: { color: COLORS.textSecondary, fontSize: 13, marginTop: 12, lineHeight: 20 },

  options: { gap: 8, marginTop: 18 },
  option: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  optionCorrect: { borderColor: COLORS.emerald, backgroundColor: COLORS.emerald + '14' },
  optionWrong: { borderColor: COLORS.red, backgroundColor: COLORS.red + '14' },
  optionText: { color: COLORS.textPrimary, fontSize: 14, flex: 1, marginRight: 8 },

  gradeBar: {
    padding: 16, borderTopWidth: 1, borderTopColor: COLORS.glassBorder,
    backgroundColor: COLORS.bgSecondary,
  },
  gradeHint: {
    color: COLORS.textSecondary, fontSize: 12, textAlign: 'center', marginBottom: 10,
  },
  gradeRow: { flexDirection: 'row', gap: 8 },
  gradeBtn: {
    flex: 1, paddingVertical: 12, paddingHorizontal: 4, borderRadius: 14,
    borderWidth: 1, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)',
  },
  gradeLabel: { fontSize: 13, fontWeight: '800' },
  gradeSub: { color: COLORS.textSecondary, fontSize: 9, marginTop: 3, textAlign: 'center' },

  doneRing: {
    width: 92, height: 92, borderRadius: 46, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.gold + '40', backgroundColor: COLORS.gold + '12',
  },
  doneTitle: { color: COLORS.textPrimary, fontSize: 21, fontWeight: '900', marginTop: 20 },
  doneSub: {
    color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 21,
  },
  doneNote: {
    color: COLORS.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 14,
    lineHeight: 18, opacity: 0.8, paddingHorizontal: 12,
  },
  primaryBtn: {
    backgroundColor: COLORS.gold, borderRadius: 14, paddingVertical: 14,
    paddingHorizontal: 32, marginTop: 28,
  },
  primaryBtnText: { color: COLORS.bg, fontWeight: '800', fontSize: 15 },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, padding: 8,
  },
  secondaryBtnText: { color: COLORS.gold, fontWeight: '700', fontSize: 14 },
});
