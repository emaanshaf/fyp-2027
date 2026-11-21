// The five pillars of Islam and the six articles of faith.
//
// This is a learning guide, not a fatwa service. Every claim carries the
// Qur'anic ayah or hadith it comes from, and the practical sections stick to
// what is agreed across the schools. Where schools differ (for example the
// exact nisab or the wording of the intention), the text says so rather than
// presenting one view as the only one.

export const PILLARS_INTRO = {
  hadithArabic:
    'بُنِيَ الإِسْلامُ عَلَى خَمْسٍ: شَهَادَةِ أَنْ لا إِلَهَ إِلا اللَّهُ وَأَنَّ مُحَمَّدًا رَسُولُ اللَّهِ، وَإِقَامِ الصَّلاةِ، وَإِيتَاءِ الزَّكَاةِ، وَالْحَجِّ، وَصَوْمِ رَمَضَانَ',
  hadithTranslation:
    'Islam is built upon five: the testimony that there is no god but Allah and that Muhammad is the Messenger of Allah, establishing prayer, giving zakat, the pilgrimage, and fasting Ramadan.',
  hadithSource: 'Sahih al-Bukhari 8 · Sahih Muslim 16',
  intro:
    'The pillars are the load-bearing acts of a Muslim life. They are not a checklist that earns salvation by itself — sincerity and sound belief run through all of them — but they are the structure the rest of the religion is built on.',
};

