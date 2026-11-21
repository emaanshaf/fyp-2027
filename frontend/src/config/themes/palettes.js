// Additional color palettes — all built on top of the dark base.
// Each palette swaps the accent colours while keeping readability and
// the same structural tokens (bg, glass, divider, etc).

import {
  baseSpacing, baseTypography, baseBorderRadius, baseShadows,
  baseButtonSizes, baseNavigation, baseScreens, baseComponents,
} from '../theme.config';

// ── Helper: build a full theme from an accent palette ────────────────────
const makeDarkPalette = ({ name, displayName, primary, primaryTint, gold, goldLight, emerald, blue, cyan, purple, pink, amber, red }) => ({
  name,
  displayName,
  colors: {
    bg: '#111312',
    bgSecondary: '#191C1B',
    bgCard: '#202422',
    cardBackground: 'rgba(32, 36, 34, 0.96)',

    primary,
    primaryPressed: primary + 'CC',
    primaryTint,
    onPrimary: '#F4FBF8',

    accent: gold,
    accentMuted: gold + '29',

    surface: '#191C1B',
    surfaceRaised: '#202422',
    border: 'rgba(255, 255, 255, 0.08)',
    borderStrong: 'rgba(255, 255, 255, 0.16)',
    textMuted: '#9AA8A2',

    success: emerald || '#34D399',
    warning: amber || '#FBBF24',
    danger: red || '#F87171',
    info: blue || '#60A5FA',

    scrim: 'rgba(0, 0, 0, 0.62)',

    gold,
    goldLight: goldLight || gold + 'CC',

    emerald: emerald || '#34D399',
    blue:    blue    || '#60A5FA',
    cyan:    cyan    || '#22D3EE',
    purple:  purple  || '#A78BFA',
    pink:    pink    || '#F472B6',
    amber:   amber   || '#FBBF24',
    red:     red     || '#F87171',

    textPrimary: '#F2F5FA',
    textSecondary: '#9AA8A2',

    glass: 'rgba(32, 36, 34, 0.72)',
    glassBorder: 'rgba(255, 255, 255, 0.09)',
    divider: 'rgba(255, 255, 255, 0.07)',
    placeholder: 'rgba(242, 245, 250, 0.32)',
  },
  spacing: baseSpacing,
  typography: baseTypography,
  borderRadius: baseBorderRadius,
  shadows: baseShadows,
  buttons: {
    primary: {
      backgroundColor: primary,
      textColor: '#F4FBF8',
      borderColor: primary,
      borderWidth: 0,
      pressedOpacity: 0.85,
      disabledOpacity: 0.4,
      loadingColor: '#F4FBF8',
    },
    secondary: {
      backgroundColor: '#1E2739',
      textColor: '#F2F5FA',
      borderColor: 'rgba(255, 255, 255, 0.09)',
      borderWidth: 1,
      pressedOpacity: 0.85,
      disabledOpacity: 0.4,
      loadingColor: '#F2F5FA',
    },
    outline: {
      backgroundColor: 'transparent',
      textColor: gold,
      borderColor: gold + '88',
      borderWidth: 1,
      pressedOpacity: 0.75,
      disabledOpacity: 0.4,
      loadingColor: gold,
    },
    ghost: {
      backgroundColor: 'transparent',
      textColor: '#93A3BA',
      borderColor: 'transparent',
      borderWidth: 0,
      pressedOpacity: 0.6,
      disabledOpacity: 0.4,
      loadingColor: '#93A3BA',
    },
    danger: {
      backgroundColor: red || '#F87171',
      textColor: '#0A0E17',
      borderColor: red || '#F87171',
      borderWidth: 0,
      pressedOpacity: 0.85,
      disabledOpacity: 0.4,
      loadingColor: '#0A0E17',
    },
    gold: {
      backgroundColor: gold,
      textColor: '#0A0E17',
      borderColor: gold,
      borderWidth: 0,
      pressedOpacity: 0.85,
      disabledOpacity: 0.4,
      loadingColor: '#0A0E17',
    },
    sizes: baseButtonSizes,
  },
  navigation: baseNavigation,
  screens: baseScreens,
  components: baseComponents,
});

// ── Palette definitions ────────────────────────────────────────────────────

export const oceanBlueTheme = makeDarkPalette({
  name: 'oceanBlue',
  displayName: 'Ocean Blue',
  primary:     '#1565C0',
  primaryTint: '#42A5F5',
  // Not the same blue as `blue`: accent tokens are used to tell modules
  // apart, so duplicating one collapses the colour coding.
  gold:        '#64B5F6',
  goldLight:   '#90CAF9',
  emerald:     '#26A69A',
  blue:        '#42A5F5',
  cyan:        '#26C6DA',
  purple:      '#7E57C2',
  pink:        '#EC407A',
  amber:       '#FFA726',
  red:         '#EF5350',
});

export const royalPurpleTheme = makeDarkPalette({
  name: 'royalPurple',
  displayName: 'Royal Purple',
  primary:     '#6A1B9A',
  primaryTint: '#AB47BC',
  gold:        '#CE93D8',
  goldLight:   '#E1BEE7',
  emerald:     '#66BB6A',
  blue:        '#5C6BC0',
  cyan:        '#26C6DA',
  purple:      '#AB47BC',
  pink:        '#F06292',
  amber:       '#FFCA28',
  red:         '#EF5350',
});

export const desertRoseTheme = makeDarkPalette({
  name: 'desertRose',
  displayName: 'Desert Rose',
  primary:     '#AD1457',
  primaryTint: '#F06292',
  gold:        '#F48FB1',
  goldLight:   '#F8BBD0',
  emerald:     '#4DB6AC',
  blue:        '#5C6BC0',
  cyan:        '#4DD0E1',
  purple:      '#AB47BC',
  pink:        '#F06292',
  amber:       '#FFB74D',
  red:         '#E53935',
});

export const midnightTealTheme = makeDarkPalette({
  name: 'midnightTeal',
  displayName: 'Midnight Teal',
  primary:     '#00695C',
  primaryTint: '#26A69A',
  gold:        '#4DB6AC',
  goldLight:   '#80CBC4',
  emerald:     '#26A69A',
  blue:        '#29B6F6',
  cyan:        '#00E5FF',
  purple:      '#7E57C2',
  pink:        '#EC407A',
  amber:       '#FFA726',
  red:         '#EF5350',
});

export const sunsetAmberTheme = makeDarkPalette({
  name: 'sunsetAmber',
  displayName: 'Sunset Amber',
  // Darkened from #E65100 so white button text clears WCAG AA; at the old
  // value the primary button read at 3.6:1.
  primary:     '#C2410C',
  primaryTint: '#FF9800',
  // Distinct from `amber`, which keeps the original orange.
  gold:        '#FFCC80',
  goldLight:   '#FFE0B2',
  emerald:     '#66BB6A',
  blue:        '#42A5F5',
  cyan:        '#26C6DA',
  purple:      '#AB47BC',
  pink:        '#EC407A',
  amber:       '#FFB74D',
  red:         '#F44336',
});
