// Quran service — quran.com API v4, plus recited-translation audio from the
// Islamic Network CDN.
//
// Every read goes through the offline cache (see cache.js), so a surah opened
// once stays fully readable with no connection.
//
// All resource ids below were verified against the live API rather than
// guessed; `listTranslations` / `listRecitations` re-fetch the catalogues at
// runtime so the constants are a fast path, not a hard dependency.
import { quranApi } from '../config/appConfig';
import { cached, fetchJson, prefetch, TTL } from './cache';

/**
 * The five reading languages, mapped to their quran.com translation ids.
 * Ordered as they appear in the reader's language picker.
 */
export const TRANSLATIONS = {
  en: { id: 20, name: 'English', native: 'English', author: 'Saheeh International', rtl: false, locale: 'en-US' },
  ur: { id: 234, name: 'Urdu', native: 'اردو', author: 'Fatah Muhammad Jalandhari', rtl: true, locale: 'ur-PK' },
  ms: { id: 39, name: 'Malay', native: 'Bahasa Melayu', author: 'Abdullah Muhammad Basmeih', rtl: false, locale: 'ms-MY' },
  fr: { id: 31, name: 'French', native: 'Français', author: 'Muhammad Hamidullah', rtl: false, locale: 'fr-FR' },
  id: { id: 134, name: 'Indonesian', native: 'Bahasa Indonesia', author: 'King Fahad Quran Complex', rtl: false, locale: 'id-ID' },
};

export const LANGUAGE_KEYS = Object.keys(TRANSLATIONS);

/**
 * The qari catalogue, drawn from two sources because neither alone is enough.
 *
 * `quran.com` serves exactly twelve recitations (verified against
 * /resources/recitations) and is the only source with whole-surah audio files,
 * so those reciters support both surah playback and per-verse playback.
 *
 * `islamic.network` publishes many more verse-by-verse editions. Those are
 * per-ayah only — there is no surah file — so selecting one makes the play
 * button stitch verses together instead. `perVerseOnly` marks that, and the
 * reader tells the user rather than letting the button do nothing.
 *
 * Every islamic.network `bitrate` below was probed against the CDN rather than
 * assumed: each edition is published at exactly one rate and requesting any
 * other returns 403.
 */
export const RECITERS = [
  // ── quran.com — surah + per-verse ───────────────────────────────────────
  { id: 7, name: 'Mishari Rashid al-Afasy', style: null, source: 'quran.com' },
  { id: 3, name: 'Abdur-Rahman as-Sudais', style: null, source: 'quran.com' },
  { id: 10, name: "Sa'ud ash-Shuraym", style: null, source: 'quran.com' },
  { id: 4, name: 'Abu Bakr al-Shatri', style: null, source: 'quran.com' },
  { id: 5, name: 'Hani ar-Rifai', style: null, source: 'quran.com' },
  { id: 6, name: 'Mahmoud Khalil Al-Husary', style: null, source: 'quran.com' },
  { id: 12, name: 'Mahmoud Khalil Al-Husary', style: 'Muallim', source: 'quran.com' },
  { id: 2, name: 'AbdulBaset AbdulSamad', style: 'Murattal', source: 'quran.com' },
  { id: 1, name: 'AbdulBaset AbdulSamad', style: 'Mujawwad', source: 'quran.com' },
  { id: 9, name: 'Mohamed Siddiq al-Minshawi', style: 'Murattal', source: 'quran.com' },
  { id: 8, name: 'Mohamed Siddiq al-Minshawi', style: 'Mujawwad', source: 'quran.com' },
  { id: 11, name: 'Mohamed al-Tablawi', style: null, source: 'quran.com' },

  // ── islamic.network — per-verse only ────────────────────────────────────
  // String ids so they can never collide with quran.com's numeric ones.
  { id: 'in:mahermuaiqly', name: 'Maher al-Muaiqly', arabic: 'ماهر المعيقلي', style: null, source: 'islamic.network', edition: 'ar.mahermuaiqly', bitrate: 128, perVerseOnly: true },
  { id: 'in:hudhaify', name: 'Ali al-Hudhaify', arabic: 'علي الحذيفي', style: null, source: 'islamic.network', edition: 'ar.hudhaify', bitrate: 128, perVerseOnly: true },
  { id: 'in:ahmedajamy', name: 'Ahmed ibn Ali al-Ajamy', arabic: 'أحمد بن علي العجمي', style: null, source: 'islamic.network', edition: 'ar.ahmedajamy', bitrate: 128, perVerseOnly: true },
  { id: 'in:abdullahbasfar', name: 'Abdullah Basfar', arabic: 'عبد الله بصفر', style: null, source: 'islamic.network', edition: 'ar.abdullahbasfar', bitrate: 192, perVerseOnly: true },
  { id: 'in:muhammadjibreel', name: 'Muhammad Jibreel', arabic: 'محمد جبريل', style: null, source: 'islamic.network', edition: 'ar.muhammadjibreel', bitrate: 128, perVerseOnly: true },
  { id: 'in:muhammadayyoub', name: 'Muhammad Ayyoub', arabic: 'محمد أيوب', style: null, source: 'islamic.network', edition: 'ar.muhammadayyoub', bitrate: 128, perVerseOnly: true },
  { id: 'in:husarymujawwad', name: 'Mahmoud Khalil Al-Husary', arabic: 'محمود خليل الحصري', style: 'Mujawwad', source: 'islamic.network', edition: 'ar.husarymujawwad', bitrate: 128, perVerseOnly: true },
  { id: 'in:ibrahimakhbar', name: 'Ibrahim al-Akhdar', arabic: 'إبراهيم الأخضر', style: null, source: 'islamic.network', edition: 'ar.ibrahimakhbar', bitrate: 32, perVerseOnly: true },
  { id: 'in:aymanswoaid', name: 'Ayman Sowaid', arabic: 'أيمن سويد', style: 'Tajweed', source: 'islamic.network', edition: 'ar.aymanswoaid', bitrate: 64, perVerseOnly: true },
  { id: 'in:parhizgar', name: 'Shahriar Parhizgar', arabic: 'شهریار پرهیزگار', style: null, source: 'islamic.network', edition: 'ar.parhizgar', bitrate: 48, perVerseOnly: true },
];

