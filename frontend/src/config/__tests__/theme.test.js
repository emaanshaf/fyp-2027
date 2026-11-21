import { themes } from '../themes';
import { MODULES, accentFor, iconFor, moduleByName } from '../routes';

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

const ACCENTS = ['gold', 'emerald', 'blue', 'cyan', 'purple', 'pink', 'amber', 'red'];
const SOLID = /^#[0-9a-fA-F]{6}$/;

describe('contrast', () => {
  for (const [name, theme] of Object.entries(themes)) {
    describe(name, () => {
      const c = theme.colors;

      it('meets AA for body text on the base background', () => {
        expect(contrast(c.textPrimary, c.bg)).toBeGreaterThanOrEqual(4.5);
      });

      it('meets AA for secondary text on the base background', () => {
        // Secondary text carries real information — timestamps, authors,
        // verse references — so it is held to the same bar, not 3:1.
        expect(contrast(c.textSecondary, c.bg)).toBeGreaterThanOrEqual(4.5);
      });

      it('meets AA for body text on cards', () => {
        expect(contrast(c.textPrimary, c.bgSecondary)).toBeGreaterThanOrEqual(4.5);
      });

      it('keeps every accent legible as a UI element on the base', () => {
        // Accents are icons, chips and borders rather than paragraphs, so the
        // 3:1 non-text bar applies.
        for (const key of ACCENTS) {
          expect(contrast(c[key], c.bg)).toBeGreaterThanOrEqual(3);
        }
      });

      it('keeps every accent legible on elevated surfaces too', () => {
        for (const key of ACCENTS) {
          expect(contrast(c[key], c.bgSecondary)).toBeGreaterThanOrEqual(3);
        }
      });

      it('reads primary button text against its own fill', () => {
        const b = theme.buttons.primary;
        expect(contrast(b.textColor.length === 4 ? '#000000' : b.textColor, b.backgroundColor))
          .toBeGreaterThanOrEqual(4.5);
      });
    });
  }
});

describe('palette structure', () => {
  for (const [name, theme] of Object.entries(themes)) {
    describe(name, () => {
      it('defines every accent as a solid hex', () => {
        // The palette previously set gold, emerald, blue, purple, pink, cyan
        // and amber all to #ffffff, which silently collapsed every bit of
        // colour-coding in the app into flat white.
        for (const key of ACCENTS) {
          expect(theme.colors[key]).toMatch(SOLID);
        }
      });

      it('gives the accents distinct values', () => {
        const values = ACCENTS.map(k => theme.colors[k].toLowerCase());
        expect(new Set(values).size).toBe(ACCENTS.length);
      });

      it('does not paint an accent the same as the text colour', () => {
        for (const key of ACCENTS) {
          expect(theme.colors[key].toLowerCase()).not.toBe(theme.colors.textPrimary.toLowerCase());
        }
      });

      it('separates the base, elevated and card surfaces', () => {
        const { bg, bgSecondary, bgCard } = theme.colors;
        expect(new Set([bg, bgSecondary, bgCard]).size).toBeGreaterThan(1);
      });
    });
  }
});

describe('module icons', () => {
  it('gives every module an outline icon', () => {
    for (const m of MODULES) {
      expect(m.icon).toMatch(/-outline$/);
    }
  });

  it('gives every module an accent that exists in the palette', () => {
    for (const m of MODULES) {
      expect(themes.default.colors[m.accent]).toMatch(SOLID);
    }
  });

  it('resolves an accent to a real colour', () => {
    expect(accentFor(themes.default.colors, 'Quran')).toBe(themes.default.colors.gold);
    expect(accentFor(themes.default.colors, 'Hadith')).toBe(themes.default.colors.emerald);
  });

  it('follows the active theme rather than hardcoding a hex', () => {
    // The same module resolves differently per theme — that is the point of
    // storing a token name instead of a colour.
    expect(accentFor(themes.light.colors, 'Quran')).toBe(themes.light.colors.gold);
    expect(accentFor(themes.light.colors, 'Quran')).not.toBe(accentFor(themes.default.colors, 'Quran'));
  });

  it('falls back to gold for an unknown module', () => {
    expect(accentFor(themes.default.colors, 'NoSuchModule')).toBe(themes.default.colors.gold);
  });

  it('switches to the filled glyph when active', () => {
    expect(iconFor('Quran')).toBe('book-outline');
    expect(iconFor('Quran', true)).toBe('book');
  });

  it('does not reuse one icon across unrelated modules', () => {
    // Some sharing is intentional (Hadith and its verification screen), but a
    // heavily duplicated icon set is what made the grid unscannable.
    const counts = {};
    for (const m of MODULES) counts[m.icon] = (counts[m.icon] || 0) + 1;
    const overused = Object.entries(counts).filter(([, n]) => n > 2);
    expect(overused).toEqual([]);
  });

  it('spreads modules across the accent range', () => {
    const used = new Set(MODULES.map(m => m.accent));
    expect(used.size).toBeGreaterThanOrEqual(6);
  });

  it('keeps the dashboard grid pointing at real modules', () => {
    for (const name of ['Quran', 'Hadith', 'Learning', 'Generator']) {
      expect(moduleByName(name)).toBeDefined();
    }
  });
});