export const PILLARS = [
  {
    id: 'shahada',
    number: 1,
    name: 'Shahada',
    nameUr: 'شہادت',
    arabicName: 'الشَّهَادَة',
    tagline: 'The declaration of faith',
    taglineUr: 'ایمان کا اقرار',
    icon: 'mic-outline',
    accent: 'gold',
    summary:
      'To testify, with knowledge and sincerity, that nothing deserves worship except Allah and that Muhammad ﷺ is His final Messenger.',
    summaryUr:
      'یہ گواہی دینا کہ اللہ کے سوا کوئی عبادت کے لائق نہیں اور محمد ﷺ اللہ کے آخری رسول ہیں۔',
    arabic: 'لَا إِلٰهَ إِلَّا اللَّهُ، مُحَمَّدٌ رَسُولُ اللَّهِ',
    transliteration: 'La ilaha illa Allah, Muhammadun rasul Allah',
    translation:
      'There is no deity worthy of worship except Allah, and Muhammad is the Messenger of Allah.',
    what:
      'The first half negates every claim to divinity and the second affirms it for Allah alone. The second half binds the believer to the message brought by Muhammad ﷺ — accepting him as the final prophet and taking the Qur’an and his Sunnah as the explanation of how to worship Allah.',
    why:
      'Every other pillar rests on this one. Prayer, fasting, charity and pilgrimage are only acts of worship when they are offered to Allah alone. The Prophet ﷺ called it the key to Paradise, and the hadith of Jibril places it as the first level of the religion.',
    practice: [
      'Say it with understanding of what it affirms and what it denies, not as an empty formula.',
      'Learn its meaning and teach it to children before they are asked to pray.',
      'Renew it often; the Prophet ﷺ taught his companions to say it frequently.',
      'A new Muslim enters Islam by pronouncing it in front of witnesses — no ceremony or paperwork is required.',
    ],
    history:
      'The testimony was the first message of revelation in the cave of Hira. For thirteen years in Makkah, the Prophet ﷺ called people to it while the other pillars had not yet been legislated. The Makkan community understood exactly what it demanded: it was a public rejection of the idols their economy and status depended on. Bilal, Sumayyah and many others were tortured for saying it. When the Prophet ﷺ entered Makkah in 8 AH, the testimony was the condition placed before its people.',
    evidence: [
      { text: 'So know that there is no deity except Allah…', ref: 'Qur’an 47:19' },
      {
        text: '“Whoever testifies that there is no god but Allah and that Muhammad is the Messenger of Allah, Allah will forbid the Fire for him.”',
        ref: 'Sahih Muslim 32',
      },
      {
        text: '“Islam is built upon five…” — beginning with the Shahada.',
        ref: 'Sahih al-Bukhari 8',
      },
    ],
    misconceptions: [
      '“Once I say it, nothing else matters.” — The Prophet ﷺ said the testimony is a key, and every key has teeth; worship and obedience are its teeth.',
      '“It must be said in Arabic to count.” — Arabic is the agreed wording for formal testimony, but what is required is knowledge of and commitment to its meaning. New Muslims are taught it in Arabic with translation.',
    ],
  },
  {
    id: 'salah',
    number: 2,
    name: 'Salah',
    nameUr: 'نماز',
    arabicName: 'الصَّلاة',
    tagline: 'The five daily prayers',
    taglineUr: 'پانچ وقت کی نماز',
    icon: 'time-outline',
    accent: 'emerald',
    summary:
      'Five prescribed prayers each day, offered at fixed times, connecting the servant directly to Allah without an intermediary.',
    summaryUr:
      'دن میں پانچ مقررہ نمازیں، مقررہ اوقات میں، جو بندے کو بغیر کسی واسطے کے اللہ سے جوڑتی ہیں۔',
    arabic: 'إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا',
    transliteration: 'Inna as-salata kanat ‘ala al-mu’minina kitaban mawquta',
    translation:
      'Indeed, prayer has been decreed upon the believers at specified times.',
    what:
      'The five daily prayers are Fajr, Dhuhr, Asr, Maghrib and Isha. Their obligatory (fard) cycles are 2, 4, 4, 3 and 4. Each is offered in its own time window, preceded by wudu, facing the qiblah, with a valid intention. Friday replaces Dhuhr for men with the congregational Jumu‘ah prayer.',
    why:
      'Prayer is the first act a person will be questioned about on the Day of Judgement. It anchors the day around remembrance of Allah and is described as a protection from indecency and wrongdoing. The Prophet ﷺ said the difference between a man and disbelief is abandoning the prayer.',
    practice: [
      'Learn the times for your own location — the Prayer tab calculates them from your city.',
      'Pray on time where possible; combining prayers is for travel and specific hardship, not habit.',
      'Learn the pillars of the prayer: intention, standing, recitation, bowing, prostration, sitting and the final salutation.',
      'Use the Prayer Tracker to keep the habit, including the sunnah and witr prayers.',
      'For women, the prayer is paused during menstruation and post-natal bleeding; no make-up is required for those days.',
    ],
    history:
      'The command for the five prayers came during the Isra’ and Mi‘raj, the night journey and ascension, about ten years after the beginning of revelation. It was the only obligation revealed directly to the Prophet ﷺ in the heavens, and the hadith reports it was reduced from fifty to five out of mercy. In Makkah the prayers were short and performed quietly because the community was small and persecuted. After the Hijrah, the adhan, the direction towards the Ka‘bah and the detailed rules of congregational prayer were established.',
    evidence: [
      { text: 'Recite what has been revealed to you of the Book and establish prayer…', ref: 'Qur’an 29:45' },
      { text: '“The first matter that the slave will be brought to account for on the Day of Judgement is the prayer.”', ref: 'Sunan al-Tirmidhi 413' },
      { text: '“Five prayers Allah has made obligatory…”', ref: 'Sunan Ibn Majah 1401' },
    ],
    rakats: [
      { name: 'Fajr', arabic: 'الفجر', fard: 2, sunnah: 2, note: 'Two sunnah before the fard.' },
      { name: 'Dhuhr', arabic: 'الظهر', fard: 4, sunnah: 6, note: 'Four before, two after (optional two more after).' },
      { name: 'Asr', arabic: 'العصر', fard: 4, sunnah: 4, note: 'Four optional sunnah before the fard.' },
      { name: 'Maghrib', arabic: 'المغرب', fard: 3, sunnah: 2, note: 'Two sunnah after the fard.' },
      { name: 'Isha', arabic: 'العشاء', fard: 4, sunnah: 4, note: 'Two after, then witr.' },
    ],
    misconceptions: [
      '“I will pray when I am older or better.” — The command applies at puberty, and habit is built long before.',
      '“Prayer is valid only in a mosque.” — It is valid anywhere that is clean, except at certain prohibited times and places; the mosque carries a greater reward.',
    ],
  },
  {
    id: 'zakat',
    number: 3,
    name: 'Zakat',
    nameUr: 'زکوٰۃ',
    arabicName: 'الزَّكَاة',
    tagline: 'The obligatory alms',
    taglineUr: 'لازمی صدقہ',
    icon: 'wallet-outline',
    accent: 'cyan',
    summary:
      'An annual purification of wealth: 2.5% of qualifying savings held for a lunar year, distributed to eight categories of recipients.',
    summaryUr:
      'مال کی پاکیزگی: قمری سال تک محفوظ نصاب سے زائد مال کا ڈھائی فیصد، آٹھ مستحق گروہوں میں۔',
    arabic: 'وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ',
    transliteration: 'Wa aqimu as-salata wa atu az-zakata',
    translation: 'And establish prayer and give zakat.',
    what:
      'Zakat is a fixed share of wealth that Allah has appointed for those in need. It becomes due when a Muslim’s qualifying wealth reaches the nisab and one lunar year passes. The rate is 2.5% (one fortieth) on cash, gold, silver, investments and trade goods. It is not a tax on income; it is a charge on wealth that is kept. Zakat al-fitr, paid at the end of Ramadan, is a separate obligation.',
    why:
      'Zakat is described in the Qur’an alongside prayer more than twenty times. It frees the heart from the love of wealth, circulates money to those who need it, and creates a community where the poor have a recognised right rather than depending on charity. It is not a favour to the recipient; it is the recipient’s right.',
    practice: [
      'Work out your zakatable wealth on a fixed lunar date each year — cash, savings, gold, silver, shares and business stock.',
      'Deduct immediate debts and the next month’s essential expenses.',
      'Compare the total to the nisab. The nisab is the value of 87.48 grams of gold or 612.36 grams of silver; many scholars prefer silver so that more people qualify to pay.',
      'Pay 2.5% of the wealth above the nisab to one or more of the eight categories.',
      'Use the Zakat calculator in the app under Zakat & Ushr for the arithmetic.',
      'Do not pay zakat to a person you know is in need but who is a descendent or ancestor of yours; those categories are excluded.',
    ],
    history:
      'Zakat was legislated in Madinah in the second year after the Hijrah, alongside the fast of Ramadan. The Prophet ﷺ sent collectors to gather it and distressed the community against withholding it. During the caliphate of Abu Bakr, some tribes refused to pay it after the Prophet’s death; he held the position that prayer and zakat could not be separated and sent armies over the issue. Umar ibn al-Khattab later organised the collection through a public treasury (bayt al-mal). The eight categories of recipients are named in Qur’an 9:60.',
    evidence: [
      { text: 'Zakat expenditures are only for the poor, the needy, those employed to collect it…', ref: 'Qur’an 9:60' },
      { text: '“Take from their wealth a charity by which you purify them and cause them increase…”', ref: 'Qur’an 9:103' },
      { text: '“Islam is built upon five…” — and giving zakat is one of them.', ref: 'Sahih al-Bukhari 8' },
    ],
    misconceptions: [
      '“Zakat is 2.5% of my salary.” — It is 2.5% of wealth held for a lunar year, not of income as it arrives. Many people pay on salary for convenience, but the ruling is about the year-end balance.',
      '“I can decide freely who gets it.” — The Qur’an names eight categories. A gift to a mosque or a general charity does not replace zakat unless the charity distributes it on your behalf to eligible people.',
    ],
  },
  {
    id: 'sawm',
    number: 4,
    name: 'Sawm',
    nameUr: 'روزہ',
    arabicName: 'الصَّوْم',
    tagline: 'Fasting the month of Ramadan',
    taglineUr: 'رمضان کے روزے',
    icon: 'moon-outline',
    accent: 'purple',
    summary:
      'Complete abstention from food, drink and intimacy from dawn to sunset throughout the ninth month of the Islamic calendar.',
    summaryUr:
      'رمضان المبارک میں صبح صادق سے غروب آفتاب تک کھانے، پینے اور ازدواجی تعلق سے مکمل پرہیز۔',
    arabic: 'يَا أَيُّهَا الَّذِينَ آمَنُوا كُتِبَ عَلَيْكُمُ الصِّيَامُ كَمَا كُتِبَ عَلَى الَّذِينَ مِن قَبْلِكُمْ لَعَلَّكُمْ تَتَّقُونَ',
    transliteration: 'Ya ayyuha alladhina amanu kutiba ‘alaykum as-siyamu kama kutiba ‘ala alladhina min qablikum la‘allakum tattaqun',
    translation:
      'O you who have believed, decreed upon you is fasting as it was decreed upon those before you, that you may become righteous.',
    what:
      'Fasting Ramadan is obligatory for every adult, sane, able Muslim. From the beginning of Fajr until Maghrib, food, drink, smoking and marital intimacy are prohibited. The meal before dawn is suhoor; the meal at sunset is iftar. Tarawih prayers are offered at night and the whole Qur’an is traditionally completed across the month. Laylat al-Qadr, the Night of Decree, falls in the last ten nights.',
    why:
      'The verse names the goal directly: taqwa — God-consciousness. Fasting is a private act; no one but Allah knows whether the fasting person truly abstained. It trains self-control, breaks the grip of habit and makes the hunger of the poor tangible. The Prophet ﷺ said whoever fasts Ramadan with faith and hope for reward has previous sins forgiven.',
    practice: [
      'Make the intention each night before Fajr; the intention is an act of the heart, not a spoken phrase that is required.',
      'Eat suhoor — there is blessing in it — and delay it until close to Fajr.',
      'Break the fast promptly at Maghrib with dates and water, then pray.',
      'Guard the tongue, eyes and temper. The Prophet ﷺ said if someone abuses you, say: “I am fasting.”',
      'Those who are ill or travelling may break the fast and make up the days later. Pregnant and nursing women, the elderly and the chronically ill follow the rulings of their situation; consult a qualified scholar for your case.',
      'Fidya (feeding a person for each missed day) applies where fasting can never be made up; kaffara applies to deliberate intimacy during a fast without a valid excuse.',
    ],
    history:
      'Fasting was made obligatory in the second year after the Hijrah, in the month of Sha‘ban, shortly before Ramadan. The Prophet ﷺ fasted Ramadan for nine years in his lifetime. The farewell Ramadan saw the Qur’anic revelation completed and the Prophet ﷺ near the end of his life. Ramadan drove the rhythm of the early community: the Muslims fought the Battle of Badr in Ramadan, and the conquest of Makkah took place in Ramadan in 8 AH. The fast was always Ramadan only; the widespread confusion with the Prophet’s optional Monday and Thursday fasts is a later misunderstanding.',
    evidence: [
      { text: 'The month of Ramadan is that in which was revealed the Qur’an, a guidance for the people…', ref: 'Qur’an 2:185' },
      { text: '“Whoever fasts Ramadan out of faith and hope for reward, his previous sins will be forgiven.”', ref: 'Sahih al-Bukhari 38' },
      { text: '“Eat suhoor, for in suhoor there is blessing.”', ref: 'Sahih Muslim 1095' },
    ],
    misconceptions: [
      '“Ramadan is about hunger only.” — The Prophet ﷺ warned that a person may gain nothing from a fast except hunger: the tongue and conduct are part of the fast.',
      '“If I miss a fast I can just pay money instead.” — For a temporary excuse such as illness or travel, making up the day is required; payment is only for cases where the fast can never be made up.',
    ],
  },
  {
    id: 'hajj',
    number: 5,
    name: 'Hajj',
    nameUr: 'حج',
    arabicName: 'الْحَج',
    tagline: 'The pilgrimage to Makkah',
    taglineUr: 'مکہ مکرمہ کا سفر',
    icon: 'airplane-outline',
    accent: 'amber',
    summary:
      'A once-in-a-lifetime pilgrimage to the House of Allah during the appointed days, for every Muslim who is physically and financially able.',
    summaryUr:
      'اللہ کے گھر کی زیارت، مقررہ دنوں میں، ہر ایسے مسلمان پر زندگی میں ایک بار جو جسمانی اور مالی طور پر سامان رکھتا ہو۔',
    arabic: 'وَلِلَّهِ عَلَى النَّاسِ حِجُّ الْبَيْتِ مَنِ اسْتَطَاعَ إِلَيْهِ سَبِيلًا',
    transliteration: 'Wa lillahi ‘ala an-nasi hijju al-bayti man istata‘a ilayhi sabila',
    translation:
      'And pilgrimage to the House is a duty owed to Allah by all people who are able to undertake the journey.',
    what:
      'Hajj is performed from 8 to 13 Dhul Hijjah, in and around Makkah. Its essential acts are the ihram, standing at Arafah, the tawaf of the Ka‘bah, walking between Safa and Marwah, and shaving or trimming the hair. A pilgrimage that omits the standing at Arafah has not happened. Umrah is a shorter visit that can be made at any time of year.',
    why:
      'Hajj makes the unity of the ummah visible: one cloth, one circuit, one call, no rank or nationality. It is a rehearsal of the Day of Judgement. The Prophet ﷺ said a righteous Hajj has no reward except Paradise. The journey also connects the pilgrim to the footsteps of Ibrahim, Hajar and Ismail, and to the farewell sermon of the Prophet ﷺ.',
    practice: [
      'Verify your ability: settle debts, seek forgiveness, arrange care for dependents, and make a valid will.',
      'Learn the rites before you travel; the crowd is not the place to read instructions for the first time.',
      'Enter ihram at the prescribed miqat and keep its prohibitions — no perfume, no cutting hair or nails, no intimacy, no hunting.',
      'Stand at Arafah in supplication from midday until sunset; this is the heart of Hajj.',
      'Perform the rites in order: rami, sacrifice, shaving, tawaf al-ifadah, and sa‘i.',
      'Choose an authorised package; access to Mina and Arafah is regulated for safety.',
      'The Hajj Guide in this app has a day-by-day checklist, duas and common mistakes.',
    ],
    history:
      'The Ka‘bah was built by Ibrahim and Ismail as the first house of worship for Allah. Hajj was corrupted over centuries by polytheism and naked circuits of the House. In 9 AH the Prophet ﷺ sent Abu Bakr to lead the pilgrimage and Ali to announce the end of treaties with the polytheists. In 10 AH the Prophet ﷺ performed his only Hajj with over one hundred thousand companions, delivered the farewell sermon at Arafah and revealed: “This day I have perfected for you your religion.” He died a few months later, making that pilgrimage the model every Hajj since has followed.',
    evidence: [
      { text: 'And complete the Hajj and Umrah for Allah…', ref: 'Qur’an 2:196' },
      { text: '“Whoever performs Hajj and does not commit sin or obscenity returns as on the day his mother bore him.”', ref: 'Sahih al-Bukhari 1521' },
      { text: '“Islam is built upon five…” — and Hajj to the House is one of them.', ref: 'Sahih al-Bukhari 8' },
    ],
    misconceptions: [
      '“A pilgrimage to a saint’s grave earns the reward of Hajj.” — No visit replaces the obligation; only the Hajj to the Ka‘bah in its appointed days does.',
      '“Hajj can be delayed indefinitely because I am young.” — It is due as soon as the conditions are met; delaying without excuse is not harmless.',
    ],
  },
];

