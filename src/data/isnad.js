// How a hadith reached us — the chain of transmission (isnad) and the people
// who checked it.
//
// HONESTY RULE, and the reason this file is shaped the way it is:
//
// The hadith CDN this app reads supplies the matn (text), the reference and
// sometimes a grade. It does NOT supply the isnad — the named chain of
// narrators between the Prophet ﷺ and the collector. Those names exist, in the
// printed collections, but we do not have them here.
//
// So this file does not contain invented chains. It contains:
//   1. the transmission STAGES, which are a documented feature of every isnad;
//   2. real biographical data for the six collectors and the major grading
//      scholars, which is uncontested;
//   3. the companion narrator where our own data records one.
//
// Where the intermediate narrators are unknown to the app, the UI says so and
// points at the printed reference. Naming narrators we cannot verify would be
// the single most harmful thing an app like this could do.

/** The stages every isnad passes through, earliest to latest. */
export const TRANSMISSION_STAGES = [
  {
    key: 'prophet',
    title: 'The Prophet Muhammad ﷺ',
    arabic: 'النَّبِيُّ ﷺ',
    role: 'Origin of the report',
    detail: 'The saying, action or tacit approval being reported.',
  },
  {
    key: 'sahabi',
    title: 'The Companion',
    arabic: 'الصَّحَابِيّ',
    role: 'Heard it directly',
    detail:
      'A Companion (Sahabi) who witnessed or heard the report and transmitted it onward.',
  },
  {
    key: 'tabii',
    title: 'The Successor',
    arabic: 'التَّابِعِيّ',
    role: 'Received it from the Companion',
    detail:
      'A Tabi‘i — of the generation after the Companions — who received the report from one of them.',
  },
  {
    key: 'atba',
    title: 'Later narrators',
    arabic: 'أَتْبَاعُ ٱلتَّابِعِين',
    role: 'Carried it forward',
    detail:
      'One or more further narrators. Each was examined for reliability (adalah) and precision (dabt) before their narration was accepted.',
  },
  {
    key: 'collector',
    title: 'The Collector',
    arabic: 'ٱلْمُصَنِّف',
    role: 'Recorded it with its chain',
    detail:
      'The compiler who wrote the report into his collection together with the full chain by which he received it.',
  },
];

/**
 * The six canonical collectors. Dates are AH / CE and are well established.
 * `criteria` describes the compiler's own stated standard for inclusion.
 */
export const COLLECTORS = {
  'eng-bukhari': {
    name: 'Imam Muhammad al-Bukhari',
    arabic: 'مُحَمَّد بْن إِسْمَاعِيل ٱلْبُخَارِيّ',
    lived: '194–256 AH (810–870 CE)',
    born: 'Bukhara, Transoxiana',
    work: 'Sahih al-Bukhari',
    criteria:
      'Accepted a report only where every narrator in the chain was trustworthy and precise, and where consecutive narrators were established to have actually met.',
    note: 'Regarded by Sunni scholarship as the most rigorously authenticated collection.',
  },
  'eng-muslim': {
    name: 'Imam Muslim ibn al-Hajjaj',
    arabic: 'مُسْلِم بْن ٱلْحَجَّاج ٱلنَّيْسَابُورِيّ',
    lived: '204–261 AH (815–875 CE)',
    born: 'Nishapur, Khurasan',
    work: 'Sahih Muslim',
    criteria:
      'Required a continuous chain of trustworthy, precise narrators, holding contemporaneity sufficient where a meeting was possible — a slightly broader standard than al-Bukhari’s.',
    note: 'A student of al-Bukhari; his collection is paired with al-Bukhari’s as the two Sahihs.',
  },
  'eng-abudawud': {
    name: 'Imam Abu Dawud as-Sijistani',
    arabic: 'أَبُو دَاوُد ٱلسِّجِسْتَانِيّ',
    lived: '202–275 AH (817–889 CE)',
    born: 'Sijistan',
    work: 'Sunan Abu Dawud',
    criteria:
      'Gathered reports bearing on legal rulings, including weaker ones, and often commented on a report’s defects rather than excluding it.',
    note: 'Because inclusion did not imply authenticity, individual hadith here need their own grading.',
  },
  'eng-tirmidhi': {
    name: 'Imam Abu Isa at-Tirmidhi',
    arabic: 'أَبُو عِيسَىٰ ٱلتِّرْمِذِيّ',
    lived: '209–279 AH (824–892 CE)',
    born: 'Tirmidh',
    work: "Jami' at-Tirmidhi",
    criteria:
      'Recorded a grading for most reports and noted which scholars acted on them, making his collection unusually explicit about its own reliability.',
    note: 'Introduced the widely used grade "hasan" (sound but below sahih).',
  },
  'eng-nasai': {
    name: "Imam Ahmad an-Nasa'i",
    arabic: 'أَحْمَد بْن شُعَيْب ٱلنَّسَائِيّ',
    lived: '215–303 AH (829–915 CE)',
    born: 'Nasa, Khurasan',
    work: "Sunan an-Nasa'i",
    criteria:
      'Applied among the strictest narrator criteria of the four Sunan, producing the least weak material of them.',
    note: 'The abridged Sunan (al-Mujtaba) is the version normally cited.',
  },
  'eng-ibnmajah': {
    name: 'Imam Ibn Majah',
    arabic: 'مُحَمَّد بْن يَزِيد ٱبْن مَاجَه',
    lived: '209–273 AH (824–887 CE)',
    born: 'Qazvin',
    work: 'Sunan Ibn Majah',
    criteria:
      'Organised by legal chapter for practical use; the collection contains a higher proportion of weak reports than the others.',
    note: 'The last of the six books to be widely accepted into the canon.',
  },
};

