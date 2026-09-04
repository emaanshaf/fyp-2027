import React from 'react';
import { render, waitFor, screen } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { ThemeProvider } from '../../theme';
import QiblaFinderScreen from '../QiblaFinderScreen';
import { qiblaBearing } from '../../utils/qibla';

/**
 * The screen used to hardcode its position to Islamabad, so it showed the
 * same bearing wherever the user actually was. These tests pin the two things
 * that made it wrong: it must read the device position, and the bearing it
 * renders must be derived from that position.
 */

const mount = () => render(
  <ThemeProvider><QiblaFinderScreen /></ThemeProvider>
);

beforeEach(() => {
  global.__resetStorage();
  jest.clearAllMocks();
  Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
  Location.watchHeadingAsync.mockImplementation(cb => {
    cb({ trueHeading: 0, magHeading: 0, accuracy: 3 });
    return Promise.resolve({ remove: jest.fn() });
  });
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe('QiblaFinderScreen', () => {
  it('asks for location rather than assuming one', async () => {
    Location.getCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: 51.5074, longitude: -0.1278 },
    });
    mount();
    await waitFor(() => expect(Location.getCurrentPositionAsync).toHaveBeenCalled());
    expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
  });

  it('shows the bearing for where the user actually is', async () => {
    // London, not Islamabad. The old screen showed 255 degrees here.
    Location.getCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: 51.5074, longitude: -0.1278 },
    });
    mount();
    const expected = Math.round(qiblaBearing(51.5074, -0.1278)); // 119
    await waitFor(() => expect(screen.getAllByText(`${expected}°`).length).toBeGreaterThan(0));
    expect(expected).toBe(119);
  });

  it('shows a different bearing from a different place', async () => {
    Location.getCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: 40.7128, longitude: -74.0060 },
    });
    mount();
    const expected = Math.round(qiblaBearing(40.7128, -74.0060)); // 58
    await waitFor(() => expect(screen.getAllByText(`${expected}°`).length).toBeGreaterThan(0));
    expect(expected).toBe(58);
  });

  it('refuses to guess a direction when permission is denied', async () => {
    Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });
    mount();
    await waitFor(() => expect(screen.getByText('Location permission needed')).toBeTruthy());
    expect(screen.getByText(/cannot be shown without/)).toBeTruthy();
    expect(screen.getByLabelText('Try again')).toBeTruthy();
  });

  it('says so when the device has no compass instead of showing a dead dial', async () => {
    Location.getCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: 51.5074, longitude: -0.1278 },
    });
    Location.watchHeadingAsync.mockRejectedValue(new Error('no compass'));
    mount();
    await waitFor(() => expect(screen.getByText(/No compass on this device/)).toBeTruthy());
  });

  it('warns when the GPS fix is loose instead of presenting it as precise', async () => {
    Location.getCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: 51.5074, longitude: -0.1278, accuracy: 250 },
    });
    mount();
    await waitFor(() => expect(screen.getByText(/Location accuracy is low/)).toBeTruthy());
  });

  it('does not warn about GPS accuracy on a tight fix', async () => {
    Location.getCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: 51.5074, longitude: -0.1278, accuracy: 8 },
    });
    mount();
    await waitFor(() => expect(screen.getAllByText(/119°/).length).toBeGreaterThan(0));
    expect(screen.queryByText(/Location accuracy is low/)).toBeNull();
  });

  it('warns about compass calibration on a poor heading accuracy reading', async () => {
    // jest-expo's default RN Platform is iOS, where the accuracy field is
    // degrees of deviation and a large number means a poor fix.
    Location.getCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: 51.5074, longitude: -0.1278 },
    });
    Location.watchHeadingAsync.mockImplementation(cb => {
      cb({ trueHeading: 0, magHeading: 0, accuracy: 30 });
      return Promise.resolve({ remove: jest.fn() });
    });
    mount();
    await waitFor(() => expect(screen.getByText(/Compass accuracy is low/)).toBeTruthy());
    expect(screen.getByText(/figure-eight/)).toBeTruthy();
  });

  it('does not warn about calibration on a high-accuracy heading', async () => {
    Location.getCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: 51.5074, longitude: -0.1278 },
    });
    // The default beforeEach mock already reports accuracy: 3, which is
    // "high" under both the iOS-degrees and Android-category readings.
    mount();
    await waitFor(() => expect(screen.getAllByText(/119°/).length).toBeGreaterThan(0));
    expect(screen.queryByText(/Compass accuracy is low/)).toBeNull();
  });

  it('flags a magnetic-only heading as not corrected to true north', async () => {
    Location.getCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: 51.5074, longitude: -0.1278 },
    });
    // trueHeading of -1 is expo-location's "not available" sentinel; only
    // magHeading is valid.
    Location.watchHeadingAsync.mockImplementation(cb => {
      cb({ trueHeading: -1, magHeading: 10, accuracy: 30 });
      return Promise.resolve({ remove: jest.fn() });
    });
    mount();
    await waitFor(() => expect(screen.getByText(/could not correct for magnetic declination/)).toBeTruthy());
  });
});
