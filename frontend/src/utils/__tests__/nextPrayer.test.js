import AsyncStorage from '@react-native-async-storage/async-storage';
import { getNextPrayer } from '../nextPrayer';

const CITY = 'Lahore';
const COUNTRY = 'Pakistan';

const seed = async (timings) => {
  await AsyncStorage.setItem('qitab_prayer_city', CITY);
  await AsyncStorage.setItem('qitab_prayer_country', COUNTRY);
  await AsyncStorage.setItem(`qitab_timings_${CITY}_${COUNTRY}`, JSON.stringify(timings));
};

const TIMINGS = {
  Fajr: '05:00',
  Dhuhr: '12:15',
  Asr: '16:00',
  Maghrib: '18:00',
  Isha: '19:00',
};

const at = (hour, minute = 0) => new Date(2026, 9, 29, hour, minute);

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('getNextPrayer targets', () => {
  it('gives the absolute instant of the next prayer', async () => {
    await seed(TIMINGS);
    const next = await getNextPrayer(at(10));

    expect(next.name).toBe('Dhuhr');
    expect(next.at).toBeInstanceOf(Date);
    expect(next.at.getFullYear()).toBe(2026);
    expect(next.at.getMonth()).toBe(9);
    expect(next.at.getDate()).toBe(29);
    expect(next.at.getHours()).toBe(12);
    expect(next.at.getMinutes()).toBe(15);
  });

  it('measures the window from the previous prayer', async () => {
    await seed(TIMINGS);
    const next = await getNextPrayer(at(10));
    // Fajr 05:00 -> Dhuhr 12:15 is 435 minutes.
    expect(next.windowMinutes).toBe(435);
  });

  it('rolls to tomorrow Fajr with a window from tonight Isha', async () => {
    await seed(TIMINGS);
    const next = await getNextPrayer(at(22));

    expect(next.name).toBe('Fajr');
    expect(next.tomorrow).toBe(true);
    expect(next.at.getDate()).toBe(30);
    expect(next.at.getHours()).toBe(5);
    // Isha 19:00 -> tomorrow Fajr 05:00 is 600 minutes.
    expect(next.windowMinutes).toBe(600);
  });

  it('counts the Fajr window from yesterday Isha when read before dawn', async () => {
    await seed(TIMINGS);
    const next = await getNextPrayer(at(3));
    expect(next.name).toBe('Fajr');
    expect(next.tomorrow).toBe(false);
    expect(next.at.getDate()).toBe(29);
    // Yesterday Isha 19:00 -> today Fajr 05:00 is 600 minutes.
    expect(next.windowMinutes).toBe(600);
  });

  it('returns null when no timings are cached', async () => {
    expect(await getNextPrayer(at(10))).toBeNull();
  });
});
