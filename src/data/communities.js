// Starter circles for the Communities screen.
//
// These are prompts, not live members. The app has no community server yet and
// the screen says so plainly: circles and posts are stored on the device. The
// prompts give a new circle something to discuss without inventing fake people.

export const COMMUNITY_CIRCLES = [
  {
    id: 'quran-companions',
    name: 'Qur’an Companions',
    nameUr: 'قرآن کے ساتھی',
    category: 'quran',
    icon: 'book-outline',
    accent: 'gold',
    description:
      'A circle for slow, steady reading. Share the ayah you are sitting with and what it changed in your week.',
    prompts: [
      'Which surah are you reading this week, and which ayah stopped you?',
      'What is one verse you have memorised this month? Post it with its reference.',
      'Share a tafsir passage that made an ayah clearer to you.',
    ],
  },
  {
    id: 'new-muslims',
    name: 'New Muslims Circle',
    nameUr: 'نئے مسلمانوں کی محفل',
    category: 'new',
    icon: 'heart-outline',
    accent: 'emerald',
    description:
      'A gentle place for people who have recently accepted Islam, and for those supporting them. No question is too basic.',
    prompts: [
      'What was the first thing about Islam that made sense to you?',
      'Which part of learning to pray feels hardest right now?',
      'Share one small habit that has helped you since you began.',
    ],
  },
  {
    id: 'sisters-halaqah',
    name: 'Sisters’ Halaqah',
    nameUr: 'بہنوں کی حلقہ',
    category: 'sisters',
    icon: 'flower-outline',
    accent: 'pink',
    description:
      'A private study circle for women: worship, family, knowledge and the questions that are easier to ask among sisters.',
    prompts: [
      'Which book or lecture has helped your relationship with salah?',
      'How do you protect a quiet moment for dhikr in a busy home?',
      'Share a dua that has carried you through a difficult season.',
    ],
  },
  {
    id: 'youth-halaqah',
    name: 'Youth Halaqah',
    nameUr: 'نوجوانوں کی حلقہ',
    category: 'youth',
    icon: 'people-outline',
    accent: 'cyan',
    description:
      'For students and young professionals balancing faith, study, work and a very loud world.',
    prompts: [
      'How do you keep Fajr in a semester full of late nights?',
      'What is one misconception about Islam you have had to explain at school or work?',
      'Share a halal hobby or project you are proud of.',
    ],
  },
  {
    id: 'seerah-club',
    name: 'Seerah Book Club',
    nameUr: 'سیرت کا مطالعہ',
    category: 'seerah',
    icon: 'footsteps-outline',
    accent: 'blue',
    description:
      'Read one section of the Prophet’s life each week and discuss what it asks of us now.',
    prompts: [
      'Which moment of the Seerah gives you courage in a difficult situation?',
      'What did the Prophet ﷺ teach us about treating people who disagree with us?',
      'Recommend a reliable Seerah book and say why it helped.',
    ],
  },
  {
    id: 'tajweed-practice',
    name: 'Tajweed Practice',
    nameUr: 'تجوید کی مشق',
    category: 'quran',
    icon: 'mic-outline',
    accent: 'amber',
    description:
      'A practice circle rather than a performance: share a rule you are working on and encourage someone else.',
    prompts: [
      'Which makhraj are you practising this week?',
      'Post one short recitation and ask for one specific correction.',
      'What was the most useful tajweed rule your teacher ever taught you?',
    ],
  },
  {
    id: 'family-parenting',
    name: 'Family & Parenting',
    nameUr: 'خاندان اور تربیت',
    category: 'family',
    icon: 'home-outline',
    accent: 'purple',
    description:
      'Raising children with faith, patience and mercy — and keeping a marriage strong through ordinary days.',
    prompts: [
      'How do you make salah a normal, loved part of a child’s day?',
      'What is one prophetic habit you want your family to keep?',
      'Share a book or talk that helped you parent with more patience.',
    ],
  },
  {
    id: 'dua-circle',
    name: 'Du‘a Circle',
    nameUr: 'دعا کی محفل',
    category: 'dua',
    icon: 'hand-left-outline',
    accent: 'red',
    description:
      'Write a request, make dua for the one above you, and return to say alhamdulillah when it is answered.',
    prompts: [
      'Share one dua you are making for someone else this week.',
      'What is a Sunnah dua that has become part of your daily routine?',
      'Post an answered dua as encouragement for someone still waiting.',
    ],
  },
];

export const COMMUNITY_CATEGORIES = [
  { id: 'all', label: 'All circles' },
  { id: 'quran', label: 'Qur’an' },
  { id: 'new', label: 'New Muslims' },
  { id: 'sisters', label: 'Sisters' },
  { id: 'youth', label: 'Youth' },
  { id: 'seerah', label: 'Seerah' },
  { id: 'family', label: 'Family' },
  { id: 'dua', label: 'Du‘a' },
];

export const COMMUNITY_NOTE =
  'Circles here are private to this device. There are no live members, no likes and no server sync yet; the starter prompts are conversation seeds, and everything you write stays in this install’s storage. A shared community server is a separate piece of work and will be added when moderation and privacy are in place.';
