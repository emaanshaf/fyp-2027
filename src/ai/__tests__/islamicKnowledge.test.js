import {
  KNOWLEDGE_BASE,
  searchKnowledgeBase,
  queryAI,
  relatedTopics,
  TOPIC_CATEGORIES,
  BROWSE_CATEGORIES,
  TOTAL_TOPICS,
  topicCategory,
} from '../islamicKnowledge';

const topTopic = question => searchKnowledgeBase(question, 1)[0]?.entry.topic;

describe('knowledge base shape', () => {
  it('covers well over a hundred topics', () => {
    expect(KNOWLEDGE_BASE.length).toBeGreaterThan(150);
  });

  it('has no duplicate topic names', () => {
    const topics = KNOWLEDGE_BASE.map(entry => entry.topic);
    expect(new Set(topics).size).toBe(topics.length);
  });

  it('gives every entry a non-empty answer and at least one keyword', () => {
    for (const entry of KNOWLEDGE_BASE) {
      expect(entry.keywords.length).toBeGreaterThan(0);
      expect(entry.answer.length).toBeGreaterThan(20);
      expect(entry.keywords.every(k => typeof k === 'string' && k.length > 0)).toBe(true);
    }
  });
});

describe('topic browser data', () => {
  it('files every knowledge entry under exactly one category', () => {
    const filed = BROWSE_CATEGORIES.flatMap(category => category.topics.map(item => item.topic));
    expect(filed.sort()).toEqual(KNOWLEDGE_BASE.map(entry => entry.topic).sort());
    expect(new Set(filed).size).toBe(filed.length);
  });

  it('keeps category ids and titles unique', () => {
    expect(new Set(TOPIC_CATEGORIES.map(c => c.id)).size).toBe(TOPIC_CATEGORIES.length);
    expect(new Set(TOPIC_CATEGORIES.map(c => c.title)).size).toBe(TOPIC_CATEGORIES.length);
  });

  it('gives every category a usable number of topics and an icon', () => {
    for (const category of BROWSE_CATEGORIES) {
      expect(category.topics.length).toBeGreaterThanOrEqual(5);
      expect(category.icon).toBeTruthy();
      expect(category.accent).toBeTruthy();
    }
  });

  it('resolves a category for every topic', () => {
    for (const entry of KNOWLEDGE_BASE) {
      expect(topicCategory(entry.topic)).toBeTruthy();
    }
    expect(topicCategory('Not A Real Topic')).toBeNull();
  });

  it('reports the same total the browser displays', () => {
    expect(TOTAL_TOPICS).toBe(KNOWLEDGE_BASE.length);
  });
});

describe('browsing topics', () => {
  // These are exactly the strings AIChatScreen sends when a topic chip is
  // tapped. One mismatch means the chip opens a different topic than its label.
  it('opens the matching answer for every chip in the app', () => {
    const wrong = [];
    for (const entry of KNOWLEDGE_BASE) {
      const found = topTopic(`Tell me about ${entry.topic}`);
      if (found !== entry.topic) wrong.push(`${entry.topic} -> ${found || 'nothing'}`);
    }
    expect(wrong).toEqual([]);
  });
});

describe('search quality', () => {
  it.each([
    ['What is zakat?', 'Zakat'],
    ['How do I perform wudu?', 'Purification (Wudu & Ghusl)'],
    ['What are the Five Pillars of Islam?', 'Pillars of Islam'],
    ['I missed Fajr, what do I do?', 'Missed Prayers (Qada)'],
    ['Can I fast if I am sick?', 'Fasting Exemptions & Make-Up'],
    ['Sunnah prayers before fajr', 'Voluntary Prayers'],
    ['How to memorise Quran', 'Quran Memorization (Hifz)'],
    ['My mother died, what dua can I make?', 'Parents After Death'],
    ['What is the day of judgement?', 'Day of Judgement'],
    ['Can I pray sitting down?', 'Praying While Sick (Sitting & Lying)'],
    ['What should I say when I sneeze?', 'Sneezing & Yawning'],
    ['What is ibadah?', 'Ibadah (Worship)'],
    ['Can I get a tattoo?', 'Tattoos & Piercings'],
    ['Does tattoo break wudu?', 'Tattoos & Piercings'],
    ['How can I stop sinning?', 'Tawbah (Repentance)'],
    ['How to control my tongue?', 'Backbiting & Gossip'],
    ['How to be grateful?', 'Gratitude (Shukr)'],
    ['I am interested in Islam', 'Becoming Muslim (Shahada)'],
    ['What is the ruling on cryptocurrency?', 'Islamic Finance in Practice'],
    ['Is investing in stocks halal?', 'Islamic Finance in Practice'],
    ['What does aurat mean?', 'Hijab & Modesty'],
  ])('%p finds %p', (question, expected) => {
    expect(topTopic(question)).toBe(expected);
  });

  it.each([
    ['namaz', 'Salah (Prayer)'],
    ['roza', 'Ramadan & Fasting'],
    ['zakaat', 'Zakat'],
  ])('expands the transliteration %p', (word, expected) => {
    expect(topTopic(`tell me about ${word}`)).toBe(expected);
  });

  it('prefers a specific topic over the general Halal & Haram overview', () => {
    expect(topTopic('Is smoking haram?')).toBe('Smoking, Vaping & Drugs');
    expect(topTopic('Is music haram?')).toBe('Music & Entertainment');
  });

  it('does not treat curiosity as a question about interest', () => {
    expect(topTopic('I am interested in Islam')).not.toBe('Riba (Interest)');
  });

  it('returns nothing for a genuinely unrelated question', () => {
    expect(searchKnowledgeBase('zzzzqqq unmatchable gibberish string')).toEqual([]);
    expect(queryAI('zzzzqqq unmatchable gibberish string')).toBeNull();
  });
});

