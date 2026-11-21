import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import AppNavigator from '../AppNavigator';
import { ThemeProvider } from '../../theme';
import { LANDING_SEEN_KEY } from '../../screens/LandingScreen';
import { AUTH_TOKEN_KEY } from '../../services/authToken';

// The app never got past its splash: the guard rendering "Loading
// Qitab-e-Noor..." waited on `isReady`, but `isReady` is only set by
// NavigationContainer's onReady — and NavigationContainer is rendered *after*
// that guard, so it could never mount, never fire onReady, never clear the
// guard. Nothing downstream was reachable, the dashboard included.
//
// Every other screen test mounts screens directly, so none of them ever
// exercised the boot path this lived on.
//
// These assert on what the user should end up looking at. Asserting only that
// the splash text is gone passes vacuously, because ThemeProvider shows its own
// spinner first and the text is not on screen yet.

const mount = () => render(<ThemeProvider><AppNavigator /></ThemeProvider>);
const TIMEOUT = { timeout: 10000 };

beforeEach(async () => {
  await AsyncStorage.clear();
  // The dashboard sits behind the sign-in gate. A returning, signed-in user is
  // the case these boot assertions describe; without a token the correct
  // screen is Login, not Home.
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, 'test-session-token');
});

describe('app boot', () => {
  it('reaches the dashboard for a returning user', async () => {
    await AsyncStorage.setItem(LANDING_SEEN_KEY, '1');

    const { queryAllByText } = mount();

    // Home is the initial route; its module grid is what should appear.
    await waitFor(
      () => expect(queryAllByText(/Qur'an|Quran/i).length).toBeGreaterThan(0),
      TIMEOUT
    );
  });

  it('shows the landing page to a first-time user', async () => {
    const { queryAllByText } = mount();

    await waitFor(
      () => expect(queryAllByText('QITAB-E-NOOR').length).toBeGreaterThan(0),
      TIMEOUT
    );
  });

  // Cleanup only runs on unmount or when the effect re-runs, so nothing before
  // this exercised it — and that is exactly where the crash lived.
  it('tears down its deep-link listener without throwing', async () => {
    await AsyncStorage.setItem(LANDING_SEEN_KEY, '1');

    const { queryAllByText, unmount } = mount();
    await waitFor(
      () => expect(queryAllByText(/Qur'an|Quran/i).length).toBeGreaterThan(0),
      TIMEOUT
    );

    expect(() => unmount()).not.toThrow();
  });

  // A fourth test asserting the splash text is gone was removed rather than
  // worked around: it read the tree after boot had swapped it out and failed on
  // "Unable to find node on an unmounted component". It also proved nothing the
  // first test does not — the dashboard cannot render while the splash is up.

});
