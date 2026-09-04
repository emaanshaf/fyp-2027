import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, globalStyles } from '../theme';
import { KNOWLEDGE_BASE } from '../ai/islamicKnowledge';
import { getAIAnswer } from '../ai/assistant';
import { claudeStatus, refreshClaudeStatus } from '../ai/claudeClient';
import FormattedText from '../components/FormattedText';

const SUGGESTED = [
  'What are the Five Pillars of Islam?',
  'How do I perform Wudu?',
  'What is Nisab for Zakat?',
  'Tell me about Laylat al-Qadr',
  'What is Riba in Islam?',
  'How to make Tawbah (repentance)?',
  'What are the major sins?',
  'Virtues of Surah Yaseen',
];

const TOPICS = [...new Set(KNOWLEDGE_BASE.map(e => e.topic))];

const BOT_INTRO = {
  id: 'intro',
  from: 'bot',
  topic: 'Welcome',
  text: `As-salamu Alaykum! I am your Islamic Knowledge Assistant.\n\nI can answer questions about:\n\n• Pillars of Islam & Iman\n• Prayer, Fasting, Zakat, Hajj\n• Quran & Hadith\n• Halal & Haram\n• Repentance & Character\n• Marriage, Family & Ethics\n\nType your question or choose a topic below. For complex fiqh matters, always consult a qualified scholar.`,
  time: new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }),
};

let msgId = 1;