/**
 * Scholars whose gradings the app surfaces. Included so a grade attributed to
 * a name is not an anonymous verdict.
 */
export const GRADERS = {
  'Al-Albani': {
    name: 'Muhammad Nasiruddin al-Albani',
    lived: '1332–1420 AH (1914–1999 CE)',
    detail: 'Graded the four Sunan collections hadith by hadith in the 20th century.',
  },
  'Darussalam': {
    name: 'Darussalam editorial gradings',
    detail: 'Gradings published with the Darussalam English translations of the collections.',
  },
  'Ahmad Shakir': {
    name: 'Ahmad Muhammad Shakir',
    lived: '1309–1377 AH (1892–1958 CE)',
    detail: 'Egyptian scholar who verified and graded major hadith works.',
  },
  'Zubair Ali Zai': {
    name: 'Hafiz Zubair Ali Zai',
    lived: '1377–1434 AH (1957–2013 CE)',
    detail: 'Provided the hadith gradings used in several English Sunan editions.',
  },
};

/** What a grade actually means, so the badge is not just a colour. */
export const GRADE_MEANINGS = {
  sahih: 'Authentic — a continuous chain of trustworthy, precise narrators, free of irregularity and hidden defect.',
  hasan: 'Sound — as above, but one or more narrators are of slightly lesser precision.',
  'hasan sahih': 'Judged sound to authentic; at-Tirmidhi uses this where chains differ in strength.',
  daif: 'Weak — a break in the chain, or a narrator criticised for reliability or precision.',
  'da`if': 'Weak — a break in the chain, or a narrator criticised for reliability or precision.',
  mawdu: 'Fabricated — attributed to the Prophet ﷺ without foundation. Not to be acted upon or spread.',
};

export const gradeMeaning = grade => {
  if (!grade) return null;
  const g = String(grade).toLowerCase().trim();
  return GRADE_MEANINGS[g] ||
    Object.entries(GRADE_MEANINGS).find(([k]) => g.includes(k))?.[1] || null;
};

export const collectorFor = collectionId => COLLECTORS[collectionId] || null;

export const graderFor = name => {
  if (!name) return null;
  return GRADERS[name] ||
    Object.entries(GRADERS).find(([k]) => name.includes(k))?.[1] || null;
};

/**
 * Builds the chain to display for one hadith.
 *
 * `companion` is filled only when our data records the narrating Companion.
 * The intermediate narrators are deliberately returned as `known: false` —
 * they exist in the printed collection but not in this app's data, and the UI
 * must say that rather than inventing names.
 */
export function buildChain({ collectionId, companion }) {
  const collector = collectorFor(collectionId);
  return TRANSMISSION_STAGES.map(stage => {
    if (stage.key === 'sahabi' && companion) {
      return { ...stage, person: companion, known: true };
    }
    if (stage.key === 'collector' && collector) {
      return { ...stage, person: collector.name, known: true, collector };
    }
    if (stage.key === 'prophet') return { ...stage, known: true };
    return { ...stage, known: false };
  });
}
