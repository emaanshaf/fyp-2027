// Global styles as a factory over a theme.
//
// These used to be frozen against defaultTheme at module load, so a screen
// using globalStyles.screen kept the dark background whichever theme was
// selected. Kept in its own module because src/theme/index.js re-exports the
// theme hooks, and the hooks need this factory — importing it from the barrel
// would be a cycle.
export const makeGlobalStyles = (t) => ({
  container: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: t.colors.bg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: t.colors.divider,
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: t.colors.textPrimary,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: t.colors.textSecondary,
  },
  input: {
    backgroundColor: t.colors.bgSecondary,
    borderRadius: t.borderRadius.md,
    padding: 12,
    color: t.colors.textPrimary,
    borderWidth: 1,
    borderColor: t.colors.glassBorder,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: t.borderRadius.full,
    backgroundColor: t.colors.bgSecondary,
  },
  chipText: {
    fontSize: 13,
    color: t.colors.textSecondary,
  },
  btnPrimary: {
    backgroundColor: t.buttons.primary.backgroundColor,
    borderRadius: t.borderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    color: t.buttons.primary.textColor,
    fontSize: 16,
    fontWeight: '700',
  },
});