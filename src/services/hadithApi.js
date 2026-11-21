// Hadith API Service — the six authentic collections, served from a CDN.
//
// Each collection is one large JSON document (Bukhari is several MB), so these
// go through `cachedLarge` — the filesystem-backed cache — rather than
// AsyncStorage. Once a collection has been opened it stays fully readable and
// searchable offline.
import { hadithCdn } from '../config/appConfig';
import { cachedLarge, isOnline, TTL } from './cache';

/**
 * The six canonical Sunni collections (Kutub al-Sittah).
 *
 * `total` is the real document count served by the CDN, not the traditional
 * figure — the declared numbers had drifted from what actually loads.
 *
 * `perHadithGrades` matters for the verification screen: Bukhari and Muslim
 * carry no per-hadith grading because every hadith in them is accepted as
 * sahih by scholarly consensus, so the collection's own grade applies. The
 * four Sunan contain hadith of varying strength and are graded individually.
 */
export const HADITH_COLLECTIONS = [
  { id: 'eng-bukhari', name: 'Sahih Bukhari', author: 'Imam al-Bukhari', total: 7589, color: '#34D399', grade: 'Sahih', perHadithGrades: false },
  { id: 'eng-muslim', name: 'Sahih Muslim', author: 'Imam Muslim', total: 7563, color: '#60A5FA', grade: 'Sahih', perHadithGrades: false },
  { id: 'eng-abudawud', name: 'Sunan Abu Dawud', author: 'Imam Abu Dawud', total: 5274, color: '#FBBF24', grade: 'Varies', perHadithGrades: true },
  { id: 'eng-tirmidhi', name: 'Jami at-Tirmidhi', author: 'Imam at-Tirmidhi', total: 3998, color: '#A78BFA', grade: 'Varies', perHadithGrades: true },
  { id: 'eng-ibnmajah', name: 'Sunan Ibn Majah', author: 'Imam Ibn Majah', total: 4343, color: '#F472B6', grade: 'Varies', perHadithGrades: true },
  { id: 'eng-nasai', name: "Sunan an-Nasa'i", author: "Imam an-Nasa'i", total: 5765, color: '#22D3EE', grade: 'Varies', perHadithGrades: true },
];

const isValidCollection = id => HADITH_COLLECTIONS.some(c => c.id === id);

export const hadithService = {
  /**
   * The full collection, cached to disk. Callers that only need a page should
   * use `getCollection` — this is the shared source both it and search read.
   *
   * No `fallback: []`: an empty array is a valid answer ("this collection has
   * no matches"), so using it for a failed download made the UI say there was
   * no hadith data at all. When nothing is cached and the fetch fails, this
   * rejects and the screen shows a retry instead.
   */
  async getAllHadiths(collectionId, { forceRefresh } = {}) {
    if (!isValidCollection(collectionId)) return [];
    return cachedLarge(
      `hadith:${collectionId}`,
      async () => {
        // Not fetchJson: these responses are large and we want the default
        // longer timeout rather than a 15s abort on a slow connection.
        const res = await fetch(`${hadithCdn}/${collectionId}.json`);
        if (!res.ok) throw new Error(`HTTP ${res.status} loading ${collectionId}`);
        const data = await res.json();
        return data.hadiths || [];
      },
      { ttl: TTL.SCRIPTURE, forceRefresh }
    );
  },

  async getCollection(collectionId, page = 1, perPage = 50, opts = {}) {
    try {
      const all = await this.getAllHadiths(collectionId, opts);
      const start = (page - 1) * perPage;
      return {
        hadiths: all.slice(start, start + perPage),
        total: all.length,
        totalPages: Math.max(1, Math.ceil(all.length / perPage)),
        page,
        offline: !isOnline(),
        error: false,
      };
    } catch {
      // First-ever load failed. Say so, rather than returning an empty list
      // that reads as "this collection contains nothing".
      return {
        hadiths: [],
        total: 0,
        totalPages: 1,
        page,
        offline: !isOnline(),
        error: true,
      };
    }
  },

  async getByNumber(collectionId, number, { throwOnError = false } = {}) {
    try {
      const all = await this.getAllHadiths(collectionId);
      return all.find(h => String(h.hadithnumber) === String(number)) || null;
    } catch (err) {
      if (throwOnError) throw err;
      return null;
    }
  },

  async search(collectionId, query, { throwOnError = false } = {}) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    try {
      const all = await this.getAllHadiths(collectionId);
      return all.filter(
        h => h.text?.toLowerCase().includes(q) || String(h.hadithnumber) === q
      );
    } catch (err) {
      if (throwOnError) throw err;
      return [];
    }
  },

  /**
   * Searches every collection at once — powers Hadith verification.
   *
   * Each collection is a separate multi-megabyte download, so `onProgress`
   * reports which one is being worked on. Without it the verification screen
   * sat on a static spinner for minutes and looked broken. `onFailure` keeps a
   * failed download from being reported as "no such hadith".
   */
  async searchAll(query, { limit = 60, onProgress, onFailure } = {}) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const results = [];
    for (let i = 0; i < HADITH_COLLECTIONS.length; i++) {
      const c = HADITH_COLLECTIONS[i];
      onProgress?.({ collection: c, index: i, total: HADITH_COLLECTIONS.length });
      try {
        const hits = await this.search(c.id, q, { throwOnError: true });
        results.push(...hits.map(h => ({ ...h, collectionId: c.id, collection: c.name, grade: c.grade })));
      } catch {
        onFailure?.(c);
      }
      if (results.length >= limit) break;
    }
    return results.slice(0, limit);
  },

  /** True once the collection is on disk and usable without a connection. */
  async isAvailableOffline(collectionId) {
    const all = await this.getAllHadiths(collectionId).catch(() => []);
    return all.length > 0;
  },

  getCollectionMeta(collectionId) {
    return HADITH_COLLECTIONS.find(c => c.id === collectionId);
  },
};

export default hadithService;
