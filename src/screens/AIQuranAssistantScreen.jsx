import React, { useState, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useGlobalStyles, useThemedStyles } from '../theme';
import { quranService } from '../services/quranApi';
import { navigationTarget } from '../config/routes';

// Single words rather than phrases: quran.com search matches the wording of a
// translation, and a one-word query returns the verses that actually use it.
const TOPICS = [
  { id: 'patience', label: 'Patience', icon: 'hourglass-outline' },
  { id: 'gratitude', label: 'Gratitude', icon: 'heart-outline' },
  { id: 'mercy', label: 'Mercy', icon: 'water-outline' },
  { id: 'forgiveness', label: 'Forgiveness', icon: 'refresh-outline' },
  { id: 'prayer', label: 'Prayer', icon: 'hand-left-outline' },
  { id: 'justice', label: 'Justice', icon: 'scale-outline' },
  { id: 'knowledge', label: 'Knowledge', icon: 'book-outline' },
  { id: 'light', label: 'Light', icon: 'sunny-outline' },
];

const GREETING =
  'Assalamu Alaikum. Ask about a theme — patience, mercy, gratitude — and I will search the Quran translation and show you the verses themselves. Tap any verse to open it in the reader.';

const VERSE_COUNT = 6;

export default function AIQuranAssistantScreen({ navigation }) {
  const COLORS = useColors();
  const globalStyles = useGlobalStyles();
  const styles = useThemedStyles(makeStyles);

  const [messages, setMessages] = useState([
    { id: 'greeting', role: 'assistant', text: GREETING, verses: [] },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);
  const nextId = useRef(0);

  const makeId = () => {
    nextId.current += 1;
    return `m${nextId.current}`;
  };

  const openVerse = verse => {
    navigation?.navigate?.(navigationTarget('Quran', { surah: verse.surah, ayah: verse.ayah }));
  };

  const sendMessage = async raw => {
    const query = String(raw || '').trim();
    if (!query || loading) return;

    setMessages(prev => [...prev, { id: makeId(), role: 'user', text: query, verses: [] }]);
    setInput('');
    setLoading(true);

    try {
      const { verses, total } = await quranService.searchVerses(query, { size: VERSE_COUNT });

      let reply;
      if (verses.length > 0) {
        const shown = verses.length;
        reply = {
          text:
            total > shown
              ? `Showing ${shown} of ${total} verses that mention “${query}”.`
              : `${shown} ${shown === 1 ? 'verse mentions' : 'verses mention'} “${query}”.`,
          verses,
        };
      } else {
        reply = {
          text:
            `I could not find “${query}” in the English translation. Search matches wording, ` +
            'so try a single word such as patience, mercy, gratitude or justice.',
          verses: [],
        };
      }

      setMessages(prev => [...prev, { id: makeId(), role: 'assistant', ...reply }]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: makeId(),
          role: 'assistant',
          text:
            'I could not reach the Quran search service. Check your connection and try again. ' +
            'The reader still works offline for surahs you have opened before.',
          verses: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onTopicPress = topic => sendMessage(topic.id);

  const renderVerse = verse => (
    <TouchableOpacity
      key={verse.key}
      style={styles.verseCard}
      activeOpacity={0.85}
      onPress={() => openVerse(verse)}
      accessibilityRole="button"
      accessibilityLabel={`Open ${verse.surahName || 'surah'} ${verse.key}`}
    >
      <Text style={styles.verseArabic}>{verse.arabic}</Text>
      <Text style={styles.verseTranslation}>{verse.translation}</Text>
      <View style={styles.verseFooter}>
        <View style={{ flex: 1 }}>
          <Text style={styles.verseRef}>
            {verse.surahName ? `${verse.surahName} · ` : ''}
            {verse.key}
          </Text>
          {verse.translator ? (
            <Text style={styles.verseTranslator}>{verse.translator}</Text>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={14} color={COLORS.gold} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {messages.length <= 1 && (
          <View style={styles.topicsSection}>
            <Text style={styles.sectionTitle}>Explore Topics</Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={TOPICS}
              keyExtractor={t => t.id}
              contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
              renderItem={({ item: t }) => (
                <TouchableOpacity
                  style={styles.topicChip}
                  onPress={() => onTopicPress(t)}
                  accessibilityRole="button"
                >
                  <Ionicons name={t.icon} size={14} color={COLORS.textSecondary} />
                  <Text style={styles.topicText}>{t.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={{ padding: 12, paddingBottom: 8 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item: msg }) => {
            const isUser = msg.role === 'user';
            return (
              <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
                <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>{msg.text}</Text>
                {msg.verses?.length > 0 && (
                  <View style={styles.verseList}>{msg.verses.map(renderVerse)}</View>
                )}
              </View>
            );
          }}
          ListFooterComponent={
            loading ? (
              <View style={styles.typingIndicator}>
                <ActivityIndicator color={COLORS.gold} size="small" />
                <Text style={styles.typingText}>Searching the translation…</Text>
              </View>
            ) : null
          }
        />

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask about the Quran…"
            placeholderTextColor={COLORS.placeholder}
            onSubmitEditing={() => sendMessage(input)}
            returnKeyType="send"
            accessibilityLabel="Question for Quran study"
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && { opacity: 0.5 }]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            accessibilityRole="button"
            accessibilityLabel="Search the Quran"
          >
            <Ionicons name="send" size={18} color="#000" />
          </TouchableOpacity>
        </View>

        <Text style={styles.footnote}>
          Searches the English translation. For rulings or tafsir, consult a qualified scholar.
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = COLORS =>
  StyleSheet.create({
    topicsSection: { paddingVertical: 12 },
    sectionTitle: {
      color: COLORS.gold,
      fontSize: 15,
      fontWeight: '800',
      marginBottom: 10,
      paddingHorizontal: 16,
    },
    topicChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: COLORS.glass,
      borderWidth: 1,
      borderColor: COLORS.glassBorder,
    },
    topicText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
    bubble: { maxWidth: '92%', padding: 14, borderRadius: 18, marginBottom: 10 },
    bubbleUser: {
      backgroundColor: COLORS.gold,
      alignSelf: 'flex-end',
      borderBottomRightRadius: 4,
    },
    bubbleAssistant: {
      backgroundColor: COLORS.glass,
      alignSelf: 'flex-start',
      borderBottomLeftRadius: 4,
      borderWidth: 1,
      borderColor: COLORS.glassBorder,
    },
    bubbleText: { color: COLORS.textPrimary, fontSize: 14, lineHeight: 21 },
    bubbleTextUser: { color: '#000' },
    verseList: { gap: 10, marginTop: 12 },
    verseCard: {
      backgroundColor: COLORS.bgSecondary,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: COLORS.glassBorder,
      padding: 12,
    },
    verseArabic: {
      color: COLORS.textPrimary,
      fontSize: 19,
      lineHeight: 32,
      textAlign: 'right',
      writingDirection: 'rtl',
      marginBottom: 8,
    },
    verseTranslation: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 },
    verseFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 10,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: COLORS.glassBorder,
    },
    verseRef: { color: COLORS.gold, fontSize: 12, fontWeight: '700' },
    verseTranslator: { color: COLORS.textSecondary, fontSize: 11, marginTop: 2, opacity: 0.8 },
    typingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 12,
      alignSelf: 'flex-start',
    },
    typingText: { color: COLORS.textSecondary, fontSize: 12 },
    inputBar: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: COLORS.glassBorder,
      backgroundColor: COLORS.bgSecondary,
    },
    input: {
      flex: 1,
      backgroundColor: COLORS.glass,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: COLORS.glassBorder,
      color: COLORS.textPrimary,
      fontSize: 14,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    sendBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: COLORS.gold,
      alignItems: 'center',
      justifyContent: 'center',
    },
    footnote: {
      color: COLORS.textSecondary,
      fontSize: 10,
      lineHeight: 14,
      textAlign: 'center',
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 10,
      opacity: 0.75,
      backgroundColor: COLORS.bgSecondary,
    },
  });
