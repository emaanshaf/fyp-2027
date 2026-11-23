// App shell translations.
//
// The Quran, hadith and the new worship guides carry their own bilingual
// content. This file covers the chrome around them: navigation, the
// dashboard, common actions and the language control itself. Keys fall back
// to English, so a missing Urdu string shows readable text rather than the
// raw key.

export const LANGUAGE_STORAGE_KEY = 'qitab_language';

export const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', translation: 'en' },
  { code: 'ur', label: 'Urdu', native: 'اردو', translation: 'ur' },
];

const en = {
  'app.brand': 'Qitab-e-Noor',
  'app.tagline': 'Your Spiritual Companion',
  'nav.dashboard': 'Dashboard',
  'nav.modules': 'Modules',
  'nav.settings': 'Settings',
  'nav.menu': 'Menu',
  'drawer.worship': 'Worship',
  'drawer.learn': 'Learn',
  'drawer.community': 'Community',
  'drawer.personal': 'Personal',
  'drawer.tools': 'Tools',

  'common.share': 'Share',
  'common.copyLink': 'Copy Link',
  'common.whatsapp': 'WhatsApp',
  'common.instagram': 'Instagram',
  'common.more': 'More',
  'common.cancel': 'Cancel',
  'common.close': 'Close',
  'common.copied': 'Link copied to clipboard',
  'common.copyFailed': 'Could not copy to the clipboard',
  'common.captionCopied': 'Caption copied — paste it into Instagram',
  'common.readMore': 'Read more',
  'common.showLess': 'Show less',
  'common.markDone': 'Mark as learned',
  'common.completed': 'Completed',
  'common.shareHint': 'Send this with a link back to Qitab-e-Noor',
  'share.invite': 'Continue your journey with Qitab-e-Noor — Quran, prayer and authentic knowledge in one app.',
  'share.pageLabel': 'Share this page',

  'home.greeting': 'Assalamu Alaikum',
  'home.addName': 'Add your name',
  'home.today': 'Today',
  'home.streak': 'Day streak',
  'home.salawat': 'Salawat',
  'home.nextPrayer': 'Next prayer',
  'home.tomorrow': 'tomorrow',
  'home.toGo': 'to go',
  'home.prayerTimes': 'Prayer times',
  'home.setLocation': 'Set your location',
  'home.tapChooseCity': 'Tap to choose your city',
  'home.explore': 'Explore Modules',
  'home.search': 'Search all content',
  'home.prayed': 'prayed',
  'home.lockBody': 'after the adhan until you confirm you have prayed',
  'home.timeFor': 'It is time for',
  'home.ayahOfDay': 'Ayah of the Day',
  'home.askAi': 'Ask the Islamic AI Assistant',
  'home.askAiBody': 'Any question about Islam — Quran, fiqh, worship or daily life.',

  'settings.appearance': 'Appearance',
  'settings.language': 'App Language',
  'settings.languageHint': 'The interface switches immediately. Choosing اردو also switches the Quran and Tafsir tarjuma to Jalandhari Urdu; all five reading translations stay available in Reading settings and in the reader.',
  'settings.english': 'English',
  'settings.urdu': 'اردو',

  // Islamic News is deliberately English-only. Headlines arrive in English
  // and the feature name follows the same English navigation policy as the
  // brand and other module titles. Missing Urdu keys fall back to this pack.
  'news.title': 'Islamic News',
  'news.kicker': 'MUSLIM WORLD · LIVE',
  'news.subtitle': 'Headlines from trusted publishers, in one place.',
  'news.latest': 'Latest',
  'news.saved': 'Saved',
  'news.allSources': 'All sources',
  'news.search': 'Search headlines',
  'news.clearSearch': 'Clear search',
  'news.refresh': 'Refresh headlines',
  'news.updated': 'Updated',
  'news.notUpdated': 'Not updated yet',
  'news.offline': 'Offline — showing saved headlines',
  'news.offlineEmpty': 'Offline — connect to load headlines',
  'news.stale': 'Could not refresh — showing earlier headlines',
  'news.partial': 'Some sources are unavailable right now',
  'news.loading': 'Loading headlines…',
  'news.loadError': 'Could not load headlines',
  'news.loadErrorBody': 'Check your connection, then try again.',
  'news.retry': 'Try again',
  'news.empty': 'No headlines yet',
  'news.emptyBody': 'Pull down to refresh, or try again in a moment.',
  'news.noMatches': 'No stories match your filters',
  'news.clearFilters': 'Clear filters',
  'news.savedEmpty': 'No saved stories',
  'news.savedEmptyBody': 'Tap the bookmark on a story to keep it here for later.',
  'news.read': 'Read full story',
  'news.save': 'Save story',
  'news.unsave': 'Remove saved story',
  'news.share': 'Share story',
  'news.footer': 'Headlines are published in English by the original outlets. Tap a story to read it at the source.',
};

const ur = {
  'nav.dashboard': 'ڈیش بورڈ',
  'nav.modules': 'ماڈیولز',
  'nav.settings': 'ترتیبات',
  'nav.menu': 'مینو',
  'drawer.worship': 'عبادت',
  'drawer.learn': 'علم',
  'drawer.community': 'کمیونٹی',
  'drawer.personal': 'ذاتی',
  'drawer.tools': 'اوزار',

  'common.share': 'شیئر کریں',
  'common.copyLink': 'لنک کاپی کریں',
  'common.whatsapp': 'واٹس ایپ',
  'common.instagram': 'انسٹاگرام',
  'common.more': 'مزید',
  'common.cancel': 'منسوخ',
  'common.close': 'بند کریں',
  'common.copied': 'لنک کاپی ہو گیا',
  'common.copyFailed': 'کاپی نہیں ہو سکا',
  'common.captionCopied': 'کیپشن کاپی ہو گیا — انسٹاگرام میں پیسٹ کریں',
  'common.readMore': 'مزید پڑھیں',
  'common.showLess': 'کم دکھائیں',
  'common.markDone': 'سیکھ لیا',
  'common.completed': 'مکمل',
  'common.shareHint': 'Qitab-e-Noor کا لنک کے ساتھ بھیجیں',
  'share.invite': 'Qitab-e-Noor کے ساتھ اپنا روحانی سفر جاری رکھیں — قرآن، نماز اور مستند علم ایک ہی ایپ میں۔',
  'share.pageLabel': 'یہ صفحہ شیئر کریں',

  'home.greeting': 'السلام علیکم',
  'home.addName': 'اپنا نام لکھیں',
  'home.today': 'آج',
  'home.streak': 'دن کا تسلسل',
  'home.salawat': 'درود',
  'home.nextPrayer': 'اگلی نماز',
  'home.tomorrow': 'کل',
  'home.toGo': 'باقی',
  'home.prayerTimes': 'نماز کے اوقات',
  'home.setLocation': 'اپنا مقام منتخب کریں',
  'home.tapChooseCity': 'شہر منتخب کرنے کے لیے دبائیں',
  'home.search': 'تمام مواد میں تلاش',
  'home.prayed': 'ادا کی',
  'home.lockBody': 'اذان کے بعد جب تک آپ نماز کی تصدیق نہ کریں',
  'home.timeFor': 'نماز کا وقت ہے',
  'home.ayahOfDay': 'آج کی آیت',

  'settings.appearance': 'ظاہری شکل',
  'settings.language': 'ایپ کی زبان',
  'settings.languageHint': 'انٹرفیس فوراً تبدیل ہو جاتا ہے۔ اردو منتخب کرنے پر قرآن اور تفسیر کا ترجمہ بھی جالندھری اردو میں آ جاتا ہے؛ پانچوں ترجمے ریڈنگ سیٹنگز اور ریڈر میں دستیاب رہتے ہیں۔',
  'settings.english': 'English',
  'settings.urdu': 'اردو',
};

export const translations = { en, ur };

export function translate(language, key, fallback) {
  const pack = translations[language] || translations.en;
  return pack[key] ?? translations.en[key] ?? fallback ?? key;
}

// Feature names stay in English in both languages: they are the app's
// navigation vocabulary (Quran, Hajj, Communities), and translating them made
// the same feature appear under a different name on every surface. Only the
// brand title and the surrounding interface copy switch language.
export function moduleTitle(_language, name, fallback) {
  return fallback || name;
}
