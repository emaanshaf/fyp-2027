// Tafsir service, backed by the quran.com v4 API.
//
// The resource ids below are the real ones returned by
// GET /resources/tafsirs — but ids are data, not contract, so `resolveId`
// re-resolves them by slug at runtime and only falls back to the constant.
// Al-Jalalayn is deliberately absent: quran.com does not carry it.
import { quranApi } from '../config/appConfig';
import { cached, fetchJson, TTL } from './cache';

export const TAFSIR_SOURCES = [
  {
    key: 'ibnKathir',
    id: 169,
    slug: 'en-tafisr-ibn-kathir',
    name: 'Ibn Kathir',
    author: 'Imam Ibn Kathir (abridged)',
    lang: 'en',
    description: 'The most widely referenced classical tafsir in the Sunni tradition.',
  },
  {
    key: 'maarifulQuran',
    id: 168,
    slug: 'en-tafsir-maarif-ul-quran',
    name: "Ma'arif al-Qur'an",
    author: 'Mufti Muhammad Shafi',
    lang: 'en',
    description: 'A comprehensive contemporary tafsir, translated from the Urdu.',
  },
  {
    key: 'tazkirul',
    id: 817,
    slug: 'tazkirul-quran-en',
    name: 'Tazkirul Quran',
    author: 'Maulana Wahiduddin Khan',
    lang: 'en',
    description: 'A concise, reflective commentary in plain modern English.',
  },
  {
    key: 'bayanUlQuran',
    id: 159,
    slug: 'tafsir-bayan-ul-quran',
    name: 'بیان القرآن',
    author: 'Dr. Israr Ahmad',
    lang: 'ur',
    description: 'اردو تفسیر — ڈاکٹر اسرار احمد',
  },
  {
    key: 'ibnKathirUrdu',
    id: 160,
    slug: 'tafseer-ibn-e-kaseer-urdu',
    name: 'تفسیر ابن کثیر',
    author: 'Imam Ibn Kathir',
    lang: 'ur',
    description: 'اردو ترجمہ — تفسیر ابن کثیر',
  },
  {
    key: 'tabari',
    id: 15,
    slug: 'ar-tafsir-al-tabari',
    name: 'تفسير الطبري',
    author: 'Imam al-Tabari',
    lang: 'ar',
    description: 'أقدم التفاسير الجامعة بالمأثور.',
  },
];

export const getSource = key => TAFSIR_SOURCES.find(s => s.key === key) || TAFSIR_SOURCES[0];

export const sourcesForLanguage = lang =>
  TAFSIR_SOURCES.filter(s => s.lang === lang);

/** The API's live tafsir catalogue, cached for a long time. */
export async function listTafsirs() {
  return cached(
    'tafsir:resources',
    async () => (await fetchJson(`${quranApi}/resources/tafsirs`)).tafsirs || [],
    { ttl: TTL.IMMUTABLE, fallback: [] }
  );
}

/** Maps a source to its current resource id, preferring a live slug match. */
async function resolveId(source) {
  try {
    const all = await listTafsirs();
    const match = all.find(t => t.slug === source.slug);
    return match?.id ?? source.id;
  } catch {
    return source.id;
  }
}

/**
 * Turns the API's HTML commentary into text React Native can render.
 * The payload uses <h2>, <p>, <br> and occasional inline tags.
 */
export function htmlToText(html) {
  if (!html) return '';
  return html
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/\s*(p|div|h[1-6]|li)\s*>/gi, '\n\n')
    .replace(/<\s*li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Commentary for one ayah.
 * @param {string} verseKey e.g. "2:255"
 * @param {string} sourceKey a key from TAFSIR_SOURCES
 * @returns {Promise<{text: string, source: object, available: boolean}>}
 */
export async function fetchTafsir(verseKey, sourceKey = 'ibnKathir') {
  const source = getSource(sourceKey);
  const id = await resolveId(source);

  const text = await cached(
    `tafsir:${id}:${verseKey}`,
    async () => {
      const data = await fetchJson(`${quranApi}/tafsirs/${id}/by_ayah/${verseKey}`);
      return htmlToText(data.tafsir?.text || '');
    },
    { ttl: TTL.SCRIPTURE, fallback: null }
  );

  // `null` means we have never fetched it and cannot right now. Say so
  // plainly rather than inventing commentary — this is scripture.
  if (!text) {
    return {
      text: '',
      source,
      available: false,
    };
  }
  return { text, source, available: true };
}

/** A single verse's translation. */
export async function fetchVerseTranslation(verseKey, translationId = 20) {
  return cached(
    `tafsir:tr:${translationId}:${verseKey}`,
    async () => {
      const data = await fetchJson(
        `${quranApi}/quran/translations/${translationId}?verse_key=${verseKey}`
      );
      return htmlToText(data.translations?.[0]?.text || '');
    },
    { ttl: TTL.SCRIPTURE, fallback: '' }
  );
}

export default { TAFSIR_SOURCES, fetchTafsir, fetchVerseTranslation, listTafsirs, sourcesForLanguage, getSource, htmlToText };
