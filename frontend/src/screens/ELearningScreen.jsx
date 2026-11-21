// A small structured course library — lessons, review questions and progress.
//
// Progress is stored locally. Lessons expand in place so reading never loses
// the course context, and the review questions give immediate explanations
// rather than only a score.

import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors, useGlobalStyles, useThemedStyles } from '../theme';
import { useLanguage } from '../context/LanguageContext';
import { useShare } from '../context/ShareContext';
import { APP_CONFIG } from '../config/appConfig';
import { COURSES, COURSE_CATEGORIES, COURSE_NOTE } from '../data/courses';

const PROGRESS_KEY = 'qitab_elearning_progress';

const EMPTY_PROGRESS = { lessons: [], quizBest: null };

export default function ELearningScreen() {
  const COLORS = useColors();
  const globalStyles = useGlobalStyles();
  const styles = useThemedStyles(makeStyles);
  const { isUrdu, t } = useLanguage();
  const { share } = useShare();

  const [category, setCategory] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [openLesson, setOpenLesson] = useState(null);
  const [progress, setProgress] = useState({});
  const [answers, setAnswers] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(PROGRESS_KEY)
      .then(raw => {
        const parsed = raw ? JSON.parse(raw) : {};
        if (parsed && typeof parsed === 'object') setProgress(parsed);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const progressFor = (courseId) => ({
    ...EMPTY_PROGRESS,
    ...(progress[courseId] || {}),
  });

  const persist = async (next) => {
    setProgress(next);
    await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
  };

  const toggleLesson = async (courseId, lessonIndex) => {
    const current = progressFor(courseId);
    const has = current.lessons.includes(lessonIndex);
    const lessons = has
      ? current.lessons.filter(i => i !== lessonIndex)
      : [...current.lessons, lessonIndex].sort((a, b) => a - b);
    await persist({ ...progress, [courseId]: { ...current, lessons } });
  };

  const chooseAnswer = async (course, questionIndex, optionIndex) => {
    const courseAnswers = {
      ...(answers[course.id] || {}),
      [questionIndex]: optionIndex,
    };
    setAnswers(prev => ({ ...prev, [course.id]: courseAnswers }));

    if (Object.keys(courseAnswers).length === course.quiz.length) {
      const score = course.quiz.reduce(
        (total, question, index) => total + (courseAnswers[index] === question.answer ? 1 : 0),
        0
      );
      const current = progressFor(course.id);
      if (current.quizBest == null || score > current.quizBest) {
        await persist({
          ...progress,
          [course.id]: { ...current, quizBest: score },
        });
      }
    }
  };

  const retryQuiz = (courseId) => {
    setAnswers(prev => {
      const next = { ...prev };
      delete next[courseId];
      return next;
    });
  };

  const totals = useMemo(() => {
    const lessons = COURSES.reduce((sum, course) => sum + course.lessons.length, 0);
    const completed = COURSES.reduce(
      (sum, course) => sum + progressFor(course.id).lessons.length,
      0
    );
    return { lessons, completed, percent: Math.round((completed / lessons) * 100) };
  }, [progress]);

  const filtered = category === 'all'
    ? COURSES
    : COURSES.filter(course => course.category === category);

  const selected = COURSES.find(course => course.id === selectedId) || null;

  const shareCourse = async (course) => {
    await share({
      title: course.title,
      message: `${course.title} (${course.arabic})\n\n${course.summary}\n\n${course.outcomes.map(o => `• ${o}`).join('\n')}`,
      url: APP_CONFIG.shareUrl('/e-learning'),
    });
  };

  // ── Course detail ──────────────────────────────────────────────────────
  if (selected) {
    const accent = COLORS[selected.accent] || COLORS.gold;
    const courseProgress = progressFor(selected.id);
    const percent = Math.round((courseProgress.lessons.length / selected.lessons.length) * 100);
    const courseAnswers = answers[selected.id] || {};
    const answeredCount = Object.keys(courseAnswers).length;
    const score = selected.quiz.reduce(
      (total, question, index) => total + (courseAnswers[index] === question.answer ? 1 : 0),
      0
    );

    return (
      <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 44 }}>
          <TouchableOpacity
            onPress={() => { setSelectedId(null); setOpenLesson(null); }}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Back to all courses"
          >
            <Ionicons name="arrow-back" size={17} color={COLORS.textPrimary} />
            <Text style={styles.backText}>All courses</Text>
          </TouchableOpacity>

          <LinearGradient
            colors={[accent + '38', COLORS.bgSecondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.detailHero, { borderColor: accent + '45' }]}
          >
            <View style={[styles.detailIcon, { backgroundColor: accent + '22', borderColor: accent + '55' }]}>
              <Ionicons name={selected.icon} size={25} color={accent} />
            </View>
            <Text style={styles.detailEyebrow}>{selected.level.toUpperCase()} · {selected.minutes} MIN</Text>
            <Text style={styles.detailTitle}>{selected.title}</Text>
            <Text style={[styles.detailArabic, { color: accent }]}>{selected.arabic}</Text>
            <Text style={styles.detailSummary}>{selected.summary}</Text>

            <View style={styles.detailMeta}>
              <View style={styles.metaPill}>
                <Ionicons name="albums-outline" size={12} color={COLORS.textSecondary} />
                <Text style={styles.metaText}>{selected.lessons.length} lessons</Text>
              </View>
              <View style={styles.metaPill}>
                <Ionicons name="help-circle-outline" size={12} color={COLORS.textSecondary} />
                <Text style={styles.metaText}>{selected.quiz.length} questions</Text>
              </View>
              {courseProgress.quizBest != null ? (
                <View style={styles.metaPill}>
                  <Ionicons name="trophy-outline" size={12} color={COLORS.gold} />
                  <Text style={[styles.metaText, { color: COLORS.gold }]}>
                    Best {courseProgress.quizBest}/{selected.quiz.length}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.detailProgressTrack}>
              <View style={[styles.detailProgressFill, { width: `${percent}%`, backgroundColor: accent }]} />
            </View>
            <Text style={styles.detailProgressText}>
              {courseProgress.lessons.length} of {selected.lessons.length} lessons complete
            </Text>
          </LinearGradient>

          <View style={styles.outcomesCard}>
            <Text style={styles.outcomesTitle}>What you will learn</Text>
            {selected.outcomes.map(outcome => (
              <View key={outcome} style={styles.outcomeRow}>
                <Ionicons name="checkmark-circle" size={15} color={COLORS.emerald} />
                <Text style={styles.outcomeText}>{outcome}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Lessons</Text>
          {selected.lessons.map((lesson, index) => {
            const done = courseProgress.lessons.includes(index);
            const open = openLesson === index;
            return (
              <View key={lesson.title} style={[styles.lessonCard, open && { borderColor: accent + '50' }]}>
                <TouchableOpacity
                  onPress={() => setOpenLesson(open ? null : index)}
                  style={styles.lessonHead}
                  activeOpacity={0.82}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: open }}
                  accessibilityLabel={`Lesson ${index + 1}: ${lesson.title}`}
                >
                  <View style={[styles.lessonNum, {
                    backgroundColor: done ? COLORS.emerald + '1A' : accent + '15',
                    borderColor: done ? COLORS.emerald + '55' : accent + '38',
                  }]}>
                    {done ? (
                      <Ionicons name="checkmark" size={15} color={COLORS.emerald} />
                    ) : (
                      <Text style={[styles.lessonNumText, { color: accent }]}>{index + 1}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.lessonTitle}>{lesson.title}</Text>
                    <Text style={styles.lessonSummary}>{lesson.summary}</Text>
                  </View>
                  <Ionicons
                    name={open ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>

                {open ? (
                  <View style={styles.lessonBody}>
                    {lesson.points.map(point => (
                      <View key={point} style={styles.pointRow}>
                        <View style={[styles.pointDot, { backgroundColor: accent }]} />
                        <Text style={styles.pointText}>{point}</Text>
                      </View>
                    ))}
                    {lesson.practice ? (
                      <View style={styles.practice}>
                        <Ionicons name="create-outline" size={13} color={COLORS.gold} />
                        <Text style={styles.practiceText}>{lesson.practice}</Text>
                      </View>
                    ) : null}
                    <TouchableOpacity
                      onPress={() => toggleLesson(selected.id, index)}
                      style={[styles.completeBtn, done && { backgroundColor: COLORS.emerald + '16', borderColor: COLORS.emerald + '45' }]}
                      accessibilityRole="button"
                      accessibilityLabel={done ? `Mark ${lesson.title} as not complete` : `Mark ${lesson.title} complete`}
                    >
                      <Ionicons
                        name={done ? 'checkmark-circle' : 'ellipse-outline'}
                        size={16}
                        color={done ? COLORS.emerald : COLORS.textSecondary}
                      />
                      <Text style={[styles.completeText, done && { color: COLORS.emerald }]}>
                        {done ? 'Completed' : 'Mark lesson complete'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            );
          })}

          <View style={styles.shareRow}>
            <TouchableOpacity
              onPress={() => shareCourse(selected)}
              style={styles.shareBtn}
              accessibilityRole="button"
              accessibilityLabel={`Share ${selected.title}`}
            >
              <Ionicons name="share-social-outline" size={16} color={COLORS.gold} />
              <Text style={styles.shareText}>{t('common.share', 'Share')}</Text>
            </TouchableOpacity>
          </View>

          {/* Review */}
          <Text style={styles.sectionTitle}>Review questions</Text>
          <Text style={styles.quizIntro}>
            Answer all {selected.quiz.length} questions to set a best score. Each
            answer shows an explanation immediately.
          </Text>
          {selected.quiz.map((question, qIndex) => {
            const chosen = courseAnswers[qIndex];
            const answered = chosen != null;
            return (
              <View key={question.q} style={styles.quizCard}>
                <Text style={styles.quizQ}>{qIndex + 1}. {question.q}</Text>
                {question.options.map((option, oIndex) => {
                  const isChosen = chosen === oIndex;
                  const isCorrect = answered && question.answer === oIndex;
                  const isWrong = answered && isChosen && oIndex !== question.answer;
                  return (
                    <TouchableOpacity
                      key={option}
                      onPress={() => chooseAnswer(selected, qIndex, oIndex)}
                      style={[
                        styles.option,
                        isCorrect && styles.optionCorrect,
                        isWrong && styles.optionWrong,
                        isChosen && !isCorrect && !isWrong && styles.optionChosen,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={option}
                      accessibilityState={{ selected: isChosen }}
                    >
                      <View style={[styles.optionMark, isCorrect && { backgroundColor: COLORS.emerald }, isWrong && { backgroundColor: COLORS.red }]}>
                        {isCorrect ? (
                          <Ionicons name="checkmark" size={12} color={COLORS.bg} />
                        ) : isWrong ? (
                          <Ionicons name="close" size={12} color={COLORS.bg} />
                        ) : (
                          <Text style={styles.optionLetter}>
                            {String.fromCharCode(65 + oIndex)}
                          </Text>
                        )}
                      </View>
                      <Text style={[styles.optionText, isCorrect && { color: COLORS.emerald }]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                {answered ? (
                  <Text style={styles.explanation}>{question.explanation}</Text>
                ) : null}
              </View>
            );
          })}

          {answeredCount === selected.quiz.length ? (
            <View style={styles.resultCard}>
              <Ionicons
                name={score === selected.quiz.length ? 'trophy' : 'ribbon-outline'}
                size={26}
                color={score === selected.quiz.length ? COLORS.gold : COLORS.emerald}
              />
              <Text style={styles.resultScore}>{score}/{selected.quiz.length}</Text>
              <Text style={styles.resultText}>
                {score === selected.quiz.length
                  ? 'Excellent — you have understood the course.'
                  : 'Review the explanations above and try again when you are ready.'}
              </Text>
              <TouchableOpacity
                onPress={() => retryQuiz(selected.id)}
                style={styles.retryBtn}
                accessibilityRole="button"
                accessibilityLabel="Retry quiz"
              >
                <Ionicons name="refresh-outline" size={15} color={COLORS.gold} />
                <Text style={styles.retryText}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Course list ────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 44 }}>
        <LinearGradient
          colors={[COLORS.primary, '#0D2A20', COLORS.bg]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroIcon}>
            <Ionicons name="school" size={24} color={COLORS.gold} />
          </View>
          <Text style={styles.heroEyebrow}>THE ONLINE MADRASAH</Text>
          <Text style={styles.heroTitle}>E-Learning Courses</Text>
          <Text style={[styles.heroSub, isUrdu && styles.urdu]}>
            {isUrdu
              ? 'قرآن، فقہ، سیرت اور عربی کے منظم کورسز — اپنی رفتار سے سیکھیں۔'
              : 'Short, structured courses in Qur’an, fiqh, history and Arabic. Read a lesson, answer a review question, keep your progress.'}
          </Text>

          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{COURSES.length}</Text>
              <Text style={styles.statLabel}>Courses</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>{totals.lessons}</Text>
              <Text style={styles.statLabel}>Lessons</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: COLORS.emerald }]}>{totals.completed}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
          </View>

          <View style={styles.heroTrack}>
            <View style={[styles.heroFill, { width: `${loaded ? totals.percent : 0}%` }]} />
          </View>
          <Text style={styles.heroProgressText}>
            {loaded ? `${totals.percent}% of the library complete` : 'Loading progress…'}
          </Text>
        </LinearGradient>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {COURSE_CATEGORIES.map(item => {
            const active = category === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => setCategory(item.id)}
                style={[styles.chip, active && styles.chipActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`Filter ${item.label}`}
              >
                <Text style={[styles.chipText, active && { color: COLORS.bg }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {filtered.map(course => {
          const accent = COLORS[course.accent] || COLORS.gold;
          const courseProgress = progressFor(course.id);
          const percent = Math.round((courseProgress.lessons.length / course.lessons.length) * 100);
          const started = courseProgress.lessons.length > 0;
          return (
            <TouchableOpacity
              key={course.id}
              onPress={() => { setSelectedId(course.id); setOpenLesson(null); }}
              style={[styles.courseCard, { borderColor: accent + '30' }]}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`${course.title}. ${course.level}. ${course.lessons.length} lessons.`}
            >
              <View style={styles.courseTop}>
                <View style={[styles.courseIcon, { backgroundColor: accent + '1A', borderColor: accent + '45' }]}>
                  <Ionicons name={course.icon} size={22} color={accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.courseTitleRow}>
                    <Text style={styles.courseTitle} numberOfLines={2}>{course.title}</Text>
                    <Ionicons name="chevron-forward" size={17} color={COLORS.textSecondary} />
                  </View>
                  <Text style={[styles.courseArabic, { color: accent }]}>{course.arabic}</Text>
                </View>
              </View>

              <Text style={styles.courseSummary} numberOfLines={3}>{course.summary}</Text>

              <View style={styles.courseMeta}>
                <View style={[styles.levelPill, { backgroundColor: accent + '15', borderColor: accent + '35' }]}>
                  <Text style={[styles.levelText, { color: accent }]}>{course.level}</Text>
                </View>
                <Text style={styles.metaDot}>·</Text>
                <Text style={styles.courseMetaText}>{course.lessons.length} lessons</Text>
                <Text style={styles.metaDot}>·</Text>
                <Text style={styles.courseMetaText}>{course.minutes} min</Text>
              </View>

              <View style={styles.courseTrack}>
                <View style={[styles.courseFill, { width: `${percent}%`, backgroundColor: accent }]} />
              </View>
              <View style={styles.courseFoot}>
                <Text style={styles.courseProgress}>
                  {started ? `${courseProgress.lessons.length}/${course.lessons.length} complete` : 'Not started'}
                </Text>
                <View style={styles.startPill}>
                  <Text style={[styles.startText, { color: accent }]}>
                    {started ? (percent === 100 ? 'Review' : 'Continue') : 'Start'}
                  </Text>
                  <Ionicons name="arrow-forward" size={12} color={accent} />
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={styles.noteCard}>
          <Ionicons name="information-circle-outline" size={17} color={COLORS.gold} />
          <Text style={styles.noteText}>{COURSE_NOTE}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = COLORS => StyleSheet.create({
  hero: {
    borderRadius: 22, padding: 20, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)', overflow: 'hidden',
  },
  heroIcon: {
    width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.26)', borderWidth: 1, borderColor: COLORS.gold + '50',
    marginBottom: 13,
  },
  heroEyebrow: { color: COLORS.gold, fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  heroTitle: { color: '#fff', fontSize: 25, fontWeight: '900', letterSpacing: -0.6, marginTop: 3 },
  heroSub: { color: 'rgba(255,255,255,0.76)', fontSize: 12, lineHeight: 19, marginTop: 7 },
  urdu: { fontFamily: 'NotoNastaliqUrdu', lineHeight: 28, textAlign: 'right' },

  stats: { flexDirection: 'row', alignItems: 'center', marginTop: 18 },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { color: '#fff', fontSize: 20, fontWeight: '900' },
  statLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 9.5, fontWeight: '700', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.7 },
  statDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.14)' },
  heroTrack: {
    height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden', marginTop: 16,
  },
  heroFill: { height: '100%', borderRadius: 3, backgroundColor: COLORS.emerald },
  heroProgressText: { color: 'rgba(255,255,255,0.65)', fontSize: 10, marginTop: 6 },

  chipRow: { gap: 7, paddingVertical: 16 },
  chip: {
    paddingHorizontal: 13, paddingVertical: 8, borderRadius: 999,
    backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  chipActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  chipText: { color: COLORS.textSecondary, fontSize: 11.5, fontWeight: '800' },

  courseCard: {
    backgroundColor: COLORS.glass, borderRadius: 18, borderWidth: 1,
    padding: 15, marginBottom: 11,
  },
  courseTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  courseIcon: {
    width: 44, height: 44, borderRadius: 14, alignItems: 'center',
    justifyContent: 'center', borderWidth: 1,
  },
  courseTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  courseTitle: { flex: 1, color: COLORS.textPrimary, fontSize: 15.5, fontWeight: '800', lineHeight: 20 },
  courseArabic: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  courseSummary: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 11 },
  courseMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 11 },
  levelPill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1 },
  levelText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  metaDot: { color: COLORS.textSecondary, fontSize: 10 },
  courseMetaText: { color: COLORS.textSecondary, fontSize: 10.5, fontWeight: '600' },
  courseTrack: {
    height: 4.5, borderRadius: 3, backgroundColor: COLORS.divider,
    overflow: 'hidden', marginTop: 12,
  },
  courseFill: { height: '100%', borderRadius: 3 },
  courseFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  courseProgress: { color: COLORS.textSecondary, fontSize: 10 },
  startPill: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  startText: { fontSize: 11, fontWeight: '800' },

  noteCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 8,
    backgroundColor: COLORS.gold + '0D', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: COLORS.gold + '28',
  },
  noteText: { flex: 1, color: COLORS.textSecondary, fontSize: 11.5, lineHeight: 18 },

  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    alignSelf: 'flex-start', marginBottom: 12,
  },
  backText: { color: COLORS.textPrimary, fontSize: 12.5, fontWeight: '700' },

  detailHero: {
    borderRadius: 20, padding: 18, borderWidth: 1, overflow: 'hidden',
  },
  detailIcon: {
    width: 48, height: 48, borderRadius: 15, alignItems: 'center',
    justifyContent: 'center', borderWidth: 1, marginBottom: 12,
  },
  detailEyebrow: { color: COLORS.textSecondary, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  detailTitle: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '900', letterSpacing: -0.5, marginTop: 4 },
  detailArabic: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  detailSummary: { color: COLORS.textSecondary, fontSize: 12.5, lineHeight: 19, marginTop: 9 },
  detailMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 13 },
  metaPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 999,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  metaText: { color: COLORS.textSecondary, fontSize: 9.5, fontWeight: '700' },
  detailProgressTrack: {
    height: 6, borderRadius: 3, backgroundColor: COLORS.divider,
    overflow: 'hidden', marginTop: 16,
  },
  detailProgressFill: { height: '100%', borderRadius: 3 },
  detailProgressText: { color: COLORS.textSecondary, fontSize: 10, marginTop: 6 },

  outcomesCard: {
    backgroundColor: COLORS.glass, borderRadius: 16, borderWidth: 1,
    borderColor: COLORS.glassBorder, padding: 15, marginTop: 14,
  },
  outcomesTitle: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '800', marginBottom: 9 },
  outcomeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 7 },
  outcomeText: { flex: 1, color: COLORS.textSecondary, fontSize: 12, lineHeight: 18 },

  sectionTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '800', marginTop: 20, marginBottom: 10 },
  lessonCard: {
    backgroundColor: COLORS.glass, borderRadius: 15, borderWidth: 1,
    borderColor: COLORS.glassBorder, marginBottom: 9, overflow: 'hidden',
  },
  lessonHead: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13 },
  lessonNum: {
    width: 32, height: 32, borderRadius: 10, alignItems: 'center',
    justifyContent: 'center', borderWidth: 1,
  },
  lessonNumText: { fontSize: 12.5, fontWeight: '900' },
  lessonTitle: { color: COLORS.textPrimary, fontSize: 13.5, fontWeight: '800' },
  lessonSummary: { color: COLORS.textSecondary, fontSize: 11, lineHeight: 16, marginTop: 2 },
  lessonBody: { paddingHorizontal: 13, paddingBottom: 13, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.divider },
  pointRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  pointDot: { width: 5, height: 5, borderRadius: 3, marginTop: 7 },
  pointText: { flex: 1, color: COLORS.textSecondary, fontSize: 12, lineHeight: 19 },
  practice: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 3,
    backgroundColor: COLORS.gold + '0D', borderRadius: 9, padding: 10,
    borderWidth: 1, borderColor: COLORS.gold + '25',
  },
  practiceText: { flex: 1, color: COLORS.textSecondary, fontSize: 11.5, lineHeight: 17 },
  completeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    marginTop: 12, paddingVertical: 9, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  completeText: { color: COLORS.textPrimary, fontSize: 11.5, fontWeight: '700' },

  shareRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.gold + '35', backgroundColor: COLORS.gold + '0D',
  },
  shareText: { color: COLORS.gold, fontSize: 11.5, fontWeight: '700' },

  quizIntro: { color: COLORS.textSecondary, fontSize: 11.5, lineHeight: 18, marginTop: -4, marginBottom: 10 },
  quizCard: {
    backgroundColor: COLORS.glass, borderRadius: 16, borderWidth: 1,
    borderColor: COLORS.glassBorder, padding: 14, marginBottom: 10,
  },
  quizQ: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '800', lineHeight: 19, marginBottom: 10 },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    padding: 10, borderRadius: 10, borderWidth: 1,
    borderColor: COLORS.glassBorder, marginBottom: 7,
    backgroundColor: 'rgba(255,255,255,0.025)',
  },
  optionCorrect: { borderColor: COLORS.emerald + '70', backgroundColor: COLORS.emerald + '12' },
  optionWrong: { borderColor: COLORS.red + '70', backgroundColor: COLORS.red + '10' },
  optionChosen: { borderColor: COLORS.gold + '70' },
  optionMark: {
    width: 21, height: 21, borderRadius: 7, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  optionLetter: { color: COLORS.textSecondary, fontSize: 9.5, fontWeight: '800' },
  optionText: { flex: 1, color: COLORS.textSecondary, fontSize: 12, lineHeight: 17 },
  explanation: {
    color: COLORS.textSecondary, fontSize: 11, lineHeight: 17, marginTop: 4,
    paddingTop: 9, borderTopWidth: 1, borderTopColor: COLORS.divider,
    fontStyle: 'italic',
  },
  resultCard: {
    alignItems: 'center', backgroundColor: COLORS.glass, borderRadius: 18,
    borderWidth: 1, borderColor: COLORS.gold + '30', padding: 20, marginTop: 6,
  },
  resultScore: { color: COLORS.textPrimary, fontSize: 24, fontWeight: '900', marginTop: 6 },
  resultText: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 5 },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.gold + '40', backgroundColor: COLORS.gold + '0D',
  },
  retryText: { color: COLORS.gold, fontSize: 11.5, fontWeight: '800' },
});
