import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import {
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
  unloadReminderSound,
} from '../reminderSound';

const soundFile = id => REMINDER_SOUNDS.find(s => s.id === id).file;

beforeEach(async () => {
  jest.clearAllMocks();
  // The service caches the preference, the selected sound, and the native
  // player in memory; normalise all three so tests stay independent.
  await setReminderSoundEnabled(true);
  await setReminderSoundId(DEFAULT_REMINDER_SOUND_ID);
  await unloadReminderSound();
  jest.clearAllMocks();
});

describe('the reminder sound preference', () => {
  it('is enabled by default', async () => {
    expect(await isReminderSoundEnabled()).toBe(true);
  });

  it('is saved to the device, not just held in memory', async () => {
    await setReminderSoundEnabled(false);

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(REMINDER_SOUND_STORAGE_KEY, 'false');
    expect(await isReminderSoundEnabled()).toBe(false);
  });

  it('can be turned back on', async () => {
    await setReminderSoundEnabled(false);
    await setReminderSoundEnabled(true);

    expect(await isReminderSoundEnabled()).toBe(true);
    expect(AsyncStorage.setItem).toHaveBeenLastCalledWith(REMINDER_SOUND_STORAGE_KEY, 'true');
  });
});

describe('choosing a sound', () => {
  it('offers four distinct sounds', () => {
    expect(REMINDER_SOUNDS).toHaveLength(4);
    expect(new Set(REMINDER_SOUNDS.map(s => s.id)).size).toBe(4);
  });

  it('gives every sound a native asset and a web motif', () => {
    for (const sound of REMINDER_SOUNDS) {
      expect(sound.file).toBeTruthy();
      expect(sound.web.notes.length).toBeGreaterThan(0);
      expect(sound.web.notes[0].frequency).toBeGreaterThan(0);
    }
    // Jest's asset transformer collapses requires to one stub value, so the
    // motifs — not the `file` identities — prove the four profiles differ.
    expect(new Set(REMINDER_SOUNDS.map(s => s.web.notes[0].frequency)).size).toBe(4);
    expect(new Set(REMINDER_SOUNDS.map(s => s.web.notes.length)).size).toBeGreaterThan(1);
  });

  it('defaults to Soft Chime on a fresh install', async () => {
    await AsyncStorage.removeItem(REMINDER_SOUND_ID_STORAGE_KEY);
    let fresh;
    jest.isolateModules(() => { fresh = require('../reminderSound'); });

    expect(fresh.getReminderSound().id).toBe(DEFAULT_REMINDER_SOUND_ID);
    await expect(fresh.getReminderSoundId()).resolves.toBe(DEFAULT_REMINDER_SOUND_ID);
  });

  it('saves the selected sound to the device', async () => {
    await setReminderSoundId('warm');

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(REMINDER_SOUND_ID_STORAGE_KEY, 'warm');
    expect(await getReminderSoundId()).toBe('warm');
  });

  it('falls back safely for an unknown saved id', async () => {
    await AsyncStorage.setItem(REMINDER_SOUND_ID_STORAGE_KEY, 'not-a-sound');

    expect(getReminderSound('not-a-sound').id).toBe(DEFAULT_REMINDER_SOUND_ID);

    // A fresh module re-reads storage, so this covers the persisted path too.
    let fresh;
    jest.isolateModules(() => { fresh = require('../reminderSound'); });
    await expect(fresh.getReminderSoundId()).resolves.toBe(DEFAULT_REMINDER_SOUND_ID);

    await expect(setReminderSoundId('not-a-sound')).resolves.toBe(DEFAULT_REMINDER_SOUND_ID);
  });

  it('loads the selected sound, not always the first one', async () => {
    await setReminderSoundId('kalimba');

    expect(await playReminderChime()).toBe(true);
    expect(Audio.Sound.createAsync).toHaveBeenCalledWith(
      soundFile('kalimba'),
      expect.objectContaining({ shouldPlay: true })
    );
  });

  it('previews a sound without changing the saved selection', async () => {
    await setReminderSoundId('soft');

    expect(await previewReminderSound('bright')).toBe(true);
    expect(await getReminderSoundId()).toBe('soft');
    expect(Audio.Sound.createAsync).toHaveBeenCalledWith(
      soundFile('bright'),
      expect.anything()
    );
    expect(AsyncStorage.setItem).not.toHaveBeenCalledWith(
      REMINDER_SOUND_ID_STORAGE_KEY,
      'bright'
    );
  });
});

describe('playing the chime', () => {
  it('does nothing when the user has turned it off', async () => {
    await setReminderSoundEnabled(false);

    expect(await playReminderChime()).toBe(false);
    expect(Audio.Sound.createAsync).not.toHaveBeenCalled();
  });

  it('plays the bundled chime when enabled', async () => {
    const played = await playReminderChime();

    expect(played).toBe(true);
    expect(Audio.setAudioModeAsync).toHaveBeenCalledWith(
      expect.objectContaining({ playsInSilentModeIOS: true })
    );
    expect(Audio.Sound.createAsync).toHaveBeenCalledWith(
      soundFile('soft'),
      expect.objectContaining({ shouldPlay: true, volume: 1.0 })
    );
  });

  it('reuses the loaded player for the same sound', async () => {
    await playReminderChime();
    await playReminderChime();

    expect(Audio.Sound.createAsync).toHaveBeenCalledTimes(1);
  });

  it('unloads the old player when the sound changes', async () => {
    await playReminderChime();
    const first = (await Audio.Sound.createAsync.mock.results[0].value).sound;

    await setReminderSoundId('warm');
    await playReminderChime();

    expect(Audio.Sound.createAsync).toHaveBeenCalledTimes(2);
    expect(Audio.Sound.createAsync.mock.calls[1][0]).toBe(soundFile('warm'));
    expect(first.unloadAsync).toHaveBeenCalled();
  });

  it('lets the Preview button play even while the toggle is off', async () => {
    await setReminderSoundEnabled(false);

    expect(await previewReminderSound()).toBe(true);
    expect(Audio.Sound.createAsync).toHaveBeenCalled();
  });

  it('does not throw when the native player fails', async () => {
    Audio.Sound.createAsync.mockRejectedValueOnce(new Error('no audio device'));

    await expect(playReminderChime()).resolves.toBe(false);
  });

  it('recovers when a reused player has been released', async () => {
    await playReminderChime();
    const { sound } = await Audio.Sound.createAsync.mock.results[0].value;
    sound.playAsync.mockRejectedValueOnce(new Error('player released'));

    await expect(playReminderChime()).resolves.toBe(true);
    expect(Audio.Sound.createAsync).toHaveBeenCalledTimes(2);
  });

  it('releases the native player on unload', async () => {
    await playReminderChime();
    const { sound } = await Audio.Sound.createAsync.mock.results[0].value;

    await unloadReminderSound();

    expect(sound.unloadAsync).toHaveBeenCalled();
  });
});
