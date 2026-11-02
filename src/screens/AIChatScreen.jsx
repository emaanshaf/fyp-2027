import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors, useGlobalStyles, useThemedStyles } from '../theme';
import { BROWSE_CATEGORIES, TOTAL_TOPICS } from '../ai/islamicKnowledge';
import { getAIAnswer } from '../ai/assistant';
import { recordAIUsage } from '../services/aiUsage';
import { claudeStatus, refreshClaudeStatus } from '../ai/claudeClient';
import { navigationTarget } from '../config/routes';
import { parseQuranCitation } from '../utils/citationLinks';
import FormattedText from '../components/FormattedText';
import TopicBrowserModal from '../components/TopicBrowserModal';

const SUGGESTED = [
  'How do I pray step by step?',
  'What are the Five Pillars of Islam?',
  'How do I perform Wudu?',
  'What is Nisab for Zakat?',
  'How do I make Istikhara?',
  'How can I deal with anxiety?',
  'What are the Three Quls?',
  'How should I raise my children?',
  'What is the ruling on alcohol?',
  'Tell me about the Battle of Badr',
];

const STORAGE_KEY = 'qitab_ai_chat_history_v1';
const MAX_STORED_MESSAGES = 40;

const nowTime = () =>
  new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });

// A module-level counter meant two app instances could mint the same id, and
// persisted messages made that worse. Timestamp + random keeps keys unique.
const makeId = prefix =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

const BOT_INTRO = {
  id: 'intro',
  from: 'bot',
  topic: 'Welcome',
  text: `As-salamu Alaykum! I am your Islamic Knowledge Assistant.\n\nI can help across:\n\n• Belief, purpose and the unseen\n• Quran, tafsir and Hadith\n• Prayer, fasting, Zakat and Hajj\n• Character, wellbeing and daily habits\n• Family, marriage and community\n• Halal living, money and work\n• Islamic history and the Seerah\n• Using every module in Qitab-e-Noor\n\nType a question, tap "Browse all ${TOTAL_TOPICS} topics" below, or ask one of the suggestions. For a personal ruling, always consult a qualified scholar.`,
  time: nowTime(),
};

const isStoredMessage = m =>
  m && typeof m.id === 'string' && (m.from === 'user' || m.from === 'bot') &&
  typeof m.text === 'string' && m.text.length > 0;

