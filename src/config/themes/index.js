import { defaultTheme } from './default';
import { lightTheme } from './light';
import { highContrastTheme } from './highContrast';

export { defaultTheme, lightTheme, highContrastTheme };

export const themes = {
  default: defaultTheme,
  light: lightTheme,
  highContrast: highContrastTheme,
};

export const themeNames = Object.keys(themes);
