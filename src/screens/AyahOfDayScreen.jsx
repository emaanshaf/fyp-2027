import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Share, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, globalStyles } from '../theme';
import { shareVerse } from '../config/appConfig';

const INTEREST_CATEGORIES = [
  { id: 'anxiety', label: 'Anxiety & Worry', icon: 'shield-outline', color: COLORS.blue },
  { id: 'patience', label: 'Patience', icon: 'hourglass-outline', color: COLORS.emerald },
  { id: 'gratitude', label: 'Gratitude', icon: 'heart-outline', color: COLORS.gold },
  { id: 'forgiveness', label: 'Forgiveness', icon: 'water-outline', color: COLORS.purple },
  { id: 'love', label: 'Love & Mercy', icon: 'heart-circle-outline', color: COLORS.pink },
  { id: 'strength', label: 'Strength', icon: 'flash-outline', color: COLORS.amber },
  { id: 'hope', label: 'Hope', icon: 'sunny-outline', color: COLORS.cyan },
  { id: 'death', label: 'Afterlife', icon: 'skull-outline', color: COLORS.red },
];

const VERSES_BY_TOPIC = {
  anxiety: [
    { verse: '2:286', arabic: 'لَا يُكَلِّفُ ٱللَّهُ نَفْسًا إِلَّا وُسْعَهَا', translation: 'Allah does not burden a soul beyond that it can bear.', meaning: 'Whatever difficulty you face, Allah knows you can handle it. Trust in His wisdom.' },
    { verse: '13:28', arabic: 'أَلَا بِذِكْرِ ٱللَّهِ تَطْمَئِنُّ ٱلْقُلُوبُ', translation: 'Verily, in the remembrance of Allah do hearts find rest.', meaning: 'When anxiety strikes, turn to dhikr. Allah\'s remembrance brings tranquility to the heart.' },
    { verse: '65:3', arabic: 'وَمَن يَتَوَكَّلْ عَلَى ٱللَّهِ فَهُوَ حَسْبُهُ', translation: 'And whoever relies upon Allah, then He is sufficient for him.', meaning: 'Place your trust in Allah. He will take care of your affairs.' },
    { verse: '94:5-6', arabic: 'فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا', translation: 'For indeed, with hardship will be ease. Indeed, with hardship will be ease.', meaning: 'Every difficulty is paired with relief. Hold on — ease is coming.' },
  ],
  patience: [
    { verse: '2:153', arabic: 'ٱسْتَعِينُوا۟ بِٱلصَّبْرِ وَٱلصَّلَوٰةِ', translation: 'Seek help through patience and prayer.', meaning: 'Patience and Salah are the two greatest tools for overcoming any trial.' },
    { verse: '3:200', arabic: 'ٱصْبِرْ إِنَّ ٱللَّهَ لَا يُضِيعُ أَجْرَ ٱلْمُحْسِنِينَ', translation: 'Be patient. Indeed, Allah does not allow to be lost the reward of those who do good.', meaning: 'Your patience is never wasted. Allah rewards every bit of it.' },
    { verse: '11:115', arabic: 'وَٱصْبِرْ فَإِنَّ ٱللَّهَ لَا يُضِيعُ أَجْرَ ٱلْمُحْسِنِينَ', translation: 'And be patient, for indeed, Allah does not allow to be lost the reward of those who do good.', meaning: 'Patience is a form of worship. Continue doing good.' },
  ],
  gratitude: [
    { verse: '14:7', arabic: 'لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ', translation: 'If you are grateful, I will surely increase you.', meaning: 'Gratitude multiplies blessings. Thank Allah for what you have.' },
    { verse: '2:152', arabic: 'فَٱذْكُرُونِىٓ أَذْكُرْكُمْ', translation: 'So remember Me; I will remember you.', meaning: 'Gratitude begins with remembrance. The more you remember Allah, the more He honors you.' },
    { verse: '31:12', arabic: 'وَلَقَدْ ءَاتَيْنَا لُقْمَانَ ٱلْحِكْمَةَ أَنِ ٱشْكُرْ لِلَّهِ', translation: 'And We gave Luqman wisdom: Be grateful to Allah.', meaning: 'The first sign of wisdom is gratitude to Allah.' },
  ],
  forgiveness: [
    { verse: '39:53', arabic: 'قُلْ يَـٰعِبَادِىَ ٱلَّذِينَ أَسْرَفُوا۟ عَلَىٰٓ أَنفُسِهِمْ لَا تَقْنَطُوا۟ مِن رَّحْمَةِ ٱللَّهِ', translation: 'Say: O My servants who have transgressed against themselves, do not despair of the mercy of Allah.', meaning: 'No matter what you\'ve done, Allah\'s mercy is always greater.' },
    { verse: '110:3', arabic: 'وَقُلْ لِّلَّذِينَ ءَاتَوْا۟ ٱلْحُكْمَةَ إِنَّ ٱللَّهَ لَغَفُورٌ رَّحِيمٌ', translation: 'And say to those who have done well: Allah is Forgiving and Merciful.', meaning: 'Even those who do good are reminded of Allah\'s forgiveness.' },
  ],
  love: [
    { verse: '85:14', arabic: 'وَهُوَ ٱلْغَفُورُ ٱلْوَدُودُ', translation: 'And He is the Forgiving, the Loving.', meaning: 'Allah loves His servants more than a mother loves her child.' },
    { verse: '3:135', arabic: 'وَمَن يَفْعَلْ ذَٰلِكَ يُرِدْ إِصْلَاحًا فَإِنَّ ٱللَّهَ يُحِبُّ ٱلْمُصْلِحِينَ', translation: 'And whoever does that... and reforms — indeed, Allah loves those who make things good.', meaning: 'Allah loves those who try to improve themselves.' },
  ],
  strength: [
    { verse: '4:84', arabic: 'وَٱللَّهُ أَشَدُّ بَأْسًا وَأَشَدُّ تَنكِيلًا', translation: 'And Allah is mightier in power and stronger in punishment.', meaning: 'When you feel weak, remember that your Lord is the strongest.' },
    { verse: '22:40', arabic: 'وَلَيَنصُرَنَّ ٱللَّهُ مَن يَنصُرُهُ', translation: 'Allah will surely support those who support Him.', meaning: 'Help Allah\'s cause and He will give you victory.' },
  ],
  hope: [
    { verse: '93:5', arabic: 'وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ', translation: 'And your Lord is going to give you, and you will be satisfied.', meaning: 'The best is yet to come. Allah will give you beyond what you imagine.' },
    { verse: '94:5-6', arabic: 'فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا', translation: 'Indeed, with hardship comes ease.', meaning: 'No matter how difficult things are, ease is guaranteed.' },
  ],
  death: [
    { verse: '2:156', arabic: 'إِنَّا لِلَّهِ وَإِنَّآ إِلَيْهِ رَٰجِعُونَ', translation: 'Indeed we belong to Allah, and indeed to Him we will return.', meaning: 'This is the phrase of patience for the bereaved. Our true home is with Allah.' },
    { verse: '3:185', arabic: 'كُلُّ نَفْسٍ ذَآئِقَةُ ٱلْمَوْتِ', translation: 'Every soul will taste death.', meaning: 'Death is not an end, but a return to our Creator.' },
  ],
};

