import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useGlobalStyles, useThemedStyles } from '../theme';
import { quranApi } from '../config/appConfig';

const TOPICS = [
  { id: 'patience', label: 'Patience', icon: 'hourglass-outline', query: 'patience sabr quran verses' },
  { id: 'gratitude', label: 'Gratitude', icon: 'heart-outline', query: 'gratitude thankfulness shukr quran' },
  { id: 'anxiety', label: 'Anxiety', icon: 'shield-outline', query: 'anxiety worry trust in allah tawakkul' },
  { id: 'forgiveness', label: 'Forgiveness', icon: 'water-outline', query: 'forgiveness repentance istighfar quran' },
  { id: 'prayer', label: 'Prayer', icon: 'hand-left-outline', query: 'prayer salah quran guidance' },
  { id: 'death', label: 'Afterlife', icon: 'skull-outline', query: 'death afterlife akhirah quran' },
  { id: 'love', label: 'Love & Mercy', icon: 'heart-circle-outline', query: 'love mercy rahma quran' },
  { id: 'justice', label: 'Justice', icon: 'scale-outline', query: 'justice equity adl quran' },
  { id: 'knowledge', label: 'Knowledge', icon: 'book-outline', query: 'knowledge ilm wisdom hikmah quran' },
  { id: 'creation', label: 'Creation', icon: 'globe-outline', query: 'creation universe signs quran' },
];

const SAMPLE_QA = [
  { q: 'What does the Quran say about patience?', a: 'Allah says: "O you who believe! Seek help with patience and prayer." (Al-Baqarah 2:153). "Verily, with hardship comes ease." (Ash-Sharh 94:6). Patience (Sabr) is mentioned over 70 times in the Quran.', verses: ['2:153', '2:45', '94:5-6', '3:200'] },
  { q: 'What does the Quran say about anxiety?', a: 'Allah says: "Verily, in the remembrance of Allah do hearts find rest." (Ar-Ra\'d 13:28). "And whoever relies upon Allah, then He is sufficient for him." (At-Talaq 65:3). The Quran provides comfort through trust in Allah.', verses: ['13:28', '65:3', '94:5-6', '2:286'] },
];

