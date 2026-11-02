// Hajj and Umrah guide.
//
// The order of rites follows the majority position and the description of the
// Prophet's farewell Hajj. Where a detail differs by school or by package
// operator, the text says so instead of pretending there is one universal
// timetable. Nothing here replaces learning from a qualified teacher before
// travelling.

export const HAJJ_INTRO = {
  title: 'Hajj & Umrah',
  titleUr: 'حج و عمرہ',
  arabic: 'وَلِلَّهِ عَلَى النَّاسِ حِجُّ الْبَيْتِ مَنِ اسْتَطَاعَ إِلَيْهِ سَبِيلًا',
  translation:
    'And pilgrimage to the House is a duty owed to Allah by all people who are able to undertake the journey.',
  source: 'Qur’an 3:97',
  intro:
    'Hajj is performed once in a lifetime by every Muslim who is able. It is a journey of obedience, not a holiday: the pilgrim leaves behind comfort, status and habit, and returns with a clean record if Allah accepts it.',
};

export const HAJJ_TYPES = [
  {
    id: 'tamattu',
    name: 'Tamattu‘',
    arabic: 'التَّمَتُّع',
    summary:
      'Enter ihram for Umrah during the Hajj months, complete Umrah, leave ihram, then enter ihram again for Hajj on 8 Dhul Hijjah.',
    detail:
      'Most pilgrims from outside Saudi Arabia choose this because it allows a break between Umrah and Hajj. A sacrifice (hady) is required; if you cannot afford one, fast three days during Hajj and seven after returning home.',
    bestFor: 'Pilgrims arriving before Hajj with time to perform Umrah first.',
  },
  {
    id: 'qiran',
    name: 'Qiran',
    arabic: 'القِرَان',
    summary:
      'Enter ihram for Hajj and Umrah together, remaining in ihram until the Day of Sacrifice.',
    detail:
      'The rites of Umrah are folded into Hajj. A sacrifice is required, and the prohibitions of ihram continue until the rami and shaving on 10 Dhul Hijjah.',
    bestFor: 'Pilgrims who arrive close to Hajj or travel with a group that performs both together.',
  },
  {
    id: 'ifrad',
    name: 'Ifrad',
    arabic: 'الإِفْرَاد',
    summary:
      'Enter ihram for Hajj alone and remain in ihram until the rites of Hajj are complete.',
    detail:
      'No sacrifice is required, although one may be offered voluntarily. The pilgrim performs tawaf and sa‘i once for Hajj.',
    bestFor: 'Residents of Makkah and pilgrims who intend Hajj only.',
  },
];

