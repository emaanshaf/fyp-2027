import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '../../theme';
import TodaysRemindersPopup from '../TodaysRemindersPopup';
import { playReminderChime } from '../../services/reminderSound';
import {
  dismissReminderKeys,
  loadDismissedKeys,
  loadTodaysReminders,
} from '../../services/todaysReminders';

jest.mock('../../services/todaysReminders', () => {
  const actual = jest.requireActual('../../services/todaysReminders');
  return {
    ...actual,
    loadTodaysReminders: jest.fn(),
    loadDismissedKeys: jest.fn(),
    dismissReminderKeys: jest.fn(),
  };
});

jest.mock('../../services/reminderSound', () => ({
  playReminderChime: jest.fn(() => Promise.resolve(true)),
}));

// A reminder that is due whenever the suite runs, without freezing time.
const nowRow = (overrides = {}) => {
  const now = new Date();
  return {
    key: 'custom:1',
    source: 'custom',
    title: 'Read Surah Al-Kahf',
    message: 'Ten quiet minutes with the mushaf.',
    time: { hour: now.getHours(), minute: now.getMinutes() },
    ...overrides,
  };
};

const mount = () => render(
  <ThemeProvider>
    <TodaysRemindersPopup navigation={{ navigate: jest.fn() }} />
  </ThemeProvider>,
);

beforeEach(() => {
  jest.clearAllMocks();
  loadTodaysReminders.mockResolvedValue([nowRow()]);
  loadDismissedKeys.mockResolvedValue(new Set());
  dismissReminderKeys.mockImplementation(keys => Promise.resolve(new Set(keys)));
});

describe('TodaysRemindersPopup', () => {
  it('shows the reminder that is due, with its message and time', async () => {
    const screen = mount();
    expect(await screen.findByText('Read Surah Al-Kahf')).toBeTruthy();
    expect(screen.getByText('Ten quiet minutes with the mushaf.')).toBeTruthy();
    expect(screen.getByText("TODAY'S REMINDER")).toBeTruthy();
  });

  it('stays closed when nothing is due', async () => {
    loadTodaysReminders.mockResolvedValue([]);
    const screen = mount();
    await waitFor(() => expect(loadTodaysReminders).toHaveBeenCalled());
    expect(screen.queryByText("TODAY'S REMINDER")).toBeNull();
    expect(playReminderChime).not.toHaveBeenCalled();
  });

  it('plays the chosen chime once when the reminder appears', async () => {
    const screen = mount();
    await screen.findByText('Read Surah Al-Kahf');
    await waitFor(() => expect(playReminderChime).toHaveBeenCalledTimes(1));
  });

  it('stays on screen until the user closes it', async () => {
    const screen = mount();
    await screen.findByText('Read Surah Al-Kahf');

    fireEvent.press(screen.getByLabelText('Close this reminder for five minutes'));

    await waitFor(() => expect(screen.queryByText("TODAY'S REMINDER")).toBeNull());
    expect(dismissReminderKeys).not.toHaveBeenCalled();
  });

  it('marks the reminder done for today', async () => {
    const screen = mount();
    fireEvent.press(await screen.findByLabelText('Mark this reminder done for today'));

    await waitFor(() => expect(dismissReminderKeys).toHaveBeenCalledWith(['custom:1']));
    await waitFor(() => expect(screen.queryByText("TODAY'S REMINDER")).toBeNull());
  });

  it('hides for five minutes without dismissing', async () => {
    const screen = mount();
    fireEvent.press(await screen.findByLabelText('Remind me again in five minutes'));

    await waitFor(() => expect(screen.queryByText("TODAY'S REMINDER")).toBeNull());
    expect(dismissReminderKeys).not.toHaveBeenCalled();
  });

  it('honours a reminder already dismissed today', async () => {
    loadDismissedKeys.mockResolvedValue(new Set(['custom:1']));
    const screen = mount();
    await waitFor(() => expect(loadDismissedKeys).toHaveBeenCalled());
    expect(screen.queryByText("TODAY'S REMINDER")).toBeNull();
  });

  it('navigates to the Reminders screen', async () => {
    const navigate = jest.fn();
    const screen = render(
      <ThemeProvider>
        <TodaysRemindersPopup navigation={{ navigate }} />
      </ThemeProvider>,
    );
    fireEvent.press(await screen.findByLabelText('Open the Reminders screen'));
    expect(navigate).toHaveBeenCalledWith('Reminders');
  });
});
