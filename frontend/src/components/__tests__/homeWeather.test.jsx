import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { ThemeProvider } from '../../theme';
import HomeWeather from '../HomeWeather';
import { getHomeWeather } from '../../services/weather';

jest.mock('../../services/weather', () => {
  const actual = jest.requireActual('../../services/weather');
  return { ...actual, getHomeWeather: jest.fn() };
});

const reading = (overrides = {}) => ({
  city: 'Islamabad',
  country: 'Pakistan',
  temperatureC: 24,
  apparentC: 25,
  humidity: 47,
  windKph: 11,
  code: 2,
  condition: 'Partly cloudy',
  icon: 'partly-sunny',
  isDay: true,
  highC: 30,
  lowC: 16,
  fetchedAt: Date.now(),
  stale: false,
  ...overrides,
});

const mount = async () => {
  const screen = render(
    <ThemeProvider>
      <HomeWeather city="Islamabad" />
    </ThemeProvider>,
  );
  // The theme provider hydrates through AsyncStorage before rendering children.
  await act(async () => {});
  return screen;
};

beforeEach(() => {
  jest.clearAllMocks();
  getHomeWeather.mockResolvedValue(reading());
});

describe('HomeWeather', () => {
  it('shows the temperature, condition and the day range', async () => {
    const screen = await mount();
    expect(await screen.findByText('24°')).toBeTruthy();
    expect(screen.getByText('Partly cloudy')).toBeTruthy();
    expect(screen.getByText('H 30° · L 16°')).toBeTruthy();
  });

  it('reads out the city and conditions for assistive technology', async () => {
    const screen = await mount();
    const row = await screen.findByLabelText(/Islamabad: 24 degrees Celsius, partly cloudy/);
    expect(row).toBeTruthy();
    expect(row.props.accessibilityLabel).toContain('High 30, low 16');
  });

  it('refreshes on tap and adopts the new reading', async () => {
    getHomeWeather
      .mockResolvedValueOnce(reading())
      .mockResolvedValueOnce(reading({ temperatureC: 18, condition: 'Rain', icon: 'rainy' }));
    const screen = await mount();

    fireEvent.press(await screen.findByLabelText(/Islamabad: 24 degrees/));

    await waitFor(() => expect(getHomeWeather).toHaveBeenLastCalledWith({ force: true }));
    expect(await screen.findByText('18°')).toBeTruthy();
    expect(screen.getByText('Rain')).toBeTruthy();
  });

  it('marks a cached reading as offline instead of hiding it', async () => {
    getHomeWeather.mockResolvedValue(reading({ stale: true }));
    const screen = await mount();
    expect(await screen.findByLabelText(/Last saved reading, currently offline/)).toBeTruthy();
    expect(screen.getByText('24°')).toBeTruthy();
  });

  it('renders nothing when no weather is available', async () => {
    getHomeWeather.mockResolvedValue(null);
    const screen = await mount();
    await waitFor(() => expect(getHomeWeather).toHaveBeenCalled());
    expect(screen.queryByText('24°')).toBeNull();
    expect(screen.toJSON()).toBeNull();
  });
});
