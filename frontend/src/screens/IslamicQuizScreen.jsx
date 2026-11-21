import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useGlobalStyles, useThemedStyles } from '../theme';
import { QUIZ_CATEGORIES as CATEGORIES, QUIZ_DATA } from '../data/quiz';


export default function IslamicQuizScreen() {
  // ── Live theme hooks (replaces frozen module-level COLORS) ────────────
  const COLORS = useColors();
  const globalStyles = useGlobalStyles();
  const styles = useThemedStyles(makeStyles);

  const [selectedCat, setSelectedCat] = useState(null);
  const [quizActive, setQuizActive] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalAttempted, setTotalAttempted] = useState(0);

  const startQuiz = (catId) => {
    setSelectedCat(catId);
    const qs = (QUIZ_DATA[catId] || []).sort(() => Math.random() - 0.5).slice(0, 10);
    setQuestions(qs);
    setQuizActive(true);
    setCurrentQ(0);
    setScore(0);
    setSelected(null);
    setShowResult(false);
    setQuizFinished(false);
  };

  const selectAnswer = (idx) => {
    if (showResult) return;
    setSelected(idx);
    setShowResult(true);
    setTotalAttempted(t => t + 1);
    if (idx === questions[currentQ].answer) {
      setScore(s => s + 1);
      setTotalCorrect(t => t + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQ + 1 >= questions.length) {
      setQuizFinished(true);
      return;
    }
    setCurrentQ(c => c + 1);
    setSelected(null);
    setShowResult(false);
  };

  if (!selectedCat) {
    return (
      <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          <Text style={styles.pageTitle}>Islamic Knowledge Quiz</Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginBottom: 20 }}>
            Test your knowledge across different topics
          </Text>

          <View style={styles.statsOverview}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{totalAttempted}</Text>
              <Text style={styles.statLabel}>Attempted</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: COLORS.emerald }]}>{totalCorrect}</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: COLORS.gold }]}>
                {totalAttempted > 0 ? Math.round(totalCorrect / totalAttempted * 100) : 0}%
              </Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>
          </View>

          {CATEGORIES.map(cat => (
            <TouchableOpacity key={cat.id} style={styles.catCard} onPress={() => startQuiz(cat.id)}>
              <View style={[styles.catIcon, { backgroundColor: cat.color + '18' }]}>
                <Ionicons name={cat.icon} size={24} color={cat.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.catName}>{cat.name}</Text>
                <Text style={styles.catInfo}>{cat.questions} questions</Text>
              </View>
              <Ionicons name="play-circle" size={28} color={cat.color} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (quizFinished) {
    const pct = Math.round(score / questions.length * 100);
    return (
      <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
        <View style={styles.resultContainer}>
          <Ionicons name={pct >= 70 ? 'trophy' : pct >= 40 ? 'star' : 'refresh'}
            size={64} color={pct >= 70 ? COLORS.gold : COLORS.textSecondary} />
          <Text style={styles.resultTitle}>{pct >= 70 ? 'MashaAllah!' : pct >= 40 ? 'Good Effort!' : 'Keep Learning!'}</Text>
          <Text style={styles.resultScore}>{score}/{questions.length}</Text>
          <Text style={styles.resultPct}>{pct}% Correct</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setSelectedCat(null); setQuizActive(false); }}>
            <Text style={{ color: '#000', fontWeight: '800', fontSize: 16 }}>Back to Categories</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: COLORS.glass, borderColor: COLORS.glassBorder }]}
            onPress={() => startQuiz(selectedCat)}>
            <Text style={{ color: COLORS.textPrimary, fontWeight: '800', fontSize: 16 }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const q = questions[currentQ];
  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      <View style={styles.quizHeader}>
        <TouchableOpacity onPress={() => { setSelectedCat(null); setQuizActive(false); }}>
          <Ionicons name="close" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.quizProgress}>{currentQ + 1}/{questions.length}</Text>
        <Text style={styles.quizScore}>Score: {score}</Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((currentQ + 1) / questions.length) * 100}%` }]} />
      </View>

      <View style={styles.questionCard}>
        <Text style={styles.questionText}>{q.q}</Text>
        {q.options.map((opt, i) => {
          let style = styles.optionBtn;
          let textColor = COLORS.textPrimary;
          if (showResult) {
            if (i === q.answer) { style = [styles.optionBtn, styles.optionCorrect]; textColor = '#fff'; }
            else if (i === selected) { style = [styles.optionBtn, styles.optionWrong]; textColor = '#fff'; }
          } else if (i === selected) {
            style = [styles.optionBtn, styles.optionSelected];
          }
          return (
            <TouchableOpacity key={i} style={style} onPress={() => selectAnswer(i)} disabled={showResult}>
              <Text style={[styles.optionText, { color: textColor }]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* The explanation is the point of the quiz: a wrong answer should leave
          the user knowing why, not just that they missed it. */}
      {showResult && q.explanation ? (
        <View style={styles.explainCard}>
          <Ionicons
            name={selected === q.answer ? 'checkmark-circle' : 'information-circle'}
            size={16}
            color={selected === q.answer ? COLORS.emerald : COLORS.amber}
          />
          <Text style={styles.explainText}>{q.explanation}</Text>
        </View>
      ) : null}

      {showResult && (
        <TouchableOpacity style={styles.nextBtn} onPress={nextQuestion}>
          <Text style={{ color: '#000', fontWeight: '800', fontSize: 16 }}>
            {currentQ + 1 >= questions.length ? 'See Results' : 'Next Question'}
          </Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const makeStyles = (COLORS) => StyleSheet.create({
  explainCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    marginHorizontal: 16, marginBottom: 12, padding: 14, borderRadius: 14,
    backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  explainText: { flex: 1, color: COLORS.textSecondary, fontSize: 13, lineHeight: 19 },
  pageTitle: { color: COLORS.gold, fontSize: 22, fontWeight: '900' },
  statsOverview: {
    flexDirection: 'row', gap: 10, marginBottom: 20, padding: 16, borderRadius: 18,
    backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statNum: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '900' },
  statLabel: { color: COLORS.textSecondary, fontSize: 10, fontWeight: '600' },
  catCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, marginBottom: 10,
    borderRadius: 18, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  catIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  catName: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '800' },
  catInfo: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  quizHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, paddingBottom: 8,
  },
  quizProgress: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '800' },
  quizScore: { color: COLORS.gold, fontSize: 14, fontWeight: '700' },
  progressBar: {
    height: 4, marginHorizontal: 16, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2, backgroundColor: COLORS.gold },
  questionCard: { flex: 1, padding: 16 },
  questionText: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 20, lineHeight: 26 },
  optionBtn: {
    padding: 16, borderRadius: 14, marginBottom: 10, backgroundColor: COLORS.glass,
    borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  optionSelected: { borderColor: COLORS.gold, backgroundColor: 'rgba(255, 255, 255,0.08)' },
  optionCorrect: { backgroundColor: COLORS.emerald, borderColor: COLORS.emerald },
  optionWrong: { backgroundColor: COLORS.red, borderColor: COLORS.red },
  optionText: { fontSize: 15, fontWeight: '600' },
  nextBtn: {
    margin: 16, padding: 16, borderRadius: 16, backgroundColor: COLORS.gold, alignItems: 'center',
  },
  resultContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  resultTitle: { color: COLORS.textPrimary, fontSize: 24, fontWeight: '900', marginTop: 20 },
  resultScore: { color: COLORS.gold, fontSize: 48, fontWeight: '900', marginTop: 10 },
  resultPct: { color: COLORS.textSecondary, fontSize: 16, marginTop: 4 },
  retryBtn: {
    width: '100%', padding: 16, borderRadius: 16, backgroundColor: COLORS.gold,
    alignItems: 'center', marginTop: 20,
  },
});