export const HAJJ_DAYS = [
  {
    id: 'day8',
    day: '8 Dhul Hijjah',
    title: 'Yawm al-Tarwiyah — the day of quenching',
    summary:
      'Enter ihram, travel to Mina, and spend the day in prayer and rest.',
    steps: [
      'Perform ghusl if possible, wear ihram, and make the intention for Hajj. Those already in ihram from Umrah simply remain in it.',
      'Recite the talbiyah aloud on the way: Labbayk Allahumma labbayk…',
      'Travel to Mina. Pray Dhuhr, Asr, Maghrib, Isha and the next Fajr there, each at its own time and shortened (Dhuhr, Asr and Isha to two rakats) but not combined.',
      'Eat, drink, rest and prepare for Arafah. This is a day of quiet preparation, not sightseeing.',
    ],
    tip: 'Keep your passport, phone and medication with you. Mina accommodation is crowded and bags are easily misplaced.',
  },
  {
    id: 'day9',
    day: '9 Dhul Hijjah',
    title: 'Yawm Arafah — the standing',
    summary:
      'The essential day of Hajj. Stand at Arafah in supplication from midday until sunset, then travel to Muzdalifah.',
    steps: [
      'After Fajr in Mina, remain in remembrance until sunrise, then travel to Arafah reciting the talbiyah.',
      'At Arafah, Dhuhr and Asr are combined and shortened at the time of Dhuhr. The rest of the day is for dua, Qur’an and repentance.',
      'Stand anywhere within the boundaries of Arafah — not on the mountain itself, which is not required. Face the qiblah and ask for both worlds.',
      'Remain until sunset. Leaving before sunset without a valid reason is a serious error and may require a sacrifice.',
      'After sunset, travel to Muzdalifah without praying Maghrib on the way. At Muzdalifah, pray Maghrib and Isha together.',
      'Sleep under the open sky or in the designated areas. Collect seven small pebbles for tomorrow (or collect them in Mina).',
    ],
    tip: 'The Prophet ﷺ said: “Hajj is Arafah.” Everything before it is preparation; this is the day that cannot be replaced.',
  },
  {
    id: 'day10',
    day: '10 Dhul Hijjah',
    title: 'Yawm al-Nahr — the day of sacrifice',
    summary:
      'The busiest day: stone the large jamrah, sacrifice, shave or trim, then perform tawaf al-ifadah and sa‘i.',
    steps: [
      'After Fajr in Muzdalifah, proceed to Mina before sunrise.',
      'Stone Jamarat al-Aqabah (the large one) with seven pebbles, saying “Allahu akbar” with each throw. Stop the talbiyah when you begin.',
      'Offer the sacrifice (hady) if you are performing Tamattu‘ or Qiran. It may be done through an authorised agent.',
      'Shave the head (men) or trim a fingertip’s length (women). This ends most ihram restrictions; intimacy remains prohibited until tawaf al-ifadah.',
      'Perform tawaf al-ifadah (the obligatory tawaf), then sa‘i for Hajj if you are doing Tamattu‘ or Ifrad. Qiran performs one tawaf and one sa‘i for both.',
      'Return to Mina to spend the night. Change into normal clothes and eat; the difficult part is over.',
    ],
    tip: 'The rites of this day may be done in different orders if the crowd makes one impossible. The Prophet ﷺ was asked about doing one before another and said: “There is no harm.”',
  },
  {
    id: 'day11',
    day: '11–12 Dhul Hijjah',
    title: 'Ayyam al-Tashreeq — the days of drying meat',
    summary:
      'Stay in Mina and stone all three jamarat each day after midday.',
    steps: [
      'On each day after Dhuhr (zawal), stone the three jamarat in order: the small, the middle, then the large.',
      'Throw seven pebbles at each, saying “Allahu akbar” with every throw. Pebbles the size of a chickpea are sufficient.',
      'Do not stone before midday on these days; the time begins after the sun has passed its zenith.',
      'Spend the nights in Mina. If you leave on 12 Dhul Hijjah after stoning and before sunset, you may depart (nafr awwal). If the sun sets while you are still in Mina, stay for the 13th and stone again.',
    ],
    tip: 'Carry water and a small umbrella. The walk between your tent and the jamarat can take much longer than the map suggests.',
  },
  {
    id: 'farewell',
    day: 'Before leaving Makkah',
    title: 'Tawaf al-Wada‘ — the farewell tawaf',
    summary:
      'Circle the Ka‘bah seven times as the final act before departing Makkah.',
    steps: [
      'Perform the farewell tawaf without sa‘i, preferably shortly before leaving.',
      'Women in menstruation are excused from the farewell tawaf according to the majority position.',
      'Make a final supplication at the Ka‘bah, then leave without walking backwards.',
      'Do not turn the farewell into a photo opportunity that blocks other pilgrims or delays the group.',
    ],
    tip: 'Keep the intention of return in your heart, but do not treat the farewell as a guarantee that you will come back.',
  },
];

export const UMRAH_STEPS = [
  {
    title: 'Enter ihram at the miqat',
    detail:
      'Wear the garments (men: two unstitched white sheets; women: ordinary modest clothes covering everything but the face and hands). Enter the state of ihram with the intention of Umrah and begin the talbiyah.',
  },
  {
    title: 'Perform tawaf',
    detail:
      'Enter the Masjid al-Haram with your right foot, then circle the Ka‘bah seven times anticlockwise, starting and ending at the Black Stone. Men walk briskly (raml) in the first three circuits when possible. Touch or kiss the Black Stone only if the crowd allows; otherwise point towards it and say “Allahu akbar”.',
  },
  {
    title: 'Pray two rakats',
    detail:
      'After tawaf, pray two short rakats behind Maqam Ibrahim if possible, or anywhere in the mosque, then drink zamzam.',
  },
  {
    title: 'Perform sa‘i',
    detail:
      'Go to Safa, face the Ka‘bah, praise Allah and make dua. Walk seven times between Safa and Marwah — the first lap starts at Safa and ends at Marwah; the seventh ends at Marwah. Men jog between the green markers; women walk normally.',
  },
  {
    title: 'Shave or trim',
    detail:
      'Men shave the head completely or trim evenly; women trim a fingertip’s length from the ends of their hair. This completes Umrah and ends the ihram restrictions.',
  },
];

