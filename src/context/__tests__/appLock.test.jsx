import React from 'react';
import { AppState, Text } from 'react-native';
import { act, render, fireEvent, waitFor } from '@testing-library/react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { ThemeProvider } from '../../theme';
import { AppLockProvider } from '../AppLockContext';
import { AppLockGate } from '../../components/AppLockGate';
import { enableAppLock, setBiometricsEnabled } from '../../services/appLock';

const mount = () => render(
  <ThemeProvider>
    <AppLockProvider>
      <AppLockGate>
        <Text>Secret home screen</Text>
      </AppLockGate>
    </AppLockProvider>
  </ThemeProvider>
);

const enterPinAndUnlock = async screen => {
  fireEvent.changeText(screen.getByLabelText('App PIN'), '1234');
  await act(async () => {
    fireEvent.press(screen.getByText('Unlock'));
  });
};

beforeEach(() => {
  global.__resetStorage();
  jest.clearAllMocks();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('AppLockGate', () => {
  it('opens straight to the app when no lock is set', async () => {
    const screen = mount();

    expect(await screen.findByText('Secret home screen')).toBeTruthy();
    expect(screen.queryByText('App locked')).toBeNull();
  });

  it('locks on launch and unlocks with the PIN', async () => {
    await enableAppLock('1234');
    const screen = mount();

    expect(await screen.findByText('App locked')).toBeTruthy();

    await enterPinAndUnlock(screen);

    expect(screen.queryByText('App locked')).toBeNull();
    expect(screen.getByText('Secret home screen')).toBeTruthy();
  });

  it('shows the remaining attempts after a wrong PIN', async () => {
    await enableAppLock('1234');
    const screen = mount();
    await screen.findByText('App locked');

    fireEvent.changeText(screen.getByLabelText('App PIN'), '0000');
    fireEvent.press(screen.getByText('Unlock'));

    expect(await screen.findByText(/4 attempts remaining/)).toBeTruthy();
  });

  it('re-locks after a long enough spell in the background', async () => {
    await enableAppLock('1234');
    const handlers = [];
    jest.spyOn(AppState, 'addEventListener').mockImplementation((type, handler) => {
      handlers.push(handler);
      return { remove: jest.fn() };
    });

    let now = 1_000_000;
    jest.spyOn(Date, 'now').mockImplementation(() => now);

    const screen = mount();
    await screen.findByText('App locked');
    await enterPinAndUnlock(screen);
    expect(screen.queryByText('App locked')).toBeNull();

    expect(handlers.length).toBeGreaterThan(0);

    handlers[0]('background');
    now += 31_000;
    handlers[0]('active');

    expect(await screen.findByText('App locked')).toBeTruthy();
  });

  it('does not re-lock after a brief app switch', async () => {
    await enableAppLock('1234');
    const handlers = [];
    jest.spyOn(AppState, 'addEventListener').mockImplementation((type, handler) => {
      handlers.push(handler);
      return { remove: jest.fn() };
    });

    let now = 1_000_000;
    jest.spyOn(Date, 'now').mockImplementation(() => now);

    const screen = mount();
    await screen.findByText('App locked');
    await enterPinAndUnlock(screen);
    expect(screen.queryByText('App locked')).toBeNull();

    handlers[0]('background');
    now += 5_000;
    handlers[0]('active');

    expect(screen.queryByText('App locked')).toBeNull();
  });

  it('unlocks automatically with biometrics when enabled', async () => {
    await enableAppLock('1234');
    await setBiometricsEnabled(true);
    LocalAuthentication.authenticateAsync.mockResolvedValue({ success: true });

    const screen = mount();
    expect(await screen.findByText('App locked')).toBeTruthy();

    // The prompt is deliberately delayed so the lock screen paints first;
    // under a loaded Jest run that delay plus the async capability lookup can
    // take a while, so allow more headroom than the default.
    await waitFor(() => expect(screen.queryByText('App locked')).toBeNull(), {
      timeout: 8000,
    });
    expect(LocalAuthentication.authenticateAsync).toHaveBeenCalled();
  });
});
