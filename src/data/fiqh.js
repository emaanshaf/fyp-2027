// How to perform wudhu and salah, per school.
//
// SCOPE AND HONESTY:
//
// Two schools are covered because the app is asked to serve both: the Hanafi
// school (the majority school of the subcontinent, Turkey and Central Asia)
// and the Ja'fari school (Twelver Shia). They differ in real, visible ways —
// how the arms are washed, whether the feet are washed or wiped, where the
// hands are held in qiyam, the number of daily prayer sittings — and this file
// states those differences rather than presenting one school's method as
// "the" method with the other as a footnote.
//
// What this file is NOT: a fatwa, and not a substitute for a teacher. Every
// guide ends with a line saying so, and the UI renders it.
//
// Where the two schools agree, the step is written once with `both: true`.
// Where they differ, each school gets its own text. A step that applies to
// only one school is marked with `only`.

export const SCHOOLS = [
  {
    key: 'hanafi',
    name: 'Hanafi',
    arabic: 'ٱلْحَنَفِي',
    detail: 'One of the four Sunni schools; predominant in South Asia, Turkey and Central Asia.',
  },
  {
    key: 'jafari',
    name: "Ja'fari",
    arabic: 'ٱلْجَعْفَرِي',
    detail: 'The Twelver Shia school, named after Imam Ja\'far as-Sadiq.',
  },
];

// ── Wudhu ──────────────────────────────────────────────────────────────────

export const WUDHU = {
  hanafi: {
    intro:
      'In the Hanafi school four acts are obligatory (fard) in wudhu: washing '
      + 'the face, washing both arms including the elbows, wiping a quarter of '
      + 'the head, and washing both feet including the ankles. The remaining '
      + 'steps are sunnah and complete the wudhu.',
    steps: [
      { title: 'Intention (niyyah)', detail: 'Intend in the heart to perform wudhu for the sake of Allah. It is not pronounced aloud as a condition.', kind: 'sunnah' },
      { title: 'Say Bismillah', detail: 'Begin with "Bismillah".', kind: 'sunnah' },
      { title: 'Wash the hands', detail: 'Wash both hands up to the wrists three times, passing between the fingers.', kind: 'sunnah' },
      { title: 'Rinse the mouth', detail: 'Rinse the mouth three times (miswak is recommended before this).', kind: 'sunnah' },
      { title: 'Rinse the nose', detail: 'Draw water into the nostrils and blow it out, three times.', kind: 'sunnah' },
      { title: 'Wash the face', detail: 'Wash the whole face three times — from the hairline to below the chin, and from ear to ear.', kind: 'fard' },
      { title: 'Wash the arms', detail: 'Wash the right arm to and including the elbow three times, then the left the same way.', kind: 'fard' },
      { title: 'Wipe the head (masah)', detail: 'Wipe the head with wet hands. Wiping at least a quarter of the head is obligatory; wiping the whole head once is sunnah.', kind: 'fard' },
      { title: 'Wipe the ears', detail: 'Wipe inside the ears with the index fingers and behind them with the thumbs, once.', kind: 'sunnah' },
      { title: 'Wash the feet', detail: 'Wash the right foot to and including the ankle three times, then the left, passing the little finger between the toes.', kind: 'fard' },
    ],
    nullifiers: [
      'Anything exiting from the front or back passage',
      'Flowing blood, pus, or vomiting a mouthful',
      'Sleeping lying down or reclining',
      'Losing consciousness or intoxication',
      'Laughing aloud during a prayer with ruku and sujud',
    ],
  },

  jafari: {
    intro:
      'In the Ja\'fari school wudhu is: washing the face, washing the right '
      + 'arm then the left from the elbow downwards, then wiping (masah) the '
      + 'front of the head and the tops of both feet with the moisture '
      + 'remaining on the hands. The feet are wiped, not washed, and the arms '
      + 'are washed downwards from the elbow.',
    steps: [
      { title: 'Intention (niyyah)', detail: 'Intend wudhu seeking nearness to Allah. The intention must be present from the start and maintained throughout.', kind: 'fard' },
      { title: 'Wash the face', detail: 'Wash the face once from the hairline to the chin, and in width the span between the thumb and middle finger. Washing twice is permitted; a third is not.', kind: 'fard' },
      { title: 'Wash the right arm', detail: 'Wash from the elbow downwards to the fingertips — the direction matters in this school.', kind: 'fard' },
      { title: 'Wash the left arm', detail: 'Wash from the elbow downwards to the fingertips.', kind: 'fard' },
      { title: 'Wipe the head', detail: 'With the moisture left on the right hand, wipe the front quarter of the head. No fresh water is taken for this.', kind: 'fard' },
      { title: 'Wipe the right foot', detail: 'With the remaining moisture, wipe from the toes to the ankle joint.', kind: 'fard' },
      { title: 'Wipe the left foot', detail: 'Wipe the left foot in the same way.', kind: 'fard' },
    ],
    nullifiers: [
      'Urination, defecation, or passing wind',
      'Sleep that overcomes both sight and hearing',
      'Anything that removes the use of the intellect',
      'Istihada (irregular bleeding) for women',
      'Anything requiring a ghusl, such as janabah',
    ],
  },
};

