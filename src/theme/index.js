// Main theme exports
import { defaultTheme } from '../config/themes';

// Static theme values (non-hook, for class components and StyleSheet)
export const COLORS = defaultTheme.colors;
export const SHADOW = defaultTheme.shadows;
export const COMPONENTS = defaultTheme.components;

export const globalStyles = {
  screen: {
    flex: 1,
    backgroundColor: defaultTheme.colors.bg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: defaultTheme.colors.divider,
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: defaultTheme.colors.textPrimary,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: defaultTheme.colors.textSecondary,
  },
  input: {
    backgroundColor: defaultTheme.colors.bgSecondary,
    borderRadius: defaultTheme.borderRadius.md,
    padding: 12,
    color: defaultTheme.colors.textPrimary,
    borderWidth: 1,
    borderColor: defaultTheme.colors.glassBorder,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: defaultTheme.borderRadius.full,
    backgroundColor: defaultTheme.colors.bgSecondary,
  },
  chipText: {
    fontSize: 13,
    color: defaultTheme.colors.textSecondary,
  },
  btnPrimary: {
    backgroundColor: defaultTheme.buttons.primary.backgroundColor,
    borderRadius: defaultTheme.borderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    color: defaultTheme.buttons.primary.textColor,
    fontSize: 16,
    fontWeight: '700',
  },
};

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