export default function AyahOfDayScreen() {
  const [selectedInterests, setSelectedInterests] = useState(['anxiety', 'patience']);
  const [currentVerse, setCurrentVerse] = useState(null);
  const [history, setHistory] = useState([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { loadInterests(); pickVerse(); }, []);
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, [currentVerse]);

  const loadInterests = async () => {
    const raw = await AsyncStorage.getItem('ayah_interests');
    if (raw) setSelectedInterests(JSON.parse(raw));
  };

  const saveInterests = async (interests) => {
    setSelectedInterests(interests);
    await AsyncStorage.setItem('ayah_interests', JSON.stringify(interests));
  };

  const toggleInterest = (id) => {
    const updated = selectedInterests.includes(id)
      ? selectedInterests.filter(i => i !== id)
      : [...selectedInterests, id];
    if (updated.length > 0) saveInterests(updated);
  };

  const pickVerse = () => {
    const topics = selectedInterests.length > 0 ? selectedInterests : ['anxiety'];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    const verses = VERSES_BY_TOPIC[randomTopic] || VERSES_BY_TOPIC.anxiety;
    const randomVerse = verses[Math.floor(Math.random() * verses.length)];
    setCurrentVerse({ ...randomVerse, topic: randomTopic });
    setHistory(prev => [randomVerse, ...prev].slice(0, 20));
  };

  const shareVerse = async () => {
    if (!currentVerse) return;
    try {
      await Share.share({
        message: `${currentVerse.arabic}\n\n${currentVerse.translation}\n\n💡 ${currentVerse.meaning}\n\n— Ayah of the Day | Qitab-e-Noor\nhttps://qitabe-noor.app/quran/${currentVerse.verse}`,
      });
    } catch {}
  };

  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* Verse Card */}
          {currentVerse && (
            <View style={styles.verseCard}>
              <View style={styles.verseGlow} />
              <View style={styles.verseContent}>
                <View style={styles.verseLabel}>
                  <Ionicons name="star" size={12} color={COLORS.gold} />
                  <Text style={styles.verseLabelText}>AYAH OF THE DAY</Text>
                </View>

                <Text style={styles.arabicText}>{currentVerse.arabic}</Text>
                <Text style={styles.translationText}>{currentVerse.translation}</Text>

                <View style={styles.divider} />

                <Text style={styles.meaningLabel}>💡 Reflection</Text>
                <Text style={styles.meaningText}>{currentVerse.meaning}</Text>

                <View style={styles.verseRef}>
                  <Ionicons name="book-outline" size={14} color={COLORS.gold} />
                  <Text style={styles.verseRefText}>Surah {currentVerse.verse}</Text>
                </View>
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity onPress={pickVerse} style={styles.actionBtn}>
                  <Ionicons name="refresh" size={18} color={COLORS.gold} />
                  <Text style={styles.actionText}>New Verse</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={shareVerse} style={styles.actionBtn}>
                  <Ionicons name="share-outline" size={18} color={COLORS.gold} />
                  <Text style={styles.actionText}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Interest Selection */}
          <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
            <Text style={styles.sectionTitle}>Your Interests</Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 12 }}>
              Select topics to personalize your daily verse
            </Text>
            <View style={styles.interestGrid}>
              {INTEREST_CATEGORIES.map(cat => {
                const active = selectedInterests.includes(cat.id);
                return (
                  <TouchableOpacity key={cat.id} onPress={() => toggleInterest(cat.id)}
                    style={[styles.interestChip, active && { backgroundColor: cat.color + '20', borderColor: cat.color }]}>
                    <Ionicons name={cat.icon} size={14} color={active ? cat.color : COLORS.textSecondary} />
                    <Text style={[styles.interestText, active && { color: cat.color }]}>{cat.label}</Text>
                    {active && <Ionicons name="checkmark-circle" size={12} color={cat.color} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* History */}
          {history.length > 1 && (
            <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
              <Text style={styles.sectionTitle}>Recent Verses</Text>
              {history.slice(1, 6).map((v, i) => (
                <View key={i} style={styles.historyCard}>
                  <Text style={styles.historyText} numberOfLines={2}>{v.translation}</Text>
                  <Text style={styles.historyRef}>— {v.verse}</Text>
                </View>
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  verseCard: {
    margin: 16, borderRadius: 24, overflow: 'hidden',
    backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.gold + '30',
  },
  verseGlow: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255, 255, 255,0.05)' },
  verseContent: { padding: 24 },
  verseLabel: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255,0.1)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  verseLabelText: { color: COLORS.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  arabicText: {
    color: COLORS.gold, fontSize: 26, lineHeight: 42, textAlign: 'right',
    writingDirection: 'rtl', marginBottom: 16,
  },
  translationText: {
    color: COLORS.textPrimary, fontSize: 17, lineHeight: 26, fontWeight: '600', fontStyle: 'italic',
  },
  divider: { height: 1, backgroundColor: COLORS.glassBorder, marginVertical: 16 },
  meaningLabel: { color: COLORS.gold, fontSize: 13, fontWeight: '800', marginBottom: 6 },
  meaningText: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 22 },
  verseRef: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16,
    backgroundColor: 'rgba(255, 255, 255,0.08)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  verseRefText: { color: COLORS.gold, fontSize: 12, fontWeight: '700' },
  actionsRow: {
    flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.glassBorder,
  },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 14, borderRightWidth: 1, borderRightColor: COLORS.glassBorder,
  },
  actionText: { color: COLORS.gold, fontSize: 13, fontWeight: '700' },
  sectionTitle: { color: COLORS.gold, fontSize: 17, fontWeight: '800', marginBottom: 8 },
  interestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interestChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 14, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  interestText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  historyCard: {
    padding: 14, marginBottom: 8, borderRadius: 14,
    backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  historyText: { color: COLORS.textPrimary, fontSize: 13, lineHeight: 19 },
  historyRef: { color: COLORS.gold, fontSize: 11, fontWeight: '700', marginTop: 6 },
});
