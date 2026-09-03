/**
 * @typedef {Object} ColorPalette
 * @property {string} bg - Primary background
 * @property {string} bgSecondary - Secondary background
 * @property {string} bgCard - Card background
 * @property {string} gold - Brand gold
 * @property {string} goldLight - Lighter gold
 * @property {string} emerald - Success green
 * @property {string} textPrimary - Primary text
 * @property {string} textSecondary - Secondary text
 * @property {string} glass - Glassmorphism bg
 * @property {string} glassBorder - Glass border
 * @property {string} red - Error/danger
 * @property {string} blue - Info
 * @property {string} purple - Accent
 * @property {string} pink - Accent
 * @property {string} cyan - Accent
 * @property {string} amber - Warning
 * @property {string} cardBackground - Card bg with opacity
 * @property {string} divider - Divider color
 * @property {string} placeholder - Placeholder text
 */

/**
 * @typedef {Object} SpacingTokens
 * @property {number} xs - 4
 * @property {number} sm - 8
 * @property {number} md - 16
 * @property {number} lg - 24
 * @property {number} xl - 32
 * @property {number} xxl - 48
 */

/**
 * @typedef {Object} TypographyTokens
 * @property {Object} fontFamily - { regular, medium, bold, arabic }
 * @property {Object} fontSize - { xs, sm, md, lg, xl, xxl, xxxl }
 * @property {Object} lineHeight - { tight, normal, relaxed }
 * @property {Object} fontWeight - { normal, medium, semibold, bold, black }
 * @property {Object} letterSpacing - { tight, normal, wide }
 */

/**
 * @typedef {Object} BorderRadiusTokens
 * @property {number} sm - 8
 * @property {number} md - 12
 * @property {number} lg - 16
 * @property {number} xl - 24
 * @property {number} full - 9999
 */

/**
 * @typedef {Object} ShadowTokens
 * @property {Object} sm - StyleSheet shadow
 * @property {Object} md - StyleSheet shadow
 * @property {Object} lg - StyleSheet shadow
 */

/**
 * @typedef {Object} ButtonVariantConfig
 * @property {string} backgroundColor
 * @property {string} textColor
 * @property {string} borderColor
 * @property {number} borderWidth
 * @property {number} pressedOpacity
 * @property {number} disabledOpacity
 * @property {string} [loadingColor]
 */

/**
 * @typedef {Object} ButtonSizeConfig
 * @property {number} height
 * @property {number} paddingHorizontal
 * @property {number} fontSize
 * @property {number} borderRadius
 * @property {number} iconSize
 */

/**
 * @typedef {Object} ButtonConfig
 * @property {ButtonVariantConfig} primary
 * @property {ButtonVariantConfig} secondary
 * @property {ButtonVariantConfig} outline
 * @property {ButtonVariantConfig} ghost
 * @property {ButtonVariantConfig} danger
 * @property {ButtonVariantConfig} gold
 * @property {Object.<string, ButtonSizeConfig>} sizes
 */

/**
 * @typedef {Object} TabBarConfig
 * @property {string} backgroundColor
 * @property {string} borderColor
 * @property {string} activeTint
 * @property {string} inactiveTint
 * @property {number} height
 * @property {Object} labelStyle
 * @property {number} iconSize
 */

/**
 * @typedef {Object} DrawerConfig
 * @property {string} backgroundColor
 * @property {number} width
 * @property {string} activeTint
 * @property {string} inactiveTint
 * @property {Object} labelStyle
 * @property {Object} itemStyle
 */

/**
 * @typedef {Object} HeaderConfig
 * @property {string} backgroundColor
 * @property {string} tintColor
 * @property {Object} titleStyle
 */

/**
 * @typedef {Object} NavigationConfig
 * @property {TabBarConfig} tabBar
 * @property {DrawerConfig} drawer
 * @property {HeaderConfig} header
 * @property {Object} screen
 */

/**
 * @typedef {Object} ScreenConfig
 * @property {number} paddingHorizontal
 * @property {number} paddingVertical
 * @property {string} backgroundColor
 * @property {Object} card
 * @property {Object} sectionTitle
 * @property {Object} divider
 */

/**
 * @typedef {Object} ThemeConfig
 * @property {string} name - Theme identifier
 * @property {string} displayName - Human readable
 * @property {ColorPalette} colors
 * @property {SpacingTokens} spacing
 * @property {TypographyTokens} typography
 * @property {BorderRadiusTokens} borderRadius
 * @property {ShadowTokens} shadows
 * @property {ButtonConfig} buttons
 * @property {NavigationConfig} navigation
 * @property {ScreenConfig} screens
 * @property {Object} components - Component-specific overrides
 */