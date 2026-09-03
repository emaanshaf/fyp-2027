import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AppNavigator from '../AppNavigator';
import { ThemeProvider } from '../../theme';
import { LANDING_SEEN_KEY } from '../../screens/LandingScreen';

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

  it('does not sit on the splash once storage has been read', async () => {
    await AsyncStorage.setItem(LANDING_SEEN_KEY, '1');

    const { queryAllByText, queryByText } = mount();

    // Wait for real content first, so this cannot pass just because the theme
    // provider has not handed over yet.
    await waitFor(
      () => expect(queryAllByText(/Qur'an|Quran/i).length).toBeGreaterThan(0),
      TIMEOUT
    );
    expect(queryByText('Loading Qitab-e-Noor...')).toBeNull();
  });
});
