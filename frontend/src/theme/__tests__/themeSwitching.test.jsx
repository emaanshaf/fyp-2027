import React from 'react';
import { Text, View } from 'react-native';
import { render, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemeProvider } from '../../context/ThemeContext';
import { useColors, useGlobalStyles, useSetTheme, useThemedStyles } from '../../hooks/useTheme';
import { makeGlobalStyles } from '../globalStyles';
import { themes } from '../../config/themes';

// The bug this file exists for: screens built their StyleSheet at module load
// from a frozen COLORS snapshot, so choosing a theme in Settings moved the
// checkmark, persisted the choice, and repainted nothing.

const makeStyles = (c) => ({
  card: { backgroundColor: c.card, borderColor: c.glassBorder },
  title: { color: c.textPrimary },
});

let setThemeFn;

function Probe() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const globalStyles = useGlobalStyles();
  setThemeFn = useSetTheme();

  return (
    <View testID="screen" style={globalStyles.screen}>
      <View testID="card" style={styles.card}>
        <Text testID="title" style={styles.title}>hello</Text>
      </View>
      <Text testID="raw">{colors.bg}</Text>
    </View>
  );
}

const flatten = (style) => (Array.isArray(style) ? Object.assign({}, ...style.flat(9)) : style);

async function mount() {
  const utils = render(<ThemeProvider><Probe /></ThemeProvider>);
  // ThemeProvider renders a spinner until it has read AsyncStorage.
  await waitFor(() => expect(utils.queryByTestId('screen')).not.toBeNull());
  return utils;
}

beforeEach(async () => {
  await AsyncStorage.clear();
  setThemeFn = undefined;
});

describe('the three themes are genuinely distinct', () => {
  it('gives default, light and highContrast different backgrounds', () => {
    const bgs = ['default', 'light', 'highContrast'].map(n => themes[n].colors.bg);
    expect(new Set(bgs).size).toBe(3);
  });
});

describe('switching theme repaints the UI', () => {
  it.each([['light'], ['highContrast']])('applies %s to a themed StyleSheet', async (name) => {
    const { getByTestId } = await mount();

    const before = flatten(getByTestId('card').props.style).backgroundColor;
    expect(before).toBe(themes.default.colors.card);

    await act(async () => { await setThemeFn(name); });

    // The assertion that fails on the old code: styles were frozen at module
    // load, so this stayed on the default theme's card colour forever.
    expect(flatten(getByTestId('card').props.style).backgroundColor)
      .toBe(themes[name].colors.card);
    expect(flatten(getByTestId('title').props.style).color)
      .toBe(themes[name].colors.textPrimary);
  });

  it('repaints the shared global styles too', async () => {
    const { getByTestId } = await mount();

    await act(async () => { await setThemeFn('light'); });

    expect(flatten(getByTestId('screen').props.style).backgroundColor)
      .toBe(themes.light.colors.bg);
  });

  it('switches back to the Islamic dark default', async () => {
    const { getByTestId } = await mount();

    await act(async () => { await setThemeFn('light'); });
    await act(async () => { await setThemeFn('default'); });

    expect(flatten(getByTestId('card').props.style).backgroundColor)
      .toBe(themes.default.colors.card);
  });

  it('persists the choice so it survives a restart', async () => {
    await mount();
    await act(async () => { await setThemeFn('highContrast'); });

    expect(await AsyncStorage.getItem('qitab_theme_preference')).toBe('highContrast');
  });

  it('restores the saved theme on next launch', async () => {
    await AsyncStorage.setItem('qitab_theme_preference', 'light');

    const { getByTestId } = await mount();

    expect(getByTestId('raw').props.children).toBe(themes.light.colors.bg);
  });

  it('ignores an unknown saved theme rather than rendering undefined colours', async () => {
    await AsyncStorage.setItem('qitab_theme_preference', 'no-such-theme');

    const { getByTestId } = await mount();

    expect(getByTestId('raw').props.children).toBe(themes.default.colors.bg);
  });
});

describe('makeGlobalStyles', () => {
  it('produces different values per theme rather than a frozen snapshot', () => {
    const light = makeGlobalStyles(themes.light);
    const dark = makeGlobalStyles(themes.default);

    expect(light.screen.backgroundColor).not.toBe(dark.screen.backgroundColor);
    expect(light.sectionTitle.color).not.toBe(dark.sectionTitle.color);
  });
});
