// Theme utility functions
import { StyleSheet } from 'react-native';

/**
 * Flatten theme tokens for StyleSheet.create
 * @param {Object} theme - Theme object
 * @returns {Object} Flattened tokens
 */
export function flattenTokens(theme) {
  return {
    colors: theme.colors,
    spacing: theme.spacing,
    typography: theme.typography,
    borderRadius: theme.borderRadius,
    shadows: theme.shadows,
  };
}

/**
 * Generate StyleSheet-compatible theme object
 * @param {Object} theme - Theme object
 * @returns {Object} StyleSheet-ready theme
 */
export function createThemeStylesheet(theme) {
  return StyleSheet.create({
    colors: theme.colors,
    spacing: theme.spacing,
    typography: theme.typography,
    borderRadius: theme.borderRadius,
    shadows: theme.shadows,
  });
}

/**
 * Merge two theme objects (for overrides)
 * @param {Object} base - Base theme
 * @param {Object} override - Override theme
 * @returns {Object} Merged theme
 */
export function mergeTheme(base, override) {
  const merged = { ...base };
  for (const key of Object.keys(override)) {
    if (typeof override[key] === 'object' && override[key] !== null && !Array.isArray(override[key])) {
      merged[key] = mergeTheme(base[key] || {}, override[key]);
    } else {
      merged[key] = override[key];
    }
  }
  return merged;
}

/**
 * Get theme value by dot-notation path
 * @param {Object} theme - Theme object
 * @param {string} path - Dot-notation path (e.g., 'colors.gold')
 * @param {*} defaultValue - Default value if path not found
 * @returns {*} Value at path or default
 */
export function getThemeValue(theme, path, defaultValue = undefined) {
  return path.split('.').reduce((obj, key) => obj?.[key], theme) ?? defaultValue;
}

/**
 * Create responsive spacing based on screen width
 * @param {number} baseSpacing - Base spacing value
 * @param {number} screenWidth - Screen width
 * @returns {number} Responsive spacing
 */
export function responsiveSpacing(baseSpacing, screenWidth) {
  const scale = screenWidth / 375; // iPhone 8 width as baseline
  return Math.round(baseSpacing * scale);
}

/**
 * Generate CSS custom properties from theme
 * @param {Object} theme - Theme object
 * @param {string} prefix - CSS variable prefix
 * @returns {Object} CSS custom properties
 */
export function generateCSSVariables(theme, prefix = 'qitab') {
  const variables = {};

  // Colors
  Object.entries(theme.colors).forEach(([key, value]) => {
    variables[`--${prefix}-color-${key}`] = value;
  });

  // Spacing
  Object.entries(theme.spacing).forEach(([key, value]) => {
    variables[`--${prefix}-spacing-${key}`] = `${value}px`;
  });

  // Border radius
  Object.entries(theme.borderRadius).forEach(([key, value]) => {
    variables[`--${prefix}-radius-${key}`] = `${value}px`;
  });

  // Typography
  Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
    variables[`--${prefix}-font-size-${key}`] = `${value}px`;
  });

  return variables;
}

/**
 * Apply theme to document root (for web)
 * @param {Object} theme - Theme object
 */
export function applyThemeToRoot(theme) {
  if (typeof document === 'undefined') return;

  const variables = generateCSSVariables(theme);
  const root = document.documentElement;

  Object.entries(variables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

/**
 * Create themed style object for a component
 * @param {Object} theme - Theme object
 * @param {Object} styleConfig - Component style config from theme
 * @param {Object} overrides - Style overrides
 * @returns {Object} Merged style object
 */
export function createThemedStyle(theme, styleConfig, overrides = {}) {
  const resolvedConfig = typeof styleConfig === 'function' ? styleConfig(theme) : styleConfig;
  return { ...resolvedConfig, ...overrides };
}