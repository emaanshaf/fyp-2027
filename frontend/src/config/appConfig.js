// Centralized App Configuration
// Update these URLs when deploying

import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Point a loopback API base at the machine that is actually running the API.
 *
 * `localhost` means "this device". That is correct in the desktop web preview,
 * but wrong for a physical phone and for a web preview opened from another
 * device on the LAN — both would call themselves instead of the computer
 * hosting Express. In development Expo knows the computer's address via
 * `hostUri`, and a browser knows the address it was served from, so use those.
 *
 * Anything explicitly configured (production HTTPS, emulator overrides) is
 * returned untouched, and the original base is kept if no better host exists.
 */
export function resolveApiUrl(configuredUrl, {
  platform = Platform.OS,
  hostUri,
  webHostname,
} = {}) {
  if (typeof configuredUrl !== 'string' || !configuredUrl) return configuredUrl;

  const loopback = /^(https?:\/\/)(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/i.exec(configuredUrl);
  if (!loopback) return configuredUrl;

  let host = '';

  if (platform === 'web') {
    const pageHost = webHostname !== undefined
      ? webHostname
      : (typeof window !== 'undefined' && window.location ? window.location.hostname : '');
    host = pageHost || '';
  } else {
    const devHost = hostUri !== undefined
      ? hostUri
      : (Constants.expoConfig?.hostUri || Constants.expoGoConfig?.debuggerHost || '');
    // hostUri looks like "192.168.1.20:8081"; strip any scheme, path or port.
    host = String(devHost)
      .replace(/^[a-z][a-z0-9+.-]*:\/\//i, '')
      .split('/')[0]
      .split(':')[0];
  }

  if (!host || host === 'localhost' || host === '127.0.0.1') return configuredUrl;

  return `${loopback[1]}${host}${loopback[3] || ''}${loopback[4] || ''}`;
}

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

const APP_CONFIG = {
  // App Info
  appName: 'Qitab-e-Noor',
  appTagline: 'Your Spiritual Companion',
  appUrl: 'https://qitabe-noor.app',
  supportEmail: 'support@qitabe-noor.app',
  // Store listings require a reachable privacy policy, and both addresses are
  // linked from Settings. They are public URLs, not secrets, so they may be
  // overridden per environment with EXPO_PUBLIC_*.
  privacyUrl: process.env.EXPO_PUBLIC_PRIVACY_URL || 'https://qitabe-noor.app/privacy',
  termsUrl: process.env.EXPO_PUBLIC_TERMS_URL || 'https://qitabe-noor.app/terms',

  // Backend API
  // Development: http://localhost:3001/api (resolved to the dev machine's LAN
  // address on a physical phone or a web page opened over the network).
  // Production: https://api.qitabe-noor.app/api
  apiUrl: resolveApiUrl(configuredApiUrl),

  // Expo Web URL
  // Development: http://localhost:8081
  // Production: https://qitabe-noor.app
  webUrl: process.env.EXPO_PUBLIC_WEB_URL || 'http://localhost:8081',

  // External APIs
  quranApi: 'https://api.quran.com/api/v4',
  hadithCdn: 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions',

  // Share URLs
  shareUrl: (path) => `https://qitabe-noor.app${path}`,
  // Accepts "2:255" (the verse-key form the Quran API returns) and emits the
  // readable deep link the app actually parses. The raw key would produce
  // `/quran/2:255`, which matches no linking pattern.
  shareVerse: (verseKey) => {
    const [surah, ayah] = String(verseKey || '').split(':');
    if (!surah) return 'https://qitabe-noor.app/quran';
    return ayah
      ? `https://qitabe-noor.app/quran/${surah}/ayah/${ayah}`
      : `https://qitabe-noor.app/quran/${surah}`;
  },
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
  privacyUrl,
  termsUrl,
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
