// System health collection.
//
// Read-only by design: nothing here schedules work, writes storage or asks
// for permissions. It gathers what the app already knows plus one request to
// `/health`, so the Settings screen can show an honest snapshot and the user
// can share it when something is wrong.

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { apiUrl } from '../config/appConfig';
import { refreshClaudeStatus } from '../ai/claudeClient';
import { cacheStats } from './cache';
import { getOfflineStats } from './offlineLibrary';
import { notificationService } from './notifications';
import { getAppLockState } from './appLock';
import { preferences } from './preferences';
import { summariseStorage } from './diagnosticsFormat';

export const HEALTH_TIMEOUT_MS = 6000;

/** Ping the backend and measure the round trip. Never throws. */
export async function checkBackendHealth({ timeoutMs = HEALTH_TIMEOUT_MS } = {}) {
  const url = `${apiUrl}/health`;
  const startedAt = Date.now();
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = setTimeout(() => controller?.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      ...(controller ? { signal: controller.signal } : {}),
    });

    let body = null;
    try {
      body = await response.json();
    } catch {
      // A reverse proxy may answer HTML. The status code is still useful.
    }

    return {
      ok: response.ok && body?.status === 'ok',
      reachable: true,
      status: response.status,
      latencyMs: Date.now() - startedAt,
      service: body?.service || null,
      url,
    };
  } catch (error) {
    return {
      ok: false,
      reachable: false,
      status: null,
      latencyMs: Date.now() - startedAt,
      timedOut: error?.name === 'AbortError',
      error: error?.name === 'AbortError' ? `No answer within ${timeoutMs} ms` : String(error?.message || error),
      url,
    };
  } finally {
    clearTimeout(timer);
  }
}

export function getRuntimeInfo() {
  const config = Constants.expoConfig || {};
  const isWeb = Platform.OS === 'web';
  const webAgent = isWeb && typeof navigator !== 'undefined' ? navigator.userAgent : null;
  const hasHermes = typeof global !== 'undefined' && Boolean(global.HermesInternal);

  return {
    platform: Platform.OS,
    appVersion: config.version || 'unknown',
    sdkVersion: config.sdkVersion || 'unknown',
    deviceName: isWeb ? 'Browser' : (Device.modelName || Device.deviceName || Device.productName || 'Unknown device'),
    osName: isWeb ? 'Web' : (Device.osName || Platform.OS),
    osVersion: isWeb ? (webAgent || 'browser') : (Device.osVersion || String(Platform.Version ?? '')),
    physical: isWeb ? false : Boolean(Device.isDevice),
    engine: hasHermes ? 'Hermes' : (isWeb ? 'Browser JS' : 'JavaScript engine'),
  };
}

async function getStorageSnapshot() {
  const keys = await AsyncStorage.getAllKeys();
  const pairs = await AsyncStorage.multiGet(keys);
  return summariseStorage(pairs);
}

async function getOfflineSummary() {
  const stats = await getOfflineStats();
  return {
    packages: stats.packages,
    chapters: stats.chapters,
    verses: stats.verses,
    bytes: stats.bytes,
    readable: stats.readable,
    updatedAt: stats.updatedAt ? new Date(stats.updatedAt).toISOString() : null,
  };
}

async function getNotificationSummary() {
  if (Platform.OS === 'web' && typeof Notification === 'undefined') {
    return { status: 'unavailable' };
  }
  const permission = await notificationService.getQuranPermission();
  return { status: permission?.status || 'unknown' };
}

async function getLockSummary() {
  const state = await getAppLockState();
  return {
    enabled: Boolean(state.enabled),
    hasPin: Boolean(state.hasPin),
    biometrics: Boolean(state.biometricsEnabled),
    lockedOut: (state.retryAfterMs || 0) > 0,
  };
}

async function getLastSyncAt() {
  const raw = await AsyncStorage.getItem('qitab_last_sync');
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? new Date(value).toISOString() : null;
}

async function getPreferenceSummary() {
  const prefs = await preferences.all();
  return {
    translationLanguage: prefs.translationLanguage,
    reciterId: prefs.reciterId,
    quranFontSize: prefs.quranFontSize,
    notificationsEnabled: prefs.notificationsEnabled,
  };
}

async function safe(task, fallback) {
  try {
    return await task();
  } catch (error) {
    return { ...fallback, error: String(error?.message || error) };
  }
}

/**
 * Gather every check concurrently. A failing subsystem fills in an `error`
 * field instead of hiding the rest of the report.
 */
export async function collectDiagnostics() {
  const [backend, storage, offline, notifications, appLock, cache, lastSyncAt, prefs, ai] =
    await Promise.all([
      safe(() => checkBackendHealth(), { ok: false, reachable: false, status: null, latencyMs: null, url: `${apiUrl}/health` }),
      safe(getStorageSnapshot, { totalKeys: 0, qitabKeys: 0, bytes: 0, readable: '0 B', malformed: [] }),
      safe(getOfflineSummary, { packages: 0, chapters: 0, verses: 0, bytes: 0, readable: '0 B' }),
      safe(getNotificationSummary, { status: 'unknown' }),
      safe(getLockSummary, { enabled: false, hasPin: false, biometrics: false }),
      safe(cacheStats, { entries: 0, bytes: 0, readable: '0 B' }),
      safe(getLastSyncAt, null),
      safe(getPreferenceSummary, {}),
      // claudeStatus() only reflects the last request the *client* made, so a
      // fresh install reported "Live" before anything had ever been asked.
      // Probe the server so the report describes the actual configuration.
      safe(refreshClaudeStatus, {
        ok: false,
        reason: 'unknown',
        message: 'Could not determine whether the live assistant is configured.',
      }),
    ]);

  return {
    generatedAt: new Date().toISOString(),
    runtime: getRuntimeInfo(),
    backend,
    storage,
    offline,
    cache,
    notifications,
    appLock,
    lastSyncAt,
    preferences: prefs,
    ai: { ok: Boolean(ai?.ok), reason: ai?.reason || 'unknown', message: ai?.message || '' },
  };
}