export default function AIChatScreen() {
  const [messages, setMessages] = useState([BOT_INTRO]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [showTopics, setShowTopics] = useState(false);
  // Whether the live assistant is reachable is now a property of the server,
  // not of a bundled key, so it has to be asked for and kept in state — a
  // module-level value would never re-render the header when it changed.
  const [liveStatus, setLiveStatus] = useState(claudeStatus());
  const flatRef = useRef(null);
  const dotAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let active = true;
    refreshClaudeStatus().then(s => { if (active) setLiveStatus(s); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (typing) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dotAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dotAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        ])
      ).start();
    } else {
      dotAnim.stopAnimation();
    }
  }, [typing]);

  const sendMessage = async (text) => {
    const q = (text || input).trim();
    if (!q) return;
    setInput('');

    const userMsg = {
      id: `u_${++msgId}`,
      from: 'user',
      text: q,
      time: new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setTyping(true);

    const minDelay = new Promise(resolve => setTimeout(resolve, 500));
    const [answer] = await Promise.all([getAIAnswer(q), minDelay]);

    let botText, topic, refs;
    if (answer) {
      botText = answer.text;
      topic = answer.topic;
      refs = answer.references;
    } else {
      botText = `JazakAllah Khair for your question.\n\nI don't have a specific answer for "${q}" in my knowledge base yet. Here are some related topics you can ask about:\n\n${SUGGESTED.slice(0, 4).map(s => `• ${s}`).join('\n')}\n\nFor detailed Islamic rulings, please consult a qualified scholar or visit reliable sources like IslamQA.info or Dar al-Ifta.`;
      topic = 'General';
      refs = [];
    }

    const botMsg = {
      id: `b_${++msgId}`,
      from: 'bot',
      text: botText,
      topic,
      refs,
      time: new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, botMsg]);
    setTyping(false);
  };

  const renderMessage = ({ item }) => {
    const isUser = item.from === 'user';
    return (
      <View style={[styles.msgRow, isUser && { flexDirection: 'row-reverse' }]}>
        {!isUser && (
          <View style={styles.botAvatar}>
            <Text style={{ fontSize: 16 }}>☾</Text>
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
          {!isUser && item.topic && (
            <View style={[globalStyles.chip, { alignSelf: 'flex-start', marginBottom: 8 }]}>
              <Text style={[globalStyles.chipText, { color: COLORS.gold }]}>{item.topic}</Text>
            </View>
          )}
          <FormattedText
            text={item.text}
            style={[styles.bubbleText, isUser && { color: '#000' }]}
            boldStyle={{ color: isUser ? '#000' : COLORS.gold }}
          />
          {!isUser && item.refs && item.refs.length > 0 && (
            <View style={styles.refsBox}>
              <Text style={styles.refsLabel}>REFERENCES</Text>
              {item.refs.map((r, i) => (
                <View key={i} style={[globalStyles.row, { gap: 6, marginTop: 4 }]}>
                  <Ionicons name="bookmark-outline" size={12} color={COLORS.gold} />
                  <Text style={styles.refText}>{r}</Text>
                </View>
              ))}
            </View>
          )}
          <Text style={[styles.timeText, isUser && { color: 'rgba(0,0,0,0.5)', textAlign: 'right' }]}>
            {item.time}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        {/* Header — solid emerald banner, matching the dashboard hero. */}
        <LinearGradient colors={[COLORS.primary, COLORS.primary]} style={styles.header}>
          <View style={styles.botInfo}>
            <View style={styles.botAvatarLg}>
              <Text style={{ fontSize: 26 }}>☾</Text>
            </View>
            <View>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 17 }}>Islamic AI Assistant</Text>
              <View style={[globalStyles.row, { gap: 6 }]}>
                <View style={styles.onlineDot} />
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
                  {liveStatus.ok ? 'Online AI' : 'Offline mode'} • {KNOWLEDGE_BASE.length} topics
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={() => setShowTopics(v => !v)} style={styles.topicsBtn}>
            <Ionicons name={showTopics ? 'close' : 'list'} size={18} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>

        {/* Topics Panel */}
        {showTopics && (
          <View style={styles.topicsPanel}>
            <Text style={[globalStyles.label, { marginBottom: 8 }]}>BROWSE TOPICS</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {TOPICS.map(t => (
                <TouchableOpacity
                  key={t}
                  onPress={() => { sendMessage(`Tell me about ${t}`); setShowTopics(false); }}
                  style={styles.topicChip}
                >
                  <Text style={{ color: COLORS.gold, fontSize: 12, fontWeight: '700' }}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

          </View>
        )}

        {/* Says why the live assistant is not answering. It used to fall back
            to offline answers with no indication at all, which reads as "the
            AI is broken" rather than "the AI is not configured". */}
        {!liveStatus.ok ? (
          <View style={styles.aiNotice}>
            <Ionicons name="information-circle-outline" size={15} color={COLORS.amber} />
            <Text style={styles.aiNoticeText}>{liveStatus.message}</Text>
          </View>
        ) : null}

        {/* Messages */}
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: 12, paddingBottom: 8 }}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={typing ? (
            <View style={[styles.msgRow]}>
              <View style={styles.botAvatar}>
                <Text style={{ fontSize: 16 }}>☾</Text>
              </View>
              <View style={[styles.bubble, styles.botBubble, { paddingVertical: 16, paddingHorizontal: 20 }]}>
                <Animated.View style={[globalStyles.row, { gap: 6, opacity: dotAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }]}>
                  {[0, 1, 2].map(i => (
                    <View key={i} style={styles.typingDot} />
                  ))}
                </Animated.View>
              </View>
            </View>
          ) : null}
        />

        {/* Suggested questions */}
        {messages.length <= 2 && !typing && (
          <View style={styles.suggestedWrap}>
            <FlatList
              horizontal
              data={SUGGESTED}
              keyExtractor={s => s}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
              renderItem={({ item: s }) => (
                <TouchableOpacity onPress={() => sendMessage(s)} style={styles.sugChip}>
                  <Text style={{ color: COLORS.gold, fontSize: 12 }}>{s}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.textInput}
              value={input}
              onChangeText={setInput}
              placeholder="Ask about Islam..."
              placeholderTextColor={COLORS.textSecondary}
              multiline
              maxLength={500}
              onSubmitEditing={() => sendMessage()}
              returnKeyType="send"
            />
          </View>
          <TouchableOpacity
            onPress={() => sendMessage()}
            disabled={!input.trim() || typing}
            style={[styles.sendBtn, (!input.trim() || typing) && { opacity: 0.4 }]}
          >
            <Ionicons name="send" size={18} color="#000" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  aiNotice: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    marginHorizontal: 16, marginTop: 10, padding: 11, borderRadius: 10,
    backgroundColor: COLORS.amber + '12',
    borderWidth: 1, borderColor: COLORS.amber + '30',
  },
  aiNoticeText: { color: COLORS.textSecondary, fontSize: 11.5, lineHeight: 17, flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 8,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  botInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  botAvatarLg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  topicsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicsPanel: {
    margin: 12,
    padding: 16,
    backgroundColor: COLORS.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  topicChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255,0.3)',
    backgroundColor: 'rgba(255, 255, 255,0.05)',
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 14,
  },
  botAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 18,
    padding: 14,
  },
  botBubble: {
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: COLORS.gold,
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    lineHeight: 22,
  },
  refsBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.glassBorder,
  },
  refsLabel: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  refText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontStyle: 'italic',
  },
  timeText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 6,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.gold,
  },
  suggestedWrap: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.glassBorder,
  },
  sugChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255,0.3)',
    backgroundColor: 'rgba(255, 255, 255,0.05)',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    padding: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.glassBorder,
    backgroundColor: COLORS.bgSecondary,
  },
  inputWrap: {
    flex: 1,
    backgroundColor: COLORS.glass,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 120,
  },
  textInput: {
    color: COLORS.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
