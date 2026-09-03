// Deep linking and URL utilities for mobile and web
import { Platform, Linking, Share } from 'react-native';
import { APP_CONFIG } from '../config/appConfig';

export const generateShareUrl = (path) => {
  const baseUrl = Platform.OS === 'web' 
    ? window.location.origin 
    : APP_CONFIG.appUrl;
  return `${baseUrl}${path}`;
};

export const shareModule = async (moduleName, moduleData = {}) => {
  const path = getModulePath(moduleName);
  const url = generateShareUrl(path);
  
  if (Platform.OS === 'web') {
    try {
      await navigator.clipboard.writeText(url);
      return { success: true, message: 'Link copied to clipboard' };
    } catch (e) {
      return { success: false, message: 'Failed to copy link' };
    }
  }
  
  try {
    await Share.share({
      title: `Qitab-e-Noor: ${moduleName}`,
      message: `Check out ${moduleName} on Qitab-e-Noor`,
      url,
    });
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
};

export const getModulePath = (moduleName) => {
  const paths = {
    Dashboard: '/dashboard',
    Home: '/dashboard/home',
    Quran: '/dashboard/quran',
    Prayer: '/dashboard/prayer',
    Duas: '/dashboard/duas',
    Hadith: '/hadith',
    Tafsir: '/tafsir',
    Hifz: '/hifz',
    AIQuran: '/ai-quran',
    AyahOfDay: '/ayah-of-day',
    HadithVerify: '/hadith/verify',
    NamesOfAllah: '/names-of-allah',
    Calendar: '/calendar',
    PrayerTracker: '/prayer-tracker',
    DuaLibrary: '/dua-library',
    Qibla: '/qibla',
    Ramadan: '/ramadan',
    QuranJourney: '/quran-journey',
    KhatmPlanner: '/khatm-planner',
    Quiz: '/quiz',
    Seerah: '/seerah',
    Prophets: '/prophets',
    Learning: '/learning',
    GoodDeeds: '/good-deeds',
    Journal: '/journal',
    Zakat: '/zakat',
    Tasbih: '/tasbih',
    Reminders: '/reminders',
    Generator: '/generator',
    Bookmarks: '/bookmarks',
    Settings: '/settings',
    AIChat: '/ai-chat',
  };
  return paths[moduleName] || '/';
};

export const openDeepLink = async (moduleName) => {
  const path = getModulePath(moduleName);
  const scheme = `qitabe-noor://${path.replace(/^\//, '')}`;
  
  try {
    const supported = await Linking.canOpenURL(scheme);
    if (supported) {
      await Linking.openURL(scheme);
      return true;
    }
    
    // Fallback to web URL
    const webUrl = generateShareUrl(path);
    await Linking.openURL(webUrl);
    return true;
  } catch (e) {
    console.error('Failed to open deep link:', e);
    return false;
  }
};

export const handleIncomingLink = (url) => {
  // Parse incoming deep link and extract route
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname + urlObj.search;
    
    const routeMap = {
      '/dashboard': 'Dashboard',
      '/dashboard/home': 'Home',
      '/dashboard/quran': 'Quran',
      '/dashboard/prayer': 'Prayer',
      '/dashboard/duas': 'Duas',
      '/hadith': 'Hadith',
      '/tafsir': 'Tafsir',
      '/hifz': 'Hifz',
      '/ai-quran': 'AIQuran',
      '/ayah-of-day': 'AyahOfDay',
      '/hadith/verify': 'HadithVerify',
      '/names-of-allah': 'NamesOfAllah',
      '/calendar': 'Calendar',
      '/prayer-tracker': 'PrayerTracker',
      '/dua-library': 'DuaLibrary',
      '/qibla': 'Qibla',
      '/ramadan': 'Ramadan',
      '/quran-journey': 'QuranJourney',
      '/khatm-planner': 'KhatmPlanner',
      '/quiz': 'Quiz',
      '/seerah': 'Seerah',
      '/prophets': 'Prophets',
      '/learning': 'Learning',
      '/good-deeds': 'GoodDeeds',
      '/journal': 'Journal',
      '/zakat': 'Zakat',
      '/tasbih': 'Tasbih',
      '/reminders': 'Reminders',
      '/generator': 'Generator',
      '/bookmarks': 'Bookmarks',
      '/settings': 'Settings',
      '/ai-chat': 'AIChat',
    };
    
    return routeMap[path] || 'Dashboard';
  } catch (e) {
    console.error('Failed to parse deep link:', e);
    return 'Dashboard';
  }
};

export const isMobileApp = () => {
  return Platform.OS !== 'web';
};

export const getDeviceInfo = () => {
  return {
    platform: Platform.OS,
    version: Platform.Version,
    isMobile: Platform.OS !== 'web',
    isWeb: Platform.OS === 'web',
  };
};