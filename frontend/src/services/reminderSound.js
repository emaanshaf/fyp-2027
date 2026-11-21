/**
 * Reminder chimes
 * ─────────────────────────────────────────────────────────────────────────────
 * Four selectable chimes that play alongside in-app reminder popups.
 *
 * Native builds play one of the bundled WAV files through expo-av, configured
 * to be audible even when the iPhone mute switch is on. Web builds synthesise
 * the same notes with the Web Audio API, because a browser tab can only start
 * audio after a user gesture — the Reminders screen exposes Preview buttons,
 * and `primeReminderAudio()` unlocks the context on the first tap/keypress
 * anywhere in the app so later reminders are heard.
 *
 * The on/off preference and the chosen sound are stored locally and default to
 * on + Soft Chime. Scheduled OS notifications keep their own sound; this
 * controls the sound that accompanies the in-app popup.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';

export const REMINDER_SOUND_STORAGE_KEY = 'qitab_reminder_sound_enabled';
export const REMINDER_SOUND_ID_STORAGE_KEY = 'qitab_reminder_sound_id';
export const DEFAULT_REMINDER_SOUND_ID = 'soft';

// Metro resolves asset requires at build time; ESLint only sees the bare
// CommonJS calls in an otherwise ESM file.
/* eslint-disable no-undef */
const SOFT_CHIME_SOURCE = require('../../assets/sounds/quran-chime.wav');
const WARM_BELL_SOURCE = require('../../assets/sounds/reminder-warm-bell.wav');
const BRIGHT_BELLS_SOURCE = require('../../assets/sounds/reminder-bright-bells.wav');
const KALIMBA_SOURCE = require('../../assets/sounds/reminder-soft-kalimba.wav');
/* eslint-enable no-undef */

// Web motifs mirror the generated WAVs closely enough to recognise the sound
// while choosing. `partials` are extra oscillators layered over a note.
const SOFT_NOTES = [
  { frequency: 523.25, delay: 0.00, duration: 1.5, gain: 0.22 },
  { frequency: 659.25, delay: 0.28, duration: 1.5, gain: 0.19 },
  { frequency: 783.99, delay: 0.56, duration: 1.6, gain: 0.17 },
  { frequency: 1046.50, delay: 0.90, duration: 1.9, gain: 0.12 },
];

const WARM_NOTES = [
  {
    frequency: 392.00,
    delay: 0,
    duration: 2.8,
    gain: 0.26,
    partials: [
      { ratio: 2.0, gain: 0.30 },
      { ratio: 2.76, gain: 0.17 },
    ],
  },
  { frequency: 587.33, delay: 0.07, duration: 2.3, gain: 0.10 },
];

const BRIGHT_NOTES = [
  {
    frequency: 659.25,
    delay: 0,
    duration: 1.6,
    gain: 0.20,
    partials: [{ ratio: 2.0, gain: 0.28 }],
  },
  { frequency: 783.99, delay: 0.20, duration: 1.5, gain: 0.17 },
  { frequency: 1046.50, delay: 0.40, duration: 1.4, gain: 0.14 },
  { frequency: 1318.51, delay: 0.62, duration: 0.9, gain: 0.06 },
];

const KALIMBA_NOTES = [
  {
    frequency: 440.00,
    delay: 0,
    duration: 0.95,
    gain: 0.22,
    partials: [
      { ratio: 3.0, gain: 0.18 },
      { ratio: 5.4, gain: 0.06 },
    ],
  },
  {
    frequency: 523.25,
    delay: 0.24,
    duration: 0.95,
    gain: 0.19,
    partials: [{ ratio: 3.0, gain: 0.16 }],
  },
  {
    frequency: 659.25,
    delay: 0.48,
    duration: 0.95,
    gain: 0.16,
    partials: [{ ratio: 3.0, gain: 0.14 }],
  },
];

/**
 * The catalogue shown by the Reminders screen. `file` is the native asset and
 * `web` holds the browser synthesis instructions; both describe one sound.
 */
export const REMINDER_SOUNDS = [
  {
    id: 'soft',
    name: 'Soft Chime',
    description: 'Gentle rising arpeggio',
    icon: 'musical-notes-outline',
    file: SOFT_CHIME_SOURCE,
    web: { oscillator: 'sine', notes: SOFT_NOTES },
  },
  {
    id: 'warm',
    name: 'Warm Bell',
    description: 'Deep, resonant bell',
    icon: 'notifications-outline',
    file: WARM_BELL_SOURCE,
    web: { oscillator: 'sine', notes: WARM_NOTES },
  },
  {
    id: 'bright',
    name: 'Bright Bells',
    description: 'Light three-note alert',
    icon: 'sparkles-outline',
    file: BRIGHT_BELLS_SOURCE,
    web: { oscillator: 'triangle', notes: BRIGHT_NOTES },
  },
  {
    id: 'kalimba',
    name: 'Soft Kalimba',
    description: 'Mellow finger-plucks',
    icon: 'leaf-outline',
    file: KALIMBA_SOURCE,
    web: { oscillator: 'sine', notes: KALIMBA_NOTES },
  },
];

let enabledCache = null;
let soundIdCache = null;
let nativeSound = null;
let nativeSoundId = null;
let nativeAudioConfigured = false;
let webAudioContext = null;
let webUnlockInstalled = false;

/** Resolve a saved/unknown id to a catalogue entry, falling back to Soft Chime. */
export function getReminderSound(soundId) {
  return REMINDER_SOUNDS.find(s => s.id === soundId)
    || REMINDER_SOUNDS.find(s => s.id === DEFAULT_REMINDER_SOUND_ID);
}

/** Read the saved on/off preference once, then serve it from memory. */
export async function isReminderSoundEnabled() {
  if (enabledCache !== null) return enabledCache;
  try {
    const raw = await AsyncStorage.getItem(REMINDER_SOUND_STORAGE_KEY);
    enabledCache = raw !== 'false'; // default on for existing installs
  } catch {
    enabledCache = true;
  }
  return enabledCache;
}

/** Persist the on/off preference. The banner reads the cached value on popup. */
export async function setReminderSoundEnabled(enabled) {
  enabledCache = Boolean(enabled);
  try {
    await AsyncStorage.setItem(REMINDER_SOUND_STORAGE_KEY, enabledCache ? 'true' : 'false');
  } catch {
    // A storage failure must not stop the chime from respecting the choice
    // for the rest of this session.
  }
  return enabledCache;
}

/** Read the saved sound once, then serve it from memory. */
export async function getReminderSoundId() {
  if (soundIdCache !== null) return soundIdCache;
  try {
    const raw = await AsyncStorage.getItem(REMINDER_SOUND_ID_STORAGE_KEY);
    soundIdCache = getReminderSound(raw).id;
  } catch {
    soundIdCache = DEFAULT_REMINDER_SOUND_ID;
  }
  return soundIdCache;
}

/** Persist the chosen sound. Unknown ids fall back rather than breaking playback. */
export async function setReminderSoundId(soundId) {
  soundIdCache = getReminderSound(soundId).id;
  try {
    await AsyncStorage.setItem(REMINDER_SOUND_ID_STORAGE_KEY, soundIdCache);
  } catch {
    // In-memory selection still applies for this session.
  }
  return soundIdCache;
}

async function configureNativeAudio() {
  if (nativeAudioConfigured) return;
  nativeAudioConfigured = true;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
    });
  } catch {
    // Older platforms may not know every key; the sound still attempts to play.
  }
}

async function releaseNativeSound() {
  const sound = nativeSound;
  nativeSound = null;
  nativeSoundId = null;
  if (!sound) return;
  try {
    await sound.unloadAsync();
  } catch {
    // already unloaded
  }
}

