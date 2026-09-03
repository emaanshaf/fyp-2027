// Helper to generate theme-aware rgba colors
// Usage: accentBg(0.1) => white at 10% opacity on dark, black at 10% on light

import { COLORS } from '../theme';

// Light tint (white on dark mode)
export const accentBg = (opacity = 0.1) => `rgba(255, 255, 255, ${opacity})`;
// Accent border
export const accentBorder = (opacity = 0.2) => `rgba(255, 255, 255, ${opacity})`;
// Success tint (subtle white)
export const successBg = (opacity = 0.06) => `rgba(255, 255, 255, ${opacity})`;
// Success border
export const successBorder = (opacity = 0.2) => `rgba(255, 255, 255, ${opacity})`;
// Error tint
export const errorBg = (opacity = 0.08) => `rgba(255, 68, 68, ${opacity})`;
// Warning tint
export const warningBg = (opacity = 0.08) => `rgba(255, 255, 255, ${opacity})`;
