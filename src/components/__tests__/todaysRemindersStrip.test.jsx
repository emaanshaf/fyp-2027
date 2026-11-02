import { render, fireEvent, act } from '@testing-library/react-native';
import { ThemeProvider } from '../../theme';
import TodaysRemindersStrip from '../TodaysRemindersStrip';
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

// The card compares against the clock, so the suite pins it to a calm 09:00.
beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 9, 29, 9, 0, 0));
  jest.clearAllMocks();
  loadTodaysReminders.mockResolvedValue([]);
  loadDismissedKeys.mockResolvedValue(new Set());
  dismissReminderKeys.mockImplementation(keys => Promise.resolve(new Set(keys)));
});

afterEach(() => {
  jest.useRealTimers();
});

const row = (overrides = {}) => ({
  key: 'custom:1',
  source: 'custom',
  title: 'Read Surah Al-Kahf',
  message: '',
  time: { hour: 9, minute: 0 },
  ...overrides,
});

const mount = async (onOpen = jest.fn()) => {
  const screen = render(
    <ThemeProvider>
      <TodaysRemindersStrip onOpen={onOpen} />
    </ThemeProvider>,
  );
  // One pass for the theme provider to hydrate, one for the reminder read.
  await act(async () => {});
  await act(async () => {});
  return { screen, onOpen };
};

describe('TodaysRemindersStrip', () => {
  it('invites the user to add a reminder when none exist', async () => {
    const { screen, onOpen } = await mount();

    expect(screen.getByText('No reminders set for today')).toBeTruthy();
    expect(screen.getByText('In-app popups appear while the app is open')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('No reminders set for today. Add a reminder.'));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('shows the reminder that is due with a Done action', async () => {
    loadTodaysReminders.mockResolvedValue([row()]);
    const { screen } = await mount();

    expect(screen.getByText('DUE NOW')).toBeTruthy();
    expect(screen.getByText('Read Surah Al-Kahf')).toBeTruthy();
    expect(screen.getByText('9:00 AM')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Mark Read Surah Al-Kahf done for today'));

    await act(async () => {});
    expect(dismissReminderKeys).toHaveBeenCalledWith(['custom:1']);
    expect(screen.getByText('No more reminders today')).toBeTruthy();
  });

  it('shows the next reminder and how many follow it', async () => {
    loadTodaysReminders.mockResolvedValue([
      row({ key: 'custom:1', title: 'Morning adhkar', time: { hour: 10, minute: 30 } }),
      row({ key: 'custom:2', title: 'Evening adhkar', time: { hour: 18, minute: 0 } }),
    ]);
    const { screen } = await mount();

    expect(screen.getByText("TODAY'S REMINDERS")).toBeTruthy();
    expect(screen.getByText('Morning adhkar')).toBeTruthy();
    expect(screen.getByText('10:30 AM')).toBeTruthy();
    expect(screen.getByText('1 more later today')).toBeTruthy();
  });

  it('does not repeat a reminder already marked done', async () => {
    loadTodaysReminders.mockResolvedValue([row()]);
    loadDismissedKeys.mockResolvedValue(new Set(['custom:1']));
    const { screen } = await mount();

    expect(screen.queryByText('DUE NOW')).toBeNull();
    expect(screen.getByText('No more reminders today')).toBeTruthy();
    expect(screen.getByText('All of today\u2019s reminders are handled')).toBeTruthy();
  });

  it('stays hidden when reminder storage cannot be read', async () => {
    loadTodaysReminders.mockRejectedValue(new Error('storage offline'));
    const { screen } = await mount();

    expect(screen.toJSON()).toBeNull();
  });
});
