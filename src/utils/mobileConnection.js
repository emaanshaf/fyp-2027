// Mobile app connection and installation utilities
import { Platform, Linking, Alert, NativeModules, Share } from 'react-native';
import { APP_CONFIG } from '../config/appConfig';
import { pathToRoute } from '../config/routes';
import { generateShareUrl, openDeepLink, isMobileApp } from './deepLinking';

export const checkAppInstalled = async () => {
  if (Platform.OS === 'web') return false;
  
  try {
    const scheme = 'qitabe-noor://';
    const supported = await Linking.canOpenURL(scheme);
    return supported;
  } catch (e) {
    return false;
  }
};

export const redirectToAppStore = async () => {
  if (Platform.OS === 'ios') {
    await Linking.openURL(APP_CONFIG.appStore);
  } else if (Platform.OS === 'android') {
    await Linking.openURL(APP_CONFIG.playStore);
  }
};

export const installAppPrompt = () => {
  if (Platform.OS === 'web') {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    if (isIOS) {
      Alert.alert(
        'Install Qitab-e-Noor',
        'For the best experience, add Qitab-e-Noor to your Home Screen. Tap the Share button and select "Add to Home Screen".',
        [{ text: 'OK' }]
      );
    } else if (isAndroid) {
      Alert.alert(
        'Install Qitab-e-Noor',
        'For the best experience, install Qitab-e-Noor from the Play Store or add to Home Screen from your browser menu.',
        [
          { text: 'Play Store', onPress: () => redirectToAppStore() },
          { text: 'Maybe Later' }
        ]
      );
    }
  }
};

export const openModuleInApp = async (moduleName, fallbackToWeb = true) => {
  if (Platform.OS === 'web') {
    // On web, just navigate via URL
    const path = getModulePath(moduleName);
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
    return true;
  }
  
  const success = await openDeepLink(moduleName);
  if (!success && fallbackToWeb) {
    const webUrl = generateShareUrl(getModulePath(moduleName));
    await Linking.openURL(webUrl);
  }
  return success;
};

export const shareModuleLink = async (moduleName, customMessage) => {
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
      message: customMessage || `Check out ${moduleName} on Qitab-e-Noor`,
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
    Login: '/login',
  };
  return paths[moduleName] || '/';
};

export const getCurrentModuleFromUrl = () => {
  if (Platform.OS !== 'web') return 'Home';
  // Resolved against the shared route table rather than a fourth hand-written
  // copy of it. Unmatched paths report null so callers can render the 404.
  return pathToRoute(window.location?.pathname || '/');
};

export const setupMobileConnection = () => {
  if (Platform.OS === 'web') return;
  
  // NavigationContainer's `linking` config does the actual routing; this
  // subscription exists only so callers can tear it down on unmount.
  // (RN 0.65 removed Linking.removeEventListener — the handle is the API now.)
  const subscription = Linking.addEventListener('url', () => {});

  return () => subscription.remove();
};

export const getInstallationInfo = () => {
  return {
    isInstalled: false, // Will be updated by checkAppInstalled
    platform: Platform.OS,
    version: Platform.Version,
    canInstall: Platform.OS === 'web',
    appStoreUrl: APP_CONFIG.appStore,
    playStoreUrl: APP_CONFIG.playStore,
    webUrl: APP_CONFIG.webUrl,
  };
};