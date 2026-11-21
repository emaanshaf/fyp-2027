import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ThemeProvider } from '../../theme';
import RemindersScreen from '../RemindersScreen';
import {
  setReminderSoundId,
  previewReminderSound,
  getReminderSoundId,
} from '../../services/reminderSound';

// Keep the real catalogue (names, icons, fallbacks) but stub persistence and
// playback, which are covered by the service suite.
jest.mock('../../services/reminderSound', () => {
  const actual = jest.requireActual('../../services/reminderSound');
  return {
    ...actual,
    getReminderSoundId: jest.fn(() => Promise.resolve(actual.DEFAULT_REMINDER_SOUND_ID)),
    setReminderSoundId: jest.fn(id => Promise.resolve(id)),
    isReminderSoundEnabled: jest.fn(() => Promise.resolve(true)),
    setReminderSoundEnabled: jest.fn(() => Promise.resolve(true)),
    previewReminderSound: jest.fn(() => Promise.resolve(true)),
  };
});

const Stack = createNativeStackNavigator();

const mount = () => render(
  <ThemeProvider>
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Reminders" component={RemindersScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  </ThemeProvider>
);

beforeEach(() => {
  global.__resetStorage();
  global.fetch = jest.fn(() => Promise.reject(new Error('offline in tests')));
  jest.clearAllMocks();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('reminder chime picker', () => {
  it('shows all four chimes and starts on the saved sound', async () => {
    const { findByText, getByText } = mount();

    expect(await findByText('Soft Chime')).toBeTruthy();
    expect(await findByText('Soft Chime plays when a reminder pops up.')).toBeTruthy();
    expect(getByText('Warm Bell')).toBeTruthy();
    expect(getByText('Bright Bells')).toBeTruthy();
    expect(getByText('Soft Kalimba')).toBeTruthy();
    expect(getReminderSoundId).toHaveBeenCalled();
  });

  it('saves and auditions a newly tapped chime', async () => {
    const { findByText, getByText } = mount();
    await findByText('Soft Chime plays when a reminder pops up.');

    fireEvent.press(getByText('Bright Bells'));

    await waitFor(() => expect(setReminderSoundId).toHaveBeenCalledWith('bright'));
    await waitFor(() => expect(previewReminderSound).toHaveBeenCalledWith('bright'));
    expect(await findByText('Bright Bells plays when a reminder pops up.')).toBeTruthy();
  });

  it('previews the selected sound from the Preview button', async () => {
    const { findByText, getByText } = mount();
    await findByText('Soft Chime plays when a reminder pops up.');

    fireEvent.press(getByText('Soft Kalimba'));
    await waitFor(() => expect(previewReminderSound).toHaveBeenCalledWith('kalimba'));

    fireEvent.press(getByText('Preview Soft Kalimba'));

    await waitFor(() => expect(previewReminderSound).toHaveBeenCalledTimes(2));
    expect(previewReminderSound).toHaveBeenLastCalledWith('kalimba');
  });
});
