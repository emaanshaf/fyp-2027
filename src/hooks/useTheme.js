// Theme hooks for easy access to theme values
import { useTheme } from '../context/ThemeContext';

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