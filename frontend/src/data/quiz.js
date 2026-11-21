// Quiz question bank, shared by IslamicQuizScreen and the learning engine.
//
// Category question counts are derived from QUIZ_DATA rather than declared:
// the hard-coded totals had drifted to advertising 200 questions against a
// bank of 32.
//
// Each question carries an `explanation`. It is shown after answering and is
// also what the spaced-repetition deck teaches from, so a wrong answer leaves
// the user knowing *why* rather than just that they missed it.
import { COLORS } from '../theme';

export const CATEGORIES = [
  { id: 'quran', name: 'Quran', icon: 'book', color: COLORS.gold },
  { id: 'hadith', name: 'Hadith', icon: 'shield-checkmark', color: COLORS.emerald },
  { id: 'seerah', name: 'Seerah', icon: 'person', color: COLORS.blue },
  { id: 'prophets', name: 'Prophets', icon: 'people', color: COLORS.purple },
  { id: 'history', name: 'Islamic History', icon: 'library', color: COLORS.pink },
  { id: 'fiqh', name: 'Fiqh Basics', icon: 'school', color: COLORS.cyan },
];

export const QUIZ_DATA = {
  quran: [
    { q: 'How many surahs are in the Quran?', options: ['112', '114', '116', '120'], answer: 1, explanation: 'The Quran has 114 surahs, beginning with Al-Fatihah and ending with An-Nas.' },
    { q: 'Which surah is called the Heart of the Quran?', options: ['Al-Fatihah', 'Ya-Sin', 'Ar-Rahman', 'Al-Mulk'], answer: 1, explanation: 'Surah Ya-Sin is traditionally described as the heart of the Quran.' },
    { q: 'Which surah is recited in every rakah of salah?', options: ['Al-Ikhlas', 'Al-Falaq', 'Al-Fatihah', 'An-Nas'], answer: 2, explanation: 'Al-Fatihah is recited in every rakah; the Prophet ﷺ said there is no prayer without it.' },
    { q: 'What is the longest surah in the Quran?', options: ['Aal-e-Imran', 'Al-Baqarah', 'An-Nisa', 'Al-Maidah'], answer: 1, explanation: 'Al-Baqarah has 286 verses, the most of any surah.' },
    { q: 'What is the shortest surah in the Quran?', options: ['Al-Asr', 'Al-Kawthar', 'Al-Ikhlas', 'An-Nas'], answer: 1, explanation: 'Al-Kawthar has only three verses.' },
    { q: 'In which month was the Quran first revealed?', options: ['Muharram', 'Ramadan', 'Rajab', 'Shawwal'], answer: 1, explanation: 'Revelation began in Ramadan, on Laylat al-Qadr (Al-Baqarah 2:185).' },
    { q: 'Which verse is known as Ayat al-Kursi?', options: ['2:255', '2:286', '3:26', '112:1'], answer: 0, explanation: 'Al-Baqarah 2:255, described in hadith as the greatest verse in the Quran.' },
    { q: 'How many verses does Al-Fatihah have?', options: ['5', '6', '7', '8'], answer: 2, explanation: 'Seven verses — hence "the seven oft-repeated" (As-Sab al-Mathani).' },
    { q: 'Into how many juz is the Quran divided?', options: ['20', '30', '40', '60'], answer: 1, explanation: 'Thirty juz, which is why one juz a day completes the Quran in Ramadan.' },
    { q: 'Which surah does not begin with Bismillah?', options: ['At-Tawbah', 'Al-Anfal', 'Yunus', 'Hud'], answer: 0, explanation: 'Surah At-Tawbah is the only surah that opens without the Basmalah.' },
    { q: 'Which surah is named after a woman?', options: ['An-Nisa', 'Maryam', 'Al-Mujadila', 'An-Nur'], answer: 1, explanation: 'Surah Maryam is named after Maryam (AS), the mother of Isa (AS).' },
    { q: 'Which surah equals a third of the Quran in reward?', options: ['Al-Falaq', 'Al-Ikhlas', 'An-Nas', 'Al-Kafirun'], answer: 1, explanation: 'The Prophet ﷺ said Al-Ikhlas equals a third of the Quran, as it is purely about tawhid.' },
    { q: 'What are the last two surahs, recited for protection, called?', options: ['Al-Mufassal', 'Al-Muawwidhatayn', 'Al-Mathani', "Al-Ma'in"], answer: 1, explanation: 'Al-Falaq and An-Nas together are Al-Muawwidhatayn, "the two of refuge".' },
    { q: 'Surahs revealed before the Hijrah are called what?', options: ['Madani', 'Makki', 'Mufassal', 'Muhkam'], answer: 1, explanation: 'Makki surahs came before the migration to Madinah; Madani after it.' },
    { q: 'Which surah is recommended to recite on Friday?', options: ['Al-Kahf', 'Al-Mulk', 'Ya-Sin', 'Ar-Rahman'], answer: 0, explanation: 'Surah Al-Kahf on Friday is reported to give light between the two Fridays.' },
    { q: 'How many times is Ramadan named in the Quran?', options: ['Once', 'Three times', 'Seven times', 'Thirty times'], answer: 0, explanation: 'Ramadan is named explicitly only once, in Al-Baqarah 2:185.' },
    { q: 'Which surah is called "the Bride of the Quran"?', options: ['Ar-Rahman', 'Al-Waqiah', 'Al-Mulk', 'Ad-Duha'], answer: 0, explanation: 'Ar-Rahman, for its beauty and the refrain repeated through it.' },
    { q: 'Which phrase repeats 31 times in Surah Ar-Rahman?', options: ['Alhamdulillah', 'So which of the favours of your Lord will you deny?', 'Allahu Akbar', 'Indeed We created'], answer: 1, explanation: 'The refrain "Fabi ayyi ala i Rabbikuma tukadhdhiban" recurs 31 times.' },
    { q: 'Which angel brought revelation to the Prophet ﷺ?', options: ['Mikail', 'Israfil', 'Jibreel', 'Izrail'], answer: 2, explanation: 'Jibreel (AS), named in the Quran as Ruh al-Amin, the Trustworthy Spirit.' },
    { q: 'What was the first revealed word of the Quran?', options: ['Qul', 'Iqra', 'Bismillah', 'Alhamdulillah'], answer: 1, explanation: '"Iqra" — Read — the opening of Surah Al-Alaq, revealed in the Cave of Hira.' },
    { q: 'What is the practice of reciting with correct pronunciation called?', options: ['Tafsir', 'Tajweed', 'Tarteel', 'Tahajjud'], answer: 1, explanation: 'Tajweed is the science of pronouncing each letter from its correct point of articulation.' },
    { q: 'Which surah is known as Al-Munjiya, the saviour?', options: ['Al-Mulk', 'Al-Kahf', 'As-Sajdah', 'Al-Insan'], answer: 0, explanation: 'Surah Al-Mulk is reported to intercede for the one who recites it.' },
    { q: 'How many prostrations of recitation (sajdah tilawah) are in the Quran?', options: ['10', '12', '14 or 15', '20'], answer: 2, explanation: 'Scholars count 14 or 15 depending on the school, the difference being Surah Sad.' },
    { q: 'Which caliph ordered the Quran compiled into one standard copy?', options: ['Abu Bakr (RA)', 'Umar (RA)', 'Uthman (RA)', 'Ali (RA)'], answer: 2, explanation: 'Uthman (RA) standardised the written copies; Abu Bakr (RA) had first gathered them.' },
    { q: 'What is the explanation and commentary of the Quran called?', options: ['Tajweed', 'Tafsir', 'Fiqh', 'Seerah'], answer: 1, explanation: 'Tafsir is Quranic exegesis, such as Tafsir Ibn Kathir.' },
  ],

  hadith: [
    { q: 'Who said: "Actions are judged by intentions"?', options: ['Abu Bakr (RA)', 'Umar (RA)', 'Prophet Muhammad ﷺ', 'Ali (RA)'], answer: 2, explanation: 'The Prophet ﷺ — the first hadith in Sahih Bukhari, narrated by Umar (RA).' },
    { q: 'Which hadith collection is considered the most authentic?', options: ['Sahih Muslim', 'Sahih Bukhari', 'Abu Dawud', 'Tirmidhi'], answer: 1, explanation: 'Sahih Bukhari is regarded as the most authentic book after the Quran.' },
    { q: 'What are the six canonical collections called?', options: ['Kutub al-Sittah', 'Sahih al-Sittah', 'Al-Muwatta', 'Al-Musnad'], answer: 0, explanation: 'Kutub al-Sittah: Bukhari, Muslim, Abu Dawud, Tirmidhi, Ibn Majah and An-Nasa\'i.' },
    { q: 'What is the chain of narrators of a hadith called?', options: ['Matn', 'Isnad', 'Rawi', 'Sanad or Isnad'], answer: 3, explanation: 'The chain is the sanad (or isnad); the text itself is the matn.' },
    { q: 'A hadith with a complete, reliable chain is graded what?', options: ['Sahih', 'Hasan', "Da'if", 'Mawdu'], answer: 0, explanation: 'Sahih means authentic. Hasan is good, da\'if is weak, mawdu is fabricated.' },
    { q: 'What does a "mawdu" hadith mean?', options: ['Authentic', 'Good', 'Weak', 'Fabricated'], answer: 3, explanation: 'Mawdu means fabricated — such reports may not be attributed to the Prophet ﷺ.' },
    { q: 'Who compiled Al-Muwatta?', options: ['Imam Malik', 'Imam Ahmad', 'Imam Bukhari', 'Imam Muslim'], answer: 0, explanation: 'Imam Malik ibn Anas compiled Al-Muwatta, one of the earliest hadith collections.' },
    { q: 'A saying reported directly from Allah through the Prophet ﷺ is called?', options: ['Hadith Qudsi', 'Hadith Marfu', 'Hadith Mursal', 'Hadith Sahih'], answer: 0, explanation: 'Hadith Qudsi — divine in meaning, prophetic in wording, distinct from the Quran.' },
    { q: 'Which collection is arranged by narrator rather than by topic?', options: ['Sahih Muslim', 'Musnad Ahmad', 'Sunan Abu Dawud', 'Jami at-Tirmidhi'], answer: 1, explanation: 'Musnad Ahmad ibn Hanbal is organised by companion narrator.' },
    { q: 'The Prophet ﷺ said the best of you are those who learn and teach what?', options: ['Hadith', 'The Quran', 'Arabic', 'Fiqh'], answer: 1, explanation: '"The best of you are those who learn the Quran and teach it." (Bukhari)' },
    { q: 'What is the study of hadith narrator reliability called?', options: ['Ilm al-Rijal', 'Ilm al-Kalam', 'Usul al-Fiqh', 'Ilm al-Tajweed'], answer: 0, explanation: 'Ilm al-Rijal, the science of men — biographical evaluation of every narrator.' },
    { q: 'How many hadith are in Sahih Bukhari including repetitions?', options: ['About 2,000', 'About 7,500', 'About 20,000', 'About 50,000'], answer: 1, explanation: 'Roughly 7,500 with repetitions, drawn from a far larger body Bukhari examined.' },
    { q: 'What did the Prophet ﷺ describe as "half of faith"?', options: ['Prayer', 'Purity', 'Charity', 'Patience'], answer: 1, explanation: '"Purity is half of faith." (Sahih Muslim)' },
    { q: 'Which hadith collection is Jami at-Tirmidhi known for noting?', options: ['Only sahih reports', 'The grading of each hadith', 'Only Madinan reports', 'Only legal rulings'], answer: 1, explanation: 'At-Tirmidhi comments on the grade and the juristic opinions attached to each report.' },
    { q: 'The Prophet ﷺ said a Muslim is one from whose tongue and hands others are what?', options: ['Guided', 'Safe', 'Taught', 'Fed'], answer: 1, explanation: '"The Muslim is the one from whose tongue and hand people are safe." (Bukhari)' },
    { q: 'What is Forty Hadith by Imam an-Nawawi best known as?', options: ['A fiqh manual', 'A collection of foundational hadith', 'A tafsir', 'A seerah'], answer: 1, explanation: 'Forty-two concise hadith gathering the essentials of the religion.' },
    { q: 'A hadith reported by so many that collusion is impossible is called?', options: ['Ahad', 'Mutawatir', 'Gharib', 'Aziz'], answer: 1, explanation: 'Mutawatir — mass-transmitted, yielding certainty.' },
    { q: 'What does "hasan" mean as a hadith grade?', options: ['Authentic', 'Good', 'Weak', 'Rejected'], answer: 1, explanation: 'Hasan is good — sound but slightly below sahih in the strength of its chain.' },
    { q: 'The Prophet ﷺ said the deeds most beloved to Allah are those that are what?', options: ['Largest', 'Most consistent', 'Most public', 'Most difficult'], answer: 1, explanation: '"The most beloved deeds to Allah are the most consistent, even if small." (Bukhari)' },
    { q: 'Which two collections together are called "the two Sahihs"?', options: ['Bukhari and Muslim', 'Muslim and Tirmidhi', 'Bukhari and Abu Dawud', 'Malik and Ahmad'], answer: 0, explanation: 'Sahih Bukhari and Sahih Muslim — the Sahihayn.' },
  ],

  seerah: [
    { q: 'In which year was the Prophet ﷺ born?', options: ['560 CE', '570 CE', '580 CE', '590 CE'], answer: 1, explanation: 'Around 570 CE, the Year of the Elephant.' },
    { q: "What was the name of the Prophet's ﷺ mother?", options: ['Khadijah', 'Aminah', 'Halimah', 'Fatimah'], answer: 1, explanation: 'Aminah bint Wahb, who died when he was about six.' },
    { q: "Who was the Prophet's ﷺ first wife?", options: ['Aisha (RA)', 'Khadijah (RA)', 'Hafsah (RA)', 'Zaynab (RA)'], answer: 1, explanation: 'Khadijah bint Khuwaylid (RA), and the first person to accept Islam.' },
    { q: 'In which cave did the first revelation come?', options: ['Thawr', 'Hira', 'Uhud', 'Safa'], answer: 1, explanation: 'The Cave of Hira on Jabal an-Nur, near Makkah.' },
    { q: 'What is the migration to Madinah called?', options: ['Isra', 'Hijrah', 'Miraj', 'Fath'], answer: 1, explanation: 'The Hijrah in 622 CE, which begins the Islamic calendar.' },
    { q: 'Which battle was the first major one, in 624 CE?', options: ['Uhud', 'Badr', 'Khandaq', 'Hunayn'], answer: 1, explanation: 'Badr, won despite the Muslims being heavily outnumbered.' },
    { q: 'What was the Prophet\'s ﷺ title before prophethood?', options: ['Al-Amin', 'Al-Faruq', 'As-Siddiq', 'Al-Hakim'], answer: 0, explanation: 'Al-Amin, the Trustworthy — a name given by the Quraysh themselves.' },
    { q: 'Who accompanied the Prophet ﷺ in the cave during the Hijrah?', options: ['Umar (RA)', 'Abu Bakr (RA)', 'Ali (RA)', 'Uthman (RA)'], answer: 1, explanation: 'Abu Bakr (RA), in the Cave of Thawr, referred to in Surah At-Tawbah 9:40.' },
    { q: 'The night journey to Jerusalem and ascension is called?', options: ['Hijrah', 'Isra and Miraj', 'Fath Makkah', 'Bay\'ah'], answer: 1, explanation: 'Al-Isra to Jerusalem and Al-Miraj through the heavens, when salah was prescribed.' },
    { q: 'Which battle involved digging a trench around Madinah?', options: ['Badr', 'Uhud', 'Al-Khandaq', 'Tabuk'], answer: 2, explanation: 'Al-Khandaq, the Battle of the Trench, on Salman al-Farisi\'s suggestion.' },
    { q: 'In which year was Makkah conquered?', options: ['625 CE', '628 CE', '630 CE', '632 CE'], answer: 2, explanation: '630 CE — a near-bloodless conquest, after which the Prophet ﷺ forgave his enemies.' },
    { q: 'What was the peace treaty of 628 CE called?', options: ['Treaty of Madinah', 'Treaty of Hudaybiyyah', 'Treaty of Taif', 'Treaty of Najran'], answer: 1, explanation: 'Hudaybiyyah, which the Quran called a clear victory.' },
    { q: 'Which year is known as the Year of Sorrow?', options: ['615 CE', '619 CE', '622 CE', '625 CE'], answer: 1, explanation: '619 CE, when both Khadijah (RA) and Abu Talib died.' },
    { q: 'Who was the first muadhin of Islam?', options: ['Bilal (RA)', 'Zayd (RA)', 'Salman (RA)', 'Ammar (RA)'], answer: 0, explanation: 'Bilal ibn Rabah (RA), freed from slavery by Abu Bakr (RA).' },
    { q: 'Where did the Prophet ﷺ deliver the Farewell Sermon?', options: ['Makkah', 'Madinah', 'Arafat', 'Mina'], answer: 2, explanation: 'On the plain of Arafat during the Farewell Pilgrimage in 632 CE.' },
    { q: 'Who raised the Prophet ﷺ after his grandfather died?', options: ['Abu Talib', 'Abu Lahab', 'Hamza', 'Abbas'], answer: 0, explanation: 'His uncle Abu Talib, who protected him for decades.' },
    { q: 'What was the Prophet\'s ﷺ tribe?', options: ['Quraysh', 'Aws', 'Khazraj', 'Thaqif'], answer: 0, explanation: 'The Quraysh of Makkah, of the clan of Banu Hashim.' },
    { q: 'To which city did some early Muslims first migrate for safety?', options: ['Taif', 'Abyssinia', 'Yemen', 'Damascus'], answer: 1, explanation: 'Abyssinia (Habashah), under the just Christian king An-Najashi.' },
    { q: 'How old was the Prophet ﷺ when he received the first revelation?', options: ['30', '35', '40', '45'], answer: 2, explanation: 'Forty years old.' },
    { q: 'Where is the Prophet ﷺ buried?', options: ['Makkah', 'Madinah', 'Jerusalem', 'Taif'], answer: 1, explanation: 'In Madinah, in the chamber of Aisha (RA), now within Masjid an-Nabawi.' },
  ],

  prophets: [
    { q: 'Who was the first prophet?', options: ['Nuh (AS)', 'Adam (AS)', 'Ibrahim (AS)', 'Idris (AS)'], answer: 1, explanation: 'Adam (AS), the first human and the first prophet.' },
    { q: 'Which prophet built the Kaaba with his son?', options: ['Nuh (AS)', 'Ibrahim (AS)', 'Musa (AS)', 'Dawud (AS)'], answer: 1, explanation: 'Ibrahim (AS) with his son Ismail (AS).' },
    { q: 'How many prophets are named in the Quran?', options: ['20', '25', '30', '40'], answer: 1, explanation: 'Twenty-five are named, though many more were sent.' },
    { q: 'Which prophet was swallowed by a whale?', options: ['Yusuf (AS)', 'Yunus (AS)', 'Ayyub (AS)', 'Harun (AS)'], answer: 1, explanation: 'Yunus (AS), whose supplication in the darkness is in Surah Al-Anbiya.' },
    { q: 'Which prophet was given the Torah?', options: ['Isa (AS)', 'Musa (AS)', 'Dawud (AS)', 'Ibrahim (AS)'], answer: 1, explanation: 'Musa (AS) received the Tawrah.' },
    { q: 'Which prophet was given the Zabur (Psalms)?', options: ['Sulaiman (AS)', 'Dawud (AS)', 'Yahya (AS)', 'Ilyas (AS)'], answer: 1, explanation: 'Dawud (AS), who was also a just king.' },
    { q: 'Which prophet was given the Injeel?', options: ['Musa (AS)', 'Isa (AS)', 'Yahya (AS)', 'Zakariya (AS)'], answer: 1, explanation: 'Isa (AS) received the Injeel (Gospel).' },
    { q: 'Which prophet called his people for 950 years?', options: ['Hud (AS)', 'Nuh (AS)', 'Salih (AS)', 'Lut (AS)'], answer: 1, explanation: 'Nuh (AS), as stated in Surah Al-Ankabut 29:14.' },
    { q: 'Which prophet is known for extraordinary patience in illness?', options: ['Ayyub (AS)', 'Yaqub (AS)', 'Idris (AS)', 'Ishaq (AS)'], answer: 0, explanation: 'Ayyub (AS), who lost health, wealth and children yet never despaired.' },
    { q: 'Which prophet could understand the speech of birds and jinn?', options: ['Dawud (AS)', 'Sulaiman (AS)', 'Musa (AS)', 'Yusuf (AS)'], answer: 1, explanation: 'Sulaiman (AS), given a kingdom granted to no one after him.' },
    { q: 'Which prophet was thrown into a well by his brothers?', options: ['Yusuf (AS)', 'Yunus (AS)', 'Ismail (AS)', 'Ishaq (AS)'], answer: 0, explanation: 'Yusuf (AS), whose story is "the most beautiful of stories".' },
    { q: 'Which prophet was sent to the people of Ad?', options: ['Salih (AS)', 'Hud (AS)', "Shu'ayb (AS)", 'Lut (AS)'], answer: 1, explanation: 'Hud (AS) was sent to Ad, a people of great strength and building.' },
    { q: 'Which prophet was sent to Thamud with the she-camel as a sign?', options: ['Hud (AS)', 'Salih (AS)', 'Idris (AS)', 'Ilyas (AS)'], answer: 1, explanation: 'Salih (AS); the she-camel was a sign they were warned not to harm.' },
    { q: 'Which prophet was sent to Madyan, calling for honest trade?', options: ["Shu'ayb (AS)", 'Lut (AS)', 'Yunus (AS)', 'Alyasa (AS)'], answer: 0, explanation: "Shu'ayb (AS) warned Madyan against cheating in weights and measures." },
    { q: 'Who is the father of Yusuf (AS)?', options: ['Ishaq (AS)', 'Yaqub (AS)', 'Ibrahim (AS)', 'Ismail (AS)'], answer: 1, explanation: 'Yaqub (AS), also called Israel, father of the twelve tribes.' },
    { q: 'Which prophet is called Khalilullah, the friend of Allah?', options: ['Musa (AS)', 'Ibrahim (AS)', 'Nuh (AS)', 'Isa (AS)'], answer: 1, explanation: 'Ibrahim (AS) was taken by Allah as an intimate friend (An-Nisa 4:125).' },
    { q: 'Which prophet spoke directly with Allah, earning the title Kalimullah?', options: ['Ibrahim (AS)', 'Musa (AS)', 'Dawud (AS)', 'Adam (AS)'], answer: 1, explanation: 'Musa (AS) spoke with Allah at Mount Tur.' },
    { q: 'Who was the brother and helper of Musa (AS)?', options: ['Harun (AS)', 'Yusha', 'Yahya (AS)', 'Ilyas (AS)'], answer: 0, explanation: 'Harun (AS), granted prophethood to support his brother.' },
    { q: 'Which prophet was born without a father?', options: ['Adam (AS)', 'Isa (AS)', 'Yahya (AS)', 'Idris (AS)'], answer: 1, explanation: 'Isa (AS) was born to Maryam (AS) by the command of Allah.' },
    { q: 'Who is the final messenger?', options: ['Isa (AS)', 'Muhammad ﷺ', 'Musa (AS)', 'Ibrahim (AS)'], answer: 1, explanation: 'Muhammad ﷺ, the Seal of the Prophets (Al-Ahzab 33:40).' },
  ],

  history: [
    { q: 'Who was the first caliph after the Prophet ﷺ?', options: ['Umar (RA)', 'Abu Bakr (RA)', 'Uthman (RA)', 'Ali (RA)'], answer: 1, explanation: 'Abu Bakr as-Siddiq (RA), the first of the Rightly Guided Caliphs.' },
    { q: 'How many Rightly Guided Caliphs (Rashidun) were there?', options: ['3', '4', '5', '7'], answer: 1, explanation: 'Four: Abu Bakr, Umar, Uthman and Ali (RA).' },
    { q: 'Who established the Islamic (Hijri) calendar?', options: ['Abu Bakr (RA)', 'Umar (RA)', 'Uthman (RA)', 'Ali (RA)'], answer: 1, explanation: 'Umar ibn al-Khattab (RA), dating it from the Hijrah.' },
    { q: 'Which caliph was known as Al-Faruq?', options: ['Abu Bakr (RA)', 'Umar (RA)', 'Uthman (RA)', 'Ali (RA)'], answer: 1, explanation: 'Umar (RA) — the one who distinguishes truth from falsehood.' },
    { q: 'Which caliph was called Dhun-Nurayn, possessor of two lights?', options: ['Umar (RA)', 'Uthman (RA)', 'Ali (RA)', 'Abu Bakr (RA)'], answer: 1, explanation: 'Uthman (RA), who married two daughters of the Prophet ﷺ in turn.' },
    { q: 'Which dynasty followed the Rashidun caliphate?', options: ['Abbasid', 'Umayyad', 'Fatimid', 'Ottoman'], answer: 1, explanation: 'The Umayyads, with their capital at Damascus.' },
    { q: 'What was the capital of the Abbasid caliphate?', options: ['Damascus', 'Baghdad', 'Cairo', 'Cordoba'], answer: 1, explanation: 'Baghdad, founded in 762 CE and long a centre of learning.' },
    { q: 'Which scholar is considered the founder of algebra?', options: ['Ibn Sina', 'Al-Khwarizmi', 'Al-Biruni', 'Ibn Rushd'], answer: 1, explanation: 'Muhammad ibn Musa al-Khwarizmi; "algorithm" derives from his name.' },
    { q: 'Which Muslim scholar wrote The Canon of Medicine?', options: ['Ibn Sina', 'Al-Razi', 'Ibn al-Haytham', 'Al-Kindi'], answer: 0, explanation: 'Ibn Sina (Avicenna); it was a standard medical text in Europe for centuries.' },
    { q: 'Which scholar pioneered the study of optics?', options: ['Al-Farabi', 'Ibn al-Haytham', 'Ibn Khaldun', 'Al-Ghazali'], answer: 1, explanation: 'Ibn al-Haytham (Alhazen), an early advocate of experimental method.' },
    { q: 'Who wrote the Muqaddimah, an early work of social science?', options: ['Ibn Khaldun', 'Al-Tabari', 'Ibn Battuta', 'Al-Masudi'], answer: 0, explanation: 'Ibn Khaldun, often called a founder of sociology and historiography.' },
    { q: 'Which traveller journeyed for around 30 years across the Muslim world?', options: ['Ibn Battuta', 'Ibn Jubayr', 'Al-Idrisi', 'Ibn Fadlan'], answer: 0, explanation: 'Ibn Battuta of Tangier, whose Rihla records some 120,000 km of travel.' },
    { q: 'Which city was the centre of learning in Muslim Spain?', options: ['Granada', 'Cordoba', 'Seville', 'Toledo'], answer: 1, explanation: 'Cordoba, whose library and university drew scholars from across Europe.' },
    { q: 'Who led the recapture of Jerusalem in 1187 CE?', options: ['Nur ad-Din', 'Salahuddin Ayyubi', 'Baybars', 'Alp Arslan'], answer: 1, explanation: 'Salahuddin (Saladin), noted by opponents for his restraint and mercy.' },
    { q: 'Which empire ruled from Istanbul for over six centuries?', options: ['Safavid', 'Mughal', 'Ottoman', 'Abbasid'], answer: 2, explanation: 'The Ottoman Empire, which took Constantinople in 1453.' },
    { q: 'Which Muslim empire built the Taj Mahal?', options: ['Ottoman', 'Safavid', 'Mughal', 'Ayyubid'], answer: 2, explanation: 'The Mughals — built by Shah Jahan in Agra.' },
    { q: 'Al-Qarawiyyin, among the oldest universities, is in which country?', options: ['Egypt', 'Morocco', 'Tunisia', 'Syria'], answer: 1, explanation: 'Fez, Morocco, founded in 859 CE by Fatima al-Fihri.' },
    { q: 'Which battle in 636 CE opened Syria to the Muslims?', options: ['Yarmouk', 'Qadisiyyah', 'Nahavand', 'Siffin'], answer: 0, explanation: 'The Battle of Yarmouk against the Byzantines.' },
  ],

  fiqh: [
    { q: 'How many pillars does Islam have?', options: ['4', '5', '6', '7'], answer: 1, explanation: 'Five: shahadah, salah, zakat, sawm and hajj.' },
    { q: 'How many articles of faith (iman) are there?', options: ['5', '6', '7', '8'], answer: 1, explanation: 'Six: Allah, angels, books, messengers, the Last Day, and divine decree.' },
    { q: 'How many daily obligatory prayers are there?', options: ['3', '4', '5', '6'], answer: 2, explanation: 'Five: Fajr, Dhuhr, Asr, Maghrib and Isha.' },
    { q: 'What is the standard rate of zakat on wealth?', options: ['1%', '2.5%', '5%', '10%'], answer: 1, explanation: '2.5% of qualifying wealth held for a full lunar year.' },
    { q: 'What is the minimum wealth threshold for zakat called?', options: ['Nisab', 'Hawl', 'Ushr', 'Khums'], answer: 0, explanation: 'Nisab — below it, no zakat is due.' },
    { q: 'How many rakah are in Fajr prayer?', options: ['2', '3', '4', '5'], answer: 0, explanation: 'Two obligatory rakah, preceded by two highly recommended sunnah.' },
    { q: 'How many rakah are in Maghrib prayer?', options: ['2', '3', '4', '5'], answer: 1, explanation: 'Three obligatory rakah.' },
    { q: 'What is the ritual washing before prayer called?', options: ['Ghusl', 'Wudu', 'Tayammum', 'Istinja'], answer: 1, explanation: 'Wudu; ghusl is the full bath, tayammum the dry substitute.' },
    { q: 'What may be used for purification when no water is available?', options: ['Sand or clean earth', 'Oil', 'Cloth', 'Nothing'], answer: 0, explanation: 'Tayammum, using clean earth, is permitted when water is unavailable or harmful.' },
    { q: 'Which direction do Muslims face in prayer?', options: ['East', 'The Kaaba in Makkah', 'Jerusalem', 'North'], answer: 1, explanation: 'The qiblah — the Kaaba in Masjid al-Haram.' },
    { q: 'What breaks the fast during Ramadan?', options: ['Sleeping', 'Eating or drinking intentionally', 'Bathing', 'Brushing teeth'], answer: 1, explanation: 'Intentional eating, drinking or intimacy. Eating by genuine forgetfulness does not.' },
    { q: 'What is the pre-dawn meal before fasting called?', options: ['Iftar', 'Suhoor', 'Sahn', 'Tarawih'], answer: 1, explanation: 'Suhoor; iftar is the meal breaking the fast at sunset.' },
    { q: 'What is the charity given at the end of Ramadan called?', options: ['Zakat al-Mal', 'Zakat al-Fitr', 'Sadaqah', 'Khums'], answer: 1, explanation: 'Zakat al-Fitr, due before the Eid prayer.' },
    { q: 'How often is hajj obligatory for one who is able?', options: ['Every year', 'Once in a lifetime', 'Every five years', 'Twice'], answer: 1, explanation: 'Once in a lifetime, for those with the physical and financial means.' },
    { q: 'What is the state of ritual consecration for hajj called?', options: ['Ihram', 'Tawaf', 'Sai', 'Wuquf'], answer: 0, explanation: 'Ihram, entered at the designated miqat boundaries.' },
    { q: 'What is circling the Kaaba seven times called?', options: ['Sai', 'Tawaf', 'Wuquf', 'Ramy'], answer: 1, explanation: 'Tawaf. Sai is the walking between Safa and Marwah.' },
    { q: 'The night prayer in Ramadan is called?', options: ['Tahajjud', 'Tarawih', 'Witr', 'Duha'], answer: 1, explanation: 'Tarawih, prayed in congregation after Isha.' },
    { q: 'What are the primary sources of Islamic law?', options: ['Quran and Sunnah', 'Quran only', 'Ijma and Qiyas only', 'Custom'], answer: 0, explanation: 'The Quran and the Sunnah, with ijma (consensus) and qiyas (analogy) following.' },
    { q: 'How many major Sunni schools of jurisprudence are there?', options: ['2', '3', '4', '6'], answer: 2, explanation: 'Four: Hanafi, Maliki, Shafi\'i and Hanbali.' },
    { q: 'What is something permissible but disliked called?', options: ['Haram', 'Makruh', 'Mubah', 'Mustahabb'], answer: 1, explanation: 'Makruh — disliked but not sinful. Mustahabb is recommended.' },
  ],
};

/** Categories annotated with their real question count, empties dropped. */
export const QUIZ_CATEGORIES = CATEGORIES
  .map(c => ({ ...c, questions: (QUIZ_DATA[c.id] || []).length }))
  .filter(c => c.questions > 0);

/** Total across every category — used by the learning hub. */
export const TOTAL_QUESTIONS = Object.values(QUIZ_DATA).reduce((n, q) => n + q.length, 0);

export default QUIZ_DATA;
