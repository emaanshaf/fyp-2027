// High Contrast Theme for Accessibility
import {
  baseSpacing,
  baseTypography,
  baseBorderRadius,
  baseShadows,
  baseButtonSizes,
  baseNavigation,
  baseScreens,
  baseComponents,
} from '../theme.config';

export const highContrastTheme = {
  name: 'highContrast',
  displayName: 'High Contrast',
  colors: {
    bg: '#000000',
    bgSecondary: '#141414',
    bgCard: '#0A0A0A',
    // --- Semantic roles -----------------------------------------------------
    // High contrast trades subtlety for legibility on purpose: surfaces are
    // near-black, borders are solid white rather than translucent, and every
    // role is pushed to the edge of its hue.
    primary: '#00E676',
    primaryPressed: '#00C853',
    primaryTint: '#00E676',
    onPrimary: '#000000',

    accent: '#FFD400',
    accentMuted: 'rgba(255, 212, 0, 0.22)',

    surface: '#141414',
    surfaceRaised: '#0A0A0A',
    border: '#FFFFFF',
    borderStrong: '#FFFFFF',
    textMuted: '#D4D4D4',

    success: '#00E676',
    warning: '#FFD400',
    danger: '#FF5252',
    info: '#40C4FF',

    scrim: 'rgba(0, 0, 0, 0.85)',

    cardBackground: '#0A0A0A',

    // Pure, maximally separated hues — chosen so they remain distinct under
    // deuteranopia and protanopia, where red/green pairs collapse.
    gold: '#FFD400',
    goldLight: '#FFE866',
    emerald: '#00E676',
    blue: '#40C4FF',
    cyan: '#18FFFF',
    purple: '#D0A2FF',
    pink: '#FF80CC',
    amber: '#FFAB00',
    red: '#FF5252',

    textPrimary: '#FFFFFF',
    textSecondary: '#D4D4D4',

    glass: 'rgba(0, 0, 0, 0.95)',
    glassBorder: '#FFFFFF',
    divider: '#5A5A5A',
    placeholder: '#9A9A9A',
  },
  spacing: baseSpacing,
  typography: {
    ...baseTypography,
    fontSize: {
      ...baseTypography.fontSize,
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 22,
      xxl: 28,
      xxxl: 36,
    },
    fontWeight: {
      ...baseTypography.fontWeight,
      normal: '600',
      medium: '700',
      semibold: '800',
      bold: '900',
      black: '900',
    },
  },
  borderRadius: baseBorderRadius,
  shadows: {
    sm: { boxShadow: '0 0 0 1px #ffffff' },
    md: { boxShadow: '0 0 0 2px #ffffff' },
    lg: { boxShadow: '0 0 0 3px #ffffff' },
  },
  buttons: {
    primary: {
      backgroundColor: '#ffff00',
      textColor: '#000000',
      borderColor: '#ffff00',
      borderWidth: 3,
      pressedOpacity: 0.9,
      disabledOpacity: 0.4,
      loadingColor: '#000000',
    },
    secondary: {
      backgroundColor: '#1a1a1a',
      textColor: '#ffffff',
      borderColor: '#ffffff',
      borderWidth: 3,
      pressedOpacity: 0.9,
      disabledOpacity: 0.4,
      loadingColor: '#ffffff',
    },
    outline: {
      backgroundColor: 'transparent',
      textColor: '#ffff00',
      borderColor: '#ffff00',
      borderWidth: 3,
      pressedOpacity: 0.9,
      disabledOpacity: 0.4,
      loadingColor: '#ffff00',
    },
    ghost: {
      backgroundColor: 'transparent',
      textColor: '#cccccc',
      borderColor: 'transparent',
      borderWidth: 0,
      pressedOpacity: 0.7,
      disabledOpacity: 0.4,
      loadingColor: '#cccccc',
    },
    danger: {
      backgroundColor: '#ff0000',
      textColor: '#ffffff',
      borderColor: '#ff0000',
      borderWidth: 3,
      pressedOpacity: 0.9,
      disabledOpacity: 0.4,
      loadingColor: '#ffffff',
    },
    gold: {
      backgroundColor: '#ffff00',
      textColor: '#000000',
      borderColor: '#ffff00',
      borderWidth: 3,
      pressedOpacity: 0.9,
      disabledOpacity: 0.4,
      loadingColor: '#000000',
    },
    sizes: {
      ...baseButtonSizes,
      sm: { ...baseButtonSizes.sm, borderRadius: 4 },
      md: { ...baseButtonSizes.md, borderRadius: 6 },
      lg: { ...baseButtonSizes.lg, borderRadius: 8 },
    },
  },
  navigation: {
    ...baseNavigation,
    tabBar: {
      ...baseNavigation.tabBar,
      backgroundColor: '#000000',
      borderColor: '#ffffff',
      activeTint: '#ffff00',
      inactiveTint: '#cccccc',
      height: 72,
    },
    drawer: {
      ...baseNavigation.drawer,
      backgroundColor: '#000000',
      activeTint: '#ffff00',
      inactiveTint: '#cccccc',
    },
    header: {
      ...baseNavigation.header,
      backgroundColor: '#000000',
      tintColor: '#ffffff',
      titleStyle: { fontWeight: '900', color: '#ffff00' },
    },
    screen: {
      backgroundColor: '#000000',
    },
  },
  screens: {
    ...baseScreens,
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    paddingVertical: 20,
    card: {
      ...baseScreens.card,
      backgroundColor: '#111111',
      borderColor: '#ffffff',
      borderWidth: 2,
      padding: 20,
    },
    sectionTitle: {
      ...baseScreens.sectionTitle,
      color: '#ffff00',
      fontSize: 28,
      fontWeight: '900',
    },
    divider: {
      ...baseScreens.divider,
      height: 2,
      backgroundColor: '#ffffff',
    },
  },
  components: {
    ...baseComponents,
    input: {
      ...baseComponents.input,
      backgroundColor: '#000000',
      borderColor: '#ffffff',
      borderWidth: 2,
      color: '#ffffff',
      fontSize: 18,
    },
    inputFocus: {
      ...baseComponents.inputFocus,
      borderColor: '#ffff00',
      backgroundColor: '#1a1a1a',
    },
  },
};