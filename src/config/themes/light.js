// Light Theme Variant
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

export const lightTheme = {
  name: 'light',
  displayName: 'Light',
  colors: {
    // Warm off-white rather than #FFF — easier to read from for long
    // stretches, which is what a Quran reader is for.
    bg: '#FBFAF7',
    bgSecondary: '#F2F0EA',
    bgCard: '#FFFFFF',
    cardBackground: '#FFFFFF',

    // The same hues as the dark theme, dropped to 600-700 so they keep
    // 4.5:1 contrast against a light ground.
    gold: '#9A6F14',
    goldLight: '#C08F2E',

    emerald: '#047857',
    blue: '#1D4ED8',
    cyan: '#0E7490',
    purple: '#6D28D9',
    pink: '#BE185D',
    amber: '#B45309',
    red: '#B91C1C',

    textPrimary: '#16202E',
    textSecondary: '#586A80',

    glass: 'rgba(255, 255, 255, 0.86)',
    glassBorder: 'rgba(22, 32, 46, 0.10)',
    divider: 'rgba(22, 32, 46, 0.08)',
    placeholder: 'rgba(22, 32, 46, 0.38)',
  },
  spacing: baseSpacing,
  typography: baseTypography,
  borderRadius: baseBorderRadius,
  shadows: {
    sm: { boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' },
    md: { boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' },
    lg: { boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' },
  },
  buttons: {
    primary: {
      backgroundColor: '#9A6F14',
      textColor: '#FFFFFF',
      borderColor: '#9A6F14',
      borderWidth: 0,
      pressedOpacity: 0.85,
      disabledOpacity: 0.4,
      loadingColor: '#FFFFFF',
    },
    secondary: {
      backgroundColor: '#F2F0EA',
      textColor: '#16202E',
      borderColor: 'rgba(22, 32, 46, 0.12)',
      borderWidth: 1,
      pressedOpacity: 0.85,
      disabledOpacity: 0.4,
      loadingColor: '#16202E',
    },
    outline: {
      backgroundColor: 'transparent',
      textColor: '#9A6F14',
      borderColor: 'rgba(154, 111, 20, 0.5)',
      borderWidth: 1,
      pressedOpacity: 0.75,
      disabledOpacity: 0.4,
      loadingColor: '#9A6F14',
    },
    ghost: {
      backgroundColor: 'transparent',
      textColor: '#586A80',
      borderColor: 'transparent',
      borderWidth: 0,
      pressedOpacity: 0.6,
      disabledOpacity: 0.4,
      loadingColor: '#586A80',
    },
    danger: {
      backgroundColor: '#B91C1C',
      textColor: '#FFFFFF',
      borderColor: '#B91C1C',
      borderWidth: 0,
      pressedOpacity: 0.85,
      disabledOpacity: 0.4,
      loadingColor: '#FFFFFF',
    },
    gold: {
      backgroundColor: '#9A6F14',
      textColor: '#FFFFFF',
      borderColor: '#9A6F14',
      borderWidth: 0,
      pressedOpacity: 0.85,
      disabledOpacity: 0.4,
      loadingColor: '#FFFFFF',
    },
    sizes: baseButtonSizes,
  },
  navigation: {
    ...baseNavigation,
    tabBar: {
      ...baseNavigation.tabBar,
      backgroundColor: '#ffffff',
      borderColor: 'rgba(22, 32, 46, 0.10)',
      activeTint: '#9A6F14',
      inactiveTint: '#8A9AAF',
    },
    drawer: {
      ...baseNavigation.drawer,
      backgroundColor: '#FBFAF7',
      activeTint: '#9A6F14',
      inactiveTint: '#586A80',
    },
    header: {
      ...baseNavigation.header,
      backgroundColor: '#FBFAF7',
      tintColor: '#16202E',
      titleStyle: { fontWeight: '700', color: '#9A6F14' },
    },
    screen: {
      backgroundColor: '#FBFAF7',
    },
  },
  screens: {
    ...baseScreens,
    backgroundColor: '#FBFAF7',
    card: {
      ...baseScreens.card,
      backgroundColor: '#ffffff',
      borderColor: 'rgba(22, 32, 46, 0.10)',
    },
    sectionTitle: {
      ...baseScreens.sectionTitle,
      color: '#16202E',
    },
    divider: {
      ...baseScreens.divider,
      backgroundColor: 'rgba(22, 32, 46, 0.10)',
    },
  },
  components: {
    ...baseComponents,
    input: {
      ...baseComponents.input,
      backgroundColor: '#ffffff',
      borderColor: 'rgba(22, 32, 46, 0.10)',
      color: '#16202E',
    },
    inputFocus: {
      ...baseComponents.inputFocus,
      borderColor: '#9A6F14',
      backgroundColor: '#fefce8',
    },
  },
};