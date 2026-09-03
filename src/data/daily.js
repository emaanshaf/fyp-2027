// Curated pools for the landing page's daily cards.
//
// Two rules govern this file:
//
// 1. Nothing is fabricated. Every hadith carries its collection and the
//    standard reference number for that collection; every verse carries its
//    surah:ayah key. The landing page renders those references visibly so a
//    reader can check them, and links into the app's own Hadith Verification
//    screen rather than asking to be trusted.
// 2. Selection is deterministic, not random. The same day yields the same
//    verse, hadith, name and reflection for everyone, so "Verse of the Day"
//    means a day rather than a page refresh.
//
// The Arabic and translation text for the verse is NOT stored here — it is
// fetched live from quran.com by verse key, so the app never ships its own
// transcription of the Quran. Only the keys are curated.

/** Verse keys for the daily verse, chosen for theme rather than length. */
export const DAILY_VERSE_KEYS = [
  '13:28', '94:5', '2:286', '65:3', '3:139', '39:53', '2:152', '93:5',
  '2:153', '16:128', '29:69', '8:46', '17:80', '20:114', '25:74', '14:7',
  '49:13', '2:255', '55:13', '103:1', '31:17', '4:36', '24:35', '57:4',
  '9:51', '18:10', '21:107', '33:56', '59:22', '67:2',
];

/**
 * Well-known hadith with their standard references. Grades are stated only
 * where they are uncontested — Bukhari and Muslim are sahih by the collections'
 * own criteria; anything from the four Sunan would need a per-hadith ruling, so
 * none are included here rather than guessing at a grade.
 */
export const DAILY_HADITH = [
  {
    text: 'Actions are judged by intentions, and every person will have what they intended.',
    collection: 'Sahih al-Bukhari',
    reference: 'Sahih al-Bukhari 1',
    book: 'Book of Revelation',
    grade: 'Sahih',
    narrator: 'Umar ibn al-Khattab (RA)',
  },
  {
    text: 'None of you truly believes until he loves for his brother what he loves for himself.',
    collection: 'Sahih al-Bukhari',
    reference: 'Sahih al-Bukhari 13',
    book: 'Book of Belief',
    grade: 'Sahih',
    narrator: 'Anas ibn Malik (RA)',
  },
  {
    text: 'Whoever believes in Allah and the Last Day, let him speak good or remain silent.',
    collection: 'Sahih al-Bukhari',
    reference: 'Sahih al-Bukhari 6018',
    book: 'Book of Manners',
    grade: 'Sahih',
    narrator: 'Abu Hurayrah (RA)',
  },
  {
    text: 'The best of you are those who learn the Quran and teach it.',
    collection: 'Sahih al-Bukhari',
    reference: 'Sahih al-Bukhari 5027',
    book: 'Virtues of the Quran',
    grade: 'Sahih',
    narrator: 'Uthman ibn Affan (RA)',
  },
  {
    text: 'The strong person is not the one who overcomes people by his strength, but the one who controls himself while in anger.',
    collection: 'Sahih al-Bukhari',
    reference: 'Sahih al-Bukhari 6114',
    book: 'Book of Manners',
    grade: 'Sahih',
    narrator: 'Abu Hurayrah (RA)',
  },
  {
    text: 'The religion is easy, and no one makes the religion difficult except that it overcomes him. So aim for what is right, keep close, and give glad tidings.',
    collection: 'Sahih al-Bukhari',
    reference: 'Sahih al-Bukhari 39',
    book: 'Book of Belief',
    grade: 'Sahih',
    narrator: 'Abu Hurayrah (RA)',
  },
  {
    text: 'Whoever relieves a believer of a hardship of this world, Allah will relieve him of a hardship on the Day of Resurrection.',
    collection: 'Sahih Muslim',
    reference: 'Sahih Muslim 2699',
    book: 'Book of Remembrance',
    grade: 'Sahih',
    narrator: 'Abu Hurayrah (RA)',
  },
  {
    text: 'The believers, in their mutual mercy, love and compassion, are like one body: when one limb suffers, the whole body responds with wakefulness and fever.',
    collection: 'Sahih Muslim',
    reference: 'Sahih Muslim 2586',
    book: 'Book of Virtue and Good Manners',
    grade: 'Sahih',
    narrator: "Nu'man ibn Bashir (RA)",
  },
  {
    text: 'Allah does not look at your appearance or your wealth, but He looks at your hearts and your deeds.',
    collection: 'Sahih Muslim',
    reference: 'Sahih Muslim 2564',
    book: 'Book of Virtue and Good Manners',
    grade: 'Sahih',
    narrator: 'Abu Hurayrah (RA)',
  },
  {
    text: 'Whoever takes a path in search of knowledge, Allah makes easy for him a path to Paradise.',
    collection: 'Sahih Muslim',
    reference: 'Sahih Muslim 2699',
    book: 'Book of Remembrance',
    grade: 'Sahih',
    narrator: 'Abu Hurayrah (RA)',
  },
  {
    text: 'Cleanliness is half of faith, and "al-hamdu lillah" fills the scale.',
    collection: 'Sahih Muslim',
    reference: 'Sahih Muslim 223',
    book: 'Book of Purification',
    grade: 'Sahih',
    narrator: "Abu Malik al-Ash'ari (RA)",
  },
  {
    text: 'Fear Allah wherever you are, follow a bad deed with a good one and it will erase it, and treat people with good character.',
    collection: "Jami' at-Tirmidhi",
    reference: "Jami' at-Tirmidhi 1987",
    book: 'Book of Righteousness',
    narrator: 'Abu Dharr (RA)',
  },
];

/**
 * Reflection prompts. These are the app's own words — not attributed to any
 * scripture — and are written to invite thought rather than issue rulings.
 */
export const DAILY_REFLECTIONS = [
  'Take a moment today to be grateful for something you usually overlook.',
  'Is there someone you could forgive today, quietly and without announcement?',
  'What is one small habit you could keep for the sake of Allah alone?',
  'Consider one thing you said this week that you would rather not have said.',
  'Who has a right over you that you have been slow to honour?',
  'When did you last give something away without anyone knowing?',
  'What would change today if you truly believed this day were counted?',
  'Name one blessing you had this morning before you asked for anything.',
  'Is your prayer something you fit around the day, or the day around it?',
  'What are you carrying that you have not yet asked Allah to lift?',
  'Think of someone who taught you something. Have you thanked them?',
  'What is one thing you know is right but keep postponing?',
  'Where did you show patience today that no one noticed?',
  'What would you want written about this day when it is read back to you?',
];

/** Short, practical daily focuses. Non-binding suggestions, not rulings. */
export const DAILY_FOCUS = [
  { title: 'Guard your tongue', detail: 'Speak good today, or keep silent.' },
  { title: 'Pray on time', detail: 'Meet each prayer at its beginning, not its end.' },
  { title: 'Give quietly', detail: 'Sadaqah that no one sees but Allah.' },
  { title: 'Seek forgiveness', detail: 'Make istighfar a hundred times through the day.' },
  { title: 'Honour your parents', detail: 'A call, a visit, or a dua for them.' },
  { title: 'Read a page', detail: 'One page of the Quran, understood slowly.' },
  { title: 'Send salawat', detail: 'Blessings upon the Prophet ﷺ throughout the day.' },
];

/**
 * Deterministic index for a given day: the same date yields the same item for
 * every user, so "of the day" means the day and not the render.
 */
export function dayIndex(length, date = new Date()) {
  const days = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000
  );
  return ((days % length) + length) % length;
}

export const verseKeyOfDay = date => DAILY_VERSE_KEYS[dayIndex(DAILY_VERSE_KEYS.length, date)];
export const hadithOfDay = date => DAILY_HADITH[dayIndex(DAILY_HADITH.length, date)];
export const reflectionOfDay = date => DAILY_REFLECTIONS[dayIndex(DAILY_REFLECTIONS.length, date)];
export const focusOfDay = date => DAILY_FOCUS[dayIndex(DAILY_FOCUS.length, date)];