export const ARTICLES = [
  {
    id: 'allah',
    name: 'Belief in Allah',
    nameUr: 'اللہ پر ایمان',
    arabicName: 'الإيمان بالله',
    icon: 'sunny-outline',
    accent: 'gold',
    summary: 'That Allah is One, unique, self-sufficient, and alone deserves worship.',
    detail:
      'Tawhid is the belief that Allah is one in His essence, attributes and actions. Nothing resembles Him, nothing shares His authority, and no created thing may be worshipped alongside Him. The Qur’an calls this the foundation of every prophet’s message. It is not merely a belief that a creator exists; it is the refusal to direct worship — supplication, sacrifice, fear, hope, love at the level of worship — to anything besides Him.',
    evidence: [
      { text: 'Say: He is Allah, the One; Allah, the Eternal Refuge…', ref: 'Qur’an 112:1–4' },
      { text: 'There is nothing like unto Him, and He is the Hearing, the Seeing.', ref: 'Qur’an 42:11' },
      { text: '“I did not create the jinn and mankind except to worship Me.”', ref: 'Qur’an 51:56' },
    ],
  },
  {
    id: 'angels',
    name: 'Belief in the Angels',
    nameUr: 'فرشتوں پر ایمان',
    arabicName: 'الإيمان بالملائكة',
    icon: 'sparkles-outline',
    accent: 'cyan',
    summary: 'Created from light, they carry out Allah’s commands with no free will.',
    detail:
      'Angels are a separate creation, made from light, without the desires or free choice of humans. They do not disobey Allah and do exactly what they are commanded. Jibril conveyed revelation to the prophets; Mika’il is charged with rain and provision; Israfil will sound the horn; the recording angels write each deed. Belief in them includes that they are honoured servants of Allah, not objects of worship.',
    evidence: [
      { text: 'They do not disobey Allah in what He commands them, and they do exactly what they are commanded.', ref: 'Qur’an 66:6' },
      { text: 'The Messenger believes in what has been sent down to him, and so do the believers — each believes in Allah, His angels, His books and His messengers.', ref: 'Qur’an 2:285' },
      { text: '“The angels were created from light, the jinn from a smokeless flame, and Adam from what is described to you.”', ref: 'Sahih Muslim 2996' },
    ],
  },
  {
    id: 'books',
    name: 'Belief in the Books',
    nameUr: 'کتابوں پر ایمان',
    arabicName: 'الإيمان بالكتب',
    icon: 'book-outline',
    accent: 'amber',
    summary: 'Allah sent guidance through His prophets, and the Qur’an is the final preserved Book.',
    detail:
      'Allah revealed books to messengers to guide humanity: the Zabur of Dawud, the Tawrah of Musa, the Injil of Isa, and the Qur’an given to Muhammad ﷺ. The earlier books were changed over time. The Qur’an is preserved in its original Arabic, memorised in full by generations of huffaz, and Allah has guaranteed its protection. Belief in the earlier books means honouring what was originally revealed, while the Qur’an is the final authority.',
    evidence: [
      { text: 'Indeed, it is We who sent down the Qur’an and indeed, We will be its guardian.', ref: 'Qur’an 15:9' },
      { text: 'And We have sent down to you the Book in truth, confirming what was before it and a guardian over it…', ref: 'Qur’an 5:48' },
      { text: '“Whoever believes in Allah, His angels, His books, His messengers, the Last Day and the divine decree…”', ref: 'Sahih Muslim 8 (the hadith of Jibril)' },
    ],
  },
  {
    id: 'messengers',
    name: 'Belief in the Messengers',
    nameUr: 'رسولوں پر ایمان',
    arabicName: 'الإيمان بالرسل',
    icon: 'people-outline',
    accent: 'emerald',
    summary: 'Allah sent chosen humans to convey His message, ending with Muhammad ﷺ.',
    detail:
      'The messengers were humans chosen to receive revelation and deliver it to their people. The Qur’an names twenty-five of them, including Adam, Nuh, Ibrahim, Musa, Isa and Muhammad ﷺ. They were truthful, trustworthy and sinless in their mission. They did not share in divine authority or deserve worship. Muhammad ﷺ is the final prophet; there is no prophet after him.',
    evidence: [
      { text: 'Muhammad is not the father of any of your men, but the Messenger of Allah and the seal of the prophets…', ref: 'Qur’an 33:40' },
      { text: 'And We certainly sent into every nation a messenger, saying: “Worship Allah and avoid false deities.”', ref: 'Qur’an 16:36' },
      { text: '“I am the last of the prophets; there is no prophet after me.”', ref: 'Sunan al-Tirmidhi 2212' },
    ],
  },
  {
    id: 'last-day',
    name: 'Belief in the Last Day',
    nameUr: 'آخرت پر ایمان',
    arabicName: 'الإيمان باليوم الآخر',
    icon: 'hourglass-outline',
    accent: 'purple',
    summary: 'Every life ends, every soul is raised, and every deed is justly accounted for.',
    detail:
      'The Last Day begins with the end of this world and the resurrection of every soul. People will stand before Allah, deeds will be weighed, and the record written by the angels will be examined. The righteous will enter Paradise and those who rejected the truth after it reached them will face the Fire. Belief in the Hereafter gives life its moral direction: pleasure is not the measure of a good life, and injustice does not escape reckoning.',
    evidence: [
      { text: 'And the weighing that Day is true. As for those whose scales are heavy — it is they who are the successful.', ref: 'Qur’an 23:102' },
      { text: 'And indeed, to Allah is the final return.', ref: 'Qur’an 24:42' },
      { text: '“Remember the destroyer of pleasures — death.”', ref: 'Sunan al-Tirmidhi 2307' },
    ],
  },
  {
    id: 'qadar',
    name: 'Belief in Divine Decree',
    nameUr: 'تقدیر پر ایمان',
    arabicName: 'الإيمان بالقدر',
    icon: 'compass-outline',
    accent: 'pink',
    summary: 'Everything happens within Allah’s knowledge and decree, and humans are still accountable.',
    detail:
      'Allah’s knowledge and decree encompass everything that has happened and will happen. Nothing surprises Him and nothing occurs outside His will. This does not erase human responsibility: we choose within the decree, earnestly seek what is good, and are rewarded or held to account for choices we truly made. The Prophet ﷺ taught four things: belief in Allah, His angels, His books, His messengers, the Last Day and divine decree. Believers are taught to work, pray and then entrust the result to Allah.',
    evidence: [
      { text: 'Indeed, We have created everything according to a decree.', ref: 'Qur’an 54:49' },
      { text: 'What the Messenger has come to you with, take it; and what he forbids you, abstain from it.', ref: 'Qur’an 59:7' },
      { text: '“Hold fast to what benefits you and seek Allah’s help; do not be helpless.”', ref: 'Sahih Muslim 2664' },
    ],
  },
];

