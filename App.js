import 'react-native-gesture-handler';
import { useState, useEffect, useRef } from 'react';
import { registerRootComponent } from 'expo';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/theme';
import ErrorBoundary from './src/components/ErrorBoundary';
import OfflineBanner from './src/components/OfflineBanner';
import QuranReminderBanner from './src/components/QuranReminderBanner';
import AppNavigator from './src/navigation/AppNavigator';
import { PrayerLockProvider } from './src/context/PrayerLockContext';
import PrayerLockOverlay from './src/components/PrayerLockOverlay';
import { AppLockProvider } from './src/context/AppLockContext';
import { AppLockGate } from './src/components/AppLockGate';
import { LanguageProvider } from './src/context/LanguageContext';
import { ShareProvider } from './src/context/ShareContext';
import { FONT_ASSETS } from './src/theme/fonts';
import notificationService from './src/services/notifications';
import { primeReminderAudio, unloadReminderSound } from './src/services/reminderSound';
import { installWebAlertFallback } from './src/utils/webAlerts';

// react-native-web's Alert is a no-op; install browser dialogs before any
// screen can ask for a confirmation. Native platforms ignore this.
installWebAlertFallback();

function App() {
  // Fonts are bundled rather than fetched, so this resolves from the binary
  // in a fraction of a second. A load failure still lets the app start on the
  // system fonts rather than leaving a blank screen.
  const [fontsLoaded, fontError] = useFonts(FONT_ASSETS);
  const [quranBanner, setQuranBanner]     = useState(false);
  const [quranBannerMsg, setQuranBannerMsg] = useState(null);
  const navRef = useRef(null);

  useEffect(() => {
    // Unlock browser audio on the first tap so a reminder timer can chime later.
    primeReminderAudio();

    // Show the in-app popup whenever a Quran reminder is due. Native events
    // arrive through expo-notifications; on web the service's own timers call
    // the same subscriber, so the popup is guaranteed on both platforms.
    const unsubscribeQuran = notificationService.subscribeQuranReminder(({ title, body }) => {
      setQuranBannerMsg({ title, body });
      setQuranBanner(true);
    });

    // Native notifications also reach us here while the app is foregrounded.
    const sub = notificationService.onNotificationReceived(notification => {
      const type = notification.request.content.data?.type;
      if (type === 'quran_reminder' || type === 'quran_snooze') {
        const { title, body } = notification.request.content;
        setQuranBannerMsg({ title, body });
        setQuranBanner(true);
      }
    });

    // Rebuild web timers after a reload and keep native daily triggers fresh.
    notificationService.restoreQuranReminders().catch(() => {});

    return () => {
      unsubscribeQuran();
      sub?.remove?.();
      unloadReminderSound();
    };
  }, []);

  const handleOpenQuran = () => {
    setQuranBanner(false);
    // Navigate to the Quran tab through the root stack → drawer → tabs.
    if (navRef.current) {
      try {
        navRef.current.navigate('Main', {
          screen: 'MainTabs',
          params: { screen: 'Quran' },
        });
      } catch { /* navigator not mounted yet */ }
    }
  };
  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <ErrorBoundary>
          <ThemeProvider>
            <ShareProvider>
              <StatusBar style="light" backgroundColor="#05070a" translucent={false} />
              {/* The gate waits for the lock setting before mounting the app, so a
                  locked cold start never flashes the last screen for a moment. */}
              <AppLockProvider>
                <AppLockGate>
                  <PrayerLockProvider>
                    <OfflineBanner />
                    <AppNavigator ref={navRef} />
                    <PrayerLockOverlay />
                    {/* Global Quran recitation reminder banner — sits above everything */}
                    <QuranReminderBanner
                      visible={quranBanner}
                      message={quranBannerMsg}
                      onOpenQuran={handleOpenQuran}
                      onSnooze={() => setQuranBanner(false)}
                      onDismiss={() => setQuranBanner(false)}
                    />
                  </PrayerLockProvider>
                </AppLockGate>
              </AppLockProvider>
            </ShareProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

registerRootComponent(App);

export default App;