// The expanded library is only useful if ordinary questions reach the new
// entries. Every topic added in the scope expansion gets at least one plain
// question here, so adding entries that collide with existing keywords is
// caught rather than silently misrouting people.
describe('expanded library retrieval', () => {
  it.each([
    // Seerah & history
    ['What is the Hijrah?', 'The Hijrah'],
    ['Who were the Sahabah?', 'The Sahabah (Companions)'],
    ['Who were the Rightly Guided Caliphs?', 'Rightly Guided Caliphs'],
    ['Tell me about the Battle of Badr', 'Battle of Badr'],
    ['Why is Al-Aqsa important?', 'Al-Aqsa & Jerusalem'],
    ['What are the Divine Books?', 'Divine Books (Torah, Zabur, Injil)'],
    ['How should Muslims treat People of the Book?', 'People of the Book & Interfaith Relations'],
    // Worship
    ['How do I pray step by step?', 'Salah Step by Step'],
    ['How do I pray Tahajjud?', 'Tahajjud & Night Prayer'],
    ['What is Witr prayer?', 'Witr Prayer'],
    ['What is Sujud al-Tilawah?', 'Sujud al-Tilawah (Prostration of Recitation)'],
    ['What is Itikaf?', "I'tikaf (Ramadan Retreat)"],
    ['Should I fast on Mondays and Thursdays?', 'Fasting Mondays, Thursdays & White Days'],
    ['How do I perform Hajj step by step?', 'Hajj Step by Step'],
    ['How do I perform Umrah?', 'Umrah Guide'],
    ['What are the morning and evening adhkar?', 'Morning & Evening Adhkar'],
    ['How do I pray Istikhara?', 'Istikhara (Seeking Guidance)'],
    // Quran & Hadith
    ['Tell me about Surah Al-Mulk', 'Surah Al-Mulk'],
    ['What are the Three Quls?', 'The Three Quls'],
    ['What is tafsir?', 'Understanding Tafsir'],
    ['Does the Quran mention science?', 'Quran & Science'],
    ['What is a weak hadith?', 'Weak & Fabricated Hadith'],
    // Character & wellbeing
    ['How do I deal with envy?', 'Hasad (Envy & Jealousy)'],
    ['What is kibr?', 'Kibr (Pride & Arrogance)'],
    ['What is ikhlas?', 'Sincerity (Ikhlas)'],
    ['I feel lonely', 'Loneliness & Belonging'],
    ['I lost my mother and feel grief', 'Grief & Loss'],
    ['I compare myself to others on social media', 'Self-Esteem & Comparison'],
    ['How do I stop wasting time?', 'Time Management & Barakah'],
    ['I am addicted to pornography', 'Pornography & Compulsive Habits'],
    // Family & society
    ['How do I raise my children as Muslims?', 'Raising Children (Tarbiyah)'],
    ['How do I maintain family ties?', 'Family Ties (Silat al-Rahm)'],
    ['What are the rights of neighbours?', 'Kindness to Neighbours'],
    ['How do I care for elderly parents?', 'Caring for Elderly Parents'],
    ['What should I do about domestic abuse?', 'Domestic Abuse & Safety'],
    ['How do I prepare for marriage?', 'Marriage Preparation'],
    ['What is adoption in Islam?', 'Adoption & Fostering (Kafalah)'],
    ['What does Islam say about racism?', 'Racism & Equality'],
    // Daily life & halal
    ['Is alcohol haram?', 'Alcohol & Intoxication'],
    ['Is gambling haram?', 'Gambling & Lotteries'],
    ['What are the rules for clothing?', 'Clothing & Adornment'],
    ['What are the sunnahs of eating?', 'Food & Eating Sunnahs'],
    ['What are the duas for travel?', 'Travel Etiquette & Duas'],
    ['What does Islam say about the environment?', 'Environment & Stewardship'],
    // Money & work
    ['How do I earn halal income?', 'Halal Income & Jobs'],
    ['I am in debt and stressed', 'Debt & Financial Stress'],
    ['Is bribery haram?', 'Bribery & Corruption'],
    ['What is workplace ethics in Islam?', 'Workplace Ethics & Excellence'],
    // App guide
    ['How do I use the Islamic News module?', 'Using the Islamic News Module'],
    ['How do the communities work?', 'Using the Communities Module'],
    ['How do quizzes and courses work?', 'Using the Learning & Quiz Modules'],
    ['How do I download content for offline use?', 'Offline Downloads & Backup'],
  ])('%p reaches %p', (question, expected) => {
    expect(topTopic(question)).toBe(expected);
  });
});

describe('safety-critical questions', () => {
  it.each([
    'I want to kill myself',
    'I want to end my life',
    'I am feeling suicidal',
    'I want to hurt myself',
  ])('routes %p to the mental-health answer', question => {
    const entry = queryAI(question);
    expect(entry.topic).toBe('Anxiety, Depression & Suicidal Thoughts');
  });

  it('tells a person in crisis to seek urgent human help', () => {
    const { answer } = queryAI('I want to kill myself');
    expect(answer).toMatch(/emergency services|crisis line/i);
    expect(answer).toMatch(/trusted person|not alone|cannot provide emergency care/i);
  });
});

describe('relatedTopics', () => {
  it('suggests distinct topics', () => {
    const related = relatedTopics('Zakat', 3);
    expect(related).not.toContain('Zakat');
    expect(new Set(related).size).toBe(related.length);
  });

  it('returns an empty list for an unknown topic', () => {
    expect(relatedTopics('Not A Real Topic')).toEqual([]);
  });
});
