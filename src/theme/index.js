import { StyleSheet } from 'react-native';

export const COLORS = {
  bg: '#05070a',
  bgSecondary: '#0a0e14',
  bgCard: '#0f1318',
  gold: '#d4af37',
  goldLight: '#f1d279',
  emerald: '#10b981',
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  glass: 'rgba(255,255,255,0.04)',
  glassBorder: 'rgba(255,255,255,0.1)',
  red: '#ef4444',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  pink: '#ec4899',
  cyan: '#06b6d4',
  amber: '#f59e0b',
};

export const FONTS = {
  black: '900',
  bold: '800',
  semibold: '700',
  medium: '500',
  regular: '400',
};

export const globalStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  card: {
    backgroundColor: COLORS.glass,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: 16,
  },
  cardLg: {
    backgroundColor: COLORS.glass,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: 24,
  },
  btnPrimary: {
    backgroundColor: COLORS.gold,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  btnPrimaryText: {
    color: '#000',
    fontWeight: FONTS.bold,
    fontSize: 16,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: FONTS.black,
    letterSpacing: -0.5,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: FONTS.bold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: COLORS.textPrimary,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  arabicText: {
    fontFamily: undefined,
    writingDirection: 'rtl',
    textAlign: 'right',
    color: COLORS.gold,
    lineHeight: 48,
  },
  chip: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderRadius: 20,
  },
  chipText: {
    color: COLORS.gold,
    fontSize: 11,
    fontWeight: FONTS.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.glassBorder,
    marginVertical: 16,
  },
});
