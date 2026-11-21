import AsyncStorage from '@react-native-async-storage/async-storage';
import nodeCrypto from 'crypto';

jest.mock('expo-crypto', () => {
  const nodeCrypto = require('crypto');
  return {
    CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
    digestStringAsync: async (_algorithm, text) =>
      nodeCrypto.createHash('sha256').update(text).digest('hex'),
  };
});

// These modules are only touched by the file-picking and share paths, which
// this test does not exercise. Empty mocks keep native code out of the test.
jest.mock('expo-file-system/legacy', () => ({}));
jest.mock('expo-sharing', () => ({ isAvailableAsync: async () => false }));
jest.mock('expo-document-picker', () => ({ getDocumentAsync: async () => ({ canceled: true }) }));

import {
  createEnvelope, normalisePayload, checksumInput,
} from '../backupFormat';
import { restoreBackupText } from '../backup';
import { preferences } from '../preferences';

const sign = payload =>
  `sha256:${nodeCrypto.createHash('sha256').update(checksumInput(payload)).digest('hex')}`;

function backupText(values) {
  const payload = normalisePayload(values);
  return JSON.stringify(createEnvelope({
    payload,
    checksum: sign(payload),
    createdAt: '2026-10-24T12:00:00.000Z',
    appVersion: '1.0.0',
    platform: 'android',
  }));
}

describe('restoreBackupText', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    preferences._clearCache();
  });

  it('overwrites backed-up keys, leaves unrelated data and skips unknown keys', async () => {
    await AsyncStorage.multiSet([
      ['qitab_user_name', 'Old name'],
      ['qitab_app_lock', '{"pin":"hash"}'],
      ['good_deeds', '["existing"]'],
    ]);

    // The extra key is kept in the envelope on purpose: an edited file must
    // still be rejected for known data, and unknown keys must never be written.
    const payload = {
      qitab_user_name: 'Aisha',
      qitab_bookmarks: '["2:255"]',
      intruder_key: 'must not be written',
    };
    const text = JSON.stringify(createEnvelope({
      payload,
      checksum: sign(payload),
      createdAt: '2026-10-24T12:00:00.000Z',
      appVersion: '1.0.0',
      platform: 'android',
    }));

    const result = await restoreBackupText(text);

    expect(result).toMatchObject({ restored: 2, skipped: 1 });
    expect(result.createdAt).toBe('2026-10-24T12:00:00.000Z');
    expect(await AsyncStorage.getItem('qitab_user_name')).toBe('Aisha');
    expect(await AsyncStorage.getItem('qitab_bookmarks')).toBe('["2:255"]');
    expect(await AsyncStorage.getItem('intruder_key')).toBeNull();

    // A merge restore must not delete data the backup did not know about, and
    // must never touch the app-lock hash.
    expect(await AsyncStorage.getItem('good_deeds')).toBe('["existing"]');
    expect(await AsyncStorage.getItem('qitab_app_lock')).toBe('{"pin":"hash"}');
  });

  it('refreshes the preferences cache so screens see restored values', async () => {
    await AsyncStorage.setItem('qitab_preferences', JSON.stringify({ quranFontSize: 20 }));
    expect((await preferences.all()).quranFontSize).toBe(20);

    const text = backupText({
      qitab_preferences: JSON.stringify({ quranFontSize: 34, translationLanguage: 'ur' }),
    });
    await restoreBackupText(text);

    const restored = await preferences.all();
    expect(restored.quranFontSize).toBe(34);
    expect(restored.translationLanguage).toBe('ur');
  });

  it('rejects a tampered payload without writing anything', async () => {
    await AsyncStorage.setItem('qitab_user_name', 'Old name');

    const envelope = JSON.parse(backupText({ qitab_user_name: 'Aisha' }));
    envelope.payload.qitab_user_name = 'Mallory';

    await expect(restoreBackupText(JSON.stringify(envelope))).rejects.toThrow(/damaged/i);
    expect(await AsyncStorage.getItem('qitab_user_name')).toBe('Old name');
  });

  it('rejects a file from another app or a newer version', async () => {
    await expect(restoreBackupText('{"format":"other"}')).rejects.toThrow(/not created/i);

    const envelope = JSON.parse(backupText({ qitab_user_name: 'Aisha' }));
    envelope.version = 99;
    await expect(restoreBackupText(JSON.stringify(envelope))).rejects.toThrow(/newer version/i);
  });

  it('rejects a backup with no recognised data', async () => {
    const text = backupText({ something_else: 'value' });
    await expect(restoreBackupText(text)).rejects.toThrow(/no restorable/i);
  });
});
