// Structured self-study courses.
//
// Each course is a short sequence of lessons with a handful of review
// questions. The content is introductory and cites its evidence; it is not a
// substitute for studying with a qualified teacher, and the app says so.

export const COURSE_CATEGORIES = [
  { id: 'all', label: 'All courses' },
  { id: 'quran', label: 'Qur’an' },
  { id: 'fiqh', label: 'Fiqh' },
  { id: 'history', label: 'History' },
  { id: 'hadith', label: 'Hadith' },
  { id: 'arabic', label: 'Arabic' },
  { id: 'aqeedah', label: 'Aqeedah' },
];

export const COURSES = [
  {
    id: 'noorani-qaida',
    title: 'Noorani Qaida Foundations',
    arabic: 'القاعدة النورانية',
    category: 'quran',
    level: 'Beginner',
    icon: 'text-outline',
    accent: 'gold',
    minutes: 90,
    summary:
      'Read Arabic from the first letter: the alphabet, short vowels, joining letters, sukoon, tanween and the first rules of elongation.',
    outcomes: [
      'Recognise and pronounce all 28 Arabic letters.',
      'Read letters with fatha, kasra and damma.',
      'Join letters into words and recognise the non-joining letters.',
      'Apply sukoon, shaddah and tanween in short words.',
    ],
    lessons: [
      {
        title: 'The Arabic alphabet',
        summary: 'Twenty-eight letters, their names and their sounds.',
        points: [
          'Arabic is written right to left. The same letter changes shape depending on whether it begins, sits inside or ends a word.',
          'Learn each letter by name and sound: alif, ba, ta, tha, jim, ha, kha… up to ya.',
          'Pay attention to letters that sound close in English: س/ص, ت/ط, ح/ه, ذ/ز/ظ, and ق/ك.',
          'The letter hamza (ء) is a consonant in its own right, not a decoration.',
        ],
        practice: 'Read the alphabet aloud every day for a week, then read it backwards.',
      },
      {
        title: 'Short vowels — harakat',
        summary: 'Fatha, kasra and damma change the sound of a letter.',
        points: [
          'Fatha ( َ ) gives the short “a” sound: بَ = ba.',
          'Kasra ( ِ ) gives the short “i” sound: بِ = bi.',
          'Damma ( ُ ) gives the short “u” sound: بُ = bu.',
          'A letter with no vowel has sukoon ( ْ ) and is not pronounced with a vowel of its own.',
          'Read slowly enough to hear every vowel; speed is not the goal at this stage.',
        ],
        practice: 'Read three-letter combinations such as كَتَبَ (kataba) and ذَهَبَ (dhahaba).',
      },
      {
        title: 'Joining letters and non-joining letters',
        summary: 'Words are a chain of joined shapes.',
        points: [
          'Most letters connect to the letter before and after them; the shape stretches into a connector.',
          'Six letters do not connect to the letter after them: ا د ذ ر ز و. A word like وَرَدَ breaks after each of these.',
          'Alif, waw and ya can also act as long vowels rather than consonants.',
          'Practice by covering the word and reading it in syllables, then joining the syllables without stopping.',
        ],
        practice: 'Copy five short words and circle every non-joining letter.',
      },
      {
        title: 'Sukoon and shaddah',
        summary: 'Stopping a sound and doubling a letter.',
        points: [
          'Sukoon means the letter is closed: مِنْ (min) ends with a silent n sound rather than “ni”.',
          'Shaddah doubles a letter: رَبَّ = rab-ba. You pronounce the letter twice, once closed and once with its vowel.',
          'Shaddah always sits on a letter and is read with emphasis, not extra length.',
          'In رَبِّ الْعَالَمِينَ the shaddah is followed by a kasra; do not replace it with a long vowel.',
        ],
        practice: 'Read pairs: بَ + بَّ, لَ + لَّ, نَ + نَّ.',
      },
      {
        title: 'Tanween and the first madd',
        summary: 'Nunation and the natural two-count elongation.',
        points: [
          'Tanween is a doubled vowel at the end of a word: بَيْتًا (baytan), بَيْتٍ (baytin), بَيْتُ (baytu).',
          'Madd al-asli is the natural elongation: alif, waw or ya followed by no vowel, held for two counts.',
          'In بِهَا the alif adds length to the “ha”; in يَقُولُ the waw adds length.',
          'Do not add length where there is no madd letter; over-elongation is a common beginner habit.',
        ],
        practice: 'Read سُورَةُ الْفَاتِحَة slowly and mark every madd letter.',
      },
    ],
    quiz: [
      {
        q: 'Which letters do not connect to the letter that follows them?',
        options: ['ا د ذ ر ز و', 'ب ت ث ن ي', 'س ش ص ض', 'ع غ ف ق'],
        answer: 0,
        explanation: 'These six letters always break the connection after themselves.',
      },
      {
        q: 'What does a shaddah indicate?',
        options: ['A long vowel', 'A doubled letter', 'A silent letter', 'A pause'],
        answer: 1,
        explanation: 'The letter is pronounced twice: once closed and once carrying its vowel.',
      },
      {
        q: 'How long is madd al-asli held?',
        options: ['Half a count', 'Two counts', 'Four counts', 'As long as you like'],
        answer: 1,
        explanation: 'The natural elongation is held for the duration of two vowel counts.',
      },
    ],
  },
  {
    id: 'tajweed',
    title: 'Tajweed Essentials',
    arabic: 'أحكام التجويد',
    category: 'quran',
    level: 'Beginner',
    icon: 'musical-notes-outline',
    accent: 'cyan',
    minutes: 120,
    summary:
      'The rules that give every letter its right: articulation points, the noon and meem rules, madd and qalqalah.',
    outcomes: [
      'Name the five main articulation areas.',
      'Apply izhar, idgham, iqlab and ikhfa to noon saakinah.',
      'Hold the madd types taught in this course for their correct counts.',
      'Identify the letters of qalqalah and apply it correctly.',
    ],
    lessons: [
      {
        title: 'Makharij — where letters are born',
        summary: 'The five regions of articulation.',
        points: [
          'The throat (al-halq) produces ء ه ع ح غ خ.',
          'The tongue (al-lisan) produces most letters, from the back of the tongue to the tip.',
          'The lips (ash-shafatan) produce ب م و ف.',
          'The nose (al-khayshum) carries the nasal sound of ghunnah for ن and م.',
          'The mouth cavity (al-jawf) carries the long vowels.',
        ],
        practice: 'Say each group three times while watching your lips and tongue in a mirror.',
      },
      {
        title: 'Noon saakinah and tanween',
        summary: 'Four rules depending on the next letter.',
        points: [
          'Izhar: clear pronunciation before the six throat letters ء ه ع ح غ خ.',
          'Idgham: merge into ي ر م ل ن و. With ي ر م ل ن و the nasal sound remains; before ل and ر it is dropped.',
          'Iqlab: change ن into م before ب, with ghunnah for two counts.',
          'Ikhfa: conceal the noon with ghunnah before the remaining fifteen letters.',
        ],
        practice: 'Open any page of the Qur’an and colour-code every noon saakinah by rule.',
      },
      {
        title: 'Meem saakinah',
        summary: 'Three rules for a silent meem.',
        points: [
          'Ikhfa shafawi: before ب, conceal the meem with ghunnah for two counts.',
          'Idgham shafawi: before م, merge the two meems with ghunnah.',
          'Izhar shafawi: before any other letter, pronounce the meem clearly with no extra ghunnah.',
        ],
        practice: 'Read Surah al-Fatihah and mark the meem rules in the first two ayahs.',
      },
      {
        title: 'Madd — the measured lengths',
        summary: 'Two, four and six counts.',
        points: [
          'Madd al-asli: two counts, when a madd letter has no hamzah or sukoon after it.',
          'Madd al-muttasil: madd letter followed by hamzah in the same word — four or five counts.',
          'Madd al-munfasil: madd letter at the end of a word followed by hamzah in the next — four or five counts.',
          'Madd al-lazim: madd letter followed by sukoon — six counts.',
          'Consistency matters more than speed: choose one valid count and keep it throughout the recitation.',
        ],
        practice: 'Record yourself reciting Surah al-Asr and compare the madd lengths.',
      },
      {
        title: 'Qalqalah — the echo',
        summary: 'A bounce on five letters.',
        points: [
          'The letters are ق ط ب ج د — remembered by the phrase “qutub jad”.',
          'Qalqalah is stronger when the letter carries sukoon and is at the end of an ayah.',
          'It is lighter when the letter is in the middle of a word.',
          'Do not add a vowel after the bounce; it is a quick echo, not an extra syllable.',
        ],
        practice: 'Read يَجْعَلُونَ, يَدْخُلُونَ and أَحَدْ with a controlled bounce.',
      },
      {
        title: 'Common recitation mistakes',
        summary: 'Protect the meaning before perfecting the melody.',
        points: [
          'Confusing ح and ه changes words; learn the throat positions deliberately.',
          'Replacing ض with د or ظ changes the letter entirely.',
          'Over-elongating a short vowel can change “you worship” into “we worship”.',
          'Reading too fast hides the rules. Slow recitation is the practice, not the performance.',
          'Learn from a teacher who can hear you; tajweed cannot be corrected from a book alone.',
        ],
        practice: 'Read one page slowly every day and record one rule you applied.',
      },
    ],
    quiz: [
      {
        q: 'Before which letter is iqlab applied to noon saakinah?',
        options: ['م', 'ب', 'ل', 'ء'],
        answer: 1,
        explanation: 'The noon becomes a meem sound before ب, with ghunnah for two counts.',
      },
      {
        q: 'How long is madd al-lazim held?',
        options: ['Two counts', 'Three counts', 'Four counts', 'Six counts'],
        answer: 3,
        explanation: 'A madd letter followed by a permanent sukoon is held for six counts.',
      },
      {
        q: 'Which set is the qalqalah letters?',
        options: ['ق ط ب ج د', 'ي ر م ل و ن', 'ء ه ع ح غ خ', 'س ش ص ض'],
        answer: 0,
        explanation: 'The five qalqalah letters are ق ط ب ج د.',
      },
    ],
  },
  {
    id: 'fiqh-salah',
    title: 'Fiqh of Salah',
    arabic: 'فقه الصلاة',
    category: 'fiqh',
    level: 'Beginner',
    icon: 'body-outline',
    accent: 'emerald',
    minutes: 75,
    summary:
      'What makes a prayer valid, what is obligatory inside it, and the mistakes that quietly invalidate it.',
    outcomes: [
      'List the conditions that precede prayer.',
      'Distinguish the pillars, obligations and sunnah acts of the prayer.',
      'Correct the most common mistakes in wudu and prayer.',
    ],
    lessons: [
      {
        title: 'Conditions before prayer',
        summary: 'Seven conditions that must be met before you begin.',
        points: [
          'Purity from major and minor impurity (wudu or ghusl as required).',
          'Cleanliness of body, clothes and place.',
          'Covering the awrah: for men, navel to knee; for women, the whole body except the face and hands.',
          'Facing the qiblah.',
          'Knowing that the time has entered.',
          'The intention in the heart.',
          'Being Muslim and sane; a child is not obligated until puberty.',
        ],
        practice: 'Check one condition each day for a week before every prayer.',
      },
      {
        title: 'The pillars of the prayer',
        summary: 'Acts that cannot be omitted, even accidentally.',
        points: [
          'Standing for the obligatory prayer when able.',
          'The opening takbir (Allahu akbar).',
          'Reciting Surah al-Fatihah in every rakah.',
          'Ruku‘, rising from it, sujud on seven limbs, and sitting between the two sujud.',
          'The final tashahhud, the salawat on the Prophet ﷺ, and the final salutation.',
          'Calmness (tuma’ninah) in every posture — rushing through the positions invalidates the prayer.',
        ],
        practice: 'Pray one prayer slowly, holding each posture for the length of a short dhikr.',
      },
      {
        title: 'Fard, wajib and sunnah',
        summary: 'The schools classify the inner acts differently.',
        points: [
          'Hanafis use fard, wajib and sunnah: omitting a wajib requires sujud al-sahw; omitting a fard invalidates the prayer.',
          'Shafi‘is and Hanbalis use pillars and obligations; omitting a pillar invalidates, omitting an obligation can be compensated by sujud al-sahw.',
          'Malikis use fard, sunnah mu’akkadah and other categories.',
          'Learn the classification of the school you follow rather than mixing them.',
        ],
        practice: 'Ask your teacher which acts your school treats as fard and which as sunnah.',
      },
      {
        title: 'Sujud al-sahw',
        summary: 'The prostration that repairs a mistake.',
        points: [
          'It is two prostrations made after the final tashahhud, before or after the salutation depending on the mistake.',
          'It applies to adding an act, omitting a non-pillar obligation, or being uncertain about the number of rakats.',
          'If you are unsure whether you prayed three or four rakats, build on what you are certain of and prostrate for the doubt.',
          'Deliberately omitting a pillar is not repaired by sujud; the prayer must be repeated.',
        ],
        practice: 'Learn one scenario and rehearse it with a teacher or a reliable local imam.',
      },
      {
        title: 'Common mistakes in prayer',
        summary: 'Small habits with large consequences.',
        points: [
          'Rushing the prayer so the joints do not settle — this removes the reward and can invalidate it.',
          'Reciting out loud in a silent prayer or silently in a loud one without reason.',
          'Moving before the imam in congregation.',
          'Praying without valid wudu because “it is only a quick sunnah”.',
          'Leaving the prayer entirely because of guilt; the cure for a missed prayer is to pray, not to abandon the habit.',
        ],
        practice: 'Choose one mistake and correct it for a full week.',
      },
    ],
    quiz: [
      {
        q: 'Which of these is a pillar of the prayer?',
        options: ['Dua al-qunut', 'Surah al-Fatihah', 'The adhan', 'The miswak'],
        answer: 1,
        explanation: 'Al-Fatihah is recited in every rakah and cannot be omitted.',
      },
      {
        q: 'What is tuma’ninah?',
        options: ['A quiet voice', 'Calmness and settling in each posture', 'Raising the hands', 'A short surah after Fatihah'],
        answer: 1,
        explanation: 'Each posture must be held long enough for the joints to settle.',
      },
      {
        q: 'When is sujud al-sahw appropriate?',
        options: ['After every prayer', 'For a mistake such as doubt about the number of rakats', 'Only on Fridays', 'When praying alone'],
        answer: 1,
        explanation: 'It repairs additions, non-pillar omissions and uncertainty, not deliberate pillar omissions.',
      },
    ],
  },
  {
    id: 'seerah',
    title: "Seerah: The Prophet's Life",
    arabic: 'السيرة النبوية',
    category: 'history',
    level: 'Beginner',
    icon: 'footsteps-outline',
    accent: 'blue',
    minutes: 150,
    summary:
      'From the cave of Hira to the farewell sermon: the life that shaped the Muslim community.',
    outcomes: [
      'Place the major events of the Seerah in order.',
      'Explain the significance of the Hijrah and the Madinan constitution.',
      'Describe the character of the Prophet ﷺ in daily life.',
    ],
    lessons: [
      {
        title: 'Makkah before the call',
        summary: 'The city, the Ka‘bah and the tribes.',
        points: [
          'Makkah was a trading city built around the Ka‘bah, which had been filled with idols.',
          'The Quraysh were the dominant tribe, custodians of the sanctuary and the pilgrimage economy.',
          'Muhammad ﷺ was born in 570 CE, orphaned early and known as al-Amin, the trustworthy.',
          'He married Khadijah bint Khuwaylid at twenty-five and worked as a trader.',
        ],
        practice: 'Draw a map of the Arabian Peninsula and mark Makkah, Ta’if and Madinah.',
      },
      {
        title: 'The first revelation',
        summary: 'The cave of Hira and the beginning of prophethood.',
        points: [
          'At forty, in the month of Ramadan, the Prophet ﷺ received the first revelation in the cave of Hira.',
          'The first words were: “Read in the name of your Lord who created.”',
          'Khadijah supported him immediately; Waraqah ibn Nawfal recognised the pattern of revelation.',
          'The call remained secret for three years before the public proclamation.',
        ],
        practice: 'Memorise the first five ayahs of Surah al-‘Alaq.',
      },
      {
        title: 'Persecution and patience',
        summary: 'The years of boycott, torture and migration.',
        points: [
          'Early Muslims were tortured and boycotted; Bilal, Sumayyah and the family of Yasir are among the most famous.',
          'The migration to Abyssinia gave the community its first safe refuge.',
          'The Year of Sorrow cost the Prophet ﷺ his wife Khadijah and his uncle Abu Talib.',
          'The Isra’ and Mi‘raj came in this period, followed by the pledge at Aqabah.',
        ],
        practice: 'Read Surah al-Kahf and note how the Qur’an strengthens believers under pressure.',
      },
      {
        title: 'The Hijrah and Madinah',
        summary: 'The founding of a community.',
        points: [
          'In 622 CE the Prophet ﷺ migrated to Madinah with Abu Bakr, escaping an assassination plot.',
          'The Ansaar welcomed the Muhajirun and shared their wealth with them.',
          'The Constitution of Madinah defined the rights and duties of Muslims, Jews and the tribes of the city.',
          'The qiblah changed, the mosque was built, and the community’s public life took shape.',
        ],
        practice: 'List three lessons from how the Ansaar received the Muhajirun.',
      },
      {
        title: 'Return to Makkah and the farewell',
        summary: 'The final years and the completed message.',
        points: [
          'The treaty of Hudaybiyah, the conquest of Makkah in 8 AH, and the general amnesty.',
          'In 10 AH the Prophet ﷺ performed his only Hajj and delivered the farewell sermon at Arafah.',
          'The sermon affirmed the sanctity of life and property, the equality of believers, and the rights of women.',
          'The Prophet ﷺ died in 11 AH in Madinah; his Sunnah and the Qur’an remain the community’s guide.',
        ],
        practice: 'Read the farewell sermon and write down three commands it contains.',
      },
    ],
    quiz: [
      {
        q: 'In which month did the first revelation begin?',
        options: ['Rajab', 'Ramadan', 'Shawwal', 'Muharram'],
        answer: 1,
        explanation: 'The Qur’an was first revealed in Ramadan, in the cave of Hira.',
      },
      {
        q: 'What was the year of the Hijrah?',
        options: ['570 CE', '610 CE', '622 CE', '632 CE'],
        answer: 2,
        explanation: 'The migration to Madinah took place in 622 CE, the start of the Hijri calendar.',
      },
      {
        q: 'Where did the Prophet ﷺ deliver the farewell sermon?',
        options: ['Mina', 'Arafah', 'Muzdalifah', 'Madinah'],
        answer: 1,
        explanation: 'The sermon was delivered during the farewell Hajj, at Arafah.',
      },
    ],
  },
  {
    id: 'hadith-sciences',
    title: 'Hadith Sciences',
    arabic: 'علوم الحديث',
    category: 'hadith',
    level: 'Intermediate',
    icon: 'shield-checkmark-outline',
    accent: 'amber',
    minutes: 90,
    summary:
      'How the sayings of the Prophet ﷺ were preserved, what the grades mean, and how to check a narration.',
    outcomes: [
      'Explain what a hadith chain (isnad) is.',
      'Distinguish sahih, hasan, da‘if and mawdu‘.',
      'Use the app’s verification checklist before sharing a narration.',
    ],
    lessons: [
      {
        title: 'What is a hadith?',
        summary: 'Report, chain and text.',
        points: [
          'A hadith has two parts: the isnad (chain of narrators) and the matn (wording).',
          'The Companions preserved the Prophet’s words in memory and in writing, and later scholars systematised the science.',
          'Not every quotation on the internet is a hadith; many are attributed to the Prophet ﷺ without any chain.',
          'The app’s Hadith screen and Hadith Verification tool use graded collections and cross-checking.',
        ],
        practice: 'Take one hadith from the app and identify its collection and number.',
      },
      {
        title: 'The chain of narration',
        summary: 'Who heard it from whom.',
        points: [
          'Each link must be known, trustworthy, precise and able to meet the one above him.',
          'A break in the chain weakens the report unless another path supports it.',
          'The same hadith can have several chains that strengthen one another (mutaba‘at and shawahid).',
          'A strong chain does not automatically make a report authentic if its text contradicts a stronger source.',
        ],
        practice: 'Look at the isnad of a hadith in Sahih al-Bukhari and find the Companion at the end.',
      },
      {
        title: 'Grading a report',
        summary: 'Sahih, hasan, da‘if and mawdu‘.',
        points: [
          'Sahih: a continuous chain of reliable, precise narrators with no hidden defect or contradiction.',
          'Hasan: like sahih but with a narrator of slightly weaker precision; it is accepted as evidence.',
          'Da‘if: a weakness in the chain or a narrator; it is not used for rulings without support.',
          'Mawdu‘: fabricated. It is not permissible to attribute it to the Prophet ﷺ.',
        ],
        practice: 'Learn the difference between “da‘if” and “fabricated” before sharing a quote.',
      },
      {
        title: 'Checking a hadith yourself',
        summary: 'A practical checklist.',
        points: [
          'Search the exact wording in a recognised collection, not a social media post.',
          'Check the grading from a scholar of hadith, not from the popularity of the quote.',
          'Be cautious with Isra’iliyyat and stories with no chain.',
          'If you cannot verify it, say “I do not know” rather than attributing it to the Prophet ﷺ.',
          'Use the Hadith Verification tool for a structured cross-check of source and grade.',
        ],
        practice: 'Pick a viral quote and try to find it in a primary collection.',
      },
    ],
    quiz: [
      {
        q: 'What is the isnad?',
        options: ['The meaning of the hadith', 'The chain of narrators', 'The chapter title', 'The Arabic dialect'],
        answer: 1,
        explanation: 'The isnad is the chain of transmission; the wording is the matn.',
      },
      {
        q: 'Which grade is accepted as evidence but carries slightly weaker precision than sahih?',
        options: ['Mawdu‘', 'Da‘if', 'Hasan', 'Munqati‘'],
        answer: 2,
        explanation: 'Hasan is acceptable evidence, though below sahih in strength.',
      },
      {
        q: 'What should you do with a narration you cannot verify?',
        options: ['Share it with “verify” in the caption', 'Attribute it to the Prophet ﷺ anyway', 'Say you do not know and refrain', 'Post it as a weak hadith without checking'],
        answer: 2,
        explanation: 'Attributing something unverified to the Prophet ﷺ is a serious matter; refrain and be honest.',
      },
    ],
  },
  {
    id: 'quranic-arabic',
    title: 'Quranic Arabic',
    arabic: 'العربية القرآنية',
    category: 'arabic',
    level: 'Beginner',
    icon: 'language-outline',
    accent: 'purple',
    minutes: 120,
    summary:
      'The high-frequency vocabulary and grammar that unlock the meaning of most Qur’anic ayahs.',
    outcomes: [
      'Recognise the most frequent Qur’anic words and roots.',
      'Understand simple pronouns and possessive suffixes.',
      'Identify the past and present verb patterns.',
    ],
    lessons: [
      {
        title: 'The hundred most frequent words',
        summary: 'A small vocabulary covers a large share of the text.',
        points: [
          'Words such as الله, رب, يوم, الناس and كتاب recur constantly.',
          'Learn roots rather than isolated forms: ك-ت-ب gives كتاب, كتب, يكتب and مكتوب.',
          'Particles carry meaning: في (in), من (from), على (on), إلى (to).',
          'The definite article ال makes a word definite; tanween often marks indefiniteness.',
        ],
        practice: 'Choose ten frequent words and find them in the ayahs of the day.',
      },
      {
        title: 'Pronouns and suffixes',
        summary: 'Who is speaking and to whom.',
        points: [
          'Independent pronouns: أنا (I), أنت (you, m.), أنتِ (you, f.), هو (he), هي (she), نحن (we).',
          'Possessive suffixes attach to nouns: كتابي (my book), كتابك (your book), كتابه (his book).',
          'Object suffixes attach to verbs: يسمعني (he hears me).',
          'The suffix ـكم addresses a group; ـهم refers to them.',
        ],
        practice: 'Read Surah al-Fatihah and identify every pronoun and suffix.',
      },
      {
        title: 'Nouns, adjectives and the phrase',
        summary: 'How Arabic builds a sentence.',
        points: [
          'An idafa phrase links two nouns: كتاب الله (the Book of Allah). The first noun takes no ال and no tanween.',
          'An adjective follows the noun and agrees in gender, number and definiteness: يوم عظيم (a great day).',
          'The subject of a nominal sentence is usually definite; the predicate is indefinite: الله نور (Allah is light).',
          'Case endings (i‘rab) show the role of a word; they matter for precision, not for basic comprehension.',
        ],
        practice: 'Find three idafa phrases in Surah al-Fatihah.',
      },
      {
        title: 'Past and present verbs',
        summary: 'Roots with patterns.',
        points: [
          'The past tense is a stem with suffixes: كتب (he wrote), كتبوا (they wrote), كتبت (she wrote).',
          'The present tense begins with a prefix: يكتب (he writes), تكتب (she writes), نكتب (we write).',
          'The imperative is built from the present: اكتب (write!).',
          'Most Qur’anic narrative alternates between past and present to bring a scene alive.',
        ],
        practice: 'Find the verb in each ayah of Surah al-‘Asr and name its tense.',
      },
      {
        title: 'Reading with a dictionary',
        summary: 'How to move from words to meaning without guessing.',
        points: [
          'Look up the root, not the inflected form.',
          'Check whether a word is a noun, verb or particle before assigning a meaning.',
          'Read the ayah in two translations and compare; note where they differ and why.',
          'Never build a ruling on a dictionary meaning alone; rely on tafsir and scholars.',
        ],
        practice: 'Take one unfamiliar ayah and write a word-by-word gloss before reading a translation.',
      },
    ],
    quiz: [
      {
        q: 'What does the suffix ـي indicate on a noun?',
        options: ['Plural', 'My', 'Your', 'Their'],
        answer: 1,
        explanation: 'كتابي means “my book”.',
      },
      {
        q: 'In the phrase كتاب الله, why does كتاب have no ال?',
        options: ['It is a verb', 'It is the first term of an idafa', 'It is plural', 'It is a question'],
        answer: 1,
        explanation: 'The first noun of an idafa cannot take the definite article or tanween.',
      },
      {
        q: 'Which prefix marks a present-tense verb?',
        options: ['يـ / تـ / نـ / أ', 'الـ', 'ـة', 'ـون'],
        answer: 0,
        explanation: 'Present verbs begin with one of the four prefix letters.',
      },
    ],
  },
  {
    id: 'aqeedah',
    title: 'Aqeedah: Foundations of Faith',
    arabic: 'العقيدة',
    category: 'aqeedah',
    level: 'Beginner',
    icon: 'sunny-outline',
    accent: 'pink',
    minutes: 80,
    summary:
      'Tawhid, the names and attributes of Allah, and the beliefs that unite the six articles of faith.',
    outcomes: [
      'Explain the three categories of tawhid.',
      'Avoid the extremes of likening Allah to creation and denying His attributes.',
      'Understand why correct belief matters for worship.',
    ],
    lessons: [
      {
        title: 'Tawhid and its categories',
        summary: 'Oneness in lordship, worship and names.',
        points: [
          'Tawhid al-rububiyyah: Allah alone creates, sustains and controls.',
          'Tawhid al-uluhiyyah: Allah alone deserves worship — the category the prophets called to.',
          'Tawhid al-asma wa al-sifat: Allah’s names and attributes are affirmed as He revealed them, without likening or distortion.',
          'Belief in lordship alone is not enough; the polytheists of Makkah accepted that Allah created the heavens.',
        ],
        practice: 'Read Surah al-Ikhlas and identify which category each line establishes.',
      },
      {
        title: 'Names and attributes',
        summary: 'Affirm without comparison.',
        points: [
          'Allah’s names are tawqifiyyah: we use what the Qur’an and Sunnah name, not personal preference.',
          '“There is nothing like unto Him, and He is the Hearing, the Seeing” (42:11) combines negation of likeness with affirmation of attributes.',
          'Do not ask “how” about the attributes; the how is beyond creation’s knowledge.',
          'The names are not slogans for magic or numbers games; they are means of knowing and worshipping Allah.',
        ],
        practice: 'Choose three names from the 99 Names screen and reflect on how each affects your dua.',
      },
      {
        title: 'Why belief matters',
        summary: 'Correct belief produces correct action.',
        points: [
          'Whoever believes Allah is the only provider will not sell his religion for a salary.',
          'Whoever believes in the Last Day will not treat injustice as profitable.',
          'Aqeedah is not a debating club; it is the root from which prayer, honesty and mercy grow.',
          'When belief weakens, worship becomes a habit without presence.',
        ],
        practice: 'Write one sentence linking each of three names of Allah to a daily action.',
      },
      {
        title: 'Extremes to avoid',
        summary: 'Likening and denial are both errors.',
        points: [
          'Tashbih: likening Allah to creation, as if His hand is like a human hand.',
          'Ta‘til: stripping Allah of the attributes He affirmed.',
          'Takfir: declaring Muslims disbelievers over matters that do not warrant it.',
          'Follow the mainstream scholars and leave the details of the unseen to Allah.',
        ],
        practice: 'Re-read 42:11 and write down what it affirms and what it denies.',
      },
    ],
    quiz: [
      {
        q: 'Which category of tawhid describes Allah as the only creator and sustainer?',
        options: ['Uluhiyyah', 'Rububiyyah', 'Asma wa sifat', 'Nubuwwah'],
        answer: 1,
        explanation: 'Rububiyyah is Allah’s exclusive lordship over creation.',
      },
      {
        q: 'What does 42:11 affirm about Allah?',
        options: ['He is like His creation', 'Nothing is like Him and He hears and sees', 'He has no attributes', 'He is only a concept'],
        answer: 1,
        explanation: 'The ayah negates likeness and affirms hearing and sight.',
      },
      {
        q: 'Why is correct aqeedah important?',
        options: ['It settles academic debates', 'It shapes how a person lives and worships', 'It is only for scholars', 'It replaces good deeds'],
        answer: 1,
        explanation: 'Belief is the root of action; sound belief produces sincere worship and honest conduct.',
      },
    ],
  },
  {
    id: 'ramadan-fiqh',
    title: 'Ramadan: Fiqh & Spirit',
    arabic: 'فقه رمضان',
    category: 'fiqh',
    level: 'Beginner',
    icon: 'moon-outline',
    accent: 'emerald',
    minutes: 60,
    summary:
      'The rulings of fasting, valid excuses, Laylat al-Qadr and zakat al-fitr — with the spiritual purpose kept in view.',
    outcomes: [
      'State the conditions and invalidators of the fast.',
      'Distinguish qada, fidya and kaffara.',
      'Prepare for the last ten nights and zakat al-fitr.',
    ],
    lessons: [
      {
        title: 'The obligatory fast',
        summary: 'Who must fast and how the day is framed.',
        points: [
          'It is obligatory for every adult, sane, able Muslim who is resident and not menstruating.',
          'The fast begins at Fajr and ends at Maghrib; intention is made the night before or at the start of the day according to the school.',
          'Suhoor is a blessed sunnah; delaying it is better than skipping it.',
          'Breaking the fast immediately at Maghrib is sunnah.',
        ],
        practice: 'Write out your intention and suhoor time for tomorrow.',
      },
      {
        title: 'What invalidates the fast',
        summary: 'Food, drink and intimacy by choice.',
        points: [
          'Deliberate eating, drinking, smoking or intimacy invalidates the fast.',
          'Forgetfully eating does not invalidate it; stop as soon as you remember.',
          'Vomiting deliberately invalidates; involuntary vomiting does not.',
          'Injections, eye drops and blood tests generally do not invalidate according to many scholars; consult your school and a trustable authority.',
          'Menstruation invalidates the fast and the days are made up later.',
        ],
        practice: 'List the three invalidators you are most likely to encounter and how to avoid them.',
      },
      {
        title: 'Qada, fidya and kaffara',
        summary: 'Making up a missed fast.',
        points: [
          'Qada: making up missed days after Ramadan for a temporary excuse such as illness or travel.',
          'Fidya: feeding a poor person for each day that can never be made up, such as in chronic illness or old age.',
          'Kaffara: for deliberate intimacy during a valid fast — freeing a slave, fasting two months, or feeding sixty poor people, according to the school.',
          'A pregnant or nursing woman follows the ruling of her situation; consult a qualified scholar.',
        ],
        practice: 'Calculate how many fasts you owe and set a date to make them up.',
      },
      {
        title: 'The last ten nights',
        summary: 'Laylat al-Qadr and i‘tikaf.',
        points: [
          'Laylat al-Qadr falls in the last ten nights, most likely on the odd nights.',
          'The Prophet ﷺ taught the dua: “Allahumma innaka ‘afuwwun tuhibbul ‘afwa fa‘fu ‘anni.”',
          'I‘tikaf is seclusion in the mosque for worship; it is a confirmed sunnah.',
          'Zakat al-fitr is due before Eid prayer, roughly a sa‘ of the local staple food per person.',
        ],
        practice: 'Plan the odd nights and one act of worship you will keep each night.',
      },
    ],
    quiz: [
      {
        q: 'What is fidya?',
        options: ['Making up a missed fast later', 'Feeding a poor person for a fast that cannot be made up', 'A voluntary fast', 'The pre-dawn meal'],
        answer: 1,
        explanation: 'Fidya applies where the fast can never be made up, such as chronic illness.',
      },
      {
        q: 'Which night is most likely to be Laylat al-Qadr?',
        options: ['The first night', 'The odd nights of the last ten', 'The night of Eid', 'The night of the 15th'],
        answer: 1,
        explanation: 'The Prophet ﷺ directed attention to the odd nights of the last ten.',
      },
      {
        q: 'When is zakat al-fitr due?',
        options: ['After Eid prayer', 'Before Eid prayer', 'At the start of Ramadan', 'After the last taraweeh'],
        answer: 1,
        explanation: 'It must reach the needy before the Eid prayer to fulfil the obligation.',
      },
    ],
  },
];

export const COURSE_NOTE =
  'These courses are introductory. Local scholars and qualified teachers remain essential, especially for rulings that affect your worship. Where schools differ, the lessons use the majority position and say so.';