export const IHRAAM_PROHIBITIONS = [
  'Do not cut hair or nails while in ihram.',
  'Do not use perfume on the body, clothes or hair.',
  'Men do not wear stitched garments; women wear ordinary modest clothes that cover the body.',
  'Men do not cover the head with a cap, turban or cloth that touches the head; an umbrella is allowed.',
  'Women do not wear a face veil (niqab) or gloves in ihram; the face and hands remain uncovered.',
  'Do not engage in marital intimacy, foreplay or marriage contracts.',
  'Do not hunt or harm wildlife on land; do not cut the trees of the sanctuary.',
  'Do not use scented soap, shampoo, lotion or deodorant. Unscented alternatives are available.',
];

export const HAJJ_DUAS = [
  {
    id: 'talbiyah',
    title: 'The Talbiyah',
    when: 'From entering ihram until you begin the rami of Jamarat al-Aqabah on 10 Dhul Hijjah.',
    arabic:
      'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ',
    transliteration:
      'Labbayk Allahumma labbayk, labbayka la sharika laka labbayk, inna al-hamda wa an-ni‘mata laka wa al-mulk, la sharika lak.',
    translation:
      'Here I am, O Allah, here I am. Here I am; You have no partner; here I am. Indeed all praise, grace and sovereignty belong to You; You have no partner.',
    source: 'Sahih al-Bukhari 1549 · Sahih Muslim 1184',
  },
  {
    id: 'arafah',
    title: 'The best dua of Arafah',
    when: 'Throughout the day of Arafah, especially after midday.',
    arabic:
      'لَا إِلٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
    transliteration:
      'La ilaha illa Allah, wahdahu la sharika lah, lahu al-mulku wa lahu al-hamd, wa huwa ‘ala kulli shay’in qadir.',
    translation:
      'There is no deity except Allah, alone, without partner. To Him belongs all sovereignty and praise, and He is able to do all things.',
    source: 'Sunan al-Tirmidhi 3585',
  },
  {
    id: 'between-corners',
    title: 'Between the Yemeni corner and the Black Stone',
    when: 'During the circuits of tawaf, between the Yemeni corner and the Black Stone.',
    arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    transliteration:
      'Rabbana atina fi ad-dunya hasanatan wa fi al-akhirah hasanatan wa qina ‘adhab an-nar.',
    translation:
      'Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.',
    source: 'Qur’an 2:201 · Sunan Abi Dawud 1905',
  },
  {
    id: 'safa',
    title: 'At Safa',
    when: 'On arriving at Safa before beginning sa‘i.',
    arabic:
      'إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللَّهِ، نَبْدَأُ بِمَا بَدَأَ اللَّهُ بِهِ',
    transliteration:
      'Inna as-Safa wa al-Marwata min sha‘a’ir Allah, nabda’u bima bada’a Allahu bih.',
    translation:
      'Indeed, Safa and Marwah are among the symbols of Allah. We begin with what Allah began with.',
    source: 'Qur’an 2:158 · Sahih Muslim 1218',
  },
  {
    id: 'sacrifice',
    title: 'When offering the sacrifice',
    when: 'At the hady on 10 Dhul Hijjah.',
    arabic: 'بِسْمِ اللَّهِ وَاللَّهُ أَكْبَرُ',
    transliteration: 'Bismillah, wa Allahu akbar.',
    translation: 'In the name of Allah, and Allah is the Greatest.',
    source: 'Sahih al-Bukhari 5558',
  },
  {
    id: 'zamzam',
    title: 'Drinking zamzam',
    when: 'After tawaf or whenever you drink from the well.',
    arabic:
      'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا وَاسِعًا، وَشِفَاءً مِنْ كُلِّ دَاءٍ',
    transliteration:
      'Allahumma inni as’aluka ‘ilman nafi‘an, wa rizqan wasi‘an, wa shifa’an min kulli da’.',
    translation:
      'O Allah, I ask You for beneficial knowledge, abundant provision and healing from every illness.',
    source: 'Narrated from Ibn Abbas; graded weak by some scholars, so say it as a general dua.',
  },
];

