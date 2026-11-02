// Full-screen topic directory for the Islamic AI Assistant.
//
// The old panel rendered every topic as one flat row of chips. That worked at
// forty entries and became a wall of text at a hundred and sixty. Here the
// same library is grouped into eight areas with a search box, so a person can
// browse by subject instead of scanning an alphabetical-looking list. Tapping
// a topic sends the same "Tell me about ..." question a chip used to send, so
// retrieval behaviour is unchanged.

import { useEffect, useMemo, useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, SectionList,
  ScrollView, StyleSheet, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors, useGlobalStyles, useThemedStyles } from '../theme';
import { BROWSE_CATEGORIES, TOTAL_TOPICS, topicMatchesQuery } from '../ai/islamicKnowledge';

const ALL = 'all';

export default function TopicBrowserModal({ visible, onClose, onSelectTopic }) {
  const COLORS = useColors();
  const globalStyles = useGlobalStyles();
  const styles = useThemedStyles(makeStyles);

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(ALL);

  // A fresh visit should start at the whole library, not the last search.
  useEffect(() => {
    if (!visible) {
      setQuery('');
      setCategory(ALL);
    }
  }, [visible]);

  const sections = useMemo(() => {
    const trimmed = query.trim();
    return BROWSE_CATEGORIES
      .filter(group => category === ALL || group.id === category)
      .map(group => ({
        ...group,
        data: group.topics.filter(item => topicMatchesQuery(item, trimmed)),
      }))
      .filter(group => group.data.length > 0);
  }, [query, category]);

  const shown = sections.reduce((total, group) => total + group.data.length, 0);
  const accentFor = group => COLORS[group?.accent] || COLORS.gold;

  const sectionHeader = ({ section }) => {
    const accent = accentFor(section);
    return (
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIcon, { backgroundColor: accent + '1A', borderColor: accent + '40' }]}>
          <Ionicons name={section.icon} size={15} color={accent} />
        </View>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <Text style={styles.sectionCount}>{section.data.length}</Text>
      </View>
    );
  };

  const renderTopic = ({ item, section }) => {
    const accent = accentFor(section);
    const preview = item.keywords.slice(0, 2).join(' · ');
    return (
      <TouchableOpacity
        style={styles.topicRow}
        onPress={() => onSelectTopic(item.topic)}
        accessibilityRole="button"
        accessibilityLabel={`Ask about ${item.topic}`}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.topicName}>{item.topic}</Text>
          {preview ? (
            <Text style={styles.topicPreview} numberOfLines={1}>{preview}</Text>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={16} color={accent} />
      </TouchableOpacity>
    );
  };

  const empty = (
    <View style={styles.empty}>
      <Ionicons name="search-outline" size={28} color={COLORS.textSecondary} />
      <Text style={styles.emptyTitle}>No topics found</Text>
      <Text style={styles.emptyBody}>
        Try a shorter word, a transliteration such as "roza", or another category.
      </Text>
      <TouchableOpacity
        style={styles.emptyAction}
        onPress={() => { setQuery(''); setCategory(ALL); }}
        accessibilityRole="button"
        accessibilityLabel="Clear topic search"
      >
        <Text style={styles.emptyActionText}>Clear search</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      transparent={false}
    >
      <SafeAreaView style={globalStyles.screen} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <LinearGradient colors={[COLORS.primary, COLORS.primary]} style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Browse Topics</Text>
              <Text style={styles.subtitle}>
                {TOTAL_TOPICS} answers in {BROWSE_CATEGORIES.length} areas
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close topics"
            >
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={17} color={COLORS.textSecondary} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Search topics or keywords"
              placeholderTextColor={COLORS.textSecondary}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              accessibilityLabel="Search topics"
            />
            {query ? (
              <TouchableOpacity
                onPress={() => setQuery('')}
                accessibilityRole="button"
                accessibilityLabel="Clear search text"
              >
                <Ionicons name="close-circle" size={17} color={COLORS.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableOpacity
              onPress={() => setCategory(ALL)}
              style={[
                styles.categoryChip,
                category === ALL && { backgroundColor: COLORS.gold + '1F', borderColor: COLORS.gold },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Show all topics"
              accessibilityState={{ selected: category === ALL }}
            >
              <Text style={[styles.categoryText, category === ALL && { color: COLORS.gold }]}>
                All {TOTAL_TOPICS}
              </Text>
            </TouchableOpacity>
            {BROWSE_CATEGORIES.map(group => {
              const selected = category === group.id;
              const accent = accentFor(group);
              return (
                <TouchableOpacity
                  key={group.id}
                  onPress={() => setCategory(group.id)}
                  style={[
                    styles.categoryChip,
                    selected && { backgroundColor: accent + '1F', borderColor: accent },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Show ${group.title}`}
                  accessibilityState={{ selected }}
                >
                  <Ionicons
                    name={group.icon}
                    size={13}
                    color={selected ? accent : COLORS.textSecondary}
                  />
                  <Text style={[styles.categoryText, selected && { color: accent }]}>
                    {group.title} {group.topics.length}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {query ? (
            <Text style={styles.resultLine}>
              {shown} {shown === 1 ? 'topic' : 'topics'} for "{query.trim()}"
            </Text>
          ) : null}

          <SectionList
            sections={sections}
            keyExtractor={item => item.topic}
            renderItem={renderTopic}
            renderSectionHeader={sectionHeader}
            ListEmptyComponent={empty}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            stickySectionHeadersEnabled={false}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={(
              <Text style={styles.footer}>
                Tap a topic to ask the assistant. For a personal ruling, consult a qualified scholar.
              </Text>
            )}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const makeStyles = (COLORS) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 17,
    paddingBottom: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: { color: '#fff', fontSize: 21, fontWeight: '900' },
  subtitle: { color: 'rgba(255,255,255,0.82)', fontSize: 12, marginTop: 3 },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 14,
    marginTop: 13,
    paddingHorizontal: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    backgroundColor: COLORS.glass,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
    paddingVertical: Platform.OS === 'ios' ? 11 : 9,
  },
  chipRow: {
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    backgroundColor: COLORS.glass,
  },
  categoryText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '700' },
  resultLine: {
    color: COLORS.textSecondary,
    fontSize: 11.5,
    marginHorizontal: 16,
    marginBottom: 4,
  },
  listContent: { paddingHorizontal: 14, paddingBottom: 26, flexGrow: 1 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: 10,
    marginBottom: 8,
  },
  sectionIcon: {
    width: 27,
    height: 27,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  sectionTitle: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '900',
  },
  sectionCount: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '700' },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    backgroundColor: COLORS.glass,
    marginBottom: 7,
  },
  topicName: { color: COLORS.textPrimary, fontSize: 13.5, fontWeight: '700' },
  topicPreview: { color: COLORS.textSecondary, fontSize: 10.5, marginTop: 2 },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 46,
    paddingHorizontal: 28,
    gap: 8,
  },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '800' },
  emptyBody: {
    color: COLORS.textSecondary,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
  },
  emptyAction: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 16,
    backgroundColor: COLORS.gold + '1A',
    borderWidth: 1,
    borderColor: COLORS.gold + '55',
  },
  emptyActionText: { color: COLORS.gold, fontSize: 12.5, fontWeight: '800' },
  footer: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 18,
    marginHorizontal: 10,
  },
});
