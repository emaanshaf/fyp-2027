// Starter content for My Library.
//
// The library reads real bookmarks, notes and favourites, so a new install
// shows an empty screen with nothing to demonstrate. These seed it on first
// open — but they are NOT invented filler: every entry is a real ayah, a real
// dua reference, or a note the user can actually act on, and each is written
// into the same stores the rest of the app reads, so bookmarks open in the
// Quran reader and notes appear beside their ayah in Tafsir.
//
// Every seeded item is flagged so the library can offer "Remove samples" in
// one tap. Seeding runs once; a user who clears them does not get them back.

export const LIBRARY_SEEDED_KEY = 'qitab_library_seeded';

/** Verse keys bookmarked on first run — widely loved, short, and worth returning to. */
export const SAMPLE_BOOKMARKS = [
  '2:255',   // Ayat al-Kursi
  '13:28',   // Hearts find rest in the remembrance of Allah
  '94:5',    // With hardship comes ease
  '2:286',   // Allah burdens no soul beyond its capacity
  '39:53',   // Do not despair of the mercy of Allah
];

/** Notes attached to those ayahs, phrased as prompts rather than rulings. */
export const SAMPLE_NOTES = {
  '2:255': 'Ayat al-Kursi — recited after every fard prayer, and before sleep.',
  '94:5': 'Worth returning to on a hard day. The ease is promised with the hardship, not only after it.',
  '39:53': 'Read this one slowly when despair feels reasonable.',
};

/**
 * Dua ids seeded as favourites. These are numeric ids from src/data/duas.js
 * (1 Morning Adhkar, 2 Ayat al-Kursi, 5 Evening Adhkar) — a test asserts they
 * still exist, so a reshuffle of that file cannot leave dangling favourites.
 */
export const SAMPLE_FAV_DUAS = [1, 2, 5];

/**
 * Seeds the library once, and only when it is genuinely empty — never
 * overwriting anything the user has saved themselves.
 *
 * @param {{getItem:Function, setItem:Function}} store
 * @returns {Promise<boolean>} whether seeding happened
 */
export async function seedLibraryIfEmpty(store) {
  const already = await store.getItem(LIBRARY_SEEDED_KEY);
  if (already) return false;

  const [bkRaw, notesRaw, favRaw] = await Promise.all([
    store.getItem('qitab_bookmarks'),
    store.getItem('qitab_notes'),
    store.getItem('qitab_fav_duas'),
  ]);

  const bookmarks = bkRaw ? JSON.parse(bkRaw) : {};
  const notes = notesRaw ? JSON.parse(notesRaw) : {};
  const favDuas = favRaw ? JSON.parse(favRaw) : [];

  // Someone with their own content does not want ours on top of it.
  const isEmpty =
    Object.keys(bookmarks).length === 0 &&
    Object.keys(notes).length === 0 &&
    favDuas.length === 0;

  await store.setItem(LIBRARY_SEEDED_KEY, '1');
  if (!isEmpty) return false;

  const seededBookmarks = {};
  for (const key of SAMPLE_BOOKMARKS) seededBookmarks[key] = true;

  await Promise.all([
    store.setItem('qitab_bookmarks', JSON.stringify(seededBookmarks)),
    store.setItem('qitab_notes', JSON.stringify(SAMPLE_NOTES)),
    store.setItem('qitab_fav_duas', JSON.stringify(SAMPLE_FAV_DUAS)),
    store.setItem('qitab_library_samples', JSON.stringify({
      bookmarks: SAMPLE_BOOKMARKS,
      notes: Object.keys(SAMPLE_NOTES),
      duas: SAMPLE_FAV_DUAS,
    })),
  ]);
  return true;
}

/** Removes only what was seeded, leaving anything the user added since. */
export async function removeLibrarySamples(store) {
  const raw = await store.getItem('qitab_library_samples');
  if (!raw) return false;
  const seeded = JSON.parse(raw);

  const [bkRaw, notesRaw, favRaw] = await Promise.all([
    store.getItem('qitab_bookmarks'),
    store.getItem('qitab_notes'),
    store.getItem('qitab_fav_duas'),
  ]);

  const bookmarks = bkRaw ? JSON.parse(bkRaw) : {};
  const notes = notesRaw ? JSON.parse(notesRaw) : {};
  const favDuas = favRaw ? JSON.parse(favRaw) : [];

  for (const key of seeded.bookmarks || []) delete bookmarks[key];
  for (const key of seeded.notes || []) delete notes[key];
  const duas = favDuas.filter(d => !(seeded.duas || []).includes(d));

  await Promise.all([
    store.setItem('qitab_bookmarks', JSON.stringify(bookmarks)),
    store.setItem('qitab_notes', JSON.stringify(notes)),
    store.setItem('qitab_fav_duas', JSON.stringify(duas)),
    store.setItem('qitab_library_samples', ''),
  ]);
  return true;
}

/** True when an item id came from the seed, so the UI can label it. */
export function isSample(seeded, item) {
  if (!seeded) return false;
  if (item.type === 'quran') return (seeded.bookmarks || []).includes(item.key);
  if (item.type === 'notes') return (seeded.notes || []).includes(item.key);
  if (item.type === 'duas') return (seeded.duas || []).includes(item.key);
  return false;
}
