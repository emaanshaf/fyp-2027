import {
  assessHealth, buildReportText, formatBytes, formatDuration,
  summariseStorage, utf8Size,
} from '../diagnosticsFormat';

describe('utf8Size', () => {
  it('counts Latin and Arabic text by bytes, not characters', () => {
    expect(utf8Size('abc')).toBe(3);
    expect(utf8Size('سلام')).toBe(8);
    expect(utf8Size('')).toBe(0);
    expect(utf8Size(null)).toBe(0);
  });
});

describe('formatBytes / formatDuration', () => {
  it('uses readable units', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2 KB');
    expect(formatBytes(5.5 * 1024 * 1024)).toBe('5.5 MB');
  });

  it('formats latency and tolerates missing values', () => {
    expect(formatDuration(42.4)).toBe('42 ms');
    expect(formatDuration(null)).toBe('—');
    expect(formatDuration(-1)).toBe('—');
  });
});

describe('summariseStorage', () => {
  it('counts keys, bytes and only reports malformed JSON keys', () => {
    const summary = summariseStorage([
      ['qitab_preferences', '{"quranFontSize":26}'],
      ['qitab_bookmarks', 'not json'],
      ['salawat_total', '12'],
      ['qitab_user_name', 'Aisha'],
      ['some_note', '{bad'],
    ]);

    expect(summary.totalKeys).toBe(5);
    expect(summary.qitabKeys).toBe(3);
    expect(summary.malformed).toEqual(['qitab_bookmarks']);
    expect(summary.bytes).toBeGreaterThan(0);
    expect(summary.readable).toMatch(/B|KB|MB/);
  });

  it('does not report non-JSON keys or empty strings as corrupt', () => {
    const summary = summariseStorage([
      ['salawat_total', 'not-json-but-fine'],
      ['qitab_notes', ''],
      ['qitab_notes_empty', '   '],
    ]);
    expect(summary.malformed).toEqual([]);
  });

  it('handles a missing or broken entry list', () => {
    expect(summariseStorage()).toMatchObject({ totalKeys: 0, malformed: [] });
    expect(summariseStorage([null, ['qitab_notes', '{}']]).totalKeys).toBe(2);
  });
});

describe('assessHealth', () => {
  const healthy = {
    backend: { ok: true },
    storage: { malformed: [] },
  };

  it('reports normal when the backend answers and storage parses', () => {
    expect(assessHealth(healthy)).toMatchObject({ level: 'ok' });
  });

  it('prioritises corrupt storage over connectivity', () => {
    const result = assessHealth({
      backend: { ok: false },
      storage: { malformed: ['qitab_bookmarks'] },
    });
    expect(result.level).toBe('attention');
    expect(result.detail).toMatch(/backup/i);
  });

  it('distinguishes an offline backend from a server error', () => {
    expect(assessHealth({ backend: { ok: false, reachable: false }, storage: {} }))
      .toMatchObject({ level: 'offline' });
    expect(assessHealth({ backend: { ok: false, reachable: true, status: 500 }, storage: {} }))
      .toMatchObject({ level: 'attention' });
  });
});

describe('buildReportText', () => {
  it('includes the facts a maintainer needs and never a token', () => {
    const report = {
      generatedAt: '2026-10-24T12:00:00.000Z',
      runtime: {
        appVersion: '1.0.0', sdkVersion: '57.0.0', platform: 'android',
        deviceName: 'Pixel 7', osName: 'Android', osVersion: '14',
        engine: 'Hermes', physical: true,
      },
      backend: { ok: true, reachable: true, status: 200, latencyMs: 38, url: 'http://localhost:3001/api/health' },
      storage: { totalKeys: 21, readable: '12 KB', malformed: [] },
      offline: { packages: 1, chapters: 114, bytes: 5000000, readable: '4.8 MB' },
      cache: { entries: 6, readable: '300 KB' },
      notifications: { status: 'granted' },
      appLock: { enabled: true, hasPin: true, biometrics: false },
      lastSyncAt: '2026-10-24T11:00:00.000Z',
      preferences: { translationLanguage: 'en', reciterId: 7, quranFontSize: 26 },
      ai: { ok: false, message: 'The live assistant is not configured.' },
    };

    const text = buildReportText(report);
    expect(text).toContain('Qitab-e-Noor — system report');
    expect(text).toContain('Pixel 7');
    expect(text).toContain('Online — HTTP 200 in 38 ms');
    expect(text).toContain('114 surahs');
    expect(text).toContain('Notifications: granted');
    expect(text).toContain('App lock: Enabled (PIN)');
    expect(text).toContain('offline knowledge base');
    expect(text).toContain('No auth token, PIN or hash is included');
    expect(text).not.toMatch(/bearer|password|secret/i);
  });

  it('describes an offline backend without pretending it is an error', () => {
    const text = buildReportText({
      backend: { ok: false, reachable: false, error: 'Network request failed', url: 'http://x/api/health' },
      storage: { totalKeys: 0, readable: '0 B', malformed: [] },
      offline: { packages: 0 },
      appLock: { enabled: false },
    });
    expect(text).toContain('Offline — Network request failed');
    expect(text).toContain('Offline Quran: Nothing downloaded');
    expect(text).toContain('App lock: Disabled');
  });
});