/** Lookup by id. Ids are mixed numeric/string, so compare loosely-but-safely. */
export const reciterById = id => RECITERS.find(r => String(r.id) === String(id)) || null;

/** True when the qari has no whole-surah file and must be played verse by verse. */
export const isPerVerseOnly = id => Boolean(reciterById(id)?.perVerseOnly);

/**
 * Recited translations ("tarjama"), served per-ayah by the Islamic Network CDN.
 *
 * Each edition is published at exactly one bitrate — requesting any other
 * returns 403, so the working rate is pinned per edition rather than assumed.
 * Malay and Indonesian have no recited translation on the CDN; the reader
 * falls back to device text-to-speech for those, which is why every language
 * in TRANSLATIONS still carries a `locale`.
 */
export const TARJAMA_AUDIO = {
  en: { edition: 'en.walk', bitrate: 192, reciter: 'Ibrahim Walk' },
  ur: { edition: 'ur.khan', bitrate: 64, reciter: 'Shamshad Ali Khan' },
  fr: { edition: 'fr.leclerc', bitrate: 128, reciter: 'Youssouf Leclerc' },
};

const CDN_AUDIO = 'https://cdn.islamic.network/quran/audio';

/**
 * quran.com returns recitation paths relative to its audio host
 * ("Alafasy/mp3/002255.mp3"). Handing that straight to the player fails
 * silently, so every audio path is normalised through here.
 */
const VERSE_AUDIO_HOST = 'https://verses.quran.com';

export function toAudioUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  // Some reciters (Husary, Tablawi) come back protocol-relative, pointing at a
  // different host entirely. Prefixing those with the verses host produced a
  // 404 — they need a scheme, not a host.
  if (path.startsWith('//')) return `https:${path}`;
  return `${VERSE_AUDIO_HOST}/${path}`;
}

/** True when this language has real recited audio rather than TTS. */
export const hasRecitedTranslation = langKey => Boolean(TARJAMA_AUDIO[langKey]);

const versesKey = (chapterId, translationId) => `quran:verses:${chapterId}:${translationId}`;

