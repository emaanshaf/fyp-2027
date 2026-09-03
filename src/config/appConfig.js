// Centralized App Configuration
// Update these URLs when deploying

const APP_CONFIG = {
  // App Info
  appName: 'Qitab-e-Noor',
  appTagline: 'Your Spiritual Companion',
  appUrl: 'https://qitabe-noor.app',
  supportEmail: 'support@qitabe-noor.app',

  // Backend API
  // Development: http://localhost:3001/api
  // Production: https://api.qitabe-noor.app/api
  apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api',

  // Expo Web URL
  // Development: http://localhost:8081
  // Production: https://qitabe-noor.app
  webUrl: process.env.EXPO_PUBLIC_WEB_URL || 'http://localhost:8081',

  // External APIs
  quranApi: 'https://api.quran.com/api/v4',
  hadithCdn: 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions',

  // Share URLs
  shareUrl: (path) => `https://qitabe-noor.app${path}`,
  shareVerse: (verseKey) => `https://qitabe-noor.app/quran/${verseKey}`,
  shareHadith: (collection, number) => `https://qitabe-noor.app/hadith/${collection}/${number}`,
  shareDua: (id) => `https://qitabe-noor.app/duas/${id}`,
  shareProfile: () => `https://qitabe-noor.app`,

  // Deep Links
  deepLinks: {
    quran: 'qitabe-noor://quran',
    hadith: 'qitabe-noor://hadith',
    prayer: 'qitabe-noor://prayer',
    tasbih: 'qitabe-noor://tasbih',
  },

  // App Store URLs (update when published)
  playStore: 'https://play.google.com/store/apps/details?id=com.qitabenoor.app',
  appStore: 'https://apps.apple.com/app/qitab-e-noor/id000000000',
};

// Exported three ways because call sites use all three: named destructuring
// (`import { quranApi }`), the whole object (`import { APP_CONFIG }`), and
// the default. The previous `module.exports = APP_CONFIG` left the named
// `APP_CONFIG` import resolving to undefined.
export const {
  appName,
  appTagline,
  appUrl,
  supportEmail,
  apiUrl,
  webUrl,
  quranApi,
  hadithCdn,
  shareUrl,
  shareVerse,
  shareHadith,
  shareDua,
  shareProfile,
  deepLinks,
  playStore,
  appStore,
} = APP_CONFIG;

export { APP_CONFIG };
export default APP_CONFIG;
