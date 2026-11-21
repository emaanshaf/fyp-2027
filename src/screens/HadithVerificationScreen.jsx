import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useGlobalStyles, useThemedStyles } from '../theme';
import { hadithService, HADITH_COLLECTIONS } from '../services/hadithApi';
import {
  buildChain, collectorFor, graderFor, gradeMeaning,
} from '../data/isnad';

// The CDN publishes one JSON document per collection and has no search API.
// This screen used to request `/{collection}/search.json?keyword=` and
// `/{collection}/json/{n}.json`, neither of which exists — both 404'd, so
// every search fell into the error branch and verification never worked.
// Searching now runs locally over the collection the service has cached.
const COLLECTIONS = HADITH_COLLECTIONS.map(c => ({
  id: c.id,
  name: c.name,
  color: c.color,
  grade: c.grade,
}));

/**
 * The chain of transmission for one hadith.
 *
 * The intermediate narrators are shown as an explicit gap, not as names: the
 * CDN supplies the text and grade but no isnad, and inventing narrators to
 * fill a chain would be far worse than admitting the app does not hold them.
 * The printed reference is given so the reader can look the chain up.
 */
function IsnadChain({ hadith }) {
  const styles = useThemedStyles(makeStyles);
  const chain = buildChain({
    collectionId: hadith.book,
    companion: hadith.narrator,
  });
  const collector = collectorFor(hadith.book);
  const grader = graderFor(hadith.gradedBy);

  return (
    <View style={styles.chain}>
      {chain.map((stage, i) => (
        <View key={stage.key} style={styles.chainRow}>
          <View style={styles.chainRail}>
            <View style={[styles.chainDot, stage.known ? styles.chainDotKnown : styles.chainDotUnknown]} />
            {i < chain.length - 1 ? <View style={styles.chainLine} /> : null}
          </View>

          <View style={styles.chainBody}>
            <Text style={styles.chainArabic}>{stage.arabic}</Text>
            <Text style={styles.chainTitle}>{stage.person || stage.title}</Text>
            <Text style={styles.chainRole}>{stage.role}</Text>

            {stage.known ? (
              <Text style={styles.chainDetail}>{stage.detail}</Text>
            ) : (
              <Text style={styles.chainUnknown}>
                Recorded in the printed collection, but not carried in this
                app's data — look them up at the reference below.
              </Text>
            )}

            {stage.collector ? (
              <View style={styles.collectorBox}>
                <Text style={styles.collectorArabic}>{stage.collector.arabic}</Text>
                <Text style={styles.collectorLine}>{stage.collector.lived}</Text>
                <Text style={styles.collectorLine}>Born {stage.collector.born}</Text>
                <Text style={styles.collectorCriteria}>{stage.collector.criteria}</Text>
                {stage.collector.note ? (
                  <Text style={styles.collectorNote}>{stage.collector.note}</Text>
                ) : null}
              </View>
            ) : null}
          </View>
        </View>
      ))}

      <View style={styles.chainFooter}>
        <Text style={styles.chainFooterLabel}>Reference</Text>
        <Text style={styles.chainFooterValue}>
          {collector?.work || hadith.book} {hadith.number}
        </Text>
      </View>

      {grader ? (
        <View style={styles.chainFooter}>
          <Text style={styles.chainFooterLabel}>Graded by</Text>
          <Text style={styles.chainFooterValue}>
            {grader.name}{grader.lived ? ` · ${grader.lived}` : ''}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/**
 * Example queries are real words from the collections, not invented hadith
 * text. Tapping one runs the search — nothing here is presented as a quote.
 */
const QUICK_SEARCHES = ['intentions', 'patience', 'charity', 'knowledge'];

export default function HadithVerificationScreen({ route }) {
  // ── Live theme hooks (replaces frozen module-level COLORS) ────────────
  const COLORS = useColors();
  const globalStyles = useGlobalStyles();
  const styles = useThemedStyles(makeStyles);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [error, setError] = useState(null);
  const [searchMode, setSearchMode] = useState('keyword'); // keyword | number
  const [openChain, setOpenChain] = useState(null);
  const [progress, setProgress] = useState(null);
  const [failed, setFailed] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const autoRan = useRef(false);

  /**
   * Normalises a hadith from the CDN into what this screen renders.
   * `grades` is an array of {name, grade} from different scholars; the
   * collection's own grade is the fallback when a hadith carries none.
   */
  const toResult = (h, collectionId) => {
    const meta = COLLECTIONS.find(c => c.id === collectionId);
    const graded = (h.grades || []).find(g => g.grade);
    return {
      id: `${collectionId}:${h.hadithnumber}`,
      text: h.text || 'Text not available',
      book: collectionId,
      number: h.hadithnumber,
      grade: graded?.grade || meta?.grade || 'Not graded',
      gradedBy: graded?.name || null,
      reference: h.reference,
      // Only set when the source actually records a narrator. Left undefined
      // otherwise so the chain shows an honest gap instead of a guess.
      narrator: h.narrator || null,
    };
  };

  const runSearch = async ({ q = query, mode = searchMode, collection = selectedCollection } = {}) => {
    const text = String(q || '').trim();
    if (!text) return;

    setLoading(true);
    setError(null);
    setResults([]);
    setFailed([]);
    setHasSearched(true);
    setProgress('Preparing…');

    const failedCollections = [];
    const onFailure = c => failedCollections.push(c);

    try {
      if (mode === 'number') {
        const num = parseInt(text, 10);
        if (!num) { setError('Please enter a valid hadith number.'); return; }

        // Without a collection chosen, look the number up in each in turn.
        const targets = collection ? [collection] : COLLECTIONS.map(c => c.id);
        const found = [];
        for (let i = 0; i < targets.length; i++) {
          const coll = targets[i];
          const meta = COLLECTIONS.find(c => c.id === coll);
          setProgress(`${meta?.name || coll} (${i + 1} of ${targets.length})…`);
          try {
            const all = await hadithService.getAllHadiths(coll);
            const h = all.find(item => String(item.hadithnumber) === String(num));
            if (h) found.push(toResult(h, coll));
          } catch {
            onFailure(meta || { id: coll, name: coll });
          }
        }
        setResults(found);
        setFailed(failedCollections);
        if (!found.length) {
          setError(
            failedCollections.length
              ? 'Some collections could not be downloaded. Check your connection and try again.'
              : `No hadith numbered ${num} in ${collection ? 'that collection' : 'any collection'}.`
          );
        }
      } else if (collection) {
        const hits = await hadithService.search(collection, text, { throwOnError: true });
        setProgress('Preparing…');
        setResults(hits.slice(0, 50).map(h => toResult(h, collection)));
        if (!hits.length) setError('No hadith matched that text in this collection.');
      } else {
        // Across all six collections — the actual "verification" case: does
        // this wording appear in an authentic book, and how is it graded?
        const hits = await hadithService.searchAll(text, {
          limit: 50,
          onProgress: ({ collection: c, index, total }) =>
            setProgress(`${c.name} (${index + 1} of ${total})…`),
          onFailure,
        });
        setResults(hits.map(h => toResult(h, h.collectionId)));
        setFailed(failedCollections);
        if (!hits.length) {
          setError(
            failedCollections.length
              ? `Could not download ${failedCollections.length === 1 ? 'a collection' : `${failedCollections.length} collections`}. Check your connection and try again.`
              : 'No hadith matched that text. It may be worded differently, or it ' +
                'may not appear in these six collections.'
          );
        }
      }
    } catch (e) {
      console.warn('Hadith search failed:', e?.message);
      setFailed(failedCollections);
      setError('Could not search. The collection needs to download once — check your connection.');
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  const searchHadith = () => runSearch();

  // Opening a shared reference — or the Hadith of the Day card — lands here
  // with the collection and number already known. Look that one hadith up
  // instead of showing an empty form.
  useEffect(() => {
    const params = route?.params;
    if (!params || autoRan.current) return;
    const coll = COLLECTIONS.some(c => c.id === params.collection) ? params.collection : null;
    if (coll) setSelectedCollection(coll);
    if (params.number != null) {
      autoRan.current = true;
      setSearchMode('number');
      setQuery(String(params.number));
      runSearch({ q: String(params.number), mode: 'number', collection: coll });
    } else if (params.query) {
      setSearchMode('keyword');
      setQuery(String(params.query));
    }
  }, [route?.params]);

  const getGradeColor = (grade) => {
    if (!grade) return COLORS.textSecondary;
    const g = grade.toLowerCase();
    if (g.includes('sahih') || g.includes('hasan')) return COLORS.emerald;
    if (g.includes('da\'if') || g.includes('weak')) return COLORS.amber;
    return COLORS.textSecondary;
  };

  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Search Mode Toggle */}
        <View style={styles.modeRow}>
          <TouchableOpacity onPress={() => setSearchMode('keyword')}
            style={[styles.modeBtn, searchMode === 'keyword' && styles.modeActive]}>
            <Ionicons name="search" size={14} color={searchMode === 'keyword' ? '#fff' : COLORS.textSecondary} />
            <Text style={[styles.modeText, searchMode === 'keyword' && { color: '#fff' }]}>Search Text</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSearchMode('number')}
            style={[styles.modeBtn, searchMode === 'number' && styles.modeActive]}>
            <Ionicons name="hash" size={14} color={searchMode === 'number' ? '#fff' : COLORS.textSecondary} />
            <Text style={[styles.modeText, searchMode === 'number' && { color: '#fff' }]}>By Number</Text>
          </TouchableOpacity>
        </View>

        {/* Collection Picker */}
        <FlatList horizontal showsHorizontalScrollIndicator={false} data={COLLECTIONS}
          keyExtractor={c => c.id} contentContainerStyle={{ paddingHorizontal: 12, gap: 8, paddingVertical: 10 }}
          renderItem={({ item: c }) => (
            <TouchableOpacity onPress={() => setSelectedCollection(c.id === selectedCollection ? null : c.id)}
              style={[styles.collChip, selectedCollection === c.id && { backgroundColor: c.color + '20', borderColor: c.color }]}>
              <Text style={[styles.collText, selectedCollection === c.id && { color: c.color }]}>{c.name}</Text>
            </TouchableOpacity>
          )} />

        {/* Search */}
        <View style={styles.searchRow}>
          <TextInput style={styles.searchInput} value={query} onChangeText={setQuery}
            placeholder={searchMode === 'keyword' ? 'Search hadith text...' : 'Enter hadith number (e.g. 1)'}
            placeholderTextColor={COLORS.placeholder} onSubmitEditing={searchHadith} returnKeyType="search" />
          <TouchableOpacity
            style={styles.searchBtn}
            onPress={searchHadith}
            accessibilityRole="button"
            accessibilityLabel="Search hadith"
          >
            <Ionicons name="search" size={18} color="#000" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator color={COLORS.gold} size="large" />
            <Text style={{ color: COLORS.textSecondary, marginTop: 12 }}>
              {progress || 'Searching…'}
            </Text>
            <Text style={{ color: COLORS.textSecondary, marginTop: 6, fontSize: 11, opacity: 0.7, textAlign: 'center', paddingHorizontal: 24 }}>
              The first search downloads each collection once (about 5 MB each); afterwards it works offline.
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={24} color={COLORS.amber} />
            <Text style={{ color: COLORS.textSecondary, fontSize: 13, textAlign: 'center' }}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={searchHadith}>
              <Ionicons name="refresh" size={14} color="#000" />
              <Text style={styles.retryText}>Search again</Text>
            </TouchableOpacity>
          </View>
        ) : results.length === 0 && !hasSearched ? (
          <View style={styles.guideCard}>
            <Ionicons name="shield-checkmark-outline" size={26} color={COLORS.emerald} />
            <Text style={styles.guideTitle}>Check a hadith against the collections</Text>
            <Text style={styles.guideText}>
              Search the wording of a hadith across Sahih Bukhari, Sahih Muslim and the four
              Sunan. Choose a collection above to narrow the search, or search by number.
            </Text>
            <Text style={styles.guideLabel}>Try a word</Text>
            <View style={styles.quickRow}>
              {QUICK_SEARCHES.map(word => (
                <TouchableOpacity
                  key={word}
                  style={styles.quickChip}
                  accessibilityRole="button"
                  accessibilityLabel={`Search for ${word}`}
                  onPress={() => {
                    setSearchMode('keyword');
                    setQuery(word);
                    runSearch({ q: word, mode: 'keyword' });
                  }}
                >
                  <Ionicons name="search-outline" size={12} color={COLORS.gold} />
                  <Text style={styles.quickText}>{word}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 12 }}>
            {results.length > 0 && (
              <Text style={styles.resultCount}>
                {results.length} match{results.length === 1 ? '' : 'es'}
                {selectedCollection ? '' : ' across all collections'}
              </Text>
            )}
            {results.length === 0 && hasSearched && !error ? (
              <Text style={styles.guideText}>No results. Try different wording.</Text>
            ) : null}
            {failed.length > 0 && results.length > 0 ? (
              <Text style={styles.partialNote}>
                {failed.length === 1
                  ? `${failed[0].name} could not be downloaded, so these results are partial.`
                  : `${failed.length} collections could not be downloaded, so these results are partial.`}
              </Text>
            ) : null}
            {results.map((h, i) => (
              <View key={i} style={styles.resultCard}>
                <View style={globalStyles.spaceBetween}>
                  <View style={styles.numBadge}>
                    <Text style={styles.numText}>#{h.number || h.id}</Text>
                  </View>
                  <View style={[styles.gradeBadge, { backgroundColor: getGradeColor(h.grade) + '20' }]}>
                    <Ionicons name="shield-checkmark" size={10} color={getGradeColor(h.grade)} />
                    <Text style={[styles.gradeText, { color: getGradeColor(h.grade) }]}>{h.grade}</Text>
                  </View>
                </View>
                <Text style={styles.resultText}>{h.text}</Text>
                <Text style={styles.sourceText}>
                  {COLLECTIONS.find(c => c.id === h.book)?.name || h.book}
                  {h.reference?.book ? `  ·  Book ${h.reference.book}` : ''}
                  {h.gradedBy ? `  ·  graded by ${h.gradedBy}` : ''}
                </Text>

                {/* What the grade actually means, rather than a bare badge. */}
                {gradeMeaning(h.grade) ? (
                  <Text style={styles.gradeMeaning}>{gradeMeaning(h.grade)}</Text>
                ) : null}

                <TouchableOpacity
                  onPress={() => setOpenChain(openChain === h.id ? null : h.id)}
                  style={styles.chainToggle}
                  accessibilityRole="button"
                  accessibilityLabel={`Chain of transmission for hadith ${h.number}`}
                >
                  <Ionicons name="git-network-outline" size={14} color={COLORS.cyan} />
                  <Text style={styles.chainToggleText}>Chain of transmission</Text>
                  <Ionicons
                    name={openChain === h.id ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>

                {openChain === h.id ? (
                  <IsnadChain hadith={h} />
                ) : null}
              </View>
            ))}
          </View>
        )}

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Ionicons name="information-circle" size={16} color={COLORS.amber} />
          <Text style={styles.disclaimerText}>
            Hadith data from authenticated sources. Always verify with qualified scholars. AI cannot verify hadith authenticity.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


const makeStyles = (COLORS) => StyleSheet.create({
  resultCount: {
    color: COLORS.textSecondary, fontSize: 12, fontWeight: '600',
    marginBottom: 10, marginTop: 4,
  },
  modeRow: { flexDirection: 'row', gap: 8, padding: 12, paddingBottom: 0 },
  modeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 12, backgroundColor: COLORS.glass,
    borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  modeActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  modeText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '700' },
  collChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  collText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  searchRow: { flexDirection: 'row', gap: 8, padding: 12 },
  searchInput: {
    flex: 1, backgroundColor: COLORS.glass, borderRadius: 14, borderWidth: 1,
    borderColor: COLORS.glassBorder, color: COLORS.textPrimary, fontSize: 14,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  searchBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.gold,
    alignItems: 'center', justifyContent: 'center',
  },
  errorCard: {
    margin: 12, padding: 20, borderRadius: 16, backgroundColor: COLORS.glass,
    borderWidth: 1, borderColor: COLORS.glassBorder, alignItems: 'center', gap: 8,
  },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6,
    backgroundColor: COLORS.gold, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10,
  },
  retryText: { color: '#000', fontWeight: '800', fontSize: 12 },
  guideCard: {
    margin: 12, padding: 20, borderRadius: 18, backgroundColor: COLORS.glass,
    borderWidth: 1, borderColor: COLORS.glassBorder, alignItems: 'center', gap: 8,
  },
  guideTitle: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '800', textAlign: 'center' },
  guideText: {
    color: COLORS.textSecondary, fontSize: 12.5, lineHeight: 19,
    textAlign: 'center', paddingHorizontal: 4,
  },
  guideLabel: {
    alignSelf: 'flex-start', color: COLORS.textSecondary, fontSize: 10.5,
    fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginTop: 8,
  },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignSelf: 'flex-start' },
  quickChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  quickText: { color: COLORS.gold, fontSize: 12, fontWeight: '700' },
  partialNote: {
    color: COLORS.amber, fontSize: 11.5, lineHeight: 17, marginBottom: 10,
  },
  resultCard: {
    padding: 16, marginBottom: 10, borderRadius: 18, backgroundColor: COLORS.glass,
    borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  numBadge: {
    backgroundColor: 'rgba(255, 255, 255,0.1)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  numText: { color: COLORS.gold, fontWeight: '800', fontSize: 11 },
  gradeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  gradeText: { fontSize: 11, fontWeight: '700' },
  resultText: { color: COLORS.textPrimary, fontSize: 14, lineHeight: 22, marginTop: 12 },
  sourceText: { color: COLORS.textSecondary, fontSize: 11, marginTop: 8, fontWeight: '600' },
  gradeMeaning: {
    color: COLORS.textSecondary, fontSize: 11.5, lineHeight: 17,
    marginTop: 8, fontStyle: 'italic',
  },
  chainToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12,
    paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.divider,
  },
  chainToggleText: { color: COLORS.cyan, fontSize: 12.5, fontWeight: '700', flex: 1 },

  chain: { marginTop: 14 },
  chainRow: { flexDirection: 'row', gap: 12 },
  chainRail: { alignItems: 'center', width: 14 },
  chainDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, marginTop: 5 },
  chainDotKnown: { backgroundColor: COLORS.emerald, borderColor: COLORS.emerald },
  chainDotUnknown: { backgroundColor: 'transparent', borderColor: COLORS.textSecondary },
  chainLine: { flex: 1, width: 1.5, backgroundColor: COLORS.divider, marginVertical: 3 },
  chainBody: { flex: 1, paddingBottom: 18 },
  chainArabic: { color: COLORS.gold, fontSize: 15, lineHeight: 26, writingDirection: 'rtl' },
  chainTitle: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '800', marginTop: 1 },
  chainRole: {
    color: COLORS.cyan, fontSize: 10.5, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2,
  },
  chainDetail: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 5 },
  chainUnknown: {
    color: COLORS.textSecondary, fontSize: 11.5, lineHeight: 17, marginTop: 5,
    fontStyle: 'italic', opacity: 0.9,
  },
  collectorBox: {
    marginTop: 9, padding: 11, borderRadius: 10,
    backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  collectorArabic: { color: COLORS.gold, fontSize: 14, lineHeight: 26, writingDirection: 'rtl' },
  collectorLine: { color: COLORS.textSecondary, fontSize: 11.5, marginTop: 2 },
  collectorCriteria: { color: COLORS.textPrimary, fontSize: 12, lineHeight: 18, marginTop: 7 },
  collectorNote: { color: COLORS.textSecondary, fontSize: 11, lineHeight: 16, marginTop: 6, fontStyle: 'italic' },
  chainFooter: {
    flexDirection: 'row', justifyContent: 'space-between', gap: 12,
    paddingTop: 9, borderTopWidth: 1, borderTopColor: COLORS.divider,
  },
  chainFooterLabel: {
    color: COLORS.textSecondary, fontSize: 10, fontWeight: '700',
    letterSpacing: 1, textTransform: 'uppercase',
  },
  chainFooterValue: {
    color: COLORS.gold, fontSize: 12, fontWeight: '700',
    flexShrink: 1, textAlign: 'right',
  },
  disclaimer: {
    flexDirection: 'row', gap: 10, margin: 12, padding: 14, borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255,0.08)', borderWidth: 1, borderColor: 'rgba(255, 255, 255,0.2)',
    alignItems: 'flex-start',
  },
  disclaimerText: { flex: 1, color: COLORS.textSecondary, fontSize: 11, lineHeight: 16 },
});
