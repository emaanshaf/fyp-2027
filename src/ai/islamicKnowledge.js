// Islamic AI Knowledge Base — comprehensive Q&A covering all major topics

export const KNOWLEDGE_BASE = [
  // ─── PILLARS OF ISLAM ───────────────────────────────────────────────────────
  {
    keywords: ['pillars', 'five pillars', 'arkan', 'arkaan', 'pillars of islam'],
    topic: 'Pillars of Islam',
    answer: `The Five Pillars of Islam (Arkan al-Islam) are:\n\n1. **Shahadah** — Testimony that there is no god but Allah and Muhammad ﷺ is His Messenger.\n2. **Salah** — Performing the five daily prayers.\n3. **Zakat** — Giving 2.5% of eligible wealth to those in need.\n4. **Sawm** — Fasting during the month of Ramadan.\n5. **Hajj** — Pilgrimage to Mecca at least once if able.\n\nThese are the foundation of a Muslim's religious life. (Sahih Bukhari, Hadith 8)`,
    references: ['Surah Al-Baqarah 2:43', 'Sahih Bukhari, Hadith 8'],
  },
  {
    keywords: ['pillars of faith', 'iman', 'six pillars', 'belief', 'arkan iman'],
    topic: 'Pillars of Iman',
    answer: `The Six Pillars of Iman (Faith) are:\n\n1. Belief in **Allah** — His existence, oneness, and attributes.\n2. Belief in His **Angels** — created from light, they worship Allah continuously.\n3. Belief in His **Books** — Torah, Psalms, Gospel, and the Quran (final and preserved).\n4. Belief in His **Prophets** — from Adam to Muhammad ﷺ (final prophet).\n5. Belief in the **Last Day** — resurrection, judgment, paradise, and hellfire.\n6. Belief in **Qadar** — Divine Decree, both good and what seems bad.\n\n(Sahih Muslim, Hadith 8 — Hadith of Jibril)`,
    references: ['Surah Al-Baqarah 2:177', 'Sahih Muslim, Hadith 8'],
  },

  // ─── PRAYER / SALAH ─────────────────────────────────────────────────────────
  {
    keywords: ['prayer', 'salah', 'salat', 'namaz', 'how to pray', 'fajr', 'dhuhr', 'asr', 'maghrib', 'isha'],
    topic: 'Salah (Prayer)',
    answer: `The five daily prayers are obligatory (Fard) on every sane adult Muslim:\n\n• **Fajr** — 2 Rak'ahs — Dawn to sunrise\n• **Dhuhr** — 4 Rak'ahs — Midday to afternoon\n• **Asr** — 4 Rak'ahs — Afternoon to sunset\n• **Maghrib** — 3 Rak'ahs — After sunset\n• **Isha** — 4 Rak'ahs — Night\n\nPrayer is the first deed a person will be questioned about on the Day of Judgment.\n\n"The first thing the servant will be called to account for on the Day of Resurrection will be prayer." (Tirmidhi, Hadith 413)\n\nCheck live timings for your city in the Prayer Times module.`,
    references: ['Surah Al-Baqarah 2:238', 'Tirmidhi 413'],
  },
  {
    keywords: ['wudu', 'ablution', 'purification', 'taharah', 'clean', 'ghusl', 'bath'],
    topic: 'Purification (Wudu & Ghusl)',
    answer: `**Wudu (Ablution)** steps:\n1. Intention (Niyyah)\n2. Say Bismillah\n3. Wash both hands to the wrist (3×)\n4. Rinse the mouth (3×)\n5. Sniff water into the nose (3×)\n6. Wash the face (3×)\n7. Wash right then left arm to elbow (3×)\n8. Wipe the head\n9. Wipe the ears\n10. Wash feet to the ankles (3×)\n\n**Ghusl (Full bath)** is required after: marital relations, menstruation, childbirth, nocturnal emission.\n\nWudu is broken by: using the toilet, passing wind, deep sleep, bleeding, unconsciousness.`,
    references: ['Surah Al-Ma\'idah 5:6'],
  },
  {
    keywords: ['qibla', 'direction', 'kaaba', 'mecca', 'facing'],
    topic: 'Qibla Direction',
    answer: `The Qibla is the direction of the Masjid al-Haram in Mecca, Saudi Arabia. Muslims must face the Qibla during prayer.\n\n**Approximate directions from major cities:**\n- Pakistan (Islamabad) → ~262° (West/WSW)\n- UK (London) → ~119° (East/SE)\n- USA (New York) → ~58° (Northeast)\n- Indonesia (Jakarta) → ~295° (West/NW)\n\nUse the Qibla Compass in the Prayer Times screen for your exact direction.\n\nIf the exact direction is unknown, a sincere attempt based on your best knowledge is acceptable. (Surah Al-Baqarah 2:144)`,
    references: ['Surah Al-Baqarah 2:144', 'Surah Al-Baqarah 2:150'],
  },
  {
    keywords: ['jummah', 'friday prayer', 'friday', 'khutbah', 'sermon'],
    topic: 'Jumu\'ah (Friday Prayer)',
    answer: `Jumu'ah prayer is obligatory for every free, adult Muslim male. It replaces the Dhuhr prayer on Fridays.\n\n**Key rulings:**\n- Begins at Dhuhr time\n- Consists of 2 Rak'ahs after the Khutbah (sermon)\n- Listening to the Khutbah is obligatory — talking is forbidden\n- Leaving Jumu'ah 3 times in a row without excuse seals the heart (Ahmad)\n- Recommended: Friday ghusl, wearing best clothes, using miswak, sending Salawat on the Prophet ﷺ\n\n"Whoever reads Surah Al-Kahf on Friday will have a light that shines for him between the two Fridays." (Al-Hakim)`,
    references: ['Surah Al-Jumu\'ah 62:9', 'Sahih Muslim 854'],
  },

  // ─── QURAN ─────────────────────────────────────────────────────────────────
  {
    keywords: ['quran', 'book of allah', 'holy book', 'koran', 'mushaf'],
    topic: 'The Holy Quran',
    answer: `The Quran is the final and preserved Word of Allah revealed to Prophet Muhammad ﷺ over 23 years through Angel Jibreel (Gabriel).\n\n**Key facts:**\n- 114 Surahs (chapters)\n- 6,236 verses (Ayat)\n- Revealed in Arabic, preserved in its original form\n- Divided into 30 Juz (parts) for recitation\n- First revelation: Surah Al-Alaq 96:1 ("Read in the name of your Lord")\n- Last revelation: Surah Al-Ma'idah 5:3\n\n**Benefits of recitation:**\n"Whoever reads one letter from the Book of Allah will have a reward, and that reward will be multiplied by ten." (Tirmidhi 2910)\n\nThe best among you are those who learn the Quran and teach it. (Bukhari 5027)`,
    references: ['Surah Al-Hijr 15:9', 'Tirmidhi 2910'],
  },
  {
    keywords: ['surah yaseen', 'yasin', 'ya sin', 'heart of quran'],
    topic: 'Surah Yaseen',
    answer: `Surah Yaseen is the 36th chapter of the Quran with 83 verses. It is often called "the Heart of the Quran."\n\n**Virtues:**\n- "Whoever recites Surah Yaseen seeking the face of Allah, his past sins will be forgiven." (Abu Dawud)\n- Traditionally recited for the dying and at graves\n- It emphasizes Tawhid, resurrection, and the story of the people of the town\n\n**Key themes:**\n- Prophethood and its rejection\n- Signs of Allah in creation\n- Resurrection and the Hereafter\n- The parable of the companions of the town (Yaseen 36:13-32)`,
    references: ['Surah Yaseen 36', 'Abu Dawud 3121'],
  },
  {
    keywords: ['ayat al kursi', 'verse of the throne', '2:255', 'kursi'],
    topic: 'Ayat al-Kursi',
    answer: `Ayat al-Kursi (Surah Al-Baqarah 2:255) is considered the greatest verse in the Quran.\n\n**Arabic:** اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ...\n\n**Virtues:**\n- "Whoever recites it after every obligatory prayer, nothing prevents him from entering Paradise except death." (Nasa'i)\n- "Whoever recites it at bedtime will be protected by Allah until morning." (Bukhari 2311)\n- It contains 50 words and affirms Allah's unlimited sovereignty over all creation\n\n**When to recite:**\n✓ After every Fard prayer\n✓ Before sleeping\n✓ Entering and leaving home\n✓ For general protection`,
    references: ['Surah Al-Baqarah 2:255', 'Sahih Bukhari 2311'],
  },
  {
    keywords: ['memorize', 'hifz', 'hafiz', 'memorization', 'memorise'],
    topic: 'Quran Memorization (Hifz)',
    answer: `Memorizing the Quran (Hifz) is one of the greatest acts of worship.\n\n**Virtues:**\n- The Hafiz (memorizer) will be crowned with a crown of light on the Day of Judgment. (Tirmidhi 2915)\n- The Hafiz will intercede for 10 family members on the Day of Judgment. (Abu Dawud 1481)\n- "The one who is proficient in reciting the Quran will be with the noble, righteous scribes (angels)." (Bukhari 4937)\n\n**Tips for memorization:**\n1. Recite consistently at the same time daily (after Fajr is ideal)\n2. Repeat each verse 20-30 times before moving to the next\n3. Revise previously memorized portions regularly\n4. Understand the meaning to strengthen retention\n5. Seek a qualified teacher (Ustadh/Sheikh)`,
    references: ['Tirmidhi 2915', 'Abu Dawud 1481'],
  },

  // ─── HADITH / SUNNAH ────────────────────────────────────────────────────────
  {
    keywords: ['hadith', 'hadees', 'sunnah', 'tradition', 'saying of prophet'],
    topic: 'Hadith & Sunnah',
    answer: `**Hadith** are the recorded sayings, actions, and approvals of Prophet Muhammad ﷺ.\n**Sunnah** broadly refers to the Prophet's ﷺ way of life and practice.\n\n**Major Hadith collections (Kutub al-Sittah):**\n1. Sahih Bukhari — ~7,563 hadiths (most authenticated)\n2. Sahih Muslim — ~7,500 hadiths\n3. Sunan Abu Dawud — ~5,274 hadiths\n4. Jami al-Tirmidhi — ~3,956 hadiths\n5. Sunan al-Nasa'i — ~5,761 hadiths\n6. Sunan ibn Majah — ~4,341 hadiths\n\n**Hadith grades:** Sahih (authentic) → Hasan (good) → Da'if (weak) → Mawdu' (fabricated)\n\nFollowing the Sunnah is obligatory: "Whatever the Messenger gives you, take it." (Quran 59:7)`,
    references: ['Surah Al-Hashr 59:7', 'Surah Al-Imran 3:31'],
  },
  {
    keywords: ['isnad', 'chain', 'narration', 'narrator', 'rawi'],
    topic: 'Hadith Chain (Isnad)',
    answer: `The Isnad is the chain of narrators that traces a hadith back to the Prophet ﷺ. Scholars of hadith spend lifetimes verifying narrators' reliability.\n\n**Isnad analysis includes:**\n- **'Adalah** — The narrator's moral uprightness\n- **Dabt** — The narrator's precision and memory\n- **Continuity** — No gaps in the chain\n- **Absence of Shudhudh** — No irregularities\n- **Absence of 'Illah** — No hidden defects\n\n**Types of Isnad:**\n- **Mutawatir** — Narrated by so many people that fabrication is impossible\n- **Ahad** — Single-chain narrations (most hadiths)\n\nImam Bukhari is said to have memorized 600,000 hadiths and selected only 7,563 as authentic.`,
    references: ['Islamic Hadith Sciences (Mustalah al-Hadith)'],
  },

  // ─── ZAKAT ──────────────────────────────────────────────────────────────────
  {
    keywords: ['zakat', 'zakah', 'alms', '2.5%', 'charity obligatory'],
    topic: 'Zakat',
    answer: `Zakat is the third pillar of Islam — an obligatory annual charity on eligible wealth.\n\n**Conditions for Zakat:**\n1. Muslim, free adult\n2. Owns Nisab (minimum threshold) for one lunar year (Hawl)\n3. The wealth must be above personal needs\n\n**Nisab thresholds:**\n- Gold: 87.48 grams (~PKR 2,187,000)\n- Silver: 612.36 grams (~PKR 195,955)\n- Scholars recommend using the Silver Nisab as it is lower and includes more\n\n**Zakat rate: 2.5%** of eligible net wealth\n\n**Categories eligible to receive Zakat (8 groups per Quran 9:60):**\nThe poor, the needy, Zakat workers, those whose hearts are to be reconciled, freeing slaves, those in debt, in the path of Allah, and the traveler.`,
    references: ['Surah Al-Tawbah 9:60', 'Surah Al-Baqarah 2:177'],
  },
  {
    keywords: ['nisab', 'threshold', 'minimum zakat'],
    topic: 'Nisab (Zakat Threshold)',
    answer: `Nisab is the minimum amount of wealth that makes Zakat obligatory.\n\n**Gold Nisab:** 87.48 grams of gold\n**Silver Nisab:** 612.36 grams of silver\n\nMost scholars today recommend using the **Silver Nisab** because:\n- It is lower, so more people qualify\n- It is broader in its application\n- It aligns with the intent of Zakat to help the less fortunate\n\n**Current approximate values (Pakistan):**\n- Gold Nisab ≈ PKR 2,187,000\n- Silver Nisab ≈ PKR 195,955\n\nWealth must exceed the Nisab and remain above it for one complete **Hawl (lunar year)** for Zakat to be due.`,
    references: ['Surah Al-Tawbah 9:103', 'Fiqh al-Zakat by Yusuf al-Qaradawi'],
  },
  {
    keywords: ['ushr', 'agricultural', 'crop', 'farm', 'harvest'],
    topic: 'Ushr (Agricultural Zakat)',
    answer: `Ushr is the Islamic tax on agricultural produce.\n\n**Rates:**\n- **10% (one-tenth)** on crops watered by rain or river (natural water)\n- **5% (one-twentieth)** on crops watered by irrigation (with effort/cost)\n- **7.5%** when both methods are used equally\n\n**Key differences from Zakat:**\n- Ushr is due upon harvest — does not require one lunar year\n- Applies to the value or quantity of the produce\n- Nisab for Ushr: 5 Awsuq (653 kg of dates or similar grain)\n\n**In Pakistan/India context:** Many scholars apply Ushr to all agricultural produce including vegetables, fruits, and sugarcane.`,
    references: ['Sahih Bukhari 1483', 'Surah Al-An\'am 6:141'],
  },

  // ─── FASTING / RAMADAN ──────────────────────────────────────────────────────
  {
    keywords: ['ramadan', 'ramzan', 'fasting', 'sawm', 'siyam', 'fast', 'iftar', 'suhoor', 'sehri'],
    topic: 'Ramadan & Fasting',
    answer: `Sawm (fasting) during Ramadan is the fourth pillar of Islam, obligatory for every sane adult Muslim.\n\n**The fast requires:**\n- Abstaining from food, drink, and marital relations from Fajr (dawn) to Maghrib (sunset)\n- Intention (Niyyah) each night\n\n**Key practices:**\n- **Suhoor** — pre-dawn meal (strongly recommended)\n- **Iftar** — breaking fast at Maghrib (with a date or water, per Sunnah)\n- **Taraweeh** — special night prayers (20 or 8 rak'ahs — both valid)\n- **I'tikaf** — seclusion in the masjid in the last 10 nights\n- **Laylat al-Qadr** — Night of Power, better than 1,000 months (last 10 odd nights)\n\n"Whoever fasts during Ramadan with faith and seeking reward, their previous sins are forgiven." (Bukhari 1901)`,
    references: ['Surah Al-Baqarah 2:183-185', 'Sahih Bukhari 1901'],
  },
  {
    keywords: ['laylat al qadr', 'night of power', 'night of decree', 'laylatulqadr', 'qadr'],
    topic: 'Laylat al-Qadr',
    answer: `Laylat al-Qadr (Night of Power) is the most blessed night of the year, occurring in the last 10 odd nights of Ramadan (21st, 23rd, 25th, 27th, or 29th).\n\n**Its significance:**\n- "Better than a thousand months" (Surah Al-Qadr 97:3)\n- The Quran was first revealed on this night\n- Angels descend with all decrees for the coming year\n- Worship on this night equals 83+ years of worship\n\n**How to seek it:**\n- Increase prayer, Quran recitation, dua, dhikr\n- Spend the night in I'tikaf\n- Recite: **اللَّهُمَّ إِنَّكَ عَفُوٌّ كَرِيمٌ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي**\n"O Allah, You are Pardoning and Generous, You love to pardon, so pardon me." (Tirmidhi 3513)`,
    references: ['Surah Al-Qadr 97', 'Tirmidhi 3513'],
  },

  // ─── HAJJ & UMRAH ────────────────────────────────────────────────────────────
  {
    keywords: ['hajj', 'pilgrimage', 'mecca', 'makkah', 'arafah', 'umrah'],
    topic: 'Hajj & Umrah',
    answer: `**Hajj** is the fifth pillar of Islam — obligatory once in a lifetime for every Muslim who is physically and financially able.\n\n**Time:** The month of Dhul Hijjah (8th-13th)\n\n**Key rites of Hajj:**\n1. Ihram (entering sacred state of pilgrimage)\n2. Tawaf al-Qudum (arrival circumambulation of Ka'bah)\n3. Sa'i (walking between Safa and Marwa 7 times)\n4. Standing on Arafah (9th Dhul Hijjah — the core of Hajj)\n5. Staying at Muzdalifah\n6. Stoning the Jamarat (pillars at Mina)\n7. Sacrificing an animal (Qurbani)\n8. Shaving the head\n9. Tawaf al-Ifadah\n\n**Umrah** can be performed any time and is a highly recommended Sunnah.\n\n"An Umrah to another Umrah is an expiation for sins between them." (Bukhari 1773)`,
    references: ['Surah Al-Imran 3:97', 'Sahih Bukhari 1773'],
  },

  // ─── MARRIAGE / FAMILY ──────────────────────────────────────────────────────
  {
    keywords: ['marriage', 'nikah', 'wedding', 'wife', 'husband', 'spouse', 'mahram', 'dowry', 'mahr'],
    topic: 'Marriage (Nikah)',
    answer: `Marriage (Nikah) in Islam is a sacred contract and worship.\n\n**Conditions for valid Nikah:**\n1. Offer (Ijab) and acceptance (Qabul)\n2. Two adult male witnesses (or 1 male + 2 female, per some scholars)\n3. Mahr (dowry) for the wife\n4. No existing obstacles (e.g., Iddah period)\n\n**The Mahr:**\n- Obligatory gift from husband to wife\n- Her exclusive property — she decides how to use it\n- No minimum amount — even a ring or teaching her Quran is valid\n\n**Virtues of marriage:**\n"Marriage is half of religion." (Bayhaqi)\n"When a man marries, he has completed half of his religion." (Bayhaqi 5486)\n\n**Rights of the wife:** maintenance, housing, kind treatment, mahr\n**Rights of the husband:** obedience in permissible matters, loyalty`,
    references: ['Surah Al-Nisa 4:4', 'Surah Al-Rum 30:21'],
  },

  // ─── HALAL / HARAM ──────────────────────────────────────────────────────────
  {
    keywords: ['halal', 'haram', 'permissible', 'forbidden', 'lawful', 'unlawful', 'food', 'pork', 'alcohol', 'interest', 'riba'],
    topic: 'Halal & Haram',
    answer: `**Key Prohibitions (Haram) in Islam:**\n\n🚫 **Food & Drink:**\n- Pork and its by-products\n- Alcohol and intoxicants\n- Carnivorous animals (lion, wolf, etc.)\n- Blood, carrion (dead animals)\n- Animals slaughtered without saying Bismillah\n\n🚫 **Financial:**\n- Riba (interest/usury) — "Allah has declared war on those who deal in riba" (Quran 2:279)\n- Gambling (Maysir)\n- Fraud, deception, bribery\n\n🚫 **Social:**\n- Fornication/adultery (Zina)\n- Alcohol and drugs\n- Backbiting (Gheebah)\n- Lying\n- Music with immoral content (scholars differ on music)\n\n**General principle:** "The halal is clear and the haram is clear." (Bukhari 52)`,
    references: ['Surah Al-Ma\'idah 5:3', 'Surah Al-Baqarah 2:173'],
  },
  {
    keywords: ['riba', 'interest', 'usury', 'bank', 'loan', 'islamic finance', 'mortgage'],
    topic: 'Riba (Interest)',
    answer: `Riba (interest/usury) is absolutely forbidden in Islam.\n\n**Quranic prohibition:**\n"Allah has permitted trade and forbidden riba." (Surah Al-Baqarah 2:275)\n\n"If you do not, then be warned of war from Allah and His Messenger." (Surah Al-Baqarah 2:279)\n\n**Types of Riba:**\n1. **Riba al-Nasi'ah** — interest on loans (conventional banking interest)\n2. **Riba al-Fadl** — unequal exchange of same commodities\n\n**Islamic alternatives:**\n- **Murabaha** — cost-plus financing (bank buys and sells to you at profit)\n- **Ijara** — lease-to-own\n- **Musharakah** — partnership with shared profit/loss\n- **Sukuk** — Islamic bonds\n\nFor necessary situations (no Islamic bank available), consult a qualified scholar.`,
    references: ['Surah Al-Baqarah 2:275-279', 'Sahih Muslim 1598'],
  },

  // ─── DEATH / AFTERLIFE ──────────────────────────────────────────────────────
  {
    keywords: ['death', 'grave', 'barzakh', 'afterlife', 'akhirah', 'hereafter', 'resurrection', 'judgment'],
    topic: 'Death & the Afterlife',
    answer: `**The Journey After Death:**\n\n1. **Angel of Death** — Azrael takes the soul at the appointed time\n2. **Barzakh** — The realm between death and resurrection. The righteous experience blessings; others experience torment.\n3. **Questioning in the Grave** — Angels Munkar and Nakir ask: "Who is your Lord? What is your religion? Who is this man?"\n4. **Day of Resurrection (Yawm al-Qiyamah)** — All are raised from the dead\n5. **Gathering (Hashr)** — All humanity is assembled\n6. **Reckoning (Hisab)** — Each person's deeds are weighed on the Mizan (scale)\n7. **The Bridge (Sirat)** — All must cross it\n8. **Final destination:** Jannah (Paradise) or Jahannam (Hellfire)\n\n"Every soul will taste death." (Quran 3:185)`,
    references: ['Surah Al-Imran 3:185', 'Surah Az-Zumar 39:68'],
  },
  {
    keywords: ['jannah', 'paradise', 'heaven', 'gardens'],
    topic: 'Jannah (Paradise)',
    answer: `Jannah has 8 gates and 100 levels:\n\n**Gates of Jannah:**\n1. Bab al-Salah (Prayer)\n2. Bab al-Jihad (Striving)\n3. Bab al-Sadaqah (Charity)\n4. Bab al-Rayyan (Fasting)\n5. Bab al-Hajj (Pilgrimage)\n6. Bab al-Kazimeen al-Ghayth wa al-'Afeen 'an al-Naas (Controlling Anger)\n7. Bab al-Iman (Faith)\n8. Bab al-Dhikr (Remembrance of Allah)\n\n"In Jannah there is that which no eye has seen, no ear has heard, and no human heart has ever imagined." (Bukhari 3244)\n\n**The highest level is Firdaus** — seek it by:\n- Consistent prayer on time\n- Reciting Surah Al-Mu'minoon 23:1-11\n- Maintaining good character`,
    references: ['Sahih Bukhari 3244', 'Sahih Muslim 2831'],
  },

  // ─── SINS & REPENTANCE ──────────────────────────────────────────────────────
  {
    keywords: ['repentance', 'tawbah', 'taubah', 'forgiveness', 'sin', 'istighfar', 'repent', 'astaghfirullah'],
    topic: 'Tawbah (Repentance)',
    answer: `Allah's mercy is limitless — sincere repentance is always accepted.\n\n**Conditions for accepted Tawbah:**\n1. Genuine remorse for the sin\n2. Immediately stopping the sin\n3. Firm intention never to return to it\n4. (If rights of others were violated) Returning the right or seeking forgiveness from them\n\n**Quranic promise:**\n"Say: O My servants who have transgressed against themselves, do not despair of the mercy of Allah. Indeed, Allah forgives all sins." (Az-Zumar 39:53)\n\n**Powerful acts of repentance:**\n- Recite Astaghfirullah frequently\n- Perform 2 rak'ah of prayer and repent sincerely\n- Give Sadaqah\n- Follow a bad deed with a good one\n\n"The best of sinners are those who repent." (Tirmidhi 2499)`,
    references: ['Surah Az-Zumar 39:53', 'Tirmidhi 2499'],
  },
  {
    keywords: ['major sins', 'kabair', 'greatest sins', 'worst sins'],
    topic: 'Major Sins (Kaba\'ir)',
    answer: `The Prophet ﷺ listed the seven greatest sins (Al-Sab' al-Mubiqat):\n\n1. **Shirk** — Associating partners with Allah\n2. **Magic/Sorcery** — Practicing witchcraft\n3. **Murder** — Killing a soul unjustly\n4. **Riba** — Consuming interest\n5. **Consuming orphan's wealth** — Taking what belongs to orphans\n6. **Fleeing from battle** — Deserting during combat\n7. **False accusation** — Accusing chaste women of fornication\n\n(Sahih Bukhari 2766)\n\nOther major sins include: disobeying parents, severing family ties, false testimony, failing to pay Zakat.\n\n**Note:** Major sins can be forgiven through sincere Tawbah and performing good deeds.`,
    references: ['Sahih Bukhari 2766', 'Surah Al-Nisa 4:31'],
  },

  // ─── DHIKR / DUA ────────────────────────────────────────────────────────────
  {
    keywords: ['dhikr', 'zikr', 'remembrance', 'subhanallah', 'alhamdulillah', 'allahu akbar', 'tasbeeh', 'tasbih'],
    topic: 'Dhikr (Remembrance of Allah)',
    answer: `Dhikr is among the most beloved acts of worship.\n\n**After every Fard prayer (33 times each):**\n- **سُبْحَانَ اللَّه** — Subhan Allah (Glory be to Allah)\n- **الْحَمْدُ لِلَّه** — Alhamdulillah (All praise to Allah)\n- **اللَّهُ أَكْبَر** — Allahu Akbar (Allah is Greatest)\n- Then: La ilaha illallahu wahdahu la shareeka lahu...\n\n**Special dhikr:**\n- **Laa hawla wa laa quwwata illa billah** — "There is no power or might except with Allah." — a treasure from Jannah. (Bukhari 4205)\n\n- **Subhan Allahi wa bihamdihi, Subhan Allahil Azeem** — Loved by Allah, light on the tongue, heavy on the scale. (Bukhari 6682)\n\n"Shall I inform you of the best of your deeds, the purest with your Master, the highest in your ranks?" They said yes. He ﷺ said: "The remembrance of Allah." (Tirmidhi 3377)`,
    references: ['Surah Al-Ahzab 33:41-42', 'Sahih Bukhari 6682'],
  },
  {
    keywords: ['dua', 'supplication', 'making dua', 'asking allah', 'prayer dua', 'invocation'],
    topic: 'Dua (Supplication)',
    answer: `Dua is the essence of worship.\n\n**Best times to make dua:**\n1. The last third of the night\n2. Between the Adhan and Iqamah\n3. During Sajdah (prostration)\n4. After Fard prayers\n5. On Friday between Asr and Maghrib\n6. While fasting, especially at Iftar\n7. During rain\n8. When waking up at night\n9. The Day of Arafah\n\n**Etiquettes of dua:**\n- Start with praise of Allah and Salawat on the Prophet ﷺ\n- Face the Qibla\n- Raise hands\n- Be in state of Wudu if possible\n- Have certainty Allah will answer\n- Be persistent\n\n"Call upon Me; I will respond to you." (Surah Ghafir 40:60)`,
    references: ['Surah Ghafir 40:60', 'Surah Al-Baqarah 2:186'],
  },

  // ─── PROPHET MUHAMMAD ﷺ ────────────────────────────────────────────────────
  {
    keywords: ['prophet', 'muhammad', 'prophet muhammad', 'rasulullah', 'nabi', 'pbuh', 'saw', 'sallallahu'],
    topic: 'Prophet Muhammad ﷺ',
    answer: `Prophet Muhammad ﷺ is the final messenger of Allah, born in Mecca in 570 CE.\n\n**Key milestones:**\n- **570 CE** — Born in Mecca (Year of the Elephant)\n- **610 CE** — First revelation in Cave Hira (age 40)\n- **622 CE** — Hijra (migration) to Madinah\n- **630 CE** — Conquest of Mecca (Fatah Makkah)\n- **632 CE** — Final Hajj and passing\n\n**Sending Salawat:**\n"Allah and His angels send blessings on the Prophet." (Quran 33:56)\nRecite: **اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ**\n\n"Whoever sends Salawat on me once, Allah will send blessings on him tenfold." (Muslim 408)\n\n**Character:** He was described as the "walking Quran" by Aisha (RA). His character was mercy, gentleness, honesty, and justice.`,
    references: ['Surah Al-Ahzab 33:56', 'Sahih Muslim 408'],
  },

  // ─── GENERAL ISLAMIC ETHICS ─────────────────────────────────────────────────
  {
    keywords: ['akhlaq', 'character', 'morals', 'ethics', 'good character', 'manners', 'adab'],
    topic: 'Islamic Character (Akhlaq)',
    answer: `The Prophet ﷺ said: "I was sent only to perfect good character." (Ahmad 8952)\n\n**Core virtues in Islam:**\n- **Sidq** — Truthfulness\n- **Amanah** — Trustworthiness\n- **Ihsan** — Excellence in worship and dealings\n- **Sabr** — Patience\n- **Shukr** — Gratitude\n- **Tawadu'** — Humility\n- **Karam** — Generosity\n\n**Most loved people to Allah:**\n"The most beloved of people to Allah are those who are most beneficial to people." (Al-Tabarani)\n\n**Heaviest thing on the scale on Judgment Day:**\n"There is nothing heavier on the scale of a believer on the Day of Judgment than good character." (Abu Dawud 4799)`,
    references: ['Ahmad 8952', 'Abu Dawud 4799'],
  },
  {
    keywords: ['parents', 'mother', 'father', 'birr', 'respect parents', 'obeying parents'],
    topic: 'Respect for Parents',
    answer: `Respecting parents is the second greatest obligation after worshipping Allah.\n\n"Your Lord has decreed that you worship none but Him, and that you be dutiful to your parents." (Surah Al-Isra 17:23)\n\n**Rights of parents:**\n- Do not say "Uff" (an expression of annoyance) to them\n- Do not rebuke or scold them\n- Speak to them with honor\n- Lower the wing of humility out of mercy\n- Pray for their forgiveness\n\n**The Mother's status:**\n"Paradise lies at the feet of your mother." (Ahmad 15577)\nA man asked: "Who most deserves my kind treatment?" The Prophet ﷺ said: "Your mother." Three times. Then: "Your father." (Bukhari 5971)\n\n**After their death:**\n- Pray for them\n- Give Sadaqah on their behalf\n- Maintain their friendships\n- Honor their memory`,
    references: ['Surah Al-Isra 17:23-24', 'Sahih Bukhari 5971'],
  },
  {
    keywords: ['sadaqah', 'charity', 'giving', 'donation', 'infaq', 'spending in way of allah'],
    topic: 'Sadaqah (Voluntary Charity)',
    answer: `Sadaqah is voluntary charity given for the sake of Allah.\n\n**Types of Sadaqah:**\n- Giving money or food to the needy\n- Building a masjid, school, or well\n- Teaching someone beneficial knowledge\n- **Sadaqah Jariyah** — ongoing charity that benefits after death (well, Quran, tree)\n- Removing harm from the road\n- A smile to a fellow Muslim\n- Helping someone with their work\n\n**Virtues:**\n"Charity does not decrease wealth." (Muslim 2588)\n"Shade on the Day of Judgment is seven types of people — one who gives charity so secretly his left hand does not know what the right gives." (Bukhari 1421)\n\nSadaqah extinguishes sins as water extinguishes fire. (Tirmidhi 614)`,
    references: ['Sahih Muslim 2588', 'Tirmidhi 614'],
  },
  {
    keywords: ['knowledge', 'ilm', 'seeking knowledge', 'learn', 'education', 'scholar'],
    topic: 'Seeking Knowledge',
    answer: `Seeking Islamic knowledge is obligatory upon every Muslim.\n\n**Virtues:**\n"Seek knowledge from the cradle to the grave." (Ibn Abd al-Barr)\n\n"Whoever travels a path seeking knowledge, Allah will make easy for him a path to Paradise." (Muslim 2699)\n\n"The superiority of a scholar over a worshipper is like the superiority of the full moon over all the stars." (Abu Dawud 3641)\n\n**First word revealed:** "Read" (Iqra) — Surah Al-Alaq 96:1\n\n**Types of knowledge:**\n- **Fard Ayn** — Obligatory on every individual (basic Aqeedah, worship, halal/haram)\n- **Fard Kifayah** — Communal obligation (Islamic law, Hadith sciences, etc.)\n\n**The heirs of the prophets are scholars** — they inherited knowledge, not gold. (Abu Dawud 3641)`,
    references: ['Surah Al-Alaq 96:1-5', 'Sahih Muslim 2699'],
  },

  // ─── PRACTICAL ──────────────────────────────────────────────────────────────
  {
    keywords: ['bismillah', 'starting with bismillah', 'in the name of allah'],
    topic: 'Bismillah',
    answer: `**بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ**\n*Bismillahir Rahmanir Raheem*\n"In the name of Allah, the Most Gracious, the Most Merciful"\n\nThis phrase should precede every important action.\n\n**When to say Bismillah:**\n✓ Before eating and drinking\n✓ Before entering home\n✓ Before starting any good work\n✓ Before Wudu\n✓ Before intercourse (protects children from Shaytan)\n✓ Before slaughtering an animal\n✓ Before reciting Quran\n✓ Before starting a journey\n\n"Any important matter not begun with Bismillah is cut off (from blessing)." (Abu Dawud)`,
    references: ['Surah Al-Naml 27:30', 'Abu Dawud'],
  },
  {
    keywords: ['salam', 'greeting', 'assalamu alaikum', 'salutation'],
    topic: 'Islamic Greeting (Salam)',
    answer: `The Islamic greeting is: **السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ**\n*Assalamu Alaykum wa Rahmatullahi wa Barakatuh*\n"Peace be upon you and the mercy and blessings of Allah"\n\n**Reply:** وَعَلَيْكُمُ السَّلَامُ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ\n\n**Reward:** For each word added (warahmatullahi, wabarakatuh), you gain 10, then 20, then 30 good deeds. (Abu Dawud 5195)\n\n**When to give Salam:**\n- Upon meeting a Muslim\n- When entering a home\n- When leaving\n- When someone is sleeping (softly)\n\n"You will not enter Paradise until you believe, and you will not believe until you love one another. Shall I guide you to something that, if you do it, you will love one another? Spread the Salam among yourselves." (Muslim 54)`,
    references: ['Sahih Muslim 54', 'Abu Dawud 5195'],
  },
  // ─── ANGELS ──────────────────────────────────────────────────────────────────
  {
    keywords: ['angels', 'angel', 'jibreel', 'gabriel', 'mikael', 'israfil', 'malak', 'munkar', 'nakir'],
    topic: 'Angels (Malaikah)',
    answer: `Angels are created from light and never disobey Allah's commands.\n\n**Notable angels:**\n• **Jibreel (Gabriel)** — delivers revelation to the prophets\n• **Mikael (Michael)** — in charge of rain and sustenance\n• **Israfil** — will blow the Trumpet on the Day of Judgment\n• **Izrael (Malak al-Mawt)** — the Angel of Death\n• **Munkar & Nakir** — question the deceased in the grave\n• **Kiraman Katibin** — two recording angels on each shoulder, writing good and bad deeds\n\nBelief in angels is the second pillar of Iman. They do not eat, sleep, or possess free will to sin.`,
    references: ['Surah Al-Baqarah 2:285', 'Surah At-Tahrim 66:6'],
  },
  // ─── PROPHETS (STORIES) ──────────────────────────────────────────────────────
  {
    keywords: ['prophets', 'nabi', 'rasul', 'adam', 'ibrahim', 'abraham', 'musa', 'moses', 'isa', 'jesus', 'nuh', 'noah', 'yusuf', 'joseph', '25 prophets'],
    topic: 'Prophets of Islam',
    answer: `The Quran names 25 prophets, all conveying the same core message: worship Allah alone.\n\n**Prophets of firm resolve (Ulul Azm):** Nuh (Noah), Ibrahim (Abraham), Musa (Moses), Isa (Jesus), Muhammad ﷺ\n\n**Key stories:**\n• **Adam** — first human and prophet, taught the names of all things\n• **Ibrahim** — built the Ka'bah with his son Ismail, father of monotheism\n• **Musa** — spoke to Allah directly, delivered the Israelites from Pharaoh\n• **Isa** — born miraculously to Maryam, will return before the Day of Judgment\n• **Yusuf** — sold into slavery by his brothers, rose to become a ruler in Egypt\n\nMuslims must believe in all prophets without discrimination between them.`,
    references: ['Surah An-Nisa 4:164', 'Surah Al-Baqarah 2:285'],
  },
  // ─── SIGNS OF THE HOUR ───────────────────────────────────────────────────────
  {
    keywords: ['signs of qiyamah', 'end times', 'dajjal', 'antichrist', 'mahdi', 'yajuj majuj', 'gog magog', 'signs of the hour', 'last day signs'],
    topic: 'Signs of the Last Hour',
    answer: `Islamic tradition describes minor and major signs before the Day of Judgment.\n\n**Minor signs (many have occurred):** widespread ignorance, time passing quickly, wealth becoming abundant, tall buildings, moral decay.\n\n**Major signs:**\n1. Appearance of the Dajjal (False Messiah/Antichrist)\n2. Descent of Isa (Jesus), who will kill the Dajjal\n3. Emergence of Ya'juj and Ma'juj (Gog and Magog)\n4. The Mahdi — a rightly-guided leader\n5. Three landslides (east, west, Arabia)\n6. A smoke covering the earth\n7. The sun rising from the west\n8. A fire driving people to the place of gathering\n\nOnly Allah knows the exact timing. (Sahih Muslim 2901)`,
    references: ['Sahih Muslim 2901', 'Surah Muhammad 47:18'],
  },
  // ─── HIJAB / MODESTY ─────────────────────────────────────────────────────────
  {
    keywords: ['hijab', 'modesty', 'veil', 'niqab', 'dress code', 'covering', 'awrah'],
    topic: 'Hijab & Modesty',
    answer: `Modesty (Haya) is a core Islamic value for both men and women.\n\n**For women:** covering the body except the face and hands (per majority opinion) in front of non-mahram men, with loose, non-transparent clothing.\n\n**For men:** covering from navel to knee at minimum, and dressing modestly at all times.\n\n**Purpose:** "Tell the believing women to lower their gaze and guard their modesty... and to draw their veils over their chests." (Surah An-Nur 24:31)\n\nHijab is both a physical covering and an attitude of modesty in speech, gaze, and behavior. Scholars differ on the niqab (face veil) — most agree it is recommended, some consider it obligatory.`,
    references: ['Surah An-Nur 24:31', 'Surah Al-Ahzab 33:59'],
  },
  // ─── JIHAD ────────────────────────────────────────────────────────────────────
  {
    keywords: ['jihad', 'struggle', 'holy war', 'greater jihad', 'lesser jihad'],
    topic: 'Jihad (Struggle)',
    answer: `Jihad means "struggle" or "striving" in the way of Allah — it is not limited to warfare.\n\n**Types of Jihad:**\n1. **Jihad an-Nafs (Greater Jihad)** — struggling against one's own ego, desires, and sins\n2. **Jihad against Shaytan** — resisting temptation\n3. **Jihad bil-Lisan** — speaking truth and enjoining good\n4. **Jihad bis-Sayf (Lesser Jihad)** — defensive armed struggle, governed by strict rules (no harming civilians, no destroying property, only defensive and state-sanctioned)\n\nThe Prophet ﷺ told returning soldiers: "We have returned from the lesser jihad to the greater jihad" — referring to the struggle against one's own soul. (Bayhaqi)\n\nIslam strictly forbids terrorism, killing innocents, and vigilante violence.`,
    references: ['Surah Al-Baqarah 2:190', 'Bayhaqi'],
  },
  // ─── BID'AH / INNOVATION ─────────────────────────────────────────────────────
  {
    keywords: ["bid'ah", 'bidah', 'innovation', 'religious innovation'],
    topic: "Bid'ah (Innovation)",
    answer: `Bid'ah refers to introducing new practices into the religion that have no basis in the Quran or Sunnah.\n\n"Whoever introduces into this matter of ours (Islam) that which is not part of it will have it rejected." (Bukhari 2697)\n\n**Types (per some scholars):**\n- **Bid'ah in worship/creed** — generally impermissible (e.g. inventing new rituals)\n- **Bid'ah in worldly matters** — permissible if beneficial and not against Sharia (e.g. technology, organizational methods)\n\nScholars differ on categorizing some cultural practices as bid'ah — always verify with a qualified scholar rather than assuming.`,
    references: ['Sahih Bukhari 2697', 'Sahih Muslim 1718'],
  },
  // ─── JANAZAH / FUNERAL ───────────────────────────────────────────────────────
  {
    keywords: ['janazah', 'funeral', 'burial', 'kafan', 'shroud', 'funeral prayer', 'death rites'],
    topic: 'Janazah (Funeral Rites)',
    answer: `Islamic funeral rites are a communal obligation (Fard Kifayah).\n\n**Steps:**\n1. **Ghusl (washing)** the body — usually 3 or 5 times with water and camphor\n2. **Kafan (shrouding)** — plain white cloth, 3 pieces for men, 5 for women\n3. **Salat al-Janazah** — funeral prayer performed standing, no bowing or prostration, with 4 Takbirs\n4. **Burial** — as soon as possible, body placed on its right side facing the Qibla\n\n**Etiquettes:** Avoid excessive wailing, keep the burial simple, recite Talqin/dua for the deceased, give Sadaqah Jariyah on their behalf.\n\n"Hasten with the funeral, for if the deceased was righteous, you are bringing him to goodness." (Bukhari 1315)`,
    references: ['Sahih Bukhari 1315', 'Sahih Muslim 945'],
  },
  // ─── ADHAN / MOSQUE ETIQUETTE ────────────────────────────────────────────────
  {
    keywords: ['adhan', 'azan', 'call to prayer', 'iqamah', 'mosque', 'masjid', 'etiquette'],
    topic: 'Adhan & Mosque Etiquette',
    answer: `The Adhan (call to prayer) announces each of the 5 daily prayers; the Iqamah is the shorter call just before the prayer begins.\n\n**Upon hearing the Adhan:**\n- Repeat after the caller (except "Hayya 'ala..." — respond with "La hawla wa la quwwata illa billah")\n- Send Salawat on the Prophet ﷺ afterward\n- Make dua — it is a time of answered prayer\n\n**Mosque etiquette:**\n- Enter with the right foot, saying the mosque-entry dua\n- Pray 2 rak'ahs (Tahiyyat al-Masjid) before sitting\n- Keep phones silent, maintain cleanliness, and avoid business talk inside\n- Straighten and fill the rows shoulder-to-shoulder for congregational prayer\n\n"Whoever says after hearing the Adhan: 'Allahumma Rabba hadhihi-d-da'wati...' — my intercession will be permitted for him on the Day of Judgment." (Bukhari 614)`,
    references: ['Sahih Bukhari 614', 'Sahih Muslim 850'],
  },
  // ─── EID & QURBANI ────────────────────────────────────────────────────────────
  {
    keywords: ['eid', 'qurbani', 'sacrifice', 'eid ul fitr', 'eid ul adha', 'udhiyah'],
    topic: 'Eid & Qurbani (Sacrifice)',
    answer: `Muslims celebrate two Eids each year:\n\n**Eid al-Fitr** — marks the end of Ramadan fasting. Zakat al-Fitr (a small charity) must be paid before the Eid prayer.\n\n**Eid al-Adha** — commemorates Ibrahim's willingness to sacrifice his son for Allah, and falls during the Hajj season (10th Dhul Hijjah).\n\n**Qurbani (Udhiyah) rules:**\n- Sacrifice a sheep/goat (1 share), or cow/camel (up to 7 shares)\n- The animal must be healthy and of a valid age\n- Meat is divided: 1/3 for family, 1/3 for relatives/friends, 1/3 for the poor\n- Obligatory (per Hanafi view) on those who meet the Nisab threshold\n\n"Their meat will not reach Allah, nor will their blood, but your piety will reach Him." (Surah Al-Hajj 22:37)`,
    references: ['Surah Al-Hajj 22:37', 'Sahih Bukhari 5545'],
  },
  // ─── PATIENCE / TRIALS ────────────────────────────────────────────────────────
  {
    keywords: ['patience', 'sabr', 'trial', 'test', 'illness', 'sickness', 'suffering', 'hardship life'],
    topic: 'Sabr (Patience) & Trials',
    answer: `Trials are a means of purification and elevation in Islam.\n\n"We will surely test you with something of fear and hunger and loss of wealth, lives, and fruits — but give good tidings to the patient." (Surah Al-Baqarah 2:155)\n\n**Types of Sabr:**\n1. Patience in obedience to Allah\n2. Patience in avoiding sin\n3. Patience during hardship and calamity\n\n**Rewards:**\n- "No fatigue, illness, sorrow, sadness, hurt, or distress befalls a Muslim, even a thorn's prick, but Allah expiates some of his sins for that." (Bukhari 5641)\n- The patient receive their reward without measure (Surah Az-Zumar 39:10)\n\nSupplicate with: **إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ** during calamity.`,
    references: ['Surah Al-Baqarah 2:155-157', 'Sahih Bukhari 5641'],
  },
  // ─── ISLAMIC CALENDAR ─────────────────────────────────────────────────────────
  {
    keywords: ['hijri', 'islamic calendar', 'lunar calendar', 'muharram', 'ashura', 'rabi al awwal', 'shaban'],
    topic: 'Islamic (Hijri) Calendar',
    answer: `The Islamic calendar is lunar, beginning with the Hijra (migration) of the Prophet ﷺ from Mecca to Madinah in 622 CE.\n\n**The 12 months:** Muharram, Safar, Rabi al-Awwal, Rabi al-Thani, Jumada al-Awwal, Jumada al-Thani, Rajab, Sha'ban, Ramadan, Shawwal, Dhul Qa'dah, Dhul Hijjah.\n\n**Notable dates:**\n- **10th Muharram (Ashura)** — fasting recommended, expiates sins of the previous year\n- **27th Rajab** — commemorates Isra and Mi'raj (Night Journey)\n- **15th Sha'ban** — Laylat al-Bara'ah (in some traditions)\n- **1st-10th Dhul Hijjah** — best 10 days of the year for good deeds\n\nCheck today's Hijri date on the Home screen of this app.`,
    references: ['Surah At-Tawbah 9:36', 'Sahih Muslim 1162'],
  },
  // ─── ISLAMIC FINANCE / BUSINESS ETHICS ───────────────────────────────────────
  {
    keywords: ['business ethics', 'trade', 'trading', 'honesty in business', 'weighing', 'fraud', 'cheating'],
    topic: 'Islamic Business Ethics',
    answer: `Islam places strong emphasis on honesty and fairness in trade.\n\n**Key principles:**\n- Full disclosure of defects in goods sold\n- Accurate weights and measures — "Woe to the defrauders who demand full measure when they buy, but give less when they sell." (Surah Al-Mutaffifin 83:1-3)\n- No Gharar (excessive uncertainty/deception) in contracts\n- No Riba (interest)\n- Mutual consent required for any transaction\n\n"The truthful and trustworthy merchant will be with the prophets, the truthful, and the martyrs." (Tirmidhi 1209)\n\nUse the Zakat & Ushr module to calculate dues on business inventory and profits.`,
    references: ['Surah Al-Mutaffifin 83:1-6', 'Jami Tirmidhi 1209'],
  },
  // ─── JINN ─────────────────────────────────────────────────────────────────────
  {
    keywords: ['jinn', 'genie', 'shaytan', 'devil', 'iblis', 'possession', 'evil eye', 'nazar'],
    topic: 'Jinn & the Unseen',
    answer: `Jinn are beings created from smokeless fire, mentioned throughout the Quran (Surah Al-Jinn is named after them).\n\n**Key facts:**\n- They have free will — some are believers, some disbelievers\n- Iblis (Shaytan) was a jinn who refused to prostrate to Adam out of arrogance\n- They cannot force a person to sin — they only whisper and tempt (Waswasa)\n\n**Protection from harm (including evil eye):**\n- Recite Ayat al-Kursi, the last 2 verses of Al-Baqarah, and Surahs Al-Falaq & An-Nas daily\n- Say Bismillah before eating, entering the home, and other daily actions\n- Ruqyah (Quranic recitation for healing) is a valid, Sunnah-based practice — avoid superstition or non-Islamic charms (amulets, tawiz with unknown content)`,
    references: ['Surah Al-Jinn 72', 'Surah Al-Falaq 113', 'Surah An-Nas 114'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── APP HELP — using Qitab-e-Noor's modules ───────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  {
    keywords: ['how to use quran', 'quran module', 'quran screen', 'quran feature', 'read quran app', 'quran audio', 'reciter'],
    topic: 'Using the Quran Module',
    answer: `The **Quran** module lets you read, listen to, and reflect on the Holy Quran.\n\n**Features:**\n- Search any Surah by name or number\n- Tap a Surah to read verse-by-verse with Arabic text and translation\n- Switch translation language and reciter in Settings (⚙️ icon)\n- Tap the bookmark icon on a verse to save it — view it later in My Library\n- Tap the pencil icon to add a personal reflection/note to any verse\n- Tap play (▶) in the header to listen to full Surah audio recitation`,
    references: [],
  },
  {
    keywords: ['how to use tasbih', 'tasbih module', 'tasbih screen', 'dhikr counter', 'counter feature', 'digital tasbih'],
    topic: 'Using the Tasbih Counter',
    answer: `The **Tasbih Counter** is your digital dhikr companion.\n\n**How it works:**\n- Tap the crescent button to count each dhikr\n- Choose a preset (SubhanAllah, Alhamdulillah, Allahu Akbar, etc.) from the dropdown — each has a target count\n- When you reach the target, the ring completes a "lap" with a haptic buzz\n- Tap "Reset Session" to save your session to history and start fresh\n- View past sessions (total count, rounds, duration) via the clock icon`,
    references: [],
  },
  {
    keywords: ['how to use zakat calculator', 'zakat module', 'zakat screen', 'zakat app', 'calculate zakat app', 'ushr calculator'],
    topic: 'Using the Zakat & Ushr Module',
    answer: `The **Zakat & Ushr** module has 3 tabs:\n\n1. **Zakat Calculator** — enter cash, gold, silver, investments, and debts. Tap "Calculate" to see your Nisab comparison and Zakat due (2.5% of net wealth if above Nisab). Save results to view calculation history.\n2. **Ushr (Crops)** — enter your crop's value and select the water source (rain-fed 10%, irrigated 5%, mixed 7.5%) to get the Ushr due.\n3. **Zakat AI** — ask specific questions about Zakat rules and get instant answers, or tap one of the quick questions.`,
    references: [],
  },
  {
    keywords: ['how to use prayer times', 'prayer times module', 'qibla compass app', 'qibla module', 'change city prayer', 'prayer app feature'],
    topic: 'Using Prayer Times & Qibla',
    answer: `The **Prayer Times** module has 2 tabs:\n\n1. **Prayer Times** — shows today's Fajr, Dhuhr, Asr, Maghrib, and Isha times for your set city, with the next prayer highlighted. Tap "Change" to update your city/country.\n2. **Qibla Compass** — tap "Find My Qibla" to grant location access; a live animated compass shows the exact direction to the Ka'bah plus your distance to Mecca. Rotate your phone in a figure-8 motion if the compass needs calibration.`,
    references: [],
  },
  {
    keywords: ['how to use duas', 'duas module', 'duas screen', 'dua app feature', 'favorite duas', 'listen dua'],
    topic: 'Using the Duas Module',
    answer: `The **Duas** module organizes supplications by category: Morning, Evening, Travel, Sleep, and Hardship.\n\n**Features:**\n- Tap a category chip to filter duas\n- Tap a dua card to see the full Arabic text, transliteration, translation, and virtue/benefit\n- Tap the star icon to save a dua to Favorites (also visible in My Library)\n- Tap the speaker icon to hear the Arabic recited aloud via text-to-speech`,
    references: [],
  },
  {
    keywords: ['how to use hadith', 'hadith module', 'hadith screen', 'hadith app feature', 'hadith grading', 'hadith chain'],
    topic: 'Using the Hadith Module',
    answer: `The **Hadith** module lets you browse major collections: Sahih Bukhari, Sahih Muslim, Abu Dawud, Tirmidhi, and Ibn Majah.\n\n**Features:**\n- Switch collections via the collection picker (top right)\n- Filter by grade: Sahih, Hasan, Da'if, or Mawdu' using the chips\n- Search hadith text with the search bar\n- Tap "View Chain" on any hadith to see its narrator chain (Isnad) from the Prophet ﷺ to the compiler`,
    references: [],
  },
  {
    keywords: ['how to use reminders', 'reminders module', 'reminders screen', 'notification app feature', 'custom reminder', 'prayer notification'],
    topic: 'Using the Reminders Module',
    answer: `The **Reminders** module manages notifications.\n\n**Features:**\n- Toggle switches for each of the 5 daily prayers to enable reminder notifications\n- Tap "Add" under Custom Reminders to create your own (title, time, message) — e.g. Quran reading, dhikr session\n- Enable/disable or delete custom reminders anytime\n- If notifications are disabled, tap the amber banner at the top to grant permission`,
    references: [],
  },
  {
    keywords: ['how to use generator', 'content creator module', 'generator screen', 'islamic graphics', 'share verse image', 'create post app'],
    topic: 'Using the Content Creator Module',
    answer: `The **Content Creator** module designs shareable Islamic graphics.\n\n**How it works:**\n1. Pick a template: Quranic Verse, Hadith Card, Dua Card, or Islamic Reminder\n2. Type your content and citation/source\n3. Tap "Preview" to see the styled card, or use "Quick Fill" for ready-made examples\n4. Tap "Share" to send it to any app on your device`,
    references: [],
  },
  {
    keywords: ['how to use bookmarks', 'my library', 'bookmarks module', 'bookmarks screen', 'saved items app'],
    topic: 'Using My Library (Bookmarks)',
    answer: `**My Library** brings together everything you've saved across the app: bookmarked Quran verses, personal notes, and favorite duas.\n\nUse the tabs (All, Quran, Hadith, Duas, Notes) to filter, search by keyword, and swipe-tap the trash icon to remove any saved item.`,
    references: [],
  },
  {
    keywords: ['how to use ai chat', 'islamic ai module', 'ai assistant app', 'ai chat screen', 'chatbot app'],
    topic: 'Using the Islamic AI Assistant',
    answer: `The **Islamic AI Assistant** answers questions about Islam using a built-in knowledge base, plus a live AI connection when online.\n\n**Tips:**\n- Type any question, or tap a suggested question to get started\n- Tap the list icon (top right) to browse all topics\n- Answers include source references (Quran/Hadith) when available\n- For detailed personal fiqh rulings, always consult a qualified scholar`,
    references: [],
  },
];

// ─── SCORING ENGINE ─────────────────────────────────────────────────────────
const scoreEntry = (entry, q, words) => {
  let score = 0;
  for (const keyword of entry.keywords) {
    if (q.includes(keyword)) {
      // longer keywords = more specific match = higher score
      score += keyword.split(' ').length * 10;
    }
  }
  // also score by individual word matches against keywords
  for (const word of words) {
    if (word.length < 3) continue;
    for (const keyword of entry.keywords) {
      if (keyword.includes(word)) score += 1;
    }
  }
  return score;
};

// Ranked retrieval — used for RAG grounding (top matches fed to Claude as context).
export const searchKnowledgeBase = (question, topN = 3) => {
  if (!question || !question.trim()) return [];
  const q = question.toLowerCase();
  const words = q.split(/\s+/);

  return KNOWLEDGE_BASE
    .map(entry => ({ entry, score: scoreEntry(entry, q, words) }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
};

export const queryAI = (question) => {
  const [top] = searchKnowledgeBase(question, 1);
  return top ? top.entry : null;
};
