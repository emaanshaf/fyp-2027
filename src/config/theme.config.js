// Base theme configuration - shared tokens across all themes

export const baseSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const baseTypography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    arabic: 'Jameel Noori Naskh',
  },
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.8,
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    black: '900',
  },
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 1,
  },
};

export const baseBorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const baseShadows = {
  sm: {
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.18), 0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  },
  md: {
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.25), 0 2px 4px -1px rgba(0, 0, 0, 0.15)',
  },
  lg: {
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.15)',
  },
};

export const baseButtonSizes = {
  sm: {
    height: 36,
    paddingHorizontal: 16,
    fontSize: 13,
    borderRadius: 10,
    iconSize: 16,
  },
  md: {
    height: 48,
    paddingHorizontal: 24,
    fontSize: 15,
    borderRadius: 12,
    iconSize: 18,
  },
  lg: {
    height: 56,
    paddingHorizontal: 32,
    fontSize: 17,
    borderRadius: 16,
    iconSize: 20,
  },
};

export const baseNavigation = {
  tabBar: {
    backgroundColor: 'rgba(15, 20, 42, 0.95)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    activeTint: '#d4af37',
    inactiveTint: '#cbd5e1',
    height: 64,
    labelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
    iconSize: 22,
  },
  drawer: {
    backgroundColor: '#1e293b',
    width: 300,
    activeTint: '#d4af37',
    inactiveTint: '#cbd5e1',
    labelStyle: { fontSize: 15, fontWeight: '600' },
    itemStyle: { marginHorizontal: 8, borderRadius: 14 },
  },
  header: {
    backgroundColor: '#1e293b',
    tintColor: '#f8fafc',
    titleStyle: { fontWeight: '700', color: '#d4af37' },
  },
  screen: {
    backgroundColor: '#0f0c29',
  },
};

export const baseScreens = {
  paddingHorizontal: 20,
  paddingVertical: 16,
  backgroundColor: '#0f0c29',
  card: {
    backgroundColor: 'rgba(10, 15, 26, 0.9)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 16,
  },
};

export const baseComponents = {
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    color: '#f8fafc',
    fontSize: 16,
  },
  inputFocus: {
    borderColor: '#d4af37',
    backgroundColor: 'rgba(245, 245, 245, 0.1)',
  },
  avatar: {
    sm: { width: 32, height: 32, borderRadius: 10 },
    md: { width: 40, height: 40, borderRadius: 12 },
    lg: { width: 56, height: 56, borderRadius: 16 },
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
};