import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, globalStyles } from '../theme';

const MOODS = [
  { id: 'grateful', label: 'Grateful', icon: 'heart', color: COLORS.gold },
  { id: 'peaceful', label: 'Peaceful', icon: 'leaf', color: COLORS.emerald },
  { id: 'reflective', label: 'Reflective', icon: 'eye', color: COLORS.blue },
  { id: 'hopeful', label: 'Hopeful', icon: 'sunny', color: COLORS.amber },
  { id: 'challenged', label: 'Challenged', icon: 'fitness', color: COLORS.red },
];

export default function ReflectionJournalScreen() {
  const [entries, setEntries] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [surah, setSurah] = useState('');
  const [ayah, setAyah] = useState('');
  const [reflection, setReflection] = useState('');
  const [selectedMood, setSelectedMood] = useState(null);

  useEffect(() => { loadEntries(); }, []);

  const loadEntries = async () => {
    const raw = await AsyncStorage.getItem('reflection_journal');
    if (raw) setEntries(JSON.parse(raw));
  };

  const addEntry = async () => {
    if (!reflection.trim()) return;
    const entry = {
      id: Date.now().toString(),
      surah: surah || '1',
      ayah: ayah || '1',
      reflection: reflection.trim(),
      mood: selectedMood,
      date: new Date().toISOString(),
    };
    const updated = [entry, ...entries];
    setEntries(updated);
    await AsyncStorage.setItem('reflection_journal', JSON.stringify(updated));
    setSurah(''); setAyah(''); setReflection(''); setSelectedMood(null);
    setShowAdd(false);
  };

  const deleteEntry = async (id) => {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    await AsyncStorage.setItem('reflection_journal', JSON.stringify(updated));
  };

  const getMood = (id) => MOODS.find(m => m.id === id);

  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      <FlatList
        data={entries}
        keyExtractor={e => e.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
        ListHeaderComponent={() => (
          <View>
            <View style={styles.headerCard}>
              <Ionicons name="journal" size={32} color="#fff" />
              <Text style={styles.headerTitle}>Reflection Journal</Text>
              <Text style={styles.headerSub}>Connect with the Quran through personal reflections</Text>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(!showAdd)}>
              <Ionicons name={showAdd ? 'close' : 'add-circle'} size={22} color={COLORS.gold} />
              <Text style={styles.addBtnText}>{showAdd ? 'Cancel' : 'New Reflection'}</Text>
            </TouchableOpacity>
          </View>
        )}
        renderItem={({ item: entry }) => {
          const mood = getMood(entry.mood);
          return (
            <View style={styles.entryCard}>
              <View style={globalStyles.spaceBetween}>
                <View style={styles.entryRef}>
                  <Ionicons name="book-outline" size={12} color={COLORS.gold} />
                  <Text style={styles.entryRefText}>Surah {entry.surah}:{entry.ayah}</Text>
                </View>
                {mood && (
                  <View style={[styles.moodBadge, { backgroundColor: mood.color + '18' }]}>
                    <Ionicons name={mood.icon} size={10} color={mood.color} />
                    <Text style={[styles.moodText, { color: mood.color }]}>{mood.label}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.entryText}>{entry.reflection}</Text>
              <View style={styles.entryFooter}>
                <Text style={styles.entryDate}>
                  {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
                <TouchableOpacity onPress={() => deleteEntry(entry.id)}>
                  <Ionicons name="trash-outline" size={14} color={COLORS.red} />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Ionicons name="journal-outline" size={40} color={COLORS.textSecondary} />
            <Text style={{ color: COLORS.textSecondary, fontSize: 14, marginTop: 12, textAlign: 'center' }}>
              Start your Quran reflection journey.{'\n'}Record your thoughts and spiritual insights.
            </Text>
          </View>
        }
      />

      {showAdd && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={globalStyles.spaceBetween}>
              <Text style={styles.modalTitle}>New Reflection</Text>
              <TouchableOpacity onPress={() => setShowAdd(false)}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.inputRow}>
              <TextInput style={[styles.modalInput, { flex: 1 }]} value={surah} onChangeText={setSurah}
                placeholder="Surah #" placeholderTextColor={COLORS.placeholder} keyboardType="numeric" />
              <TextInput style={[styles.modalInput, { flex: 1 }]} value={ayah} onChangeText={setAyah}
                placeholder="Ayah #" placeholderTextColor={COLORS.placeholder} keyboardType="numeric" />
            </View>
            <TextInput style={[styles.modalInput, { minHeight: 100 }]} value={reflection}
              onChangeText={setReflection} placeholder="Your reflection on this verse..."
              placeholderTextColor={COLORS.placeholder} multiline textAlignVertical="top" />
            <Text style={{ color: COLORS.gold, fontSize: 12, fontWeight: '700', marginBottom: 8 }}>How are you feeling?</Text>
            <View style={styles.moodRow}>
              {MOODS.map(m => (
                <TouchableOpacity key={m.id} style={[styles.moodBtn, selectedMood === m.id && { backgroundColor: m.color + '20', borderColor: m.color }]}
                  onPress={() => setSelectedMood(m.id)}>
                  <Ionicons name={m.icon} size={16} color={selectedMood === m.id ? m.color : COLORS.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={addEntry}>
              <Text style={{ color: '#000', fontWeight: '800' }}>Save Reflection</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    padding: 24, borderRadius: 24, alignItems: 'center', marginBottom: 16,
    backgroundColor: COLORS.primary,
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 12 },
  headerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4, textAlign: 'center' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: 14, borderRadius: 14, backgroundColor: COLORS.glass,
    borderWidth: 1, borderColor: COLORS.gold + '30', marginBottom: 12,
  },
  addBtnText: { color: COLORS.gold, fontSize: 14, fontWeight: '700' },
  entryCard: {
    padding: 16, marginBottom: 10, borderRadius: 18, backgroundColor: COLORS.glass,
    borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  entryRef: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255, 255, 255,0.1)',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  entryRefText: { color: COLORS.gold, fontSize: 11, fontWeight: '700' },
  entryText: { color: COLORS.textPrimary, fontSize: 14, lineHeight: 22, marginTop: 12 },
  entryFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 12, borderTopWidth: 1, borderTopColor: COLORS.glassBorder, paddingTop: 10,
  },
  entryDate: { color: COLORS.textSecondary, fontSize: 11 },
  moodBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  moodText: { fontSize: 10, fontWeight: '700' },
  emptyCard: {
    padding: 40, borderRadius: 20, backgroundColor: COLORS.glass,
    borderWidth: 1, borderColor: COLORS.glassBorder, alignItems: 'center',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', padding: 20, zIndex: 999,
  },
  modal: {
    backgroundColor: COLORS.bgSecondary, borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  modalTitle: { color: COLORS.gold, fontSize: 18, fontWeight: '900', marginBottom: 16 },
  inputRow: { flexDirection: 'row', gap: 10 },
  modalInput: {
    backgroundColor: COLORS.glass, borderRadius: 12, borderWidth: 1, borderColor: COLORS.glassBorder,
    color: COLORS.textPrimary, fontSize: 14, padding: 12, marginBottom: 10,
  },
  moodRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  moodBtn: {
    padding: 10, borderRadius: 12, backgroundColor: COLORS.glass,
    borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  saveBtn: {
    padding: 14, borderRadius: 14, backgroundColor: COLORS.gold, alignItems: 'center',
  },
});