export const HAJJ_MISTAKES = [
  {
    title: 'Thinking ihram begins at home',
    fix: 'It begins at the miqat. Passengers flying to Jeddah from the east usually enter ihram before boarding or on the plane when the captain announces the approach; follow your group’s instruction.',
  },
  {
    title: 'Leaving Arafah before sunset',
    fix: 'The standing continues until sunset. Leaving early without a valid excuse is a serious mistake and may require a sacrifice.',
  },
  {
    title: 'Shaving before the rami',
    fix: 'The order is rami, then sacrifice, shaving and tawaf. If you do them in a different order out of crowding, the Prophet ﷺ said there is no harm — but do not deliberately reverse them.',
  },
  {
    title: 'Showering in scented soap',
    fix: 'Washing is allowed in ihram, but scented soap, shampoo, lotion and deodorant are not. Buy unscented products before you enter ihram.',
  },
  {
    title: 'Throwing all seven pebbles at once',
    fix: 'Each pebble is a separate throw with its own takbir. A bundle counted as one throw does not fulfil the rite.',
  },
  {
    title: 'Stoning before midday on 11–13 Dhul Hijjah',
    fix: 'Wait until after the sun has passed its zenith (zawal). On the 10th the time begins after sunrise for the large jamrah.',
  },
  {
    title: 'Touching the Black Stone by force',
    fix: 'It is a sunnah to touch or kiss it, but not at the cost of harming others. Point towards it and say “Allahu akbar” from a distance.',
  },
  {
    title: 'Treating Mina as a shopping trip',
    fix: 'These are days of worship and restraint. Rest, remember Allah and protect your tongue from arguments in the crowd.',
  },
  {
    title: 'Skipping the farewell tawaf',
    fix: 'It is required before leaving Makkah by the majority. Only a menstruating woman is excused according to the majority.',
  },
  {
    title: 'Assuming the sacrifice is optional for Tamattu‘',
    fix: 'It is required for Tamattu‘ and Qiran. If you cannot afford it, fast three days during Hajj and seven after you return.',
  },
];

export const HAJJ_CHECKLIST = [
  {
    group: 'Before travel',
    items: [
      { id: 'passport', label: 'Passport valid for at least six months' },
      { id: 'visa', label: 'Hajj/Umrah visa and confirmed package' },
      { id: 'vaccines', label: 'Required vaccinations and health record' },
      { id: 'debts', label: 'Debts settled and dependants cared for' },
      { id: 'will', label: 'Valid will and emergency contacts written down' },
      { id: 'learn', label: 'Rites of Hajj learned before departure' },
    ],
  },
  {
    group: 'Packing for ihram',
    items: [
      { id: 'sheets', label: 'Two white unstitched sheets (men)' },
      { id: 'unscented', label: 'Unscented soap, shampoo and deodorant' },
      { id: 'sandals', label: 'Comfortable sandals that leave the ankles bare for men' },
      { id: 'ihram-bag', label: 'Small cloth bag for shoes and valuables' },
      { id: 'water', label: 'Reusable water bottle' },
      { id: 'meds', label: 'Personal medication with copies of prescriptions' },
    ],
  },
  {
    group: 'Rites',
    items: [
      { id: 'intention', label: 'Enter ihram at the miqat with the correct intention' },
      { id: 'mina', label: 'Travel to Mina on 8 Dhul Hijjah' },
      { id: 'arafah', label: 'Stand at Arafah until sunset on 9 Dhul Hijjah' },
      { id: 'muzdalifah', label: 'Spend the night at Muzdalifah and collect pebbles' },
      { id: 'rami10', label: 'Stone Jamarat al-Aqabah on 10 Dhul Hijjah' },
      { id: 'hady', label: 'Offer the sacrifice if performing Tamattu‘ or Qiran' },
      { id: 'halq', label: 'Shave or trim the hair' },
      { id: 'tawaf', label: 'Perform tawaf al-ifadah and sa‘i' },
      { id: 'rami11', label: 'Stone all three jamarat on 11 and 12 Dhul Hijjah' },
      { id: 'farewell', label: 'Perform the farewell tawaf before leaving Makkah' },
    ],
  },
];

export const HAJJ_HISTORY =
  'The rites trace back to Ibrahim, Hajar and Ismail. Hajar’s search for water between Safa and Marwah became sa‘i; the well of zamzam sprang where her infant struck the ground; and Ibrahim was commanded to sacrifice his son and was ransomed with a ram. Over centuries the pilgrimage was corrupted by idol worship and naked circuits of the House. In 9 AH the Prophet ﷺ sent Abu Bakr to lead the pilgrimage and announce the end of treaties with the polytheists. In 10 AH he performed his only Hajj, taught the rites in person and delivered the farewell sermon at Arafah, where the verse “This day I have perfected for you your religion” was revealed. That pilgrimage is the model every Hajj follows.';
