import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AI_USAGE_STORAGE_KEY,
  classifyAISource,
  getAIUsage,
  recordAIUsage,
  resetAIUsage,
  summarizeAIUsage,
  usageDayKey,
} from '../aiUsage';

const NOW = new Date(2026, 10, 1, 12, 0, 0); // 1 Nov 2026, local noon

beforeEach(() => {
  global.__resetStorage();
});

describe('aiUsage', () => {
  it('classifies assistant sources into live, offline and other', () => {
    expect(classifyAISource('claude+rag')).toBe('live');
    expect(classifyAISource('claude')).toBe('live');
    expect(classifyAISource('offline')).toBe('offline');
    expect(classifyAISource('offline+quran')).toBe('offline');
    expect(classifyAISource('unavailable')).toBe('other');
    expect(classifyAISource(undefined)).toBe('other');
  });

  it('counts answers by source and day', async () => {
    await recordAIUsage('claude+rag', NOW);
    await recordAIUsage('offline', NOW);
    await recordAIUsage('offline+quran', NOW);

    const usage = await getAIUsage(NOW);
    expect(usage.total).toBe(3);
    expect(usage.live).toBe(1);
    expect(usage.offline).toBe(2);
    expect(usage.today).toBe(3);
    expect(usage.last7Days).toBe(3);
    expect(usage.bySource).toEqual({
      'claude+rag': 1,
      offline: 1,
      'offline+quran': 1,
    });
    expect(usage.lastAskedAt).toBe(NOW.toISOString());

    const stored = JSON.parse(await AsyncStorage.getItem(AI_USAGE_STORAGE_KEY));
    expect(stored.total).toBe(3);
    expect(stored.byDay[usageDayKey(NOW)]).toBe(3);
  });

  it('only counts the last seven local days in the weekly total', async () => {
    const old = new Date(2026, 9, 20, 12, 0, 0); // 20 Oct, more than 7 days earlier
    await recordAIUsage('offline', old);
    await recordAIUsage('offline', NOW);

    const usage = await getAIUsage(NOW);
    expect(usage.total).toBe(2);
    expect(usage.last7Days).toBe(1);
    expect(usage.today).toBe(1);
  });

  it('survives corrupt or unexpected stored data', async () => {
    await AsyncStorage.setItem(AI_USAGE_STORAGE_KEY, '{not json');
    expect(await getAIUsage(NOW)).toMatchObject({ total: 0, live: 0, offline: 0 });

    await AsyncStorage.setItem(
      AI_USAGE_STORAGE_KEY,
      JSON.stringify({ total: 'x', bySource: { offline: -2 }, byDay: { bad: 4 } })
    );
    expect(await getAIUsage(NOW)).toMatchObject({ total: 0, offline: 0, last7Days: 0 });
  });

  it('summarises a raw object without touching storage', () => {
    const summary = summarizeAIUsage(
      {
        total: 5,
        bySource: { claude: 2, offline: 2, unavailable: 1 },
        byDay: { [usageDayKey(NOW)]: 3 },
        lastAskedAt: NOW.toISOString(),
      },
      NOW
    );

    expect(summary).toMatchObject({ total: 5, live: 2, offline: 2, other: 1, today: 3 });
  });

  it('resets all counters', async () => {
    await recordAIUsage('claude', NOW);
    const cleared = await resetAIUsage(NOW);

    expect(cleared.total).toBe(0);
    expect(await AsyncStorage.getItem(AI_USAGE_STORAGE_KEY)).toBeNull();
    expect((await getAIUsage(NOW)).total).toBe(0);
  });
});
