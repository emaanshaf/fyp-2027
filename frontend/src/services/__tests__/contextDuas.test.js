import {
  DROUGHT_DAYS,
  MANUAL_CONTEXTS,
  TRAVEL_SPEED_MPS,
  buildContextRecommendation,
  matchDuas,
  moonContext,
  moonPhase,
  movementContexts,
  natureContexts,
  placeContexts,
  sanitizeManualContexts,
  timeContexts,
  weatherContexts,
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

describe('weatherContexts', () => {
  it('maps rain, storms and hail to the right contexts', () => {
    expect(weatherContexts({ code: 61 }).contexts).toEqual(['rain']);
    expect(weatherContexts({ code: 95 }).contexts).toEqual(['storm']);
    expect(weatherContexts({ code: 96 }).contexts).toEqual(['hail', 'storm']);
  });

  it('offers the rain prayer only after a real dry spell', () => {
    const dry = weatherContexts({ code: 0, daysSinceRain: DROUGHT_DAYS + 10, rainTrackedDays: 93 });
    expect(dry.contexts).toEqual(['drought']);
    expect(dry.reason).toMatch(/70 days/);
    expect(weatherContexts({ code: 0, daysSinceRain: 5 }).contexts).toEqual([]);
  });

  it('says 92+ when it never rained in the whole window', () => {
    const result = weatherContexts({ code: 0, daysSinceRain: 93, rainTrackedDays: 93 });
    expect(result.reason).toMatch(/93\+ days/);
  });

  it('ignores a missing reading', () => {
    expect(weatherContexts(null).contexts).toEqual([]);
    expect(weatherContexts({}).contexts).toEqual([]);
  });
});

describe('moonContext', () => {
  it('recognises the reference new moon', () => {
    const newMoon = new Date(Date.UTC(2000, 0, 6, 18, 14));
    expect(moonContext(newMoon).isNew).toBe(true);
  });

  it('does not call the full moon new', () => {
    const full = new Date(Date.UTC(2000, 0, 6, 18, 14) + 14.77 * 86400000);
    expect(moonContext(full).isNew).toBe(false);
    expect(moonPhase(full).phase).toBeCloseTo(0.5, 1);
  });
});

describe('natureContexts', () => {
  it('names the river and orders the kinds for matching', () => {
    const result = natureContexts({ kinds: ['mountain', 'river'], names: { river: 'Chenab' } });
    expect(result.contexts).toEqual(['river', 'mountain']);
    expect(result.reason).toBe('You are near the Chenab');
  });

  it('has a plain wording when the feature has no name', () => {
    expect(natureContexts({ kinds: ['river'], names: {} }).reason).toBe('You are near a river');
    expect(natureContexts(null).contexts).toEqual([]);
  });
});

describe('context priority', () => {
  const date = new Date(2026, 9, 26, 10, 0); // not near a new moon

  it('lets rain beat both the clock and a named place', () => {
    const result = buildContextRecommendation({
      date,
      weather: { code: 61 },
      place: { address: { name: 'Central Masjid' } },
    });
    expect(result.sources).toEqual(['weather']);
    expect([35, 36]).toContain(result.dua.id);
  });

  it('shows the crescent dua at the new moon when nothing more urgent is known', () => {
    const newMoon = new Date(Date.UTC(2000, 0, 6, 18, 14));
    const result = buildContextRecommendation({ date: newMoon });
    expect(result.sources).toEqual(['moon']);
    expect(result.dua.id).toBe(38);
  });

  it('uses the landscape when it is otherwise an ordinary morning', () => {
    const result = buildContextRecommendation({
      date,
      nature: { kinds: ['river'], names: { river: 'Ravi' } },
    });
    expect(result.sources).toEqual(['nature']);
    expect([42, 43]).toContain(result.dua.id);
  });

  it('still lets a tapped chip win over the weather', () => {
    const result = buildContextRecommendation({
      date,
      manualContexts: ['mosque'],
      weather: { code: 61 },
    });
    expect(result.sources).toEqual(['manual']);
  });
});
