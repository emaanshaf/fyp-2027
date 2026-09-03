// Significance of each Hijri month.
//
// SOURCING RULE: nothing in this file is invented. Each entry states only what
// is broadly agreed across mainstream Sunni scholarship, and where a date or
// practice is genuinely disputed that is said plainly rather than smoothed
// over. `disputed` renders as a visible caveat in the UI — an Islamic app that
// asserts contested dates as fact is worse than one that stays quiet.
//
// The four sacred months (Al-Ashhur al-Hurum) are Muharram, Rajab, Dhul
// Qi'dah and Dhul Hijjah, per Surah At-Tawbah 9:36.
//
// Every `highlights` entry must carry exactly one provenance marker, and a
// test enforces it:
//   reference   — a citable Quran verse or hadith
//   disputed    — the claim is contested; the dispute renders in the UI
//   established — definitional or uncontested historical fact, no citation
//
// To correct or extend an entry, edit here — the landing page renders whatever
// this file says and holds no copy of its own.

export const HIJRI_MONTH_INFO = {
  1: {
    name: 'Muharram',
    arabic: 'ٱلْمُحَرَّم',
    meaning: 'The Forbidden (Sacred) Month',
    sacred: true,
    summary:
      'The first month of the Islamic year and one of the four sacred months in which fighting was forbidden.',
    highlights: [
      {
        title: 'The Day of Ashura',
        when: '10 Muharram',
        detail:
          'The Prophet ﷺ fasted on this day and encouraged fasting it. It is recommended to fast the 9th alongside the 10th.',
        reference: 'Sahih Muslim 1134',
      },
    ],
  },
  2: {
    name: 'Safar',
    arabic: 'صَفَر',
    meaning: 'The Void',
    sacred: false,
    summary:
      'An ordinary month with no specifically legislated acts of worship attached to it.',
    highlights: [
      {
        title: 'No inherent misfortune',
        detail:
          'The Prophet ﷺ rejected the pre-Islamic belief that Safar carries bad omens: "There is no ‘adwa (contagion held to act independently), no tiyarah (omens), no hamah and no Safar."',
        reference: 'Sahih al-Bukhari 5757',
      },
    ],
  },
  3: {
    name: "Rabi' al-Awwal",
    arabic: 'رَبِيعُ ٱلْأَوَّل',
    meaning: 'The First Spring',
    sacred: false,
    summary:
      'The month associated with the birth of the Prophet Muhammad ﷺ, and the month in which he passed away in Madinah.',
    highlights: [
      {
        title: 'Birth of the Prophet ﷺ',
        when: 'Rabi\' al-Awwal',
        detail:
          'The Prophet ﷺ was born in this month in the Year of the Elephant. He was asked about fasting on Mondays and answered: "That is the day I was born."',
        reference: 'Sahih Muslim 1162',
        disputed:
          'The exact day is not agreed upon — the 12th is widely cited, while other reports name the 8th, 9th or 10th. Marking it as a festival is itself a matter of scholarly disagreement.',
      },
      {
        title: 'The Hijrah reaches Madinah',
        detail:
          'The Prophet ﷺ completed his migration from Makkah and arrived in Quba, then Madinah, during this month.',
        established: 'Well-established in the standard seerah literature.',
      },
    ],
  },
  4: {
    name: "Rabi' al-Thani",
    arabic: 'رَبِيعُ ٱلثَّانِي',
    meaning: 'The Second Spring',
    sacred: false,
    summary: 'An ordinary month with no specifically legislated observances.',
    highlights: [],
  },
  5: {
    name: 'Jumada al-Ula',
    arabic: 'جُمَادَىٰ ٱلْأُولَىٰ',
    meaning: 'The First of the Dry Months',
    sacred: false,
    summary: 'An ordinary month with no specifically legislated observances.',
    highlights: [],
  },
  6: {
    name: 'Jumada al-Thani',
    arabic: 'جُمَادَىٰ ٱلْآخِرَة',
    meaning: 'The Last of the Dry Months',
    sacred: false,
    summary: 'An ordinary month with no specifically legislated observances.',
    highlights: [],
  },
  7: {
    name: 'Rajab',
    arabic: 'رَجَب',
    meaning: 'The Revered Month',
    sacred: true,
    summary:
      'One of the four sacred months, and the month preceding Sha\'ban and Ramadan.',
    highlights: [
      {
        title: "Al-Isra wal-Mi'raj",
        detail:
          'The Night Journey and Ascension are traditionally associated with this month.',
        disputed:
          'The month and date are not established with certainty; scholars differ, and no specific worship is legislated for the night itself.',
      },
    ],
  },
  8: {
    name: "Sha'ban",
    arabic: 'شَعْبَان',
    meaning: 'The Month of Dispersal',
    sacred: false,
    summary:
      'The month before Ramadan, in which the Prophet ﷺ fasted more than in any other month outside Ramadan.',
    highlights: [
      {
        title: 'A month of frequent fasting',
        detail:
          "Aisha (RA) said: \"I never saw the Messenger of Allah ﷺ fast a complete month except Ramadan, and I never saw him fast more in a month than in Sha'ban.\"",
        reference: 'Sahih al-Bukhari 1969',
      },
    ],
  },
  9: {
    name: 'Ramadan',
    arabic: 'رَمَضَان',
    meaning: 'The Scorching Heat',
    sacred: false,
    summary:
      'The month of obligatory fasting, in which the revelation of the Quran began.',
    highlights: [
      {
        title: 'The month the Quran was revealed',
        detail:
          '"The month of Ramadan is that in which was revealed the Quran, a guidance for the people..."',
        reference: 'Surah Al-Baqarah 2:185',
      },
      {
        title: 'Laylat al-Qadr',
        when: 'One of the last ten nights',
        detail:
          'The Night of Decree, better than a thousand months. The Prophet ﷺ told believers to seek it in the odd nights of the last ten.',
        reference: 'Sahih al-Bukhari 2017',
      },
    ],
  },
  10: {
    name: 'Shawwal',
    arabic: 'شَوَّال',
    meaning: 'The Raised',
    sacred: false,
    summary: 'The month of Eid al-Fitr and the recommended six fasts.',
    highlights: [
      {
        title: 'Eid al-Fitr',
        when: '1 Shawwal',
        detail: 'The festival marking the completion of the Ramadan fast.',
        established: 'The date is definitional: Eid al-Fitr is the first of Shawwal.',
      },
      {
        title: 'The six fasts of Shawwal',
        detail:
          '"Whoever fasts Ramadan and follows it with six days of Shawwal, it is as if he fasted the entire year."',
        reference: 'Sahih Muslim 1164',
      },
    ],
  },
  11: {
    name: "Dhul Qi'dah",
    arabic: 'ذُو ٱلْقَعْدَة',
    meaning: 'The Month of Sitting',
    sacred: true,
    summary:
      'One of the four sacred months, and the first of the months of Hajj.',
    highlights: [],
  },
  12: {
    name: 'Dhul Hijjah',
    arabic: 'ذُو ٱلْحِجَّة',
    meaning: 'The Month of Pilgrimage',
    sacred: true,
    summary:
      'One of the four sacred months. It contains the Hajj, the Day of Arafah and Eid al-Adha.',
    highlights: [
      {
        title: 'The first ten days',
        when: '1–10 Dhul Hijjah',
        detail:
          '"There are no days in which righteous deeds are more beloved to Allah than these ten days."',
        reference: 'Sahih al-Bukhari 969',
      },
      {
        title: 'The Day of Arafah',
        when: '9 Dhul Hijjah',
        detail:
          'Fasting this day for those not performing Hajj expiates the sins of the past and coming year.',
        reference: 'Sahih Muslim 1162',
      },
      {
        title: 'Eid al-Adha',
        when: '10 Dhul Hijjah',
        detail:
          'The Festival of Sacrifice, commemorating the willingness of Ibrahim (AS).',
        established: 'The date is definitional: Eid al-Adha is the tenth of Dhul Hijjah.',
      },
    ],
  },
};

/** Info for a Hijri month number (1-12). */
export const monthInfo = month => HIJRI_MONTH_INFO[month] || null;

export default HIJRI_MONTH_INFO;
