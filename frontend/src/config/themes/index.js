import { defaultTheme } from './default';
import { lightTheme } from './light';
import { highContrastTheme } from './highContrast';
import {
  oceanBlueTheme,
  royalPurpleTheme,
  desertRoseTheme,
  midnightTealTheme,
  sunsetAmberTheme,
} from './palettes';

export { defaultTheme, lightTheme, highContrastTheme };

export const themes = {
  default: defaultTheme,
  light: lightTheme,
  highContrast: highContrastTheme,
  oceanBlue: oceanBlueTheme,
  royalPurple: royalPurpleTheme,
  desertRose: desertRoseTheme,
  midnightTeal: midnightTealTheme,
  sunsetAmber: sunsetAmberTheme,
};

export const themeNames = Object.keys(themes);
