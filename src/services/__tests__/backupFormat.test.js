import {
  BACKUP_FORMAT, BACKUP_KEYS, BACKUP_VERSION, MAX_BACKUP_BYTES,
  backupFilename, canonicalJson, checksumInput, checksumMatches,
  createEnvelope, describeEnvelope, normalisePayload, parseEnvelope,
  restorableEntries,
} from '../backupFormat';

const payload = {
  qitab_user_name: 'Aisha',
  qitab_preferences: '{"quranFontSize":30}',
  qitab_bookmarks: '["2:255"]',
};

const envelope = () => createEnvelope({
  payload,
  checksum: 'sha256:abc123',
  createdAt: '2026-10-24T12:00:00.000Z',
  appVersion: '1.0.0',
  platform: 'android',
});

describe('canonicalJson', () => {
  it('produces the same string regardless of key insertion order', () => {
    const a = { b: '2', a: '1', nested: { y: 2, x: 1 } };
    const b = { nested: { x: 1, y: 2 }, a: '1', b: '2' };
    expect(canonicalJson(a)).toBe(canonicalJson(b));
    expect(canonicalJson(a)).toBe('{"a":"1","b":"2","nested":{"x":1,"y":2}}');
  });

  it('handles arrays and undefined without throwing', () => {
    expect(canonicalJson(['b', 'a'])).toBe('["b","a"]');
    expect(canonicalJson(undefined)).toBe('null');
  });
});

describe('normalisePayload', () => {
  it('keeps only whitelisted string values', () => {
    const result = normalisePayload({
      qitab_user_name: 'Aisha',
      qitab_bookmarks: null,
      qitab_preferences: 42,
      auth_token: 'secret',
      unknown_key: 'x',
    });
    expect(result).toEqual({ qitab_user_name: 'Aisha' });
  });

  it('does not include security or cache keys', () => {
    expect(BACKUP_KEYS).not.toContain('qitab_auth_token');
    expect(BACKUP_KEYS).not.toContain('qitab_app_lock');
    expect(BACKUP_KEYS).not.toContain('qitab_offline_quran_manifest');
    expect(BACKUP_KEYS).not.toContain('qitab_api_catalog_cache');
  });

  it('feeds the checksum the same data in any order', () => {
    const reversed = Object.fromEntries(Object.entries(payload).reverse());
    expect(checksumInput(payload)).toBe(checksumInput(reversed));
  });
});

describe('createEnvelope', () => {
  it('records format, version, metadata and a key count', () => {
    const env = envelope();
    expect(env.format).toBe(BACKUP_FORMAT);
    expect(env.version).toBe(BACKUP_VERSION);
    expect(env.keyCount).toBe(3);
    expect(env.appVersion).toBe('1.0.0');
    expect(env.platform).toBe('android');
    expect(env.checksum).toBe('sha256:abc123');
    expect(env.payload).toEqual(payload);
  });

  it('defaults unknown metadata instead of omitting it', () => {
    const env = createEnvelope({ payload: {}, checksum: 'x', createdAt: 'now' });
    expect(env.appVersion).toBe('unknown');
    expect(env.platform).toBe('unknown');
    expect(env.keyCount).toBe(0);
  });
});

describe('parseEnvelope', () => {
  it('accepts a well-formed backup', () => {
    const parsed = parseEnvelope(JSON.stringify(envelope()));
    expect(parsed.ok).toBe(true);
    expect(parsed.envelope.payload.qitab_user_name).toBe('Aisha');
  });

  it('rejects empty, non-JSON and plain JSON files', () => {
    expect(parseEnvelope('').ok).toBe(false);
    expect(parseEnvelope('not json {').error).toMatch(/valid JSON/i);
    expect(parseEnvelope(JSON.stringify({ hello: 'world' })).error).toMatch(/not created by/i);
  });

  it('rejects a backup from a newer app version', () => {
    const env = { ...envelope(), version: BACKUP_VERSION + 1 };
    expect(parseEnvelope(JSON.stringify(env)).error).toMatch(/newer version/i);
  });

  it('rejects a missing checksum', () => {
    const env = { ...envelope(), checksum: '' };
    expect(parseEnvelope(JSON.stringify(env)).error).toMatch(/checksum/i);
  });

  it('rejects non-string payload values', () => {
    const env = { ...envelope(), payload: { qitab_user_name: 42 } };
    expect(parseEnvelope(JSON.stringify(env)).error).toMatch(/invalid entry/i);
  });

  it('rejects an oversized file before parsing', () => {
    const huge = 'x'.repeat(MAX_BACKUP_BYTES + 1);
    expect(parseEnvelope(huge).error).toMatch(/too large/i);
  });
});

describe('checksumMatches', () => {
  it('matches with or without the sha256 prefix and ignores case', () => {
    expect(checksumMatches({ checksum: 'sha256:ABC' }, 'abc')).toBe(true);
    expect(checksumMatches({ checksum: 'ABC' }, 'sha256:abc')).toBe(true);
  });

  it('rejects a different digest, an empty digest, and no checksum', () => {
    expect(checksumMatches({ checksum: 'sha256:abc' }, 'def')).toBe(false);
    expect(checksumMatches({ checksum: '' }, 'abc')).toBe(false);
    expect(checksumMatches(null, 'abc')).toBe(false);
  });
});

describe('restore helpers', () => {
  it('skips unknown keys and counts them', () => {
    const { accepted, skipped } = restorableEntries({
      qitab_user_name: 'Aisha',
      unknown_key: 'ignore me',
      qitab_theme_preference: 'light',
    });
    expect(accepted).toEqual([
      ['qitab_user_name', 'Aisha'],
      ['qitab_theme_preference', 'light'],
    ]);
    expect(skipped).toBe(1);
  });

  it('summarises what a restore would write', () => {
    const summary = describeEnvelope(envelope());
    expect(summary.restorable).toBe(3);
    expect(summary.skipped).toBe(0);
    expect(summary.createdAt).toBe('2026-10-24T12:00:00.000Z');
    expect(summary.keys).toEqual(expect.arrayContaining(['qitab_user_name']));
  });
});

describe('backupFilename', () => {
  it('uses a sortable local date and time', () => {
    const date = new Date(2026, 9, 24, 18, 30);
    expect(backupFilename(date)).toBe('qitab-e-noor-backup-2026-10-24-1830.json');
  });
});
