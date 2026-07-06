// Shared Duas dataset + contextual recommendation engine.
// Used by DuasScreen (browse/favorite) and HomeScreen (today's contextual pick),
// and looked up by id in BookmarksScreen.

export const DUAS = [
  { id: 1, title: 'Morning Adhkar', arabic: 'اللّهُـمَّ بِكَ أَصْـبَحْنا وَبِكَ أَمْسَـينا، وَبِكَ نَحْـيا وَبِكَ نَمُـوتُ وَإِلَـيْكَ النُّـشُور', transliteration: 'Allahumma bika asbahna, wa bika amsayna, wa bika nahya, wa bika namutu wa ilayka-nushur.', translation: 'O Allah, by You we enter the morning and evening, by You we live and die, and to You is the Resurrection.', category: 'Morning', contexts: ['morning'], benefit: 'Recite every morning to begin the day with gratitude and surrender.' },
  { id: 2, title: 'Morning – Ayat al-Kursi', arabic: 'اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ', transliteration: "Allahu la ilaha illa Huwa, Al-Hayyul-Qayyum. La ta'khudhuhu sinatun wa la nawm.", translation: 'Allah — there is no deity except Him, the Ever-Living, the Self-Sustaining. Neither drowsiness overtakes Him nor sleep.', category: 'Morning', contexts: ['morning', 'protection'], benefit: 'Whoever recites Ayat al-Kursi in the morning will be under Allah\'s protection until evening. (Bukhari)' },
  { id: 3, title: 'Morning – Protection', arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ', transliteration: "A'udhu bi kalimati-llahi t-tammati min sharri ma khalaq.", translation: 'I seek refuge in the perfect words of Allah from the evil of what He has created.', category: 'Morning', contexts: ['morning', 'protection'], benefit: 'Recite 3 times every morning and evening for complete protection. (Muslim)' },
  { id: 4, title: 'Morning – Gratitude', arabic: 'اللَّهُمَّ مَا أَصْبَحَ بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ فَمِنْكَ وَحْدَكَ لَا شَرِيكَ لَكَ', transliteration: 'Allahumma ma asbaha bi min ni\'matin, aw bi-ahadin min khalqika, fa minka wahdaka la sharika lak.', translation: 'O Allah, whatever blessing I or any of Your creation have risen upon, it is from You alone, You have no partner.', category: 'Morning', contexts: ['morning', 'gratitude'], benefit: 'Fulfills the obligation of thanking Allah for all blessings. (Abu Dawud)' },
  { id: 5, title: 'Evening Adhkar', arabic: 'اللَّهُمَّ بِكَ أَمْسَيْنَا وَبِكَ أَصْبَحْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ', transliteration: 'Allahumma bika amsayna, wa bika asbahna, wa bika nahya, wa bika namutu, wa ilayka-l-masir.', translation: 'O Allah, by You we enter the evening and morning, by You we live and die, and to You is the final return.', category: 'Evening', contexts: ['evening'], benefit: 'Said by the Prophet (ﷺ) every evening.' },
  { id: 6, title: 'Evening – Forgiveness', arabic: 'أَسْتَغْفِرُ اللَّهَ الَّذِي لاَ إِلَهَ إِلاَّ هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ', transliteration: "Astaghfirullaha alladhi la ilaha illa Huwa, al-Hayyul-Qayyumu, wa atubu ilayh.", translation: 'I seek forgiveness from Allah, besides Whom none is worthy of worship, the Ever-Living, the Eternal, and I repent to Him.', category: 'Evening', contexts: ['evening', 'forgiveness'], benefit: 'Whoever says this once, their sins are forgiven even if they fled from battle. (Abu Dawud & Tirmidhi)' },
  { id: 7, title: 'Evening – Protection', arabic: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الأَرْضِ وَلَا فِي السَّمَاءِ', transliteration: "Bismillahi-lladhi la yadurru ma' ismihi shay'un fi-l-ardi wa la fi-s-sama'.", translation: 'In the name of Allah with Whose name nothing can harm on earth or in heaven.', category: 'Evening', contexts: ['evening', 'protection'], benefit: 'Recite 3 times each morning and evening. Nothing will harm you that day. (Abu Dawud)' },
  { id: 8, title: 'Dua for Traveling', arabic: 'اللَّهُ أَكْبَرُ اللَّهُ أَكْبَرُ اللَّهُ أَكْبَرُ سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا', transliteration: 'Allahu Akbar (x3). Subhana-lladhi sakhkhara lana hadha.', translation: 'Allah is Greatest (x3). Glory be to Him Who has subjugated this for us.', category: 'Travel', contexts: ['travel'], benefit: 'The Prophet (ﷺ) said this at the beginning of every journey. (Muslim)' },
  { id: 9, title: 'Returning from Travel', arabic: 'آيِبُونَ تَائِبُونَ عَابِدُونَ لِرَبِّنَا حَامِدُونَ', transliteration: "Ayibun, ta'ibun, 'abidun, li-rabbina hamidun.", translation: 'We are returning, repenting, worshipping, and praising our Lord.', category: 'Travel', contexts: ['travel'], benefit: 'Said by the Prophet (ﷺ) upon returning from a journey. (Bukhari)' },
  { id: 10, title: 'Before Sleeping', arabic: 'بِاسْمِكَ رَبِّ وَضَعْتُ جَنْبِي وَبِكَ أَرْفَعُهُ فَإِنْ أَمْسَكْتَ نَفْسِي فَارْحَمْهَا', transliteration: 'Bismika Rabbi wada\'tu janbi, wa bika arfa\'uhu, fa-in amsakta nafsi farhamha.', translation: 'In Your name, my Lord, I lay my side down, and in Your name I raise it. If You take my soul, have mercy on it.', category: 'Sleep', contexts: ['sleep', 'night'], benefit: 'Security and peace during sleep. (Bukhari & Muslim)' },
  { id: 11, title: 'Upon Waking Up', arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ', transliteration: "Al-hamdu lillahi-lladhi ahyana ba'da ma amatana wa ilayhi-n-nushur.", translation: 'Praise be to Allah who gave us life after causing us to die, and unto Him is the Resurrection.', category: 'Sleep', contexts: ['morning'], benefit: 'The first thing to say upon waking each morning. (Bukhari)' },
  { id: 12, title: 'Dua for Hardship', arabic: 'حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ', transliteration: 'Hasbiyallahu la ilaha illa Huwa, alayhi tawakkaltu.', translation: 'Allah is sufficient for me. There is no god but He. In Him I have placed my trust.', category: 'Hardship', contexts: ['hardship', 'anxiety'], benefit: 'Recited 7 times morning and evening, Allah will suffice any worry. (Abu Dawud)' },
  { id: 13, title: 'Dua of Prophet Yunus', arabic: 'لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ', transliteration: 'La ilaha illa Anta, Subhanaka, inni kuntu mina-z-zalimin.', translation: 'There is no deity but You; glory be to You. Indeed, I have been of the wrongdoers.', category: 'Hardship', contexts: ['hardship'], benefit: 'Any Muslim who calls upon Allah with this is answered. (Tirmidhi)' },
  { id: 14, title: 'Dua for Anxiety', arabic: 'اللَّهُمَّ إِنِّي عَبْدُكَ وَابْنُ عَبْدِكَ نَاصِيَتِي بِيَدِكَ', transliteration: "Allahumma inni 'abduka wa-bnu 'abdika, nasiyati bi-yadika.", translation: 'O Allah, I am Your servant, son of Your servant. My forelock is in Your hand, Your command over me is forever executed.', category: 'Hardship', contexts: ['anxiety', 'hardship'], benefit: 'Allah will replace the person\'s grief with joy. (Ahmad)' },
  { id: 15, title: 'Dua in Calamity', arabic: 'إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ اللَّهُمَّ أْجُرْنِي فِي مُصِيبَتِي', transliteration: "Inna lillahi wa inna ilayhi raji'un. Allahumma ajurni fi musibati.", translation: 'Verily, to Allah we belong and to Him we return. O Allah, reward me in this calamity.', category: 'Hardship', contexts: ['hardship'], benefit: 'Umm Salama (RA) said this when her husband died. (Muslim)' },

  // ─── Gratitude ──────────────────────────────────────────────────────────────
  { id: 16, title: 'Thanks for Good News', arabic: 'الْحَمْدُ لِلَّهِ الَّذِي بِنِعْمَتِهِ تَتِمُّ الصَّالِحَاتُ', transliteration: "Alhamdulillahi-lladhi bini'matihi tatimmus-salihat.", translation: 'Praise be to Allah, by whose grace good deeds are completed.', category: 'Gratitude', contexts: ['gratitude'], benefit: 'Said by the Prophet ﷺ upon hearing good news. (Ibn Majah)' },
  { id: 17, title: 'Praise in Every Circumstance', arabic: 'الْحَمْدُ لِلَّهِ عَلَى كُلِّ حَالٍ', transliteration: "Alhamdulillahi 'ala kulli hal.", translation: 'Praise be to Allah in every circumstance.', category: 'Gratitude', contexts: ['gratitude'], benefit: 'A short, powerful dhikr for any moment — good or hard. (Ibn Majah)' },

  // ─── Forgiveness (Istighfar) ──────────────────────────────────────────────────
  { id: 18, title: 'Sayyid al-Istighfar (Master of Seeking Forgiveness)', arabic: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ', transliteration: "Allahumma anta Rabbi la ilaha illa Anta, khalaqtani wa ana 'abduka, wa ana 'ala 'ahdika wa wa'dika mastata't.", translation: 'O Allah, You are my Lord, none has the right to be worshipped except You. You created me and I am Your servant, and I abide by Your covenant and promise as best I can.', category: 'Forgiveness', contexts: ['forgiveness', 'evening', 'morning'], benefit: 'Whoever says this during the day with certainty and dies that day enters Paradise — and likewise at night. (Bukhari 6306)' },
  { id: 19, title: 'Seeking Forgiveness & Repentance', arabic: 'رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ', transliteration: "Rabbighfir li wa tub 'alayya, innaka Antat-Tawwabur-Rahim.", translation: 'My Lord, forgive me and accept my repentance. Indeed, You are the Accepting of repentance, the Merciful.', category: 'Forgiveness', contexts: ['forgiveness'], benefit: "The Prophet ﷺ said this over 100 times a day. (Abu Dawud, Tirmidhi)" },

  // ─── Anxiety & Fear ───────────────────────────────────────────────────────────
  { id: 20, title: 'Dua Against Fear of Others', arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', transliteration: "Hasbunallahu wa ni'mal-wakil.", translation: 'Allah is sufficient for us, and He is the best Disposer of affairs.', category: 'Anxiety', contexts: ['anxiety', 'protection'], benefit: 'Said by the Prophets when facing overwhelming odds. (Surah Al-Imran 3:173)' },
  { id: 21, title: 'Refuge from Worry & Sorrow', arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ وَالْعَجْزِ وَالْكَسَلِ', transliteration: "Allahumma inni a'udhu bika minal-hammi wal-hazani, wal-'ajzi wal-kasali.", translation: 'O Allah, I seek refuge in You from worry and grief, from incapacity and laziness.', category: 'Anxiety', contexts: ['anxiety'], benefit: 'A comprehensive dua the Prophet ﷺ recited daily against mental distress. (Bukhari 6369)' },

  // ─── Exams & Knowledge ────────────────────────────────────────────────────────
  { id: 22, title: 'Increase Me in Knowledge', arabic: 'رَبِّ زِدْنِي عِلْمًا', transliteration: 'Rabbi zidni ilma.', translation: 'My Lord, increase me in knowledge.', category: 'Exams', contexts: ['exam', 'knowledge'], benefit: 'A short dua the Prophet ﷺ was commanded to say. (Surah Ta-Ha 20:114)' },
  { id: 23, title: 'Dua for Ease Before a Difficult Task', arabic: 'اللَّهُمَّ لَا سَهْلَ إِلَّا مَا جَعَلْتَهُ سَهْلًا وَأَنْتَ تَجْعَلُ الْحَزْنَ إِذَا شِئْتَ سَهْلًا', transliteration: "Allahumma la sahla illa ma ja'altahu sahla, wa anta taj'alul-hazna idha shi'ta sahla.", translation: 'O Allah, nothing is easy except what You make easy, and You make the difficult easy if You wish.', category: 'Exams', contexts: ['exam'], benefit: 'Perfect to recite before an exam, interview, or any daunting task. (Ibn Hibban)' },

  // ─── Protection ───────────────────────────────────────────────────────────────
  { id: 24, title: 'The Three Quls', arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ ۝ قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ قُلْ أَعُوذُ بِرَبِّ النَّاسِ', transliteration: "Qul huwa Allahu ahad — Qul a'udhu bi Rabbil-falaq — Qul a'udhu bi Rabbin-nas.", translation: 'Surahs Al-Ikhlas, Al-Falaq, and An-Nas — declaring Allah\'s oneness and seeking refuge from all harm.', category: 'Protection', contexts: ['protection', 'morning', 'evening', 'sleep'], benefit: 'Recite each 3 times morning, evening, and before sleep — the Prophet ﷺ did this daily. (Abu Dawud, Tirmidhi)' },
  { id: 25, title: 'Protection Upon Leaving Home', arabic: 'بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', transliteration: "Bismillahi tawakkaltu 'alallah, wa la hawla wa la quwwata illa billah.", translation: 'In the name of Allah, I place my trust in Allah, there is no might nor power except with Allah.', category: 'Protection', contexts: ['protection', 'travel'], benefit: 'Whoever says this upon leaving home is told: "You are guided, defended, and protected." (Abu Dawud, Tirmidhi)' },

  // ─── Sustenance (Rizq) ────────────────────────────────────────────────────────
  { id: 26, title: 'Dua for Lawful Sustenance', arabic: 'اللَّهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ', transliteration: "Allahumma-kfini bi-halalika 'an haramika, wa aghnini bifadlika 'amman siwak.", translation: 'O Allah, suffice me with what You have made lawful instead of what You have forbidden, and make me independent of all others besides You.', category: 'Sustenance', contexts: ['sustenance', 'rizq'], benefit: "A comprehensive dua for provision and independence from people. (Tirmidhi 3563)" },

  // ─── Illness & Healing ────────────────────────────────────────────────────────
  { id: 27, title: 'Dua for Healing', arabic: 'أَذْهِبِ الْبَاسَ رَبَّ النَّاسِ اشْفِ أَنْتَ الشَّافِي لَا شِفَاءَ إِلَّا شِفَاؤُكَ شِفَاءً لَا يُغَادِرُ سَقَمًا', transliteration: "Adhhibil-ba'sa Rabban-nasi, ishfi Antash-Shafi, la shifa'a illa shifa'uk, shifa'an la yughadiru saqama.", translation: 'Remove the harm, Lord of mankind, heal — You are the Healer. There is no healing but Your healing, a healing that leaves no illness behind.', category: 'Illness', contexts: ['illness'], benefit: 'The Prophet ﷺ said this while wiping his hand over the sick. (Bukhari 5743)' },

  // ─── Marriage & Family ────────────────────────────────────────────────────────
  { id: 28, title: 'Dua for Righteous Family', arabic: 'رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا', transliteration: "Rabbana hab lana min azwajina wa dhurriyyatina qurrata a'yunin waj'alna lil-muttaqina imama.", translation: 'Our Lord, grant us from among our spouses and offspring comfort to our eyes, and make us leaders for the righteous.', category: 'Family', contexts: ['family', 'marriage'], benefit: 'A beautiful dua for a blessed spouse, children, and household. (Surah Al-Furqan 25:74)' },

  // ─── Before Eating ────────────────────────────────────────────────────────────
  { id: 29, title: 'Forgotten Bismillah Before Eating', arabic: 'بِسْمِ اللَّهِ أَوَّلَهُ وَآخِرَهُ', transliteration: 'Bismillahi awwalahu wa akhirahu.', translation: 'In the name of Allah, at its beginning and its end.', category: 'Eating', contexts: ['eating'], benefit: 'Said when you remember to say Bismillah only after already starting to eat. (Abu Dawud, Tirmidhi)' },

  // ─── Special / Friday ────────────────────────────────────────────────────────
  { id: 30, title: 'Friday — Surah Al-Kahf Reminder', arabic: 'مَنْ قَرَأَ سُورَةَ الْكَهْفِ فِي يَوْمِ الْجُمُعَةِ أَضَاءَ لَهُ مِنَ النُّورِ مَا بَيْنَ الْجُمُعَتَيْنِ', transliteration: "Man qara'a Surata-l-Kahfi fi yawmi-l-Jumu'ati ada'a lahu minan-nuri ma bayna-l-Jumu'atayn.", translation: 'Whoever recites Surah Al-Kahf on Friday will have a light that shines for him between the two Fridays.', category: 'Special', contexts: ['friday'], benefit: 'Read Surah Al-Kahf today in the Quran module — it is Sunnah every Friday. (Al-Hakim, authenticated by Al-Albani)' },
];

export const CATEGORIES = ['Morning', 'Evening', 'Travel', 'Sleep', 'Hardship', 'Gratitude', 'Forgiveness', 'Anxiety', 'Exams', 'Protection', 'Sustenance', 'Illness', 'Family', 'Eating', 'Favorites'];

export const CAT_ICONS = {
  Morning: 'sunny-outline', Evening: 'partly-sunny-outline', Travel: 'airplane-outline',
  Sleep: 'moon-outline', Hardship: 'hourglass-outline', Gratitude: 'happy-outline',
  Forgiveness: 'refresh-circle-outline', Anxiety: 'pulse-outline', Exams: 'school-outline',
  Protection: 'shield-checkmark-outline', Sustenance: 'wallet-outline', Illness: 'medkit-outline',
  Family: 'people-outline', Eating: 'restaurant-outline', Special: 'star-outline', Favorites: 'heart-outline',
};

export const DUA_TITLES = DUAS.reduce((acc, d) => { acc[d.id] = d.title; return acc; }, {});

// ─── Contextual recommendation engine ────────────────────────────────────────
// Picks a relevant dua for "right now" based on time of day and day of week,
// rotating daily through matching duas so it isn't the same one every time.
export function getContextualDua({ date = new Date() } = {}) {
  const hour = date.getHours();
  const isFriday = date.getDay() === 5;
  const dayIndex = date.getDate();

  let contextTag, reason;
  if (isFriday && hour < 19) {
    contextTag = 'friday';
    reason = "It's Jumu'ah (Friday) — a Sunnah reminder for you";
  } else if (hour >= 4 && hour < 11) {
    contextTag = 'morning';
    reason = 'Good morning — start your day with remembrance';
  } else if (hour >= 11 && hour < 15) {
    contextTag = 'gratitude';
    reason = 'Midday — a moment to give thanks';
  } else if (hour >= 15 && hour < 18) {
    contextTag = 'protection';
    reason = 'Afternoon — seek Allah\'s protection for the rest of your day';
  } else if (hour >= 18 && hour < 20) {
    contextTag = 'evening';
    reason = 'Evening has arrived';
  } else if (hour >= 20 && hour < 23) {
    contextTag = 'forgiveness';
    reason = 'Night — a beautiful time for Istighfar';
  } else {
    contextTag = 'sleep';
    reason = 'Late night — a dua before you rest';
  }

  const matches = DUAS.filter(d => d.contexts?.includes(contextTag));
  const pool = matches.length ? matches : DUAS.filter(d => d.contexts?.includes('morning'));
  const dua = pool[dayIndex % pool.length];
  return { dua, reason };
}