async function playNativeChime(sound) {
  await configureNativeAudio();

  // Reuse the loaded player only for the same file; switching sounds has to
  // unload the old one, otherwise the previous selection keeps playing.
  if (nativeSound && nativeSoundId === sound.id) {
    try {
      await nativeSound.stopAsync();
      await nativeSound.playAsync();
      return true;
    } catch {
      await releaseNativeSound();
    }
  } else {
    await releaseNativeSound();
  }

  try {
    const { sound: player } = await Audio.Sound.createAsync(sound.file, {
      shouldPlay: true,
      volume: 1.0,
    });
    nativeSound = player;
    nativeSoundId = sound.id;
    player.setOnPlaybackStatusUpdate(status => {
      if (status?.didJustFinish && nativeSound === player) releaseNativeSound();
    });
    return true;
  } catch {
    nativeSound = null;
    nativeSoundId = null;
    return false;
  }
}

function getWebAudioContext() {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!webAudioContext) {
    try {
      webAudioContext = new Ctx();
    } catch {
      return null;
    }
  }
  return webAudioContext;
}

async function playWebChime(sound) {
  const ctx = getWebAudioContext();
  if (!ctx) return false;

  // A context created before any interaction starts suspended. resume() is a
  // no-op without a gesture on some browsers, so this is best-effort only.
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {
      return false;
    }
  }

  try {
    const start = ctx.currentTime + 0.04;
    const master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);

    for (const note of sound.web.notes) {
      const layers = [{ ratio: 1, gain: 1 }, ...(note.partials || [])];

      for (const layer of layers) {
        const at = start + note.delay;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const level = note.gain * layer.gain;
        const duration = note.duration;

        osc.type = note.type || sound.web.oscillator || 'sine';
        osc.frequency.setValueAtTime(note.frequency * layer.ratio, at);
        // Attack quickly, then decay like a struck chime. The exponential ramp
        // cannot target zero, hence the small floor.
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(level, at + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
        osc.connect(gain);
        gain.connect(master);
        osc.start(at);
        osc.stop(at + duration + 0.05);
        osc.onended = () => {
          try { gain.disconnect(); } catch { /* context closing */ }
        };
      }
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Unlock browser audio on the first interaction. Browsers refuse to start an
 * AudioContext outside a gesture, and a reminder timer firing later has none.
 */
export function primeReminderAudio() {
  if (Platform.OS !== 'web' || webUnlockInstalled) return;
  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return;

  webUnlockInstalled = true;
  const unlock = () => {
    const ctx = getWebAudioContext();
    if (ctx?.state === 'suspended') ctx.resume().catch(() => {});
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
    window.removeEventListener('touchstart', unlock);
  };
  window.addEventListener('pointerdown', unlock, { once: true, passive: true });
  window.addEventListener('keydown', unlock, { once: true });
  window.addEventListener('touchstart', unlock, { once: true, passive: true });
}

/**
 * Play a reminder chime, honouring the saved preference.
 * @param {{force?: boolean, soundId?: string}} options
 *   force=true is used by Preview. soundId overrides the saved selection for
 *   this one playback (previewing a choice must not commit it).
 */
export async function playReminderChime({ force = false, soundId } = {}) {
  if (!force && !(await isReminderSoundEnabled())) return false;
  const sound = getReminderSound(soundId || await getReminderSoundId());
  if (Platform.OS === 'web') return playWebChime(sound);
  return playNativeChime(sound);
}

/**
 * Preview ignores the on/off preference so a user can hear what they are
 * toggling, and can audition a sound before selecting it.
 */
export const previewReminderSound = soundId => playReminderChime({ force: true, soundId });

/** Release the native player when the app unmounts (or under test teardown). */
export async function unloadReminderSound() {
  await releaseNativeSound();
  // Re-apply the audio mode on the next play. Releasing the player should not
  // leave configuration state that a later mount silently inherits.
  nativeAudioConfigured = false;
}

export default {
  REMINDER_SOUND_STORAGE_KEY,
  REMINDER_SOUND_ID_STORAGE_KEY,
  DEFAULT_REMINDER_SOUND_ID,
  REMINDER_SOUNDS,
  getReminderSound,
  isReminderSoundEnabled,
  setReminderSoundEnabled,
  getReminderSoundId,
  setReminderSoundId,
  playReminderChime,
  previewReminderSound,
  primeReminderAudio,
  unloadReminderSound,
};
