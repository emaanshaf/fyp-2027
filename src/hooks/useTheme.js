// Theme hooks for easy access to theme values
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { makeGlobalStyles } from '../theme/globalStyles';

export const useColors = () => useTheme().theme.colors;
export const useSpacing = () => useTheme().theme.spacing;
export const useTypography = () => useTheme().theme.typography;
export const useBorderRadius = () => useTheme().theme.borderRadius;
export const useShadows = () => useTheme().theme.shadows;
export const useButtons = () => useTheme().theme.buttons;
export const useNavigation = () => useTheme().theme.navigation;
export const useScreens = () => useTheme().theme.screens;
export const useComponents = () => useTheme().theme.components;

export const useThemeValue = (path) => {
  const { theme } = useTheme();
  return path.split('.').reduce((obj, key) => obj?.[key], theme);
};

export const useThemeName = () => useTheme().themeName;
export const useSetTheme = () => useTheme().setTheme;
export const useAvailableThemes = () => useTheme().availableThemes;
/**
 * Build a screen's StyleSheet from the *active* theme, and rebuild it when the
 * theme changes.
 *
 * A module-level `const styles = StyleSheet.create({ bg: COLORS.bg })` reads
 * COLORS once, when the bundle loads. Switching themes afterwards updates the
 * context and repaints nothing, because those style objects were frozen with
 * the colours of whichever theme happened to be the default. That is why the
 * Appearance picker moved its checkmark but changed nothing on screen.
 *
 * Define the factory at module scope so it is referentially stable:
 *
 *   const makeStyles = (c) => ({ card: { backgroundColor: c.card } });
 *   ...
 *   const styles = useThemedStyles(makeStyles);
 */
export const useThemedStyles = (factory) => {
  const { theme } = useTheme();
  return useMemo(
    () => StyleSheet.create(factory(theme.colors, theme)),
    [factory, theme]
  );
};

/** The shared global styles, rebuilt for whichever theme is active. */
export const useGlobalStyles = () => {
  const { theme } = useTheme();
  return useMemo(() => StyleSheet.create(makeGlobalStyles(theme)), [theme]);
};
