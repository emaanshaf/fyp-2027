import { themes } from '../themes';

/** Relative luminance per WCAG 2.1. */
function luminance(hex) {
  const [r, g, b] = hex.replace('#', '').match(/../g).map(h => {
    const c = parseInt(h, 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

const SOLID = /^#[0-9a-fA-F]{6}$/;

// The roles a component is allowed to reach for. A component written against
// these must work in every theme without a conditional, so every theme has to
// define every one of them.
const REQUIRED_ROLES = [
  'primary', 'primaryPressed', 'primaryTint', 'onPrimary',
  'accent', 'accentMuted',
  'surface', 'surfaceRaised', 'border', 'borderStrong',
  'textMuted',
  'success', 'warning', 'danger', 'info',
  'scrim',
];

describe('design system roles', () => {
  for (const [name, theme] of Object.entries(themes)) {
    describe(name, () => {
      const c = theme.colors;

      it('defines every semantic role', () => {
        const missing = REQUIRED_ROLES.filter(r => !c[r]);
        expect(missing).toEqual([]);
      });

      it('reads text on primary at AA', () => {
        expect(contrast(c.onPrimary, c.primary)).toBeGreaterThanOrEqual(4.5);
      });

      it('keeps the pressed state distinguishable from primary', () => {
        expect(c.primaryPressed).not.toBe(c.primary);
      });

      it.each(['surface', 'surfaceRaised'])(
        'reads body text on %s at AA', (surface) => {
          expect(contrast(c.textPrimary, c[surface])).toBeGreaterThanOrEqual(4.5);
        });

      it.each(['surface', 'surfaceRaised'])(
        'reads muted text on %s at AA for large text', (surface) => {
          // textMuted is for secondary labels, which the design system sets at
          // 14px+ semibold or larger, so 3:1 is the applicable threshold.
          expect(contrast(c.textMuted, c[surface])).toBeGreaterThanOrEqual(3);
        });

      it.each(['primaryTint', 'accent', 'success', 'warning', 'danger', 'info'])(
        '%s is legible on the base background', (role) => {
          expect(contrast(c[role], c.bg)).toBeGreaterThanOrEqual(3);
        });

      it('uses solid hex for anything text is drawn in', () => {
        // A translucent foreground composites against whatever is behind it,
        // so its measured contrast is a guess. Backgrounds and borders may be
        // translucent; text and icon colours may not.
        for (const role of ['primary', 'primaryTint', 'onPrimary', 'accent',
          'textMuted', 'success', 'warning', 'danger', 'info']) {
          expect(c[role]).toMatch(SOLID);
        }
      });
    });
  }

  it('gives every theme the same role vocabulary', () => {
    const vocabularies = Object.values(themes).map(
      t => REQUIRED_ROLES.filter(r => r in t.colors).join(',')
    );
    expect(new Set(vocabularies).size).toBe(1);
  });
});
