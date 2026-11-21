// The Seerah — the life of Prophet Muhammad ﷺ, as a dated timeline.
//
// Extracted from the screen and expanded from 15 events to a fuller account
// covering the Makkan period, the Hijrah, the Madinan years and the farewell.
// Colours are theme *token names*, resolved by the screen, so the timeline
// follows the active palette.
//
// Dates for this period are given as they are conventionally reported; where
// sources differ the commonly cited year is used.

export const SEERAH_EVENTS = [
  // ── Makkah: before prophethood ──────────────────────────────────────────
  { year: '570 CE', title: 'Birth in Makkah', desc: 'Born in the Year of the Elephant into the clan of Banu Hashim. His father Abdullah had already died.', icon: 'star-outline', color: 'gold', period: 'Early life' },
  { year: '574 CE', title: 'Years with Halimah', desc: 'Raised in his early years among the Banu Sa\'d in the desert, as was the custom of Makkan families.', icon: 'leaf-outline', color: 'emerald', period: 'Early life' },
  { year: '576 CE', title: 'Death of his mother', desc: 'Aminah died at al-Abwa when he was about six. He was taken in by his grandfather Abdul-Muttalib.', icon: 'heart-dislike-outline', color: 'pink', period: 'Early life' },
  { year: '578 CE', title: 'Death of Abdul-Muttalib', desc: 'His grandfather died two years later, and his uncle Abu Talib became his guardian and lifelong protector.', icon: 'people-outline', color: 'purple', period: 'Early life' },
  { year: '582 CE', title: 'Journey to Syria', desc: 'At about twelve he travelled with Abu Talib\'s caravan, where the monk Bahira is said to have recognised signs of prophethood.', icon: 'navigate-outline', color: 'cyan', period: 'Early life' },
  { year: '590 CE', title: 'Hilf al-Fudul', desc: 'Joined a pact of Makkan chiefs to defend the wronged. Years later he said he would still honour such a pact in Islam.', icon: 'hand-left-outline', color: 'emerald', period: 'Early life' },
  { year: '595 CE', title: 'Marriage to Khadijah (RA)', desc: 'Married Khadijah bint Khuwaylid, a respected merchant who had employed him for his honesty. She became the first believer.', icon: 'heart-outline', color: 'pink', period: 'Early life' },
  { year: '605 CE', title: 'Rebuilding the Kaaba', desc: 'The clans disputed who would place the Black Stone. He settled it by having them carry it together on a cloak.', icon: 'cube-outline', color: 'amber', period: 'Early life' },

  // ── Prophethood in Makkah ───────────────────────────────────────────────
  { year: '610 CE', title: 'The first revelation', desc: 'In the Cave of Hira, Jibreel (AS) brought the opening verses of Surah Al-Alaq: "Read, in the name of your Lord."', icon: 'book-outline', color: 'gold', period: 'Makkan period' },
  { year: '610 CE', title: 'The first believers', desc: 'Khadijah (RA), Ali (RA), Zayd (RA) and Abu Bakr (RA) accepted Islam in the earliest days.', icon: 'people-circle-outline', color: 'emerald', period: 'Makkan period' },
  { year: '613 CE', title: 'The call made public', desc: 'He called openly from Mount Safa. The Quraysh turned against him, and persecution of the weakest Muslims began.', icon: 'megaphone-outline', color: 'blue', period: 'Makkan period' },
  { year: '615 CE', title: 'Migration to Abyssinia', desc: 'A group of Muslims sought refuge with the Christian king An-Najashi, who refused to hand them back.', icon: 'boat-outline', color: 'cyan', period: 'Makkan period' },
  { year: '616 CE', title: 'The boycott of Banu Hashim', desc: 'The Quraysh cut off trade and marriage with his clan for roughly three years, causing severe hunger.', icon: 'lock-closed-outline', color: 'red', period: 'Makkan period' },
  { year: '619 CE', title: 'The Year of Sorrow', desc: 'Khadijah (RA) and Abu Talib both died, leaving him without his closest support and his protection in Makkah.', icon: 'cloudy-outline', color: 'purple', period: 'Makkan period' },
  { year: '619 CE', title: 'Rejection at Taif', desc: 'He sought support in Taif and was driven out. Asked whether he wanted the town destroyed, he prayed for their descendants instead.', icon: 'rainy-outline', color: 'amber', period: 'Makkan period' },
  { year: '620 CE', title: 'Isra and Miraj', desc: 'The night journey to Jerusalem and the ascension through the heavens, during which the five daily prayers were prescribed.', icon: 'moon-outline', color: 'gold', period: 'Makkan period' },
  { year: '621 CE', title: 'First pledge at Aqabah', desc: 'Twelve men of Yathrib pledged allegiance, and Mus\'ab ibn Umayr (RA) was sent to teach them.', icon: 'hand-right-outline', color: 'emerald', period: 'Makkan period' },
  { year: '622 CE', title: 'Second pledge at Aqabah', desc: 'Seventy-three men and two women pledged to protect him, opening the way for the migration.', icon: 'shield-outline', color: 'blue', period: 'Makkan period' },

  // ── Madinah ─────────────────────────────────────────────────────────────
  { year: '622 CE', title: 'The Hijrah', desc: 'He migrated to Yathrib with Abu Bakr (RA), sheltering in the Cave of Thawr on the way. The city became Madinah, and the year began the Islamic calendar.', icon: 'walk-outline', color: 'emerald', period: 'Madinan period' },
  { year: '622 CE', title: 'Masjid an-Nabawi and brotherhood', desc: 'He built the mosque and paired each Muhajir with an Ansari host, binding the community together.', icon: 'business-outline', color: 'gold', period: 'Madinan period' },
  { year: '622 CE', title: 'The Constitution of Madinah', desc: 'A written compact setting out the rights and duties of Muslims, Jews and other groups as one polity.', icon: 'document-text-outline', color: 'cyan', period: 'Madinan period' },
  { year: '624 CE', title: 'The qiblah changes', desc: 'The direction of prayer turned from Jerusalem to the Kaaba in Makkah.', icon: 'compass-outline', color: 'purple', period: 'Madinan period' },
  { year: '624 CE', title: 'Battle of Badr', desc: 'Roughly 313 Muslims met a force some three times larger and prevailed decisively.', icon: 'shield-checkmark-outline', color: 'blue', period: 'Madinan period' },
  { year: '625 CE', title: 'Battle of Uhud', desc: 'A reversal after archers left their post. Hamza (RA) was killed. The lesson of obedience was taken deeply.', icon: 'alert-circle-outline', color: 'amber', period: 'Madinan period' },
  { year: '627 CE', title: 'Battle of the Trench', desc: 'A confederate siege was met by digging a trench, on Salman al-Farisi\'s (RA) advice. The siege broke without a general battle.', icon: 'construct-outline', color: 'purple', period: 'Madinan period' },
  { year: '628 CE', title: 'Treaty of Hudaybiyyah', desc: 'A ten-year truce that looked like a concession but opened the way for mass acceptance of Islam. The Quran called it a clear victory.', icon: 'ribbon-outline', color: 'emerald', period: 'Madinan period' },
  { year: '628 CE', title: 'Letters to the kings', desc: 'Envoys carried invitations to Islam to Heraclius, Chosroes, the Negus and the ruler of Egypt.', icon: 'mail-outline', color: 'cyan', period: 'Madinan period' },
  { year: '628 CE', title: 'Khaybar', desc: 'The fortresses of Khaybar were taken, settling a long-standing source of hostility toward Madinah.', icon: 'flag-outline', color: 'blue', period: 'Madinan period' },
  { year: '629 CE', title: 'The fulfilled pilgrimage', desc: 'Under the terms of Hudaybiyyah, the Muslims performed umrah in Makkah for the first time.', icon: 'walk-outline', color: 'gold', period: 'Madinan period' },
  { year: '629 CE', title: 'Battle of Mutah', desc: 'A force met a far larger Byzantine army near the Syrian frontier; Khalid ibn al-Walid (RA) withdrew the army intact.', icon: 'swap-horizontal-outline', color: 'amber', period: 'Madinan period' },
  { year: '630 CE', title: 'The conquest of Makkah', desc: 'Makkah was entered almost without bloodshed. The idols were cleared from the Kaaba, and he told the Quraysh: "Go, you are free."', icon: 'trophy-outline', color: 'gold', period: 'Madinan period' },
  { year: '630 CE', title: 'Hunayn and Taif', desc: 'After an initial rout at Hunayn the Muslims regrouped and prevailed; the spoils were distributed to soften hearts.', icon: 'triangle-outline', color: 'purple', period: 'Madinan period' },
  { year: '630 CE', title: 'The expedition to Tabuk', desc: 'A difficult march north in extreme heat. No battle followed, but it demonstrated the community\'s resolve.', icon: 'sunny-outline', color: 'red', period: 'Madinan period' },
  { year: '631 CE', title: 'The Year of Delegations', desc: 'Tribes came from across Arabia to accept Islam, and the peninsula was largely united.', icon: 'people-outline', color: 'emerald', period: 'Madinan period' },
  { year: '632 CE', title: 'The Farewell Pilgrimage', desc: 'He performed hajj with tens of thousands and delivered the Farewell Sermon at Arafat, affirming the sanctity of life, property and the equality of all people.', icon: 'megaphone-outline', color: 'gold', period: 'Farewell' },
  { year: '632 CE', title: 'His passing', desc: 'He died in Madinah in the chamber of Aisha (RA), aged about 63, having completed the message entrusted to him.', icon: 'moon-outline', color: 'purple', period: 'Farewell' },
];

/** The four phases the timeline groups into, in order. */
export const SEERAH_PERIODS = ['Early life', 'Makkan period', 'Madinan period', 'Farewell'];

export default SEERAH_EVENTS;
