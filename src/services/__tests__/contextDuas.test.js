import {
  MANUAL_CONTEXTS,
  TRAVEL_SPEED_MPS,
  buildContextRecommendation,
  matchDuas,
  movementContexts,
  placeContexts,
  sanitizeManualContexts,
  timeContexts,
} from '../contextDuas';

describe('timeContexts', () => {
  it('treats Friday daytime as Jumu\u2019ah', () => {
    // 2026-10-30 is a Friday.
    expect(timeContexts(new Date(2026, 9, 30, 10, 0)).context).toBe('friday');
  });

  it('maps the hour of day to a worship moment', () => {
    expect(timeContexts(new Date(2026, 9, 26, 7, 0)).context).toBe('morning');
    expect(timeContexts(new Date(2026, 9, 26, 13, 0)).context).toBe('gratitude');
    expect(timeContexts(new Date(2026, 9, 26, 22, 0)).context).toBe('forgiveness');
    expect(timeContexts(new Date(2026, 9, 26, 2, 0)).context).toBe('sleep');
  });
});

describe('placeContexts', () => {
  it('recognises mosque, market and graveyard names', () => {
    expect(placeContexts({ name: 'Jamia Masjid' }).contexts).toContain('mosque');
    expect(placeContexts({ street: 'Souq Street' }).contexts).toContain('market');
    expect(placeContexts({ district: 'Qabristan Road' }).contexts).toContain('graveyard');
  });

  it('returns nothing rather than guessing for an ordinary street', () => {
    expect(placeContexts({ street: '12 Oak Avenue', city: 'Leeds' }).contexts).toEqual([]);
  });

  it('survives a missing address', () => {
    expect(placeContexts(null)).toEqual({ contexts: [], label: '' });
    expect(placeContexts('not-an-object')).toEqual({ contexts: [], label: '' });
  });
});

describe('movementContexts', () => {
  it('uses speed as an honest hint, not a claim', () => {
    expect(movementContexts(1.2).contexts).toEqual([]);
    expect(movementContexts(TRAVEL_SPEED_MPS).contexts).toEqual(['travel']);
    expect(movementContexts(null).contexts).toEqual([]);
  });
});

describe('manual contexts', () => {
  it('offers only known chips', () => {
    expect(MANUAL_CONTEXTS.length).toBeGreaterThan(4);
    expect(sanitizeManualContexts(['home', 'nonsense', 'rain'])).toEqual(['home', 'rain']);
    expect(sanitizeManualContexts('home')).toEqual([]);
  });
});

describe('matchDuas', () => {
  it('finds the entry and exit duas for a mosque', () => {
    const ids = matchDuas(['mosque']).map(d => d.id);
    expect(ids).toEqual(expect.arrayContaining([31, 32]));
  });

  it('puts duas matching more contexts first', () => {
    const matches = matchDuas(['rain', 'gratitude']);
    expect(matches[0].contexts).toEqual(expect.arrayContaining(['rain', 'gratitude']));
  });

  it('returns an empty list when nothing matches', () => {
    expect(matchDuas(['unknown-context'])).toEqual([]);
  });
});

describe('buildContextRecommendation', () => {
  const date = new Date(2026, 9, 26, 10, 0); // Monday morning

  it('lets a manual chip beat the clock', () => {
    const result = buildContextRecommendation({ date, manualContexts: ['market'] });
    expect(result.dua.category).toBe('Daily Life');
    expect(result.contexts).toEqual(['market']);
    expect(result.sources).toContain('manual');
    expect(result.reason).toMatch(/selected/i);
  });

  it('uses the place label when one was found', () => {
    const result = buildContextRecommendation({
      date,
      place: { address: { name: 'Central Masjid' } },
    });
    expect([31, 32]).toContain(result.dua.id);
    expect(result.reason).toMatch(/near a mosque/i);
    expect(result.sources).toContain('place');
  });

  it('falls back to the time of day when nothing is known', () => {
    const result = buildContextRecommendation({ date });
    expect(result.sources).toEqual(['time']);
    expect(result.dua).toBeTruthy();
    expect(result.reason).toBeTruthy();
  });

  it('ignores a slow walking speed', () => {
    const result = buildContextRecommendation({ date, speedMps: 1 });
    expect(result.contexts).toEqual(['morning']);
  });

  it('always returns a dua with a reason', () => {
    for (const manualContexts of [[], ['mosque'], ['travel'], ['illness']]) {
      const result = buildContextRecommendation({ date, manualContexts });
      expect(result.dua?.arabic).toBeTruthy();
      expect(typeof result.reason).toBe('string');
    }
  });
});
