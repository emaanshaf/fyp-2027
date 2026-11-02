import React from 'react';
import { render, waitFor, screen } from '@testing-library/react-native';
import LandingScreen from '../LandingScreen';
import { HIJRI_MONTH_INFO } from '../../data/hijriMonths';
import { DAILY_HADITH, DAILY_VERSE_KEYS, dayIndex } from '../../data/daily';

/**
 * The landing page makes religious claims, so its content rules are the part
 * worth testing: references must render, contested dates must render their
 * dispute, and "of the day" must mean the day rather than the render.
 */

beforeEach(() => {
  global.__resetStorage();
  global.fetch = jest.fn(() => Promise.reject(new Error('offline in tests')));
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe('daily content selection', () => {
  it('is stable within a day and changes across days', () => {
    // Local dates, not UTC: "the day" is the user's day, so a reader in any
    // timezone sees one verse from their midnight to their midnight.
    const a = new Date(2026, 2, 10, 1, 0);
    const b = new Date(2026, 2, 10, 22, 0);
    const c = new Date(2026, 2, 11, 9, 0);
    expect(dayIndex(30, a)).toBe(dayIndex(30, b));
    expect(dayIndex(30, a)).not.toBe(dayIndex(30, c));
  });

  it('never returns an out-of-range index', () => {
    for (let d = 0; d < 400; d++) {
      const date = new Date(2026, 0, 1 + d);
      const i = dayIndex(DAILY_VERSE_KEYS.length, date);
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThan(DAILY_VERSE_KEYS.length);
    }
  });
});

describe('content integrity', () => {
  it('gives every hadith a collection and a reference', () => {
    for (const h of DAILY_HADITH) {
      expect(h.collection).toBeTruthy();
      expect(h.reference).toBeTruthy();
      expect(h.text.length).toBeGreaterThan(20);
    }
  });

  it('uses well-formed surah:ayah keys for every daily verse', () => {
    for (const key of DAILY_VERSE_KEYS) {
      expect(key).toMatch(/^\d{1,3}:\d{1,3}$/);
      const [surah] = key.split(':').map(Number);
      expect(surah).toBeGreaterThanOrEqual(1);
      expect(surah).toBeLessThanOrEqual(114);
    }
  });

  it('covers all twelve Hijri months with Arabic and a summary', () => {
    for (let m = 1; m <= 12; m++) {
      const info = HIJRI_MONTH_INFO[m];
      expect(info).toBeDefined();
      expect(info.arabic).toBeTruthy();
      expect(info.summary).toBeTruthy();
    }
  });

  it('marks exactly the four sacred months', () => {
    const sacred = Object.entries(HIJRI_MONTH_INFO)
      .filter(([, v]) => v.sacred).map(([k]) => Number(k)).sort((a, b) => a - b);
    expect(sacred).toEqual([1, 7, 11, 12]);
  });

  it('gives every month highlight a provenance marker', () => {
    // A highlight asserting an event must either cite a source or say plainly
    // that the date is disputed. Silent assertion is the failure mode.
    for (const info of Object.values(HIJRI_MONTH_INFO)) {
      for (const h of info.highlights || []) {
        const marked = Boolean(h.reference) || Boolean(h.disputed) || Boolean(h.established);
        expect({ title: h.title, marked }).toEqual({ title: h.title, marked: true });
      }
    }
  });
});

describe('LandingScreen', () => {
  it('renders the Hijri date, hadith provenance and the entry CTA offline', async () => {
    render(<LandingScreen onDone={() => {}} />);

    await waitFor(() => expect(screen.getByText(/AH$/)).toBeTruthy());
    expect(screen.getByText('✦ Today in the Islamic World ✦')).toBeTruthy();
    expect(screen.getByLabelText('Enter Qitab-e-Noor')).toBeTruthy();

    // Provenance labels must be present even with no network.
    expect(screen.getByText('Collection')).toBeTruthy();
    expect(screen.getByText('Reference')).toBeTruthy();

    // The verse degrades to its reference rather than to a blank card.
    await waitFor(() => expect(screen.getByLabelText('Retry')).toBeTruthy());
  });
});
