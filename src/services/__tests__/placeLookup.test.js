import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { PLACE_LOOKUP_MESSAGES, lookupCurrentPlace } from '../placeLookup';

const mockRequest = Location.requestForegroundPermissionsAsync;
const mockGetPermission = Location.getForegroundPermissionsAsync;
const mockPosition = Location.getCurrentPositionAsync;
const mockGeocode = Location.reverseGeocodeAsync;

describe('lookupCurrentPlace', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest.mockResolvedValue({ status: 'granted' });
    mockGetPermission.mockResolvedValue({ status: 'undetermined' });
    mockPosition.mockResolvedValue({
      coords: { latitude: 31.52, longitude: 74.35, accuracy: 12, speed: 0.8 },
    });
    mockGeocode.mockResolvedValue([{ name: 'Jamia Masjid', city: 'Lahore' }]);
  });

  afterEach(() => {
    jest.replaceProperty(Platform, 'OS', 'ios');
  });

  it('reads a single fix and names the place on a device', async () => {
    const result = await lookupCurrentPlace();
    expect(result.outcome).toBe('ok');
    expect(result.address.name).toBe('Jamia Masjid');
    expect(result.speedMps).toBeCloseTo(0.8);
    expect(mockRequest).toHaveBeenCalled();
  });

  it('does not prompt when asked only for an existing grant', async () => {
    const result = await lookupCurrentPlace({ prompt: false });
    expect(result.outcome).toBe('skipped');
    expect(mockRequest).not.toHaveBeenCalled();
    expect(mockPosition).not.toHaveBeenCalled();
  });

  it('reports denied without reading a position', async () => {
    mockRequest.mockResolvedValue({ status: 'denied' });
    const result = await lookupCurrentPlace();
    expect(result.outcome).toBe('denied');
    expect(result.message).toBe(PLACE_LOOKUP_MESSAGES.denied);
    expect(mockPosition).not.toHaveBeenCalled();
  });

  it('still returns coordinates on web, without a place name', async () => {
    jest.replaceProperty(Platform, 'OS', 'web');
    const result = await lookupCurrentPlace();
    expect(result.outcome).toBe('unsupported');
    expect(result.address).toBeNull();
    expect(result.latitude).toBeCloseTo(31.52);
    expect(result.message).toBe(PLACE_LOOKUP_MESSAGES.unsupported);
    expect(mockGeocode).not.toHaveBeenCalled();
  });

  it('degrades when the device geocoder fails', async () => {
    mockGeocode.mockRejectedValue(new Error('no geocoder'));
    const result = await lookupCurrentPlace();
    expect(result.outcome).toBe('unsupported');
    expect(result.latitude).toBeCloseTo(31.52);
  });

  it('turns a failed fix into a readable message', async () => {
    mockPosition.mockRejectedValue(new Error('timeout'));
    const result = await lookupCurrentPlace();
    expect(result.outcome).toBe('error');
    expect(result.message).toBe(PLACE_LOOKUP_MESSAGES.error);
  });

  it('ignores the -1 speed sentinel some devices report', async () => {
    mockPosition.mockResolvedValue({ coords: { latitude: 1, longitude: 2, speed: -1 } });
    const result = await lookupCurrentPlace();
    expect(result.speedMps).toBeNull();
  });
});