export default function AIChatScreen({ navigation }) {
  // ── Live theme hooks (replaces frozen module-level COLORS) ────────────
  const COLORS = useColors();
  const globalStyles = useGlobalStyles();
  const styles = useThemedStyles(makeStyles);

  const [messages, setMessages] = useState([BOT_INTRO]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [showTopics, setShowTopics] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  // Whether the live assistant is reachable is now a property of the server,
  // not of a bundled key, so it has to be asked for and kept in state — a
  // module-level value would never re-render the header when it changed.
  const [liveStatus, setLiveStatus] = useState(claudeStatus());
  const flatRef = useRef(null);
  const dotAnim = useRef(new Animated.Value(0)).current;
  const sendingRef = useRef(false);

  useEffect(() => {
    let active = true;
    refreshClaudeStatus()
      .then(s => { if (active) setLiveStatus(s); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  // Restore this device's conversation. The intro is rebuilt rather than
  // stored so a schema change or a broken JSON payload cannot leave the
  // screen with no greeting and no way to recover.
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (!active) return;
        if (raw) {
          try {
            const stored = JSON.parse(raw);
            const valid = Array.isArray(stored) ? stored.filter(isStoredMessage) : [];
            if (valid.length) {
              setMessages([BOT_INTRO, ...valid.slice(-MAX_STORED_MESSAGES)]);
            }
          } catch {
            // Corrupt history is not worth crashing the chat over.
          }
        }
      })
      .catch(() => {})
      .finally(() => { if (active) setHydrated(true); });
    return () => { active = false; };
  }, []);

  // Persist only after hydration, otherwise the first render would write the
  // intro over the saved conversation before it was read back.
  useEffect(() => {
    if (!hydrated) return;
    const toStore = messages.filter(m => m.id !== 'intro').slice(-MAX_STORED_MESSAGES);
    const write = toStore.length
      ? AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
      : AsyncStorage.removeItem(STORAGE_KEY);
    write.catch(() => {});
  }, [messages, hydrated]);

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

  const appendAnswer = async (question) => {
    setTyping(true);
    try {
      // A tiny delay keeps the typing indicator from flashing for instant
      // offline answers, but never delays the actual result for long.
      const minDelay = new Promise(resolve => setTimeout(resolve, 450));
      const [answer] = await Promise.all([getAIAnswer(question), minDelay]);

      // Local-only usage counters power the Settings summary; a failure to
      // record must never affect the answer.
      recordAIUsage(answer?.source || 'unavailable').catch(() => {});

      const botMsg = answer
        ? {
            id: makeId('b'),
            from: 'bot',
            text: answer.text,
            topic: answer.topic,
            refs: answer.references || [],
            followUps: answer.followUps || [],
            source: answer.source,
            // A Quran search that found nothing is worth retrying once the
            // user is back online.
            retryQuestion: answer.source === 'unavailable' ? question : undefined,
            time: nowTime(),
          }
        : {
            id: makeId('b'),
            from: 'bot',
            text: "I couldn't form an answer to that just now. Please try again, or rephrase the question with a shorter phrase.",
            topic: 'No exact match',
            refs: [],
            source: 'unavailable',
            retryQuestion: question,
            time: nowTime(),
          };

      setMessages(prev => [...prev, botMsg]);
    } catch {
      recordAIUsage('error').catch(() => {});
      setMessages(prev => [...prev, {
        id: makeId('b'),
        from: 'bot',
        text: "Something went wrong while answering that. Your question is still here — tap Try again, or check that the backend is running if you are using the app on a local network.",
        topic: 'Connection problem',
        refs: [],
        source: 'error',
        retryQuestion: question,
        time: nowTime(),
      }]);
    } finally {
      setTyping(false);
    }
  };

  const sendMessage = async (text) => {
    const q = (text ?? input).trim();
    if (!q || sendingRef.current) return;

    sendingRef.current = true;
    setInput('');
    setConfirmClear(false);
    setMessages(prev => [...prev, {
      id: makeId('u'),
      from: 'user',
      text: q,
      time: nowTime(),
    }]);

    try {
      await appendAnswer(q);
    } finally {
      sendingRef.current = false;
    }
  };

  const retryMessage = async (message) => {
    if (sendingRef.current || !message?.retryQuestion) return;
    sendingRef.current = true;
    // Remove the failed bubble first, so a successful retry leaves one answer
    // rather than a stale error above it.
    setMessages(prev => prev.filter(m => m.id !== message.id));
    try {
      await appendAnswer(message.retryQuestion);
    } finally {
      sendingRef.current = false;
    }
  };

  const handleFollowUp = (topic) => sendMessage(`Tell me about ${topic}`);

  const clearChat = () => {
    setConfirmClear(false);
    setMessages([BOT_INTRO]);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  };

  /**
   * Opens a Quran reference in the reader. AIChat is a drawer screen while
   * Quran is a tab, so the shared navigationTarget helper is required; a bare
   * navigate('Quran') would silently find no handler from here.
   */
  const openCitation = (reference) => {
    const citation = parseQuranCitation(reference);
    if (!citation || !navigation?.navigate) return;
    const target = navigationTarget('Quran', citation);
    navigation.navigate(target.name, target.params);
  };

  const sourceMeta = (source) => {
    switch (source) {
      case 'claude+rag':
        return { label: 'Live AI, grounded in sources', icon: 'sparkles', color: COLORS.cyan };
      case 'claude':
        return { label: 'Live AI', icon: 'sparkles', color: COLORS.cyan };
      case 'offline+quran':
        return { label: 'Quran translation search', icon: 'book-outline', color: COLORS.gold };
      case 'offline':
        return { label: 'Bundled knowledge base', icon: 'library-outline', color: COLORS.gold };
      case 'unavailable':
        return { label: 'No prepared answer', icon: 'help-circle-outline', color: COLORS.amber };
      case 'error':
        return { label: 'Connection problem', icon: 'cloud-offline-outline', color: COLORS.amber };
      default:
        return null;
    }
  };

  const renderMessage = ({ item, index }) => {
    const isUser = item.from === 'user';
    const meta = !isUser ? sourceMeta(item.source) : null;
    const isLatestBot = !isUser && index === messages.length - 1 && !typing;
    return (
      <View style={[styles.msgRow, isUser && { flexDirection: 'row-reverse' }]}>
        {!isUser && (
          <View style={styles.botAvatar}>
            <Text style={{ fontSize: 16 }}>☾</Text>
          </View>
        )}
        <View style={{ maxWidth: '82%', flexShrink: 1 }}>
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
                {item.refs.map((r, i) => {
                  const citation = parseQuranCitation(r);
                  const content = (
                    <>
                      <Ionicons name="bookmark-outline" size={12} color={COLORS.gold} />
                      <Text style={[styles.refText, citation && styles.refLinkText]}>{r}</Text>
                      {citation ? (
                        <Ionicons name="open-outline" size={12} color={COLORS.gold} />
                      ) : null}
                    </>
                  );

                  return citation ? (
                    <TouchableOpacity
                      key={i}
                      style={[globalStyles.row, styles.refRow]}
                      onPress={() => openCitation(r)}
                      accessibilityRole="link"
                      accessibilityLabel={`Open ${r} in the Quran reader`}
                    >
                      {content}
                    </TouchableOpacity>
                  ) : (
                    <View key={i} style={[globalStyles.row, styles.refRow]}>{content}</View>
                  );
                })}
              </View>
            )}
            {meta && (
              <View style={styles.sourceRow}>
                <Ionicons name={meta.icon} size={12} color={meta.color} />
                <Text style={[styles.sourceText, { color: meta.color }]}>{meta.label}</Text>
              </View>
            )}
            {!isUser && item.retryQuestion && !typing && (
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => retryMessage(item)}
                accessibilityRole="button"
                accessibilityLabel="Try this question again"
              >
                <Ionicons name="refresh" size={13} color={COLORS.gold} />
                <Text style={styles.retryText}>Try again</Text>
              </TouchableOpacity>
            )}
            <Text style={[styles.timeText, isUser && { color: 'rgba(0,0,0,0.5)', textAlign: 'right' }]}>
              {item.time}
            </Text>
          </View>

          {/* Follow-up prompts belong to the newest answer only; repeating
              them under every old bubble would turn the transcript into a
              wall of chips. */}
          {isLatestBot && item.followUps?.length > 0 && (
            <View style={styles.followUpsWrap}>
              <Text style={styles.followUpsLabel}>ASK NEXT</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {item.followUps.map(topic => (
                  <TouchableOpacity
                    key={topic}
                    onPress={() => handleFollowUp(topic)}
                    style={styles.followUpChip}
                    accessibilityRole="button"
                    accessibilityLabel={`Ask about ${topic}`}
                  >
                    <Text style={styles.followUpText}>{topic}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
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
            <View style={{ flexShrink: 1 }}>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 17 }}>Islamic AI Assistant</Text>
              <View style={[globalStyles.row, { gap: 6 }]}>
                <View style={styles.onlineDot} />
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
                  {liveStatus.ok ? 'Online AI' : 'Offline mode'} • {TOTAL_TOPICS} topics
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => setShowTopics(v => !v)}
              style={styles.topicsBtn}
              accessibilityRole="button"
              accessibilityLabel={showTopics ? 'Close topics list' : 'Browse topics'}
            >
              <Ionicons name={showTopics ? 'close' : 'list'} size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setConfirmClear(v => !v)}
              style={styles.topicsBtn}
              accessibilityRole="button"
              accessibilityLabel="Clear conversation"
            >
              <Ionicons name="trash-outline" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Inline confirmation instead of Alert: Alert with two buttons is a
            no-op on React Native Web, so a web user could never confirm. */}
        {confirmClear && (
          <View style={styles.confirmBar}>
            <Text style={styles.confirmText}>Clear this conversation?</Text>
            <TouchableOpacity onPress={() => setConfirmClear(false)} accessibilityRole="button">
              <Text style={styles.confirmCancel}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={clearChat} accessibilityRole="button">
              <Text style={styles.confirmClear}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Topics live in their own searchable sheet. The previous inline
            panel rendered every topic as a chip, which stopped being usable
            once the library grew past a hundred entries. */}
        <TopicBrowserModal
          visible={showTopics}
          onClose={() => setShowTopics(false)}
          onSelectTopic={(topic) => {
            setShowTopics(false);
            sendMessage(`Tell me about ${topic}`);
          }}
        />

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
            <TouchableOpacity
              onPress={() => setShowTopics(true)}
              style={styles.browseAllBtn}
              accessibilityRole="button"
              accessibilityLabel={`Browse all ${TOTAL_TOPICS} topics`}
            >
              <Ionicons name="albums-outline" size={14} color={COLORS.gold} />
              <Text style={styles.browseAllText}>Browse all {TOTAL_TOPICS} topics</Text>
              <Text style={styles.browseAllMeta}>{BROWSE_CATEGORIES.length} areas</Text>
            </TouchableOpacity>
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
              accessibilityLabel="Ask the Islamic AI assistant a question"
            />
          </View>
          <TouchableOpacity
            onPress={() => sendMessage()}
            disabled={!input.trim() || typing}
            style={[styles.sendBtn, (!input.trim() || typing) && { opacity: 0.4 }]}
            accessibilityRole="button"
            accessibilityLabel="Send question"
          >
            <Ionicons name="send" size={18} color="#000" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (COLORS) => StyleSheet.create({
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
  botInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  headerActions: { flexDirection: 'row', gap: 8, flexShrink: 0 },
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
  confirmBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginHorizontal: 12,
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.amber + '12',
    borderWidth: 1,
    borderColor: COLORS.amber + '35',
  },
  confirmText: { flex: 1, color: COLORS.textPrimary, fontSize: 13, fontWeight: '600' },
  confirmCancel: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '700' },
  confirmClear: { color: COLORS.amber, fontSize: 13, fontWeight: '900' },
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
    flexShrink: 1,
  },
  refRow: {
    gap: 6,
    marginTop: 4,
    alignItems: 'center',
  },
  refLinkText: {
    color: COLORS.gold,
    fontStyle: 'normal',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
  },
  sourceText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.gold + '55',
    backgroundColor: COLORS.gold + '14',
  },
  retryText: { color: COLORS.gold, fontSize: 12, fontWeight: '800' },
  followUpsWrap: {
    marginTop: 8,
    marginLeft: 2,
    gap: 6,
  },
  followUpsLabel: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  followUpChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.gold + '45',
    backgroundColor: COLORS.gold + '10',
  },
  followUpText: { color: COLORS.gold, fontSize: 11.5, fontWeight: '700' },
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
  browseAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.gold + '45',
    backgroundColor: COLORS.gold + '10',
  },
  browseAllText: { color: COLORS.gold, fontSize: 12, fontWeight: '800' },
  browseAllMeta: { color: COLORS.textSecondary, fontSize: 10.5 },
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
