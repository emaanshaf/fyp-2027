// The twenty-five prophets named in the Quran, in canonical order.
//
// The screen previously listed seventeen while its header claimed twenty-five;
// the eight missing (Idris, Hud, Salih, Lut, Shu'ayb, Dhul-Kifl, Ilyas and
// Al-Yasa) are restored here, and the count is derived from the array so the
// two cannot drift apart again.

export const PROPHETS = [
  { id: 'adam', name: 'Adam (AS)', title: 'The First Human', desc: 'Created from clay. The first human being and the first prophet. Taught the names of all things.', lesson: 'Knowledge is the foundation of humanity.', icon: 'globe', color: 'gold' },
  { id: 'idris', name: 'Idris (AS)', title: 'The Upright One', desc: 'Raised to a high station by Allah. Described in the Quran as truthful and patient.', lesson: 'Patience and truthfulness raise a person in rank.', icon: 'trending-up', color: 'cyan' },
  { id: 'nuh', name: 'Nuh (AS)', title: 'The Patient Caller', desc: 'Called his people to Allah for 950 years. Built the ark and was saved from the flood.', lesson: 'Persistence in calling to truth, however long it takes.', icon: 'water', color: 'blue' },
  { id: 'hud', name: 'Hud (AS)', title: 'Sent to Ad', desc: 'Sent to the people of Ad, who were powerful builders. They rejected him and were destroyed by a furious wind.', lesson: 'Strength without gratitude leads to ruin.', icon: 'thunderstorm', color: 'purple' },
  { id: 'salih', name: 'Salih (AS)', title: 'Sent to Thamud', desc: 'Sent to Thamud with the she-camel as a sign. They hamstrung her and were seized by the earthquake.', lesson: 'Rejecting clear signs carries a cost.', icon: 'alert-circle', color: 'amber' },
  { id: 'ibrahim', name: 'Ibrahim (AS)', title: 'The Friend of Allah', desc: 'Broke the idols of his people. Was thrown into fire and saved by Allah. Built the Kaaba with Ismail (AS).', lesson: 'Complete trust in Allah, even against all odds.', icon: 'flame', color: 'amber' },
  { id: 'lut', name: 'Lut (AS)', title: 'The Warner', desc: 'Nephew of Ibrahim (AS). Warned his people against their transgressions and was saved with his family.', lesson: 'Standing for what is right even when alone.', icon: 'shield-half', color: 'red' },
  { id: 'ismail', name: 'Ismail (AS)', title: 'The Sacrifice', desc: 'Willingly submitted to Allah\'s command for sacrifice. Helped build the Kaaba. Ancestor of the Prophet Muhammad ﷺ.', lesson: 'Obedience to Allah above all else.', icon: 'heart', color: 'pink' },
  { id: 'ishaq', name: 'Ishaq (AS)', title: 'The Blessed Son', desc: 'Son of Ibrahim (AS), born to Sarah in her old age. Father of Yaqub (AS).', lesson: 'Allah\'s promises arrive in their own time.', icon: 'star', color: 'emerald' },
  { id: 'yaqub', name: 'Yaqub (AS)', title: 'Father of Bani Israil', desc: 'Father of twelve sons who became the tribes of Israel. Bore the loss of Yusuf (AS) with beautiful patience.', lesson: 'Patience through family trials.', icon: 'people', color: 'purple' },
  { id: 'yusuf', name: 'Yusuf (AS)', title: 'The Truthful', desc: 'Thrown into a well by his brothers and sold into slavery. Rose to authority in Egypt and forgave them.', lesson: 'Allah\'s plan is always the best.', icon: 'sunny', color: 'gold' },
  { id: 'ayyub', name: 'Ayyub (AS)', title: 'The Patient', desc: 'Lost his wealth, children and health, yet never complained of his Lord. Restored in full.', lesson: 'Patience in the face of immense suffering.', icon: 'medkit', color: 'red' },
  { id: 'shuayb', name: "Shu'ayb (AS)", title: 'Sent to Madyan', desc: 'Sent to the people of Madyan, who cheated in weights and measures. Called them to honest dealing.', lesson: 'Honesty in trade is part of faith.', icon: 'scale', color: 'emerald' },
  { id: 'musa', name: 'Musa (AS)', title: 'The Speaker with Allah', desc: 'Confronted Pharaoh, led Bani Israil out of Egypt, and received the Torah. Spoke directly with Allah.', lesson: 'Courage in standing up for truth.', icon: 'flash', color: 'blue' },
  { id: 'harun', name: 'Harun (AS)', title: 'The Helper', desc: 'Brother of Musa (AS), given eloquence of speech. Supported him throughout his mission.', lesson: 'Supporting others in doing good.', icon: 'hand-left', color: 'emerald' },
  { id: 'dhulkifl', name: 'Dhul-Kifl (AS)', title: 'The One of the Pledge', desc: 'Named among the patient and the righteous. Kept every promise he made.', lesson: 'Keeping your word is a mark of the righteous.', icon: 'ribbon', color: 'cyan' },
  { id: 'dawud', name: 'Dawud (AS)', title: 'The King & Psalmist', desc: 'Given the Zabur. A just king and warrior; the mountains and birds joined his praise.', lesson: 'Balance between power and worship.', icon: 'musical-notes', color: 'purple' },
  { id: 'sulaiman', name: 'Sulaiman (AS)', title: 'The Wise King', desc: 'Son of Dawud (AS). Given a kingdom like no other, and understanding of the speech of birds and jinn.', lesson: 'Wisdom is the greatest gift.', icon: 'earth', color: 'cyan' },
  { id: 'ilyas', name: 'Ilyas (AS)', title: 'The Caller to Tawhid', desc: 'Called his people away from the idol Baal and back to the worship of Allah alone.', lesson: 'Worship belongs to Allah alone.', icon: 'megaphone', color: 'amber' },
  { id: 'alyasa', name: "Al-Yasa (AS)", title: 'The Successor', desc: 'Succeeded Ilyas (AS) and continued his call. Counted among the excellent.', lesson: 'Carrying forward the work of those before you.', icon: 'git-branch', color: 'blue' },
  { id: 'yunus', name: 'Yunus (AS)', title: 'The Companion of the Whale', desc: 'Left his people without permission and was swallowed by the whale. Called on Allah in the darkness and was delivered.', lesson: 'Never give up on Allah\'s mercy.', icon: 'fish', color: 'blue' },
  { id: 'zakariya', name: 'Zakariya (AS)', title: 'The Devoted', desc: 'Old and childless, he called upon his Lord in secret and was granted Yahya (AS).', lesson: 'Allah\'s power is beyond human limits.', icon: 'person', color: 'emerald' },
  { id: 'yahya', name: 'Yahya (AS)', title: 'The Forerunner', desc: 'Given wisdom while still a child. Prepared the way for Isa (AS).', lesson: 'Sincerity from the earliest age.', icon: 'book', color: 'gold' },
  { id: 'isa', name: 'Isa (AS)', title: 'The Messiah', desc: 'Born to Maryam (AS) without a father. Given the Injeel and spoke from the cradle.', lesson: 'Miracles are signs of Allah, not divinity.', icon: 'sparkles', color: 'gold' },
  { id: 'muhammad', name: 'Muhammad ﷺ', title: 'The Final Messenger', desc: 'The seal of all prophets. Received the Quran and perfected the religion of Islam. A mercy to all the worlds.', lesson: 'The perfect example for all humanity.', icon: 'moon', color: 'gold' },
];

export default PROPHETS;
