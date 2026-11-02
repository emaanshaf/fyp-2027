// Main theme exports
import { defaultTheme } from '../config/themes';
import { makeGlobalStyles } from './globalStyles';

// Static theme values (non-hook, for class components and StyleSheet)
export const COLORS = defaultTheme.colors;
export const SHADOW = defaultTheme.shadows;
export const COMPONENTS = defaultTheme.components;

export { makeGlobalStyles } from './globalStyles';


/** @deprecated Frozen against the default theme — use useGlobalStyles(). */
export const globalStyles = makeGlobalStyles(defaultTheme);

export { ThemeProvider, useTheme } from '../context/ThemeContext';
export {
  useColors,
  useSpacing,
  useTypography,
  useBorderRadius,
  useShadows,
  useButtons,
  useNavigation,
  useScreens,
  useComponents,
  useGlobalStyles,
  useThemedStyles,
  useThemeValue,
  useThemeName,
  useSetTheme,
  useAvailableThemes,
} from '../hooks/useTheme';
export {
  flattenTokens,
  createThemeStylesheet,
  mergeTheme,
  getThemeValue,
  responsiveSpacing,
  generateCSSVariables,
  applyThemeToRoot,
  createThemedStyle,
} from '../utils/themeUtils';
export { themes, themeNames, defaultTheme, lightTheme, highContrastTheme } from '../config/themes';
