import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PrayerLockProvider, usePrayerLock, LOCK_SETTINGS_KEY, DEFAULT_LOCK_DELAY_MIN,
} from '../PrayerLockContext';

/**
 * The lock takes the app away from the user, so its rules need to be exact:
 * it must not engage when disabled, must not engage before the delay, must
 * not engage for a prayer already logged, and must always offer a way out.
 */

function Probe() {
  const lock = usePrayerLock();
  return (
    <>
      <Text testID="locked">{String(lock.locked)}</Text>
      <Text testID="prayer">{String(lock.lockedPrayer)}</Text>
      <Text testID="pending">{String(lock.pendingPrayer)}</Text>
      <Text testID="confirm" onPress={() => lock.confirmPrayed(lock.lockedPrayer)}>confirm</Text>
      <Text testID="snooze" onPress={() => lock.snooze(lock.lockedPrayer)}>snooze</Text>
    </>
  );
}

const mount = () => render(<PrayerLockProvider><Probe /></PrayerLockProvider>);

// The clock is pinned to mid-afternoon. Without this the seeded times wrap
// around midnight when the suite happens to run late, a different prayer
// becomes "current", and the assertions flip — a flaky test, not a real fault.
const NOW = new Date(2026, 0, 15, 14, 0, 0);

const hhmm = mins => {
  const m = ((mins % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

/** Cached timings with Dhuhr `minsAgo` minutes before the pinned clock. */
async function seedTimings(minsAgo) {
  const nowMins = NOW.getHours() * 60 + NOW.getMinutes(); // 840
  await AsyncStorage.setItem('qitab_prayer_city', 'Islamabad');
  await AsyncStorage.setItem('qitab_prayer_country', 'Pakistan');
  await AsyncStorage.setItem('qitab_timings_Islamabad_Pakistan', JSON.stringify({
    Fajr: '05:00',
    Dhuhr: hhmm(nowMins - minsAgo),
    Asr: hhmm(nowMins + 90),
    Maghrib: hhmm(nowMins + 200),
    Isha: hhmm(nowMins + 260),
  }));
}

const logKeyToday = () =>
  `prayer_log_${NOW.getFullYear()}_${NOW.getMonth()}_${NOW.getDate()}`;

beforeEach(() => {
  global.__resetStorage();
  jest.clearAllMocks();
  jest.useFakeTimers({ now: NOW, doNotFake: ['nextTick', 'setImmediate'] });
});

afterEach(() => { jest.useRealTimers(); });

describe('prayer lock', () => {
  it('stays off when the feature is disabled', async () => {
    await seedTimings(60);
    await AsyncStorage.setItem(LOCK_SETTINGS_KEY, '0');
    mount();
    await waitFor(() => expect(screen.getByTestId('locked').props.children).toBe('false'));
  });

  it('does not lock before the delay has elapsed', async () => {
    await seedTimings(DEFAULT_LOCK_DELAY_MIN - 5);
    await AsyncStorage.setItem(LOCK_SETTINGS_KEY, '1');
    mount();
    await waitFor(() => expect(screen.getByTestId('pending').props.children).toBe('Dhuhr'));
    expect(screen.getByTestId('locked').props.children).toBe('false');
  });

  it('locks once the delay has passed', async () => {
    await seedTimings(DEFAULT_LOCK_DELAY_MIN + 5);
    await AsyncStorage.setItem(LOCK_SETTINGS_KEY, '1');
    mount();
    await waitFor(() => expect(screen.getByTestId('locked').props.children).toBe('true'));
    expect(screen.getByTestId('prayer').props.children).toBe('Dhuhr');
  });

  it('does not lock for a prayer already marked prayed', async () => {
    await seedTimings(60);
    await AsyncStorage.setItem(LOCK_SETTINGS_KEY, '1');
    await AsyncStorage.setItem(logKeyToday(), JSON.stringify({ dhuhr: true }));
    mount();
    await waitFor(() => expect(screen.getByTestId('pending').props.children).toBe('null'));
    expect(screen.getByTestId('locked').props.children).toBe('false');
  });

  it('unlocks on confirmation and records it in the prayer tracker log', async () => {
    await seedTimings(30);
    await AsyncStorage.setItem(LOCK_SETTINGS_KEY, '1');
    mount();
    await waitFor(() => expect(screen.getByTestId('locked').props.children).toBe('true'));

    await act(async () => { fireEvent.press(screen.getByTestId('confirm')); });
    await waitFor(() => expect(screen.getByTestId('locked').props.children).toBe('false'));

    expect(JSON.parse(await AsyncStorage.getItem(logKeyToday())).dhuhr).toBe(true);
  });

  it('always offers a way out that does not claim the prayer was offered', async () => {
    await seedTimings(30);
    await AsyncStorage.setItem(LOCK_SETTINGS_KEY, '1');
    mount();
    await waitFor(() => expect(screen.getByTestId('locked').props.children).toBe('true'));

    await act(async () => { fireEvent.press(screen.getByTestId('snooze')); });
    await waitFor(() => expect(screen.getByTestId('locked').props.children).toBe('false'));

    const raw = await AsyncStorage.getItem(logKeyToday());
    expect(raw ? JSON.parse(raw).dhuhr : undefined).toBeFalsy();
  });

  it('does not lock hours after the window, when the app was simply closed', async () => {
    await seedTimings(300);
    await AsyncStorage.setItem(LOCK_SETTINGS_KEY, '1');
    mount();
    await waitFor(() => expect(screen.getByTestId('pending').props.children).toBe('null'));
    expect(screen.getByTestId('locked').props.children).toBe('false');
  });

  it('reports unlocked outside a provider', () => {
    render(<Probe />);
    expect(screen.getByTestId('locked').props.children).toBe('false');
  });
});
