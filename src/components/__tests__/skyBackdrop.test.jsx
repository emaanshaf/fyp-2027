import { render } from '@testing-library/react-native';
import SkyBackdrop from '../SkyBackdrop';

const PRAYERS = [
  { name: 'Fajr', mins: 5 * 60 },
  { name: 'Asr', mins: 16 * 60 },
  { name: 'Maghrib', mins: 18 * 60 },
  { name: 'Isha', mins: 19 * 60 },
];

const at = (hour, minute = 0) => new Date(2026, 9, 29, hour, minute);

describe('SkyBackdrop', () => {
  it('draws the sun during the day', () => {
    const screen = render(<SkyBackdrop now={at(10)} prayers={PRAYERS} hijriDay={14} />);
    expect(screen.getByTestId('sky-sun', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.queryByTestId('sky-moon', { includeHiddenElements: true })).toBeNull();
  });

  it('draws a moon at night using the Hijri day', () => {
    const screen = render(<SkyBackdrop now={at(22)} prayers={PRAYERS} hijriDay={14} />);
    expect(screen.getByTestId('sky-moon', { includeHiddenElements: true })).toBeTruthy();
  });

  it('renders before prayer times are cached', () => {
    const screen = render(<SkyBackdrop now={at(12)} prayers={null} />);
    expect(screen.getByTestId('sky-sun', { includeHiddenElements: true })).toBeTruthy();
  });

  it('stays decorative, out of the accessibility tree', () => {
    const { toJSON } = render(<SkyBackdrop now={at(10)} prayers={PRAYERS} />);
    const root = toJSON();
    expect(root.props.accessibilityElementsHidden).toBe(true);
    expect(root.props.pointerEvents).toBe('none');
  });
});
