// Local-first community circles.
//
// There is no community server yet, so this screen is explicit about what it
// is: named circles, conversation prompts and private notes stored on the
// device. Presenting fabricated members or live activity would be dishonest,
// so the interface counts what actually exists.

import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors, useGlobalStyles, useThemedStyles } from '../theme';
import { useLanguage } from '../context/LanguageContext';
import { useShare } from '../context/ShareContext';
import { APP_CONFIG } from '../config/appConfig';
import {
  COMMUNITY_CIRCLES, COMMUNITY_CATEGORIES, COMMUNITY_NOTE,
} from '../data/communities';

const STORAGE_KEY = 'qitab_communities_v1';

export default function CommunitiesScreen() {
  const COLORS = useColors();
  const globalStyles = useGlobalStyles();
  const styles = useThemedStyles(makeStyles);
  const { isUrdu } = useLanguage();
  const { share } = useShare();

  const [category, setCategory] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [customCircles, setCustomCircles] = useState([]);
  const [posts, setPosts] = useState({});
  const [loaded, setLoaded] = useState(false);

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('quran');

  const [draft, setDraft] = useState('');
  const [confirmPost, setConfirmPost] = useState(null);
  const [confirmCircle, setConfirmCircle] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        const parsed = raw ? JSON.parse(raw) : {};
        if (Array.isArray(parsed.circles)) setCustomCircles(parsed.circles);
        if (parsed.posts && typeof parsed.posts === 'object') setPosts(parsed.posts);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const persist = async (nextCircles, nextPosts) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
      circles: nextCircles,
      posts: nextPosts,
    }));
  };

  const allCircles = useMemo(
    () => [...COMMUNITY_CIRCLES, ...customCircles],
    [customCircles]
  );

  const selected = allCircles.find(circle => circle.id === selectedId) || null;

  const totalPosts = useMemo(
    () => Object.values(posts).reduce((sum, list) => sum + (Array.isArray(list) ? list.length : 0), 0),
    [posts]
  );

  const filtered = category === 'all'
    ? allCircles
    : allCircles.filter(circle => circle.category === category);

  const createCircle = async () => {
    const name = newName.trim();
    if (!name) return;
    const circle = {
      id: `custom-${Date.now()}`,
      name,
      category: newCategory,
      icon: 'people-outline',
      accent: 'purple',
      description: newDesc.trim() || 'A private circle on this device.',
      prompts: [],
      custom: true,
    };
    const next = [...customCircles, circle];
    setCustomCircles(next);
    await persist(next, posts);
    setNewName('');
    setNewDesc('');
    setCreating(false);
    setSelectedId(circle.id);
  };

  const addPost = async (circleId) => {
    const text = draft.trim();
    if (!text) return;
    const list = Array.isArray(posts[circleId]) ? posts[circleId] : [];
    const nextPosts = {
      ...posts,
      [circleId]: [
        { id: `post-${Date.now()}`, text, createdAt: new Date().toISOString() },
        ...list,
      ],
    };
    setPosts(nextPosts);
    setDraft('');
    await persist(customCircles, nextPosts);
  };

  const removePost = async (circleId, postId) => {
    if (confirmPost !== postId) {
      setConfirmPost(postId);
      return;
    }
    const list = Array.isArray(posts[circleId]) ? posts[circleId] : [];
    const nextPosts = { ...posts, [circleId]: list.filter(post => post.id !== postId) };
    setPosts(nextPosts);
    setConfirmPost(null);
    await persist(customCircles, nextPosts);
  };

  const removeCircle = async (circleId) => {
    if (confirmCircle !== circleId) {
      setConfirmCircle(circleId);
      return;
    }
    const nextCircles = customCircles.filter(circle => circle.id !== circleId);
    const nextPosts = { ...posts };
    delete nextPosts[circleId];
    setCustomCircles(nextCircles);
    setPosts(nextPosts);
    setConfirmCircle(null);
    setSelectedId(null);
    await persist(nextCircles, nextPosts);
  };

  const shareCircle = async (circle) => {
    await share({
      title: circle.name,
      message: `${circle.name}\n\n${circle.description}\n\nA circle in Qitab-e-Noor.`,
      url: APP_CONFIG.shareUrl('/communities'),
    });
  };

  // ── Circle detail ──────────────────────────────────────────────────────
  if (selected) {
    const accent = COLORS[selected.accent] || COLORS.gold;
    const circlePosts = Array.isArray(posts[selected.id]) ? posts[selected.id] : [];

    return (
      <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 44 }}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            onPress={() => { setSelectedId(null); setConfirmPost(null); setConfirmCircle(null); }}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Back to all circles"
          >
            <Ionicons name="arrow-back" size={17} color={COLORS.textPrimary} />
            <Text style={styles.backText}>All circles</Text>
          </TouchableOpacity>

          <LinearGradient
            colors={[accent + '35', COLORS.bgSecondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.detailHero, { borderColor: accent + '45' }]}
          >
            <View style={styles.detailTop}>
              <View style={[styles.detailIcon, { backgroundColor: accent + '22', borderColor: accent + '55' }]}>
                <Ionicons name={selected.icon} size={24} color={accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailName}>
                  {isUrdu && selected.nameUr ? selected.nameUr : selected.name}
                </Text>
                <Text style={styles.detailBadge}>PRIVATE · ON THIS DEVICE</Text>
              </View>
              <TouchableOpacity
                onPress={() => shareCircle(selected)}
                style={styles.iconBtn}
                accessibilityRole="button"
                accessibilityLabel={`Share ${selected.name}`}
              >
                <Ionicons name="share-social-outline" size={17} color={COLORS.gold} />
              </TouchableOpacity>
            </View>
            <Text style={styles.detailDesc}>{selected.description}</Text>
          </LinearGradient>

          {selected.prompts?.length ? (
            <>
              <Text style={styles.sectionTitle}>Conversation starters</Text>
              <Text style={styles.sectionIntro}>
                Tap a prompt to place it in the composer, then write your own
                answer below it.
              </Text>
              {selected.prompts.map((prompt, index) => (
                <TouchableOpacity
                  key={prompt}
                  onPress={() => setDraft(prompt)}
                  style={styles.promptCard}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`Use prompt: ${prompt}`}
                >
                  <View style={styles.promptNum}>
                    <Text style={styles.promptNumText}>{index + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.promptText}>{prompt}</Text>
                    <Text style={styles.promptHint}>Tap to write about this</Text>
                  </View>
                  <Ionicons name="arrow-up-outline" size={14} color={accent} />
                </TouchableOpacity>
              ))}
            </>
          ) : null}

          <Text style={styles.sectionTitle}>Write something</Text>
          <View style={styles.composer}>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              placeholder="Share a reflection, a question or a dua…"
              placeholderTextColor={COLORS.textSecondary}
              multiline
              textAlignVertical="top"
              accessibilityLabel="Write a post"
            />
            <View style={styles.composerFoot}>
              <Text style={styles.composerHint}>Stored on this device</Text>
              <TouchableOpacity
                onPress={() => addPost(selected.id)}
                style={[styles.postBtn, !draft.trim() && { opacity: 0.4 }]}
                disabled={!draft.trim()}
                accessibilityRole="button"
                accessibilityLabel="Post to circle"
              >
                <Ionicons name="send" size={13} color={COLORS.bg} />
                <Text style={styles.postBtnText}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.postsHead}>
            <Text style={styles.sectionTitle}>Your notes</Text>
            <Text style={styles.postCount}>{circlePosts.length}</Text>
          </View>

          {circlePosts.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="chatbubble-ellipses-outline" size={28} color={COLORS.textSecondary} />
              <Text style={styles.emptyTitle}>The circle is quiet</Text>
              <Text style={styles.emptyText}>
                Nothing is shared between devices. Start with a prompt above and
                keep your own record of the conversation.
              </Text>
            </View>
          ) : null}

          {circlePosts.map(post => (
            <View key={post.id} style={styles.post}>
              <View style={styles.postHead}>
                <View style={[styles.avatar, { backgroundColor: accent + '20', borderColor: accent + '45' }]}>
                  <Ionicons name="person" size={12} color={accent} />
                </View>
                <Text style={styles.postAuthor}>You</Text>
                <Text style={styles.postDate}>
                  {new Date(post.createdAt).toLocaleDateString(undefined, {
                    day: 'numeric', month: 'short',
                  })}
                </Text>
                <View style={{ flex: 1 }} />
                <TouchableOpacity
                  onPress={() => removePost(selected.id, post.id)}
                  style={{ padding: 4 }}
                  accessibilityRole="button"
                  accessibilityLabel={confirmPost === post.id ? 'Confirm delete post' : 'Delete post'}
                >
                  <Ionicons
                    name={confirmPost === post.id ? 'alert-circle-outline' : 'trash-outline'}
                    size={14}
                    color={COLORS.red}
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.postText}>{post.text}</Text>
              {confirmPost === post.id ? (
                <Text style={styles.confirmHint}>Tap the trash again to delete.</Text>
              ) : null}
            </View>
          ))}

          {selected.custom ? (
            <TouchableOpacity
              onPress={() => removeCircle(selected.id)}
              style={styles.deleteCircle}
              accessibilityRole="button"
              accessibilityLabel={confirmCircle === selected.id ? 'Confirm delete circle' : 'Delete this circle'}
            >
              <Ionicons
                name={confirmCircle === selected.id ? 'alert-circle-outline' : 'trash-outline'}
                size={15}
                color={COLORS.red}
              />
              <Text style={styles.deleteCircleText}>
                {confirmCircle === selected.id ? 'Tap again to delete this circle' : 'Delete this circle'}
              </Text>
            </TouchableOpacity>
          ) : null}

          <View style={styles.noteCard}>
            <Ionicons name="lock-closed-outline" size={16} color={COLORS.gold} />
            <Text style={styles.noteText}>
              Everything in this circle is stored locally. It is not visible to
              anyone else and is removed if you clear app data.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Circle list ────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 44 }}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={[COLORS.primary, '#0D2A20', COLORS.bg]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroIcon}>
            <Ionicons name="people" size={24} color={COLORS.gold} />
          </View>
          <Text style={styles.heroEyebrow}>TOGETHER IN THE DEEN</Text>
          <Text style={styles.heroTitle}>Islamic Communities</Text>
          <Text style={[styles.heroSub, isUrdu && styles.urdu]}>
            {isUrdu
              ? 'اپنے حلقے منتخب کریں، سوال لکھیں اور اپنی روحانی ڈائری محفوظ رکھیں۔'
              : 'Choose a circle, answer a prompt and keep a private record of the conversation — all on this device.'}
          </Text>
          <View style={styles.heroStats}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{allCircles.length}</Text>
              <Text style={styles.statLabel}>Circles</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>{totalPosts}</Text>
              <Text style={styles.statLabel}>Your posts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: COLORS.emerald }]}>Local</Text>
              <Text style={styles.statLabel}>Privacy</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.privacy}>
          <Ionicons name="lock-closed-outline" size={16} color={COLORS.gold} />
          <Text style={styles.privacyText}>
            No accounts, no followers and no server upload. These circles are a
            private workspace, not a public feed.
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {COMMUNITY_CATEGORIES.map(item => {
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

        <TouchableOpacity
          onPress={() => setCreating(value => !value)}
          style={styles.createCard}
          accessibilityRole="button"
          accessibilityState={{ expanded: creating }}
          accessibilityLabel="Create a new circle"
        >
          <View style={styles.createIcon}>
            <Ionicons name={creating ? 'close' : 'add'} size={20} color={COLORS.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.createTitle}>{creating ? 'Cancel' : 'Create a circle'}</Text>
            <Text style={styles.createSub}>
              {creating ? 'Close the form' : 'A private space for a study group, family or halaqah'}
            </Text>
          </View>
        </TouchableOpacity>

        {creating ? (
          <View style={styles.formCard}>
            <Text style={styles.formLabel}>Circle name</Text>
            <TextInput
              style={styles.inputSmall}
              value={newName}
              onChangeText={setNewName}
              placeholder="e.g. Family Qur’an circle"
              placeholderTextColor={COLORS.textSecondary}
              accessibilityLabel="Circle name"
            />
            <Text style={[styles.formLabel, { marginTop: 12 }]}>Intention or description</Text>
            <TextInput
              style={[styles.inputSmall, { minHeight: 70 }]}
              value={newDesc}
              onChangeText={setNewDesc}
              placeholder="What is this circle for?"
              placeholderTextColor={COLORS.textSecondary}
              multiline
              textAlignVertical="top"
              accessibilityLabel="Circle description"
            />
            <Text style={[styles.formLabel, { marginTop: 12 }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {COMMUNITY_CATEGORIES.filter(item => item.id !== 'all').map(item => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setNewCategory(item.id)}
                  style={[styles.miniChip, newCategory === item.id && styles.miniChipActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: newCategory === item.id }}
                  accessibilityLabel={item.label}
                >
                  <Text style={[styles.miniChipText, newCategory === item.id && { color: COLORS.bg }]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              onPress={createCircle}
              style={[styles.primaryBtn, !newName.trim() && { opacity: 0.4 }]}
              disabled={!newName.trim()}
              accessibilityRole="button"
              accessibilityLabel="Save circle"
            >
              <Ionicons name="add-circle-outline" size={16} color={COLORS.bg} />
              <Text style={styles.primaryBtnText}>Create circle</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {filtered.map(circle => {
          const accent = COLORS[circle.accent] || COLORS.gold;
          const count = Array.isArray(posts[circle.id]) ? posts[circle.id].length : 0;
          return (
            <TouchableOpacity
              key={circle.id}
              onPress={() => { setSelectedId(circle.id); setDraft(''); }}
              style={[styles.circleCard, { borderColor: accent + '30' }]}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`${circle.name}. ${count} of your posts.`}
            >
              <View style={[styles.circleIcon, { backgroundColor: accent + '1A', borderColor: accent + '45' }]}>
                <Ionicons name={circle.icon} size={21} color={accent} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.circleNameRow}>
                  <Text style={styles.circleName}>
                    {isUrdu && circle.nameUr ? circle.nameUr : circle.name}
                  </Text>
                  {circle.custom ? (
                    <View style={styles.customBadge}>
                      <Text style={styles.customBadgeText}>MINE</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.circleDesc} numberOfLines={2}>{circle.description}</Text>
                <View style={styles.circleMeta}>
                  <Ionicons name="chatbubbles-outline" size={11} color={COLORS.textSecondary} />
                  <Text style={styles.circleMetaText}>{count} {count === 1 ? 'note' : 'notes'}</Text>
                  {circle.prompts?.length ? (
                    <>
                      <Text style={styles.metaDot}>·</Text>
                      <Text style={styles.circleMetaText}>{circle.prompts.length} prompts</Text>
                    </>
                  ) : null}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={17} color={COLORS.textSecondary} />
            </TouchableOpacity>
          );
        })}

        <View style={styles.noteCard}>
          <Ionicons name="information-circle-outline" size={17} color={COLORS.gold} />
          <Text style={styles.noteText}>{COMMUNITY_NOTE}</Text>
        </View>

        {loaded && filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={28} color={COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>No circles in this category</Text>
            <Text style={styles.emptyText}>Choose another category or create your own.</Text>
          </View>
        ) : null}
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
  heroStats: { flexDirection: 'row', alignItems: 'center', marginTop: 17 },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { color: '#fff', fontSize: 19, fontWeight: '900' },
  statLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 9.5, fontWeight: '700', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.7 },
  statDivider: { width: 1, height: 27, backgroundColor: 'rgba(255,255,255,0.14)' },

  privacy: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginTop: 13,
    backgroundColor: COLORS.gold + '0D', borderRadius: 13, padding: 12,
    borderWidth: 1, borderColor: COLORS.gold + '25',
  },
  privacyText: { flex: 1, color: COLORS.textSecondary, fontSize: 11, lineHeight: 17 },

  chipRow: { gap: 7, paddingVertical: 15 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  chipActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  chipText: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '800' },

  createCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    borderRadius: 16, borderWidth: 1, borderStyle: 'dashed',
    borderColor: COLORS.gold + '45', backgroundColor: COLORS.gold + '07',
    marginBottom: 12,
  },
  createIcon: {
    width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.gold + '15',
  },
  createTitle: { color: COLORS.gold, fontSize: 13.5, fontWeight: '800' },
  createSub: { color: COLORS.textSecondary, fontSize: 10.5, marginTop: 2, lineHeight: 15 },

  formCard: {
    backgroundColor: COLORS.glass, borderRadius: 16, padding: 15,
    borderWidth: 1, borderColor: COLORS.glassBorder, marginBottom: 13,
  },
  formLabel: {
    color: COLORS.textSecondary, fontSize: 10, fontWeight: '800',
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6,
  },
  inputSmall: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: COLORS.glassBorder,
    borderRadius: 10, paddingHorizontal: 11, paddingVertical: 9,
    color: COLORS.textPrimary, fontSize: 12.5,
  },
  miniChip: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  miniChipActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  miniChipText: { color: COLORS.textSecondary, fontSize: 10.5, fontWeight: '700' },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: COLORS.gold, borderRadius: 11, paddingVertical: 11, marginTop: 13,
  },
  primaryBtnText: { color: COLORS.bg, fontSize: 12.5, fontWeight: '800' },

  circleCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14,
    backgroundColor: COLORS.glass, borderRadius: 17, borderWidth: 1,
    marginBottom: 9,
  },
  circleIcon: {
    width: 42, height: 42, borderRadius: 13, alignItems: 'center',
    justifyContent: 'center', borderWidth: 1,
  },
  circleNameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  circleName: { flexShrink: 1, color: COLORS.textPrimary, fontSize: 14.5, fontWeight: '800' },
  customBadge: {
    backgroundColor: COLORS.purple + '20', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1.5,
  },
  customBadgeText: { color: COLORS.purple, fontSize: 7.5, fontWeight: '900', letterSpacing: 0.6 },
  circleDesc: { color: COLORS.textSecondary, fontSize: 11.5, lineHeight: 17, marginTop: 3 },
  circleMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 7 },
  circleMetaText: { color: COLORS.textSecondary, fontSize: 9.5, fontWeight: '600' },
  metaDot: { color: COLORS.textSecondary, fontSize: 9 },

  noteCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 12,
    backgroundColor: COLORS.gold + '0D', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: COLORS.gold + '28',
  },
  noteText: { flex: 1, color: COLORS.textSecondary, fontSize: 11, lineHeight: 17 },

  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', marginBottom: 12 },
  backText: { color: COLORS.textPrimary, fontSize: 12.5, fontWeight: '700' },

  detailHero: { borderRadius: 20, padding: 18, borderWidth: 1, overflow: 'hidden' },
  detailTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  detailIcon: {
    width: 48, height: 48, borderRadius: 15, alignItems: 'center',
    justifyContent: 'center', borderWidth: 1,
  },
  detailName: { color: COLORS.textPrimary, fontSize: 19, fontWeight: '900' },
  detailBadge: { color: COLORS.textSecondary, fontSize: 8.5, fontWeight: '800', letterSpacing: 1, marginTop: 3 },
  iconBtn: {
    width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.16)', borderWidth: 1, borderColor: COLORS.gold + '30',
  },
  detailDesc: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 19, marginTop: 13 },

  sectionTitle: { color: COLORS.textPrimary, fontSize: 15.5, fontWeight: '800', marginTop: 19, marginBottom: 9 },
  sectionIntro: { color: COLORS.textSecondary, fontSize: 11.5, lineHeight: 17, marginTop: -4, marginBottom: 10 },

  promptCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 13,
    backgroundColor: COLORS.glass, borderRadius: 14, borderWidth: 1,
    borderColor: COLORS.glassBorder, marginBottom: 8,
  },
  promptNum: {
    width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  promptNumText: { color: COLORS.gold, fontSize: 10, fontWeight: '800' },
  promptText: { color: COLORS.textPrimary, fontSize: 12.5, lineHeight: 19 },
  promptHint: { color: COLORS.gold, fontSize: 9.5, fontWeight: '700', marginTop: 4 },

  composer: {
    backgroundColor: COLORS.glass, borderRadius: 15, padding: 12,
    borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  input: {
    minHeight: 86, color: COLORS.textPrimary, fontSize: 13, lineHeight: 19,
    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.glassBorder, padding: 11,
  },
  composerFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 9 },
  composerHint: { color: COLORS.textSecondary, fontSize: 9.5 },
  postBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.gold, borderRadius: 9,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  postBtnText: { color: COLORS.bg, fontSize: 11, fontWeight: '800' },

  postsHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  postCount: {
    color: COLORS.textSecondary, fontSize: 10, fontWeight: '800',
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 999,
    paddingHorizontal: 7, paddingVertical: 2, marginTop: 10,
  },
  post: {
    backgroundColor: COLORS.glass, borderRadius: 15, padding: 13,
    borderWidth: 1, borderColor: COLORS.glassBorder, marginBottom: 9,
  },
  postHead: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  avatar: {
    width: 25, height: 25, borderRadius: 13, alignItems: 'center',
    justifyContent: 'center', borderWidth: 1,
  },
  postAuthor: { color: COLORS.textPrimary, fontSize: 11.5, fontWeight: '800' },
  postDate: { color: COLORS.textSecondary, fontSize: 9.5 },
  postText: { color: COLORS.textSecondary, fontSize: 12.5, lineHeight: 20, marginTop: 9 },
  confirmHint: { color: COLORS.red, fontSize: 9.5, marginTop: 7, fontWeight: '700' },

  deleteCircle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    marginTop: 12, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.red + '35', backgroundColor: COLORS.red + '08',
  },
  deleteCircleText: { color: COLORS.red, fontSize: 11, fontWeight: '700' },

  empty: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 24 },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 13.5, fontWeight: '800', marginTop: 9 },
  emptyText: { color: COLORS.textSecondary, fontSize: 11.5, lineHeight: 18, textAlign: 'center', marginTop: 5 },
});
