// Turns the reference strings returned with an assistant answer into a Quran
// location the reader can open. Only Quran references are parsed here: hadith
// references ("Sahih Bukhari 8") stay plain text until the Hadith reader can
// accept a collection + number deep link.
//
// Every pattern is deliberately anchored. A loose "number:number" match would
// also catch citation-like text inside other references and send the user to
// the wrong ayah.

const SURAH_REFERENCE = /^Surah\s+.+?[\s,]+(\d{1,3})(?:\s*:\s*(\d{1,3}))?/i;
const QURAN_REFERENCE = /^(?:The\s+)?Qur'?an\s+(\d{1,3})(?:\s*:\s*(\d{1,3}))?/i;

/**
 * @param {string} reference e.g. "Surah Al-Baqarah 2:255" or "Qur'an 2:153"
 * @returns {{surah: number, ayah: number|null}|null}
 */
export function parseQuranCitation(reference) {
  if (typeof reference !== 'string') return null;

  const text = reference.trim();
  const match = SURAH_REFERENCE.exec(text) || QURAN_REFERENCE.exec(text);
  if (!match) return null;

  const surah = Number(match[1]);
  const ayah = match[2] == null ? null : Number(match[2]);

  if (!Number.isInteger(surah) || surah < 1 || surah > 114) return null;
  if (ayah != null && (!Number.isInteger(ayah) || ayah < 1)) return null;

  return { surah, ayah };
}
