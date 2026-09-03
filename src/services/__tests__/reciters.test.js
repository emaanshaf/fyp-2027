import { RECITERS, reciterById, isPerVerseOnly, quranService, toAudioUrl } from '../quranApi';

/**
 * The qari catalogue mixes two audio sources with different addressing schemes
 * (quran.com by surah:ayah, islamic.network by global ayah number). These
 * tests pin the contract between them, because getting it wrong produces a
 * 403 or 404 at playback time rather than a visible failure here.
 */

describe('qari catalogue', () => {
  it('has unique ids across both sources', () => {
    const ids = RECITERS.map(r => String(r.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('namespaces islamic.network ids so they cannot collide with numeric ones', () => {
    for (const r of RECITERS) {
      if (r.source === 'islamic.network') {
        expect(String(r.id).startsWith('in:')).toBe(true);
      } else {
        expect(typeof r.id).toBe('number');
      }
    }
  });

  it('gives every islamic.network qari an edition and a probed bitrate', () => {
    const cdn = RECITERS.filter(r => r.source === 'islamic.network');
    expect(cdn.length).toBeGreaterThan(0);
    for (const r of cdn) {
      expect(r.edition).toMatch(/^ar\./);
      expect([32, 40, 48, 64, 128, 192]).toContain(r.bitrate);
      expect(r.perVerseOnly).toBe(true);
    }
  });

  it('gives every qari a source', () => {
    for (const r of RECITERS) {
      expect(['quran.com', 'islamic.network']).toContain(r.source);
    }
  });

  it('resolves ids of either type', () => {
    expect(reciterById(7)?.name).toMatch(/Afasy/);
    expect(reciterById('7')?.name).toMatch(/Afasy/);
    expect(reciterById('in:mahermuaiqly')?.name).toMatch(/Muaiqly/);
    expect(reciterById('nope')).toBeNull();
  });

  it('flags only islamic.network qaris as per-verse-only', () => {
    expect(isPerVerseOnly(7)).toBe(false);
    expect(isPerVerseOnly('in:hudhaify')).toBe(true);
  });
});

describe('audio URL resolution', () => {
  beforeEach(() => {
    global.__resetStorage();
    global.fetch = jest.fn(() => Promise.reject(new Error('offline in tests')));
  });
  afterEach(() => jest.restoreAllMocks());

  it('builds a CDN url from the global ayah number for islamic.network qaris', async () => {
    // 2:255 is global ayah 262.
    const url = await quranService.getVerseAudioUrl('in:mahermuaiqly', 2, 255, 262);
    expect(url).toBe('https://cdn.islamic.network/quran/audio/128/ar.mahermuaiqly/262.mp3');
  });

  it('uses each qari its own probed bitrate, not a shared default', async () => {
    const a = await quranService.getVerseAudioUrl('in:ibrahimakhbar', 2, 255, 262);
    const b = await quranService.getVerseAudioUrl('in:abdullahbasfar', 2, 255, 262);
    expect(a).toContain('/audio/32/');
    expect(b).toContain('/audio/192/');
  });

  it('returns null rather than a 404 url when the global ayah id is missing', async () => {
    expect(await quranService.getVerseAudioUrl('in:hudhaify', 2, 255)).toBeNull();
  });

  it('reports no surah file for per-verse-only qaris without calling the network', async () => {
    expect(await quranService.getAudioUrl(2, 'in:hudhaify')).toBeNull();
    expect(await quranService.getVerseAudioList(2, 'in:hudhaify')).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('quran.com audio path normalisation', () => {
  // The per-ayah play button silently did nothing because these paths were
  // handed to the player unchanged. Each shape below is one the live API
  // actually returns.
  it('prefixes the verses host onto a bare relative path', () => {
    expect(toAudioUrl('Alafasy/mp3/002255.mp3'))
      .toBe('https://verses.quran.com/Alafasy/mp3/002255.mp3');
  });

  it('adds only a scheme to a protocol-relative path on another host', () => {
    // Husary and Tablawi come back like this; prefixing the verses host 404s.
    expect(toAudioUrl('//mirrors.quranicaudio.com/everyayah/Husary_64kbps/002255.mp3'))
      .toBe('https://mirrors.quranicaudio.com/everyayah/Husary_64kbps/002255.mp3');
  });

  it('leaves an absolute url alone', () => {
    expect(toAudioUrl('https://example.com/a.mp3')).toBe('https://example.com/a.mp3');
  });

  it('returns null for a missing path rather than a broken url', () => {
    expect(toAudioUrl(undefined)).toBeNull();
    expect(toAudioUrl('')).toBeNull();
  });
});

describe('per-verse audio honours the selected qari', () => {
  beforeEach(() => {
    global.__resetStorage();
    global.fetch = jest.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ audio_files: [{ verse_key: '2:255', url: 'Sudais/mp3/002255.mp3' }] }),
    }));
  });
  afterEach(() => jest.restoreAllMocks());

  it('requests the chosen reciter, not a hardcoded one', async () => {
    await quranService.getVerseAudioUrl(3, 2, 255, 262);
    const called = global.fetch.mock.calls[0][0];
    expect(called).toContain('/recitations/3/by_ayah/2:255');
    expect(called).not.toContain('audio=1');
  });
});
