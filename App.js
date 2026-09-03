import 'react-native-gesture-handler';
import React from 'react';
import { registerRootComponent } from 'expo';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/theme';
import ErrorBoundary from './src/components/ErrorBoundary';
import OfflineBanner from './src/components/OfflineBanner';
import AppNavigator from './src/navigation/AppNavigator';
import { PrayerLockProvider } from './src/context/PrayerLockContext';
import PrayerLockOverlay from './src/components/PrayerLockOverlay';

function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ThemeProvider>
          <StatusBar style="light" backgroundColor="#05070a" translucent={false} />
          {/* Sits above the navigator so the connectivity state is visible on
              every screen, not just the ones that happen to fetch. */}
          <PrayerLockProvider>
            <OfflineBanner />
            <AppNavigator />
            {/* Above the navigator so the lock covers every screen rather
                than being something the user can navigate around. */}
            <PrayerLockOverlay />
          </PrayerLockProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

registerRootComponent(App);

export default App;