export const PILLAR_TIMELINE = [
  {
    year: '610 CE',
    hijri: 'Before Hijrah',
    title: 'The call begins',
    text: 'The first revelation comes in the cave of Hira. The Shahada is the first obligation; prayer is practised in a short, secret form while the community is small.',
  },
  {
    year: '622 CE',
    hijri: '1 AH',
    title: 'The Hijrah',
    text: 'The Prophet ﷺ and the Muslims migrate to Madinah. A community with a mosque, a constitution and public worship begins to take shape.',
  },
  {
    year: '623–624 CE',
    hijri: '2 AH',
    title: 'Fasting and zakat legislated',
    text: 'Ramadan fasting and zakat become obligatory. The qiblah turns from Jerusalem to the Ka‘bah in the same period.',
  },
  {
    year: '630 CE',
    hijri: '9 AH',
    title: 'Hajj is announced',
    text: 'Hajj is made obligatory. Abu Bakr is sent to lead the pilgrimage and Ali announces the end of treaties with the polytheists.',
  },
  {
    year: '632 CE',
    hijri: '10 AH',
    title: 'The farewell Hajj',
    text: 'The Prophet ﷺ performs his only Hajj with more than one hundred thousand companions and delivers the farewell sermon at Arafah.',
  },
];

export const FIVE_PILLARS_NOTE =
  'The five pillars are acts of worship; the six articles of faith are beliefs. Islam is not one or the other — the Qur’an repeatedly joins right belief to right action. The app follows the majority position that both are essential and that a person’s salvation rests on Allah’s mercy, not on the arithmetic of good deeds.';