/** The differences a reader most needs to see side by side. */
export const WUDHU_DIFFERENCES = [
  { point: 'Arms', hanafi: 'Washed up to and including the elbows', jafari: 'Washed from the elbow downwards' },
  { point: 'Head', hanafi: 'Wiping a quarter of the head is obligatory', jafari: 'Wiping the front of the head with residual moisture' },
  { point: 'Feet', hanafi: 'Washed, including the ankles', jafari: 'Wiped (masah), not washed' },
  { point: 'Repetitions', hanafi: 'Three washes is the sunnah', jafari: 'Once is obligatory; twice permitted, a third is not' },
];

// ── Salah ──────────────────────────────────────────────────────────────────

export const SALAH = {
  hanafi: {
    intro:
      'The method below is for two rak\'ah. Longer prayers repeat the same '
      + 'cycle, with the final sitting containing the tashahhud, salawat and '
      + 'dua before the salam.',
    steps: [
      { title: 'Standing (qiyam) and intention', detail: 'Stand facing the qiblah, feet about four fingers apart, and make the intention for the prayer you are offering.' },
      { title: 'Takbir al-Ihram', detail: 'Raise the hands to the ears (men) or the shoulders (women) and say "Allahu Akbar".' },
      { title: 'Placing the hands', detail: 'Men place the right hand over the left below the navel; women place them on the chest.' },
      { title: 'Thana, ta\'awwudh, tasmiyah', detail: 'Recite "Subhanaka Allahumma...", then "A\'udhu billahi..." and "Bismillah..." quietly.' },
      { title: 'Recitation', detail: 'Recite Surah al-Fatihah, then any other passage of the Quran.' },
      { title: 'Ruku', detail: 'Say "Allahu Akbar" and bow, grasping the knees, back level, saying "Subhana Rabbiyal Azeem" three times.' },
      { title: 'Rising (qawmah)', detail: 'Rise saying "Sami\'Allahu liman hamidah", then "Rabbana lakal hamd".' },
      { title: 'Sujud', detail: 'Say "Allahu Akbar" and prostrate on seven limbs, saying "Subhana Rabbiyal A\'la" three times.' },
      { title: 'Sitting (jalsah)', detail: 'Sit briefly between the two prostrations.' },
      { title: 'Second sujud', detail: 'Prostrate a second time in the same manner. This completes one rak\'ah.' },
      { title: 'Final sitting', detail: 'After the last rak\'ah recite the tashahhud, then the salawat, then a dua.' },
      { title: 'Salam', detail: 'Turn the head right saying "Assalamu alaikum wa rahmatullah", then to the left.' },
    ],
  },

  jafari: {
    intro:
      'The method below is for two rak\'ah. The five prayers are commonly '
      + 'offered in three sittings — Dhuhr with Asr, and Maghrib with Isha — '
      + 'which is a well-known distinguishing practice of this school.',
    steps: [
      { title: 'Standing (qiyam) and intention', detail: 'Stand facing the qiblah and form the intention, specifying the prayer and that it is for nearness to Allah.' },
      { title: 'Takbirat al-Ihram', detail: 'Raise the hands to the level of the ears and say "Allahu Akbar".' },
      { title: 'Hands at the sides', detail: 'The hands are kept at the sides during qiyam; folding them is not part of the prayer in this school.' },
      { title: 'Recitation', detail: 'Recite Surah al-Fatihah followed by a complete surah.' },
      { title: 'Qunut', detail: 'Before the ruku of the second rak\'ah, raise the hands before the face and make dua. This is a recommended (mustahabb) act.' },
      { title: 'Ruku', detail: 'Bow with the hands on the knees, saying "Subhana Rabbiyal Azeemi wa bihamdih".' },
      { title: 'Rising', detail: 'Stand upright saying "Sami\'Allahu liman hamidah".' },
      { title: 'Sujud', detail: 'Prostrate saying "Subhana Rabbiyal A\'la wa bihamdih". The forehead is placed on earth or something grown from it — commonly a turbah of clay.' },
      { title: 'Sitting and second sujud', detail: 'Sit saying "Astaghfirullaha Rabbi wa atubu ilayh", then prostrate a second time.' },
      { title: 'Tashahhud', detail: 'In the sitting, recite the shahadah and the salawat upon the Prophet and his family.' },
      { title: 'Salam', detail: 'Conclude with the salam.' },
    ],
  },
};

export const SALAH_DIFFERENCES = [
  { point: 'Hands in qiyam', hanafi: 'Folded — right over left', jafari: 'Kept at the sides' },
  { point: 'Prayer sittings', hanafi: 'Five separate times', jafari: 'Commonly combined into three sittings' },
  { point: 'Qunut', hanafi: 'In the Witr prayer', jafari: 'In the second rak\'ah before ruku' },
  { point: 'Place of sujud', hanafi: 'Any clean surface', jafari: 'Earth or what grows from it — commonly a turbah' },
  { point: 'After al-Fatihah', hanafi: 'Any portion of the Quran', jafari: 'A complete surah' },
];

/** Rendered at the foot of every guide. */
export const FIQH_DISCLAIMER =
  'This is a summary for learning, not a fatwa. Details vary with circumstance '
  + 'and between scholars within each school. Learn the prayer from a qualified '
  + 'teacher in your own community, and ask them about anything specific to you.';

export const wudhuFor = school => WUDHU[school] || null;
export const salahFor = school => SALAH[school] || null;
