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
      { ttl: TTL.SCRIPTURE, forceRefresh, fallback: [] }
    );
  },

  async getCollection(collectionId, page = 1, perPage = 50, opts = {}) {
    const all = await this.getAllHadiths(collectionId, opts);
    const start = (page - 1) * perPage;
    return {
      hadiths: all.slice(start, start + perPage),
      total: all.length,
      totalPages: Math.max(1, Math.ceil(all.length / perPage)),
      page,
      // Lets the UI say "showing saved copy" rather than silently going stale.
      offline: !isOnline() && all.length === 0,
    };
  },

  async getByNumber(collectionId, number) {
    const all = await this.getAllHadiths(collectionId);
    return all.find(h => String(h.hadithnumber) === String(number)) || null;
  },

  async search(collectionId, query) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const all = await this.getAllHadiths(collectionId);
    return all.filter(
      h => h.text?.toLowerCase().includes(q) || String(h.hadithnumber) === q
    );
  },

  /** Searches every collection at once — powers Hadith verification. */
  async searchAll(query, { limit = 60 } = {}) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const results = [];
    for (const c of HADITH_COLLECTIONS) {
      const hits = await this.search(c.id, q);
      results.push(...hits.map(h => ({ ...h, collectionId: c.id, collection: c.name, grade: c.grade })));
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
