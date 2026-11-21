import { act, render } from '@testing-library/react-native';
import { ThemeProvider } from '../../theme';
import PrayerCountdownRing, { formatCountdown, ringProgress } from '../PrayerCountdownRing';

// ThemeProvider shows a spinner for one microtask while it reads the saved
// theme, so mount waits for that before the ring exists.
const mount = async (props = {}) => {
  const screen = render(
    <ThemeProvider>
      <PrayerCountdownRing
        target={new Date(2026, 9, 29, 12, 10, 0)}
        windowMinutes={10}
        label="TO GO"
        doneLabel="Now"
        {...props}
      />
    </ThemeProvider>,
  );
  await act(async () => {});
  return screen;
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 9, 29, 12, 0, 0));
});

afterEach(() => {
  jest.useRealTimers();
});

describe('formatCountdown', () => {
  it('shows minutes:seconds under an hour', () => {
    expect(formatCountdown(0)).toBe('0:00');
    expect(formatCountdown(65_000)).toBe('1:05');
    expect(formatCountdown(3_599_000)).toBe('59:59');
  });

  it('adds hours for longer waits', () => {
    expect(formatCountdown(3_600_000)).toBe('1:00:00');
    expect(formatCountdown(3_661_000)).toBe('1:01:01');
  });

  it('never goes negative', () => {
    expect(formatCountdown(-5_000)).toBe('0:00');
  });
});

describe('ringProgress', () => {
  it('fills from zero at the previous prayer to full at the next', () => {
    expect(ringProgress(600_000, 600_000)).toBe(0);
    expect(ringProgress(300_000, 600_000)).toBe(0.5);
    expect(ringProgress(0, 600_000)).toBe(1);
  });

  it('clamps a stale target and a bad window', () => {
    expect(ringProgress(900_000, 600_000)).toBe(0);
    expect(ringProgress(-1_000, 600_000)).toBe(1);
    expect(ringProgress(100, 0)).toBe(0);
  });
});

describe('PrayerCountdownRing', () => {
  it('ticks the remaining time down every second', async () => {
    const screen = await mount();
    expect(screen.getByText('10:00', { includeHiddenElements: true })).toBeTruthy();

    act(() => { jest.advanceTimersByTime(1000); });
    expect(screen.getByText('9:59', { includeHiddenElements: true })).toBeTruthy();

    act(() => { jest.advanceTimersByTime(59_000); });
    expect(screen.getByText('9:00', { includeHiddenElements: true })).toBeTruthy();
  });

  it('switches to the done label and reports completion once', async () => {
    const onComplete = jest.fn();
    const screen = await mount({
      target: new Date(2026, 9, 29, 12, 0, 3),
      onComplete,
    });

    act(() => { jest.advanceTimersByTime(4000); });
    expect(screen.getByText('Now', { includeHiddenElements: true })).toBeTruthy();
    expect(onComplete).toHaveBeenCalledTimes(1);

    act(() => { jest.advanceTimersByTime(5000); });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('keeps the label while time remains', async () => {
    const screen = await mount();
    expect(screen.getByText('TO GO', { includeHiddenElements: true })).toBeTruthy();
  });
});