export default function AIQuranAssistantScreen({ navigation }) {
  // ── Live theme hooks (replaces frozen module-level COLORS) ────────────
  const COLORS = useColors();
  const globalStyles = useGlobalStyles();
  const styles = useThemedStyles(makeStyles);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: '0', role: 'assistant',
        text: 'Assalamu Alaikum! I am your Quran study companion. I search Quran translations for a topic and share short study notes. For detailed tafsir, open the Tafsir module.',
      }]);
    }
  }, []);

  const searchQuran = async (query) => {
    try {
      const res = await fetch(`${quranApi}/search?q=${encodeURIComponent(query)}&size=5&language=en`);
      const data = await res.json();
      return data.search?.results || [];
    } catch { return []; }
  };

  const findRelevantVerses = async (topic) => {
    try {
      const res = await fetch(`${quranApi}/search?q=${encodeURIComponent(topic)}&size=3&language=en`);
      const data = await res.json();
      return (data.search?.results || []).map(r => ({
        key: r.verse_key, text: r.text?.replace(/<[^>]*>/g, '') || '',
      }));
    } catch { return []; }
  };

  const generateResponse = async (query) => {
    const q = query.toLowerCase();
    const sampleMatch = SAMPLE_QA.find(s => q.includes(s.q.toLowerCase().split(' ').slice(-2).join('')));
    if (sampleMatch) return { text: sampleMatch.a, verses: sampleMatch.verses };

    const results = await searchQuran(query);
    if (results.length > 0) {
      const topVerses = results.slice(0, 3).map(r => r.verse_key).join(', ');
      return {
        text: `Based on Quranic search for "${query}":\n\nFound ${results.length} relevant results. The most relevant verses are: ${topVerses}.\n\nThese verses address the topic of ${query}. For detailed tafsir, please check the Tafsir module.`,
        verses: results.slice(0, 3).map(r => r.verse_key),
      };
    }

    return {
      text: `I found the following guidance regarding "${query}":\n\nThe Quran addresses this topic in multiple places. Key principles include seeking knowledge, trusting in Allah's plan, and following the example of the Prophets. Please explore the relevant surahs for complete understanding.`,
      verses: [],
    };
  };

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { id: Date.now().toString(), role: 'user', text: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await generateResponse(text);
      const assistantMsg = {
        id: (Date.now() + 1).toString(), role: 'assistant',
        text: response.text, verses: response.verses,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), role: 'assistant',
        text: 'I apologize, but I could not process your request. Please try again or rephrase your question.',
      }]);
    } finally { setLoading(false); }
  };

  const onTopicPress = (topic) => {
    setSelectedTopic(topic.id);
    sendMessage(topic.query);
  };

  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>

        {/* Topics */}
        {messages.length <= 1 && (
          <View style={styles.topicsSection}>
            <Text style={styles.sectionTitle}>Explore Topics</Text>
            <FlatList horizontal showsHorizontalScrollIndicator={false} data={TOPICS}
              keyExtractor={t => t.id} contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
              renderItem={({ item: t }) => (
                <TouchableOpacity style={[styles.topicChip, selectedTopic === t.id && styles.topicActive]}
                  onPress={() => onTopicPress(t)}>
                  <Ionicons name={t.icon} size={14} color={selectedTopic === t.id ? '#000' : COLORS.textSecondary} />
                  <Text style={[styles.topicText, selectedTopic === t.id && { color: '#000' }]}>{t.label}</Text>
                </TouchableOpacity>
              )} />
          </View>
        )}

        {/* Messages */}
        <FlatList ref={flatListRef} data={messages} keyExtractor={m => m.id}
          contentContainerStyle={{ padding: 12, paddingBottom: 8 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          renderItem={({ item: msg }) => (
            <View style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant]}>
              <Text style={[styles.bubbleText, msg.role === 'user' && { color: '#000' }]}>{msg.text}</Text>
              {msg.verses?.length > 0 && (
                <View style={styles.verseLinks}>
                  {msg.verses.map((v, i) => (
                    <TouchableOpacity key={i} style={styles.verseLink} onPress={() => navigation?.navigate?.('Quran')}>
                      <Ionicons name="book-outline" size={10} color={COLORS.gold} />
                      <Text style={styles.verseLinkText}>{v}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
          ListFooterComponent={loading ? (
            <View style={styles.typingIndicator}>
              <ActivityIndicator color={COLORS.gold} size="small" />
              <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>Thinking...</Text>
            </View>
          ) : null} />

        {/* Input */}
        <View style={styles.inputBar}>
          <TextInput style={styles.input} value={input} onChangeText={setInput}
            placeholder="Ask about the Quran..." placeholderTextColor={COLORS.placeholder}
            onSubmitEditing={() => sendMessage(input)} returnKeyType="send" />
          <TouchableOpacity style={[styles.sendBtn, !input.trim() && { opacity: 0.5 }]}
            onPress={() => sendMessage(input)} disabled={!input.trim()}>
            <Ionicons name="send" size={18} color="#000" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (COLORS) => StyleSheet.create({
  topicsSection: { paddingVertical: 12 },
  sectionTitle: { color: COLORS.gold, fontSize: 15, fontWeight: '800', marginBottom: 10, paddingHorizontal: 16 },
  topicChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  topicActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  topicText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  bubble: {
    maxWidth: '85%', padding: 14, borderRadius: 18, marginBottom: 10,
  },
  bubbleUser: {
    backgroundColor: COLORS.gold, alignSelf: 'flex-end', borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: COLORS.glass, alignSelf: 'flex-start', borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  bubbleText: { color: COLORS.textPrimary, fontSize: 14, lineHeight: 21 },
  verseLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  verseLink: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, backgroundColor: 'rgba(255, 255, 255,0.1)', borderWidth: 1, borderColor: 'rgba(255, 255, 255,0.3)',
  },
  verseLinkText: { color: COLORS.gold, fontSize: 11, fontWeight: '700' },
  typingIndicator: {
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, alignSelf: 'flex-start',
  },
  inputBar: {
    flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: COLORS.glassBorder,
    backgroundColor: COLORS.bgSecondary,
  },
  input: {
    flex: 1, backgroundColor: COLORS.glass, borderRadius: 14, borderWidth: 1, borderColor: COLORS.glassBorder,
    color: COLORS.textPrimary, fontSize: 14, paddingHorizontal: 14, paddingVertical: 10,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.gold,
    alignItems: 'center', justifyContent: 'center',
  },
});
