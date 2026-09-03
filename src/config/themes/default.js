// Default Islamic Dark Theme
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

export const defaultTheme = {
  name: 'default',
  displayName: 'Islamic Dark',
  colors: {
    // Deep midnight rather than pure black: elevation is only legible when
    // surfaces can sit above the base, and #000 flattens every card.
    bg: '#0A0E17',
    bgSecondary: '#121826',
    bgCard: '#161D2E',
    cardBackground: 'rgba(22, 29, 46, 0.96)',

    // Warm gold is the brand accent — used for emphasis, never for body text.
    gold: '#E0B44C',
    goldLight: '#F3D68C',

    // One harmonious accent family. These sit at a common lightness so they
    // read as a set rather than a clash, and each clears 4.5:1 on the base.
    emerald: '#34D399',
    blue: '#60A5FA',
    cyan: '#22D3EE',
    purple: '#A78BFA',
    pink: '#F472B6',
    amber: '#FBBF24',
    red: '#F87171',

    // Soft white: #FFF at full strength glares against a dark ground.
    textPrimary: '#F2F5FA',
    textSecondary: '#93A3BA',

    glass: 'rgba(22, 29, 46, 0.72)',
    glassBorder: 'rgba(255, 255, 255, 0.09)',
    divider: 'rgba(255, 255, 255, 0.07)',
    placeholder: 'rgba(242, 245, 250, 0.32)',
  },
  spacing: baseSpacing,
  typography: baseTypography,
  borderRadius: baseBorderRadius,
  shadows: baseShadows,
  buttons: {
    // The primary action carries the brand gold. Previously every variant was
    // a white slab, which gave the UI no visual hierarchy at all.
    primary: {
      backgroundColor: '#E0B44C',
      textColor: '#0A0E17',
      borderColor: '#E0B44C',
      borderWidth: 0,
      pressedOpacity: 0.85,
      disabledOpacity: 0.4,
      loadingColor: '#0A0E17',
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
      textColor: '#E0B44C',
      borderColor: 'rgba(224, 180, 76, 0.55)',
      borderWidth: 1,
      pressedOpacity: 0.75,
      disabledOpacity: 0.4,
      loadingColor: '#E0B44C',
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
      backgroundColor: '#F87171',
      textColor: '#0A0E17',
      borderColor: '#F87171',
      borderWidth: 0,
      pressedOpacity: 0.85,
      disabledOpacity: 0.4,
      loadingColor: '#0A0E17',
    },
    gold: {
      backgroundColor: '#E0B44C',
      textColor: '#0A0E17',
      borderColor: '#E0B44C',
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
};