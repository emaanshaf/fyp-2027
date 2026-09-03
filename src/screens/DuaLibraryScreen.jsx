import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView, TextInput, Share
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, globalStyles } from '../theme';

const DUA_CATEGORIES = [
  { id: 'morning', name: 'Morning Azkar', icon: 'sunny', color: COLORS.gold, time: 'After Fajr' },
  { id: 'evening', name: 'Evening Azkar', icon: 'moon', color: COLORS.purple, time: 'After Asr' },
  { id: 'sleep', name: 'Sleep Azkar', icon: 'bed', color: COLORS.blue, time: 'Before Sleep' },
  { id: 'wakeup', name: 'Wake Up', icon: 'alarm', color: COLORS.amber, time: 'On Waking' },
  { id: 'salah', name: 'After Salah', icon: 'hand-left', color: COLORS.emerald, time: 'After Prayer' },
  { id: 'travel', name: 'Travel', icon: 'airplane', color: COLORS.cyan, time: 'During Journey' },
  { id: 'protection', name: 'Protection', icon: 'shield', color: COLORS.red, time: 'Anytime' },
  { id: 'parents', name: 'For Parents', icon: 'people', color: COLORS.pink, time: 'Anytime' },
  { id: 'forgiveness', name: 'Forgiveness', icon: 'water', color: '#ffffff', time: 'Anytime' },
  { id: 'hardship', name: 'Hard Times', icon: 'rainy', color: COLORS.amber, time: 'When in Need' },
  { id: 'food', name: 'Before/After Eating', icon: 'restaurant', color: COLORS.emerald, time: 'Mealtime' },
  { id: 'home', name: 'Entering Home', icon: 'home', color: COLORS.gold, time: 'On Entering' },
];

const AZKAR_DATA = {
  morning: [
    { arabic: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ', transliteration: 'Asbahna wa asbahal mulku lillah', translation: 'We have reached the morning and at this very time all sovereignty belongs to Allah.', count: 1 },
    { arabic: 'اللَّهُمَّ بِكَ أَصْبَحْنَا', transliteration: 'Allahumma bika asbahna', translation: 'O Allah, by You we have entered the morning.', count: 1 },
    { arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', transliteration: 'SubhanAllahi wa bihamdihi', translation: 'Glory be to Allah and praise be to Him.', count: 100 },
    { arabic: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ', transliteration: 'La ilaha illAllahu wahdahu la shareeka lahu', translation: 'None has the right to be worshipped but Allah, alone, without partner.', count: 100 },
    { arabic: 'أَسْتَغْفِرُ اللَّهَ', transliteration: 'Astaghfirullah', translation: 'I seek forgiveness from Allah.', count: 100 },
  ],
  evening: [
    { arabic: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ', transliteration: 'Amsayna wa amsal mulku lillah', translation: 'We have entered the evening and at this very time all sovereignty belongs to Allah.', count: 1 },
    { arabic: 'اللَّهُمَّ بِكَ أَمْسَيْنَا', transliteration: 'Allahumma bika amsayna', translation: 'O Allah, by You we have entered the evening.', count: 1 },
    { arabic: 'أَعُوذُ بِاللَّهِ مِنْ الشَّيْطَانِ الرَّجِيمِ', transliteration: 'A\'udhu billahi min ash-shaytan ir-rajim', translation: 'I seek refuge in Allah from Satan, the accursed.', count: 3 },
  ],
  sleep: [
    { arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا', transliteration: 'Bismika Allahumma amootu wa ahya', translation: 'In Your name, O Allah, I die and I live.', count: 1 },
    { arabic: 'اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ', transliteration: 'Allahumma qini adhabaka yawma tab\'athu ibadak', translation: 'O Allah, protect me from Your punishment on the Day You resurrect Your servants.', count: 1 },
    { arabic: 'سُبْحَانَ اللَّهِ', transliteration: 'SubhanAllah', translation: 'Glory be to Allah.', count: 33 },
    { arabic: 'الْحَمْدُ لِلَّهِ', transliteration: 'Alhamdulillah', translation: 'All praise is for Allah.', count: 33 },
    { arabic: 'اللَّهُ أَكْبَرُ', transliteration: 'Allahu Akbar', translation: 'Allah is the Greatest.', count: 34 },
  ],
  salah: [
    { arabic: 'أَسْتَغْفِرُ اللَّهَ', transliteration: 'Astaghfirullah', translation: 'I seek forgiveness from Allah.', count: 3 },
    { arabic: 'اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ', transliteration: 'Allahumma antas-salamu wa minkas-salam', translation: 'O Allah, You are Peace and from You comes peace.', count: 1 },
    { arabic: 'سُبْحَانَ اللَّهِ', transliteration: 'SubhanAllah', translation: 'Glory be to Allah.', count: 33 },
    { arabic: 'الْحَمْدُ لِلَّهِ', transliteration: 'Alhamdulillah', translation: 'All praise is for Allah.', count: 33 },
    { arabic: 'اللَّهُ أَكْبَرُ', transliteration: 'Allahu Akbar', translation: 'Allah is the Greatest.', count: 33 },
    { arabic: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ', transliteration: 'La ilaha illAllahu wahdahu la shareeka lahu', translation: 'None has the right to be worshipped but Allah alone.', count: 1 },
  ],
  protection: [
    { arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ', transliteration: 'A\'udhu bikalimatillahit-tammati min sharri ma khalaq', translation: 'I seek protection in the perfect words of Allah from the evil of that which He has created.', count: 3 },
    { arabic: 'بِاسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ', transliteration: 'Bismillahilladhi la yadurru ma\'asmihi shai\'un fil-ardi wa la fis-sama', translation: 'In the name of Allah, with Whose name nothing on earth or in heaven can cause harm.', count: 3 },
  ],
  parents: [
    { arabic: 'رَبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا', transliteration: 'Rabbir-hamhuma kama rabbayani saghira', translation: 'My Lord, have mercy on them as they brought me up when I was small.', count: 1 },
  ],
  forgiveness: [
    { arabic: 'أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيَّ الْقَيُّومَ وَأَتُوبُ إِلَيْهِ', transliteration: 'Astaghfirullahal-adheem alladhi la ilaha illa huwal-hayyul-qayyumu wa atubu ilaih', translation: 'I seek forgiveness from Allah, the Mighty, whom none has the right to be worshipped but He, the Living, the Self-Sustaining, and I turn in repentance to Him.', count: 1 },
  ],
};

const EXTRA_DUA = {
  food: [
    { arabic: 'بِسْمِ اللَّهِ', transliteration: 'Bismillah', translation: 'In the name of Allah.', count: 1 },
    { arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا', transliteration: 'Alhamdulillahilladhi at\'amana wa saqana', translation: 'All praise is for Allah who fed us and gave us drink.', count: 1 },
  ],
  travel: [
    { arabic: 'اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ', transliteration: 'Allahu Akbar, Allahu Akbar', translation: 'Allah is the Greatest, Allah is the Greatest.', count: 1 },
    { arabic: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا', transliteration: 'Subhanalladhi sakh-khana lana hadha', translation: 'Glory be to Him who has placed this at our service.', count: 1 },
  ],
  wakeup: [
    { arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ', transliteration: 'Alhamdulillahilladhi ahyana ba\'da ma amatana wa ilaihin-nushoor', translation: 'All praise is for Allah who gave us life after causing us to die, and to Him is the resurrection.', count: 1 },
  ],
  home: [
    { arabic: 'بِسْمِ اللَّهِ وَلَجْنَا، بِسْمِ اللَّهِ خَرَجْنَا', transliteration: 'Bismillahi walajna, bismillahi kharajna', translation: 'In the name of Allah we enter, in the name of Allah we leave.', count: 1 },
  ],
};

export default function DuaLibraryScreen() {
  const [selectedCat, setSelectedCat] = useState(null);
  const [completedCounts, setCompletedCounts] = useState({});
  const [personalDuas, setPersonalDuas] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newDua, setNewDua] = useState({ title: '', arabic: '', translation: '' });

  useEffect(() => { loadProgress(); loadPersonal(); }, []);

  const loadProgress = async () => {
    const key = `azkar_progress_${new Date().toISOString().split('T')[0]}`;
    const raw = await AsyncStorage.getItem(key);
    if (raw) setCompletedCounts(JSON.parse(raw));
  };

  const saveProgress = async (updated) => {
    setCompletedCounts(updated);
    const key = `azkar_progress_${new Date().toISOString().split('T')[0]}`;
    await AsyncStorage.setItem(key, JSON.stringify(updated));
  };

  const incrementCount = (catId, idx) => {
    const key = `${catId}_${idx}`;
    const current = completedCounts[key] || 0;
    const dua = (AZKAR_DATA[catId] || [])[idx];
    if (!dua || current >= dua.count) return;
    saveProgress({ ...completedCounts, [key]: current + 1 });
  };

  const loadPersonal = async () => {
    const raw = await AsyncStorage.getItem('personal_duas');
    if (raw) setPersonalDuas(JSON.parse(raw));
  };

  const addPersonalDua = async () => {
    if (!newDua.title.trim()) return;
    const updated = [...personalDuas, { ...newDua, id: Date.now().toString() }];
    setPersonalDuas(updated);
    await AsyncStorage.setItem('personal_duas', JSON.stringify(updated));
    setNewDua({ title: '', arabic: '', translation: '' });
    setShowAdd(false);
  };

  const deletePersonal = async (id) => {
    const updated = personalDuas.filter(d => d.id !== id);
    setPersonalDuas(updated);
    await AsyncStorage.setItem('personal_duas', JSON.stringify(updated));
  };

  const shareDua = async (dua) => {
    try {
      await Share.share({
        message: `${dua.arabic}\n\n${dua.transliteration || ''}\n${dua.translation}\n\n— Dua Library | Qitab-e-Noor`,
      });
    } catch {}
  };

  if (!selectedCat) {
    return (
      <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
            <Text style={styles.pageTitle}>Dua & Azkar</Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>Morning, Evening & Daily Supplications</Text>
          </View>

          <View style={{ paddingHorizontal: 12 }}>
            {DUA_CATEGORIES.map(cat => {
              const azkar = AZKAR_DATA[cat.id] || [];
              const completed = azkar.filter((_, i) => (completedCounts[`${cat.id}_${i}`] || 0) >= azkar[i]?.count).length;
              return (
                <TouchableOpacity key={cat.id} style={styles.catCard}
                  onPress={() => setSelectedCat(cat.id)}>
                  <View style={[styles.catIcon, { backgroundColor: cat.color + '18' }]}>
                    <Ionicons name={cat.icon} size={22} color={cat.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.catName}>{cat.name}</Text>
                    <Text style={styles.catInfo}>{azkar.length} supplications • {cat.time}</Text>
                    {azkar.length > 0 && (
                      <View style={styles.catProgress}>
                        <View style={[styles.catProgressBar, { width: `${(completed / azkar.length) * 100}%`, backgroundColor: cat.color }]} />
                      </View>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Personal Duas */}
          <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
            <View style={globalStyles.spaceBetween}>
              <Text style={styles.sectionTitle}>My Personal Duas</Text>
              <TouchableOpacity onPress={() => setShowAdd(true)} style={{ padding: 4 }}>
                <Ionicons name="add-circle" size={24} color={COLORS.gold} />
              </TouchableOpacity>
            </View>
            {personalDuas.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="heart-outline" size={32} color={COLORS.textSecondary} />
                <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginTop: 8 }}>No personal duas yet</Text>
              </View>
            ) : personalDuas.map(dua => (
              <View key={dua.id} style={styles.personalCard}>
                <Text style={styles.personalTitle}>{dua.title}</Text>
                {dua.arabic ? <Text style={styles.personalArabic}>{dua.arabic}</Text> : null}
                {dua.translation ? <Text style={styles.personalTrans}>{dua.translation}</Text> : null}
                <TouchableOpacity onPress={() => deletePersonal(dua.id)} style={{ padding: 4 }}>
                  <Ionicons name="trash-outline" size={14} color={COLORS.red} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>

        {showAdd && (
          <View style={styles.modalOverlay}>
            <View style={styles.modal}>
              <View style={globalStyles.spaceBetween}>
                <Text style={styles.modalTitle}>Add Personal Dua</Text>
                <TouchableOpacity onPress={() => setShowAdd(false)}><Ionicons name="close" size={22} color={COLORS.textSecondary} /></TouchableOpacity>
              </View>
              <TextInput style={styles.modalInput} value={newDua.title} onChangeText={t => setNewDua({...newDua, title: t})}
                placeholder="Title" placeholderTextColor={COLORS.placeholder} />
              <TextInput style={[styles.modalInput, { minHeight: 60 }]} value={newDua.arabic}
                onChangeText={t => setNewDua({...newDua, arabic: t})} placeholder="Arabic (optional)" placeholderTextColor={COLORS.placeholder} multiline />
              <TextInput style={styles.modalInput} value={newDua.translation}
                onChangeText={t => setNewDua({...newDua, translation: t})} placeholder="Translation" placeholderTextColor={COLORS.placeholder} />
              <TouchableOpacity style={styles.addBtn} onPress={addPersonalDua}>
                <Text style={{ color: '#000', fontWeight: '800' }}>Save Dua</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    );
  }

  const azkar = AZKAR_DATA[selectedCat] || [];
  const cat = DUA_CATEGORIES.find(c => c.id === selectedCat);

  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSelectedCat(null)}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{cat?.name}</Text>
      </View>

      <FlatList data={azkar} keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
        renderItem={({ item: dua, index }) => {
          const done = (completedCounts[`${selectedCat}_${index}`] || 0) >= dua.count;
          const current = completedCounts[`${selectedCat}_${index}`] || 0;
          return (
            <TouchableOpacity style={[styles.duaCard, done && styles.duaDone]}
              onPress={() => incrementCount(selectedCat, index)} activeOpacity={0.7}>
              <Text style={styles.duaArabic}>{dua.arabic}</Text>
              <Text style={styles.duaTranslit}>{dua.transliteration}</Text>
              <Text style={styles.duaTranslation}>{dua.translation}</Text>
              <View style={styles.duaFooter}>
                <View style={[styles.countBadge, done && { backgroundColor: COLORS.emerald + '20' }]}>
                  <Text style={[styles.countText, done && { color: COLORS.emerald }]}>
                    {done ? '✓ Complete' : `${current}/${dua.count}`}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => shareDua(dua)} style={{ padding: 4 }}>
                  <Ionicons name="share-outline" size={14} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pageTitle: { color: COLORS.gold, fontSize: 22, fontWeight: '900' },
  catCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, marginBottom: 8,
    backgroundColor: COLORS.glass, borderRadius: 16, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  catIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  catName: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '800' },
  catInfo: { color: COLORS.textSecondary, fontSize: 11, marginTop: 2 },
  catProgress: { height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.06)', marginTop: 6, overflow: 'hidden' },
  catProgressBar: { height: '100%', borderRadius: 2 },
  sectionTitle: { color: COLORS.gold, fontSize: 17, fontWeight: '800', marginBottom: 12 },
  emptyCard: {
    padding: 30, borderRadius: 16, backgroundColor: COLORS.glass,
    borderWidth: 1, borderColor: COLORS.glassBorder, alignItems: 'center',
  },
  personalCard: {
    padding: 14, marginBottom: 8, borderRadius: 14, backgroundColor: COLORS.glass,
    borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  personalTitle: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '700' },
  personalArabic: { color: COLORS.gold, fontSize: 16, marginTop: 6, textAlign: 'right' },
  personalTrans: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder, backgroundColor: COLORS.bgSecondary,
  },
  headerTitle: { color: COLORS.gold, fontSize: 18, fontWeight: '800' },
  duaCard: {
    padding: 18, marginBottom: 10, borderRadius: 18, backgroundColor: COLORS.glass,
    borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  duaDone: { borderColor: COLORS.emerald + '40', backgroundColor: 'rgba(255, 255, 255,0.04)' },
  duaArabic: { color: COLORS.gold, fontSize: 20, textAlign: 'right', lineHeight: 34, writingDirection: 'rtl' },
  duaTranslit: { color: COLORS.textSecondary, fontSize: 12, fontStyle: 'italic', marginTop: 8 },
  duaTranslation: { color: COLORS.textPrimary, fontSize: 14, lineHeight: 21, marginTop: 6 },
  duaFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12,
    borderTopWidth: 1, borderTopColor: COLORS.glassBorder, paddingTop: 10,
  },
  countBadge: {
    backgroundColor: 'rgba(255, 255, 255,0.12)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  countText: { color: COLORS.gold, fontSize: 11, fontWeight: '800' },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', padding: 20, zIndex: 999,
  },
  modal: {
    backgroundColor: COLORS.bgSecondary, borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  modalTitle: { color: COLORS.gold, fontSize: 18, fontWeight: '900', marginBottom: 16 },
  modalInput: {
    backgroundColor: COLORS.glass, borderRadius: 12, borderWidth: 1, borderColor: COLORS.glassBorder,
    color: COLORS.textPrimary, fontSize: 14, padding: 12, marginBottom: 10,
  },
  addBtn: {
    padding: 14, borderRadius: 14, backgroundColor: COLORS.gold, alignItems: 'center', marginTop: 6,
  },
});