export const quranService = {
  // ── Structure ───────────────────────────────────────────────────────────

  /** All 114 surahs. */
  async getChapters({ forceRefresh } = {}) {
    return cached(
      'quran:chapters',
      async () => (await fetchJson(`${quranApi}/chapters?language=en`)).chapters,
      { ttl: TTL.IMMUTABLE, forceRefresh, fallback: [] }
    );
  },

  async getChapterInfo(chapterId) {
    return cached(
      `quran:chapter:${chapterId}`,
      async () => (await fetchJson(`${quranApi}/chapters/${chapterId}?language=en`)).chapter,
      { ttl: TTL.IMMUTABLE, fallback: null }
    );
  },

  /** Revelation background and themes for a surah. */
  async getChapterIntroduction(chapterId, language = 'en') {
    return cached(
      `quran:chapterinfo:${chapterId}:${language}`,
      async () =>
        (await fetchJson(`${quranApi}/chapters/${chapterId}/info?language=${language}`)).chapter_info,
      { ttl: TTL.IMMUTABLE, fallback: null }
    );
  },

  // ── Verses ──────────────────────────────────────────────────────────────

  /**
   * Every verse of a surah, with Arabic and the chosen translation.
   *
   * `verse.id` is the *global* ayah number (1-6236), which is what the
   * translation-audio CDN is keyed by — it is carried through deliberately.
   */
  async getVersesByChapter(chapterId, translationId = 20, { forceRefresh } = {}) {
    return cached(
      versesKey(chapterId, translationId),
      async () => {
        const url = page =>
          `${quranApi}/verses/by_chapter/${chapterId}` +
          `?language=en&words=true&word_fields=text_uthmani` +
          `&translations=${translationId}` +
          `&fields=text_uthmani,text_indopak` +
          `&per_page=50&page=${page}`;

        const first = await fetchJson(url(1));
        const totalPages = first.pagination?.total_pages || 1;
        if (totalPages === 1) return first.verses || [];

        // Pages are independent, so fetching them together turns a four-second
        // load for Al-Baqarah into well under one.
        const rest = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, i) => fetchJson(url(i + 2)))
        );
        return rest.reduce((all, p) => all.concat(p.verses || []), first.verses || []);
      },
      { ttl: TTL.SCRIPTURE, forceRefresh, fallback: [] }
    );
  },

  /** A single verse by key, e.g. "2:255". Used by deep links and Ayah of the Day. */
  async getVerseByKey(verseKey, translationId = 20) {
    return cached(
      `quran:verse:${verseKey}:${translationId}`,
      async () =>
        (
          await fetchJson(
            `${quranApi}/verses/by_key/${verseKey}` +
            `?language=en&translations=${translationId}&fields=text_uthmani&audio=1`
          )
        ).verse,
      { ttl: TTL.SCRIPTURE, fallback: null }
    );
  },

  /** Verses of one juz — the 30-part division used for reading plans. */
  async getVersesByJuz(juzNumber, translationId = 20) {
    return cached(
      `quran:juz:${juzNumber}:${translationId}`,
      async () =>
        (
          await fetchJson(
            `${quranApi}/verses/by_juz/${juzNumber}` +
            `?language=en&translations=${translationId}&fields=text_uthmani&per_page=300`
          )
        ).verses || [],
      { ttl: TTL.SCRIPTURE, fallback: [] }
    );
  },

  /** Verses on one mushaf page (1-604). */
  async getVersesByPage(pageNumber, translationId = 20) {
    return cached(
      `quran:page:${pageNumber}:${translationId}`,
      async () =>
        (
          await fetchJson(
            `${quranApi}/verses/by_page/${pageNumber}` +
            `?language=en&translations=${translationId}&fields=text_uthmani&per_page=50`
          )
        ).verses || [],
      { ttl: TTL.SCRIPTURE, fallback: [] }
    );
  },

  // ── Recitation audio ────────────────────────────────────────────────────

  /**
   * Whole-surah recitation by the chosen qari, or null when that qari has no
   * surah file. Callers must treat null as "play verse by verse instead"
   * rather than as an error — it is the normal case for islamic.network qaris.
   */
  async getAudioUrl(chapterId, reciterId = 7) {
    if (isPerVerseOnly(reciterId)) return null;
    return cached(
      `quran:audio:${reciterId}:${chapterId}`,
      async () =>
        (await fetchJson(`${quranApi}/chapter_recitations/${reciterId}/${chapterId}`)).audio_file
          ?.audio_url,
      { ttl: TTL.IMMUTABLE, fallback: null }
    );
  },

  /** Per-verse recitation URLs for a whole surah, in order. quran.com only. */
  async getVerseAudioList(chapterId, reciterId = 7) {
    if (isPerVerseOnly(reciterId)) return [];
    return cached(
      `quran:audiolist:${reciterId}:${chapterId}`,
      async () => {
        const data = await fetchJson(
          `${quranApi}/recitations/${reciterId}/by_chapter/${chapterId}?per_page=300`
        );
        return (data.audio_files || []).map(a => ({
          verseKey: a.verse_key,
          url: toAudioUrl(a.url),
        }));
      },
      { ttl: TTL.IMMUTABLE, fallback: [] }
    );
  },

  /**
   * One verse's recitation.
   *
   * `globalAyahId` is the 1-6236 ayah number (quran.com's `verse.id`). It is
   * required for islamic.network qaris, whose CDN is addressed by global ayah
   * rather than by surah:ayah — without it those qaris cannot be played, so
   * the call returns null rather than building a URL that 404s.
   */
  async getVerseAudioUrl(reciterId, chapterId, verseNumber, globalAyahId) {
    const qari = reciterById(reciterId);

    if (qari?.source === 'islamic.network') {
      if (!globalAyahId) return null;
      return `${CDN_AUDIO}/${qari.bitrate}/${qari.edition}/${globalAyahId}.mp3`;
    }

    // /recitations/{id}/by_ayah honours the chosen qari. The previous call —
    // /verses/by_key?audio=1 — was wrong twice over: `audio=1` pinned every
    // verse to recitation 1 whatever the user had selected, and the response
    // field is `audio`, not `audio_properties`, so the lookup returned
    // undefined every time and the per-ayah play button did nothing at all.
    return cached(
      `quran:vaudio:${reciterId}:${chapterId}:${verseNumber}`,
      async () => {
        const data = await fetchJson(
          `${quranApi}/recitations/${reciterId}/by_ayah/${chapterId}:${verseNumber}`
        );
        return toAudioUrl(data.audio_files?.[0]?.url);
      },
      { ttl: TTL.IMMUTABLE, fallback: null }
    );
  },

  // ── Translation audio (tarjama) ─────────────────────────────────────────

  /**
   * Recited-translation URL for one ayah.
   *
   * @param {string} langKey       key from TRANSLATIONS
   * @param {number} globalAyahId  the verse's `id` (1-6236), not its verse number
   * @returns {string|null} null when the language has no recited translation,
   *                        in which case the caller should use text-to-speech.
   */
  getTarjamaAudioUrl(langKey, globalAyahId) {
    const edition = TARJAMA_AUDIO[langKey];
    if (!edition || !globalAyahId) return null;
    return `${CDN_AUDIO}/${edition.bitrate}/${edition.edition}/${globalAyahId}.mp3`;
  },

  // ── Search & catalogues ─────────────────────────────────────────────────

  async search(query, { size = 20, language = 'en' } = {}) {
    const q = query.trim();
    if (!q) return [];
    return cached(
      `quran:search:${language}:${q.toLowerCase()}`,
      async () =>
        (
          await fetchJson(
            `${quranApi}/search?q=${encodeURIComponent(q)}&size=${size}&language=${language}`
          )
        ).search?.results || [],
      { ttl: TTL.SHORT, fallback: [] }
    );
  },

  /** Live catalogue — the constants above are a fast path, this is the truth. */
  async listTranslations(language) {
    return cached(
      `quran:resources:translations:${language || 'all'}`,
      async () =>
        (
          await fetchJson(
            `${quranApi}/resources/translations${language ? `?language=${language}` : ''}`
          )
        ).translations || [],
      { ttl: TTL.IMMUTABLE, fallback: [] }
    );
  },

  async listRecitations() {
    return cached(
      'quran:resources:recitations',
      async () => (await fetchJson(`${quranApi}/resources/recitations`)).recitations || [],
      { ttl: TTL.IMMUTABLE, fallback: [] }
    );
  },

  // ── Helpers ─────────────────────────────────────────────────────────────

  getReciterLabel(reciter) {
    return reciter.style ? `${reciter.name} (${reciter.style})` : reciter.name;
  },

  /** Warms the surah list plus the most-opened surahs so a cold start isn't empty. */
  async warmUp(translationId = 20) {
    await prefetch(
      'quran:chapters',
      async () => (await fetchJson(`${quranApi}/chapters?language=en`)).chapters,
      { ttl: TTL.IMMUTABLE }
    );
    // Al-Fatihah, Ya-Sin, Ar-Rahman, Al-Mulk.
    for (const id of [1, 36, 55, 67]) {
      await prefetch(versesKey(id, translationId), () =>
        this.getVersesByChapter(id, translationId)
      );
    }
  },
};

export default quranService;
