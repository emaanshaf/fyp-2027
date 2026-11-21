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
    // Warm charcoal rather than pure black: elevation is only legible when
    // surfaces can sit above the base, and #000 flattens every card. Warm
    // rather than blue-black, so this and the ivory light theme read as one
    // product seen at two times of day.
    bg: '#111312',
    bgSecondary: '#191C1B',
    bgCard: '#202422',
    cardBackground: 'rgba(32, 36, 34, 0.96)',

    // --- Semantic roles -----------------------------------------------------
    // New code should reach for these rather than for a named hue: `primary`
    // can be retuned here once, where `emerald` cannot without a rename.
    //
    // Deep emerald is the brand. On a dark ground the fill stays deep with
    // near-white on it; primaryTint is the readable variant for icons and
    // labels sitting directly on the background.
    primary: '#0F7A55',
    primaryPressed: '#0B6144',
    primaryTint: '#34D399',
    onPrimary: '#F4FBF8',

    // Gold is an accent, not a second brand colour: section marks, active
    // indicators, occasional emphasis. Muted so it reads as brass rather than
    // as a highlighter.
    accent: '#C9A44C',
    accentMuted: 'rgba(201, 164, 76, 0.16)',

    surface: '#191C1B',
    surfaceRaised: '#202422',
    border: 'rgba(255, 255, 255, 0.08)',
    borderStrong: 'rgba(255, 255, 255, 0.16)',
    textMuted: '#9AA8A2',

    success: '#34D399',
    warning: '#FBBF24',
    danger: '#F87171',
    info: '#60A5FA',

    scrim: 'rgba(0, 0, 0, 0.62)',

    // The historical name for the accent; `accent` is the role new code should
    // use. Muted from #E0B44C so gold reads as restraint, not decoration.
    gold: '#C9A44C',
    goldLight: '#E3C87F',

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
    // The primary action carries the brand gold. Previously every variant was
    // a white slab, which gave the UI no visual hierarchy at all.
    primary: {
      // Deep emerald, not gold. Gold on every primary button made the accent
      // meaningless — when the brightest colour on screen is also the most
      // common one, nothing stands out. Gold is now reserved for emphasis.
      backgroundColor: '#0F7A55',
      textColor: '#F4FBF8',
      borderColor: '#0F7A55',
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