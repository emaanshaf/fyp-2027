import React from 'react';
import { Linking } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider } from '../../theme';
import ApiConsoleScreen from '../ApiConsoleScreen';
import { API_CATALOG_CACHE_KEY } from '../../services/apiCatalog';
import { apiUrl } from '../../config/appConfig';

const catalog = {
  service: 'qitabe-noor-api',
  version: '1.0.0',
  basePath: '/api',
  uptimeSeconds: 125,
  groups: [
    {
      id: 'system',
      title: 'System',
      description: 'Liveness and self-documentation.',
      endpoints: [
        {
          method: 'GET', path: '/health', auth: 'public', testable: true,
          summary: 'Liveness probe.', group: 'system', fullPath: '/api/health',
        },
      ],
    },
    {
      id: 'bookmarks',
      title: 'Bookmarks',
      description: 'Ayah bookmarks for the signed-in user.',
      endpoints: [
        {
          method: 'GET', path: '/bookmarks', auth: 'session', testable: false,
          summary: 'List your bookmarks.', group: 'bookmarks', fullPath: '/api/bookmarks',
        },
        {
          method: 'POST', path: '/bookmarks', auth: 'session', testable: false,
          summary: 'Save a bookmark.', group: 'bookmarks', fullPath: '/api/bookmarks',
        },
      ],
    },
    {
      id: 'ai',
      title: 'Islamic AI assistant',
      description: 'Grounding status and answers.',
      endpoints: [
        {
          method: 'GET', path: '/ai/status', auth: 'public', testable: true,
          summary: 'Whether a live key is configured.', group: 'ai', fullPath: '/api/ai/status',
        },
      ],
    },
  ],
  counts: {
    groups: 3, endpoints: 4, public: 2, session: 2, admin: 0, testable: 2,
    byMethod: { GET: 3, POST: 1 },
  },
};

const apiResponse = (body, { status = 200, ok = true, requestId = 'req-test' } = {}) => ({
  ok,
  status,
  headers: {
    get: name => (String(name).toLowerCase() === 'x-request-id' ? requestId : null),
  },
  text: async () => JSON.stringify(body),
});

const Stack = createNativeStackNavigator();

const mount = () => render(
  <ThemeProvider>
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="ApiConsole" component={ApiConsoleScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  </ThemeProvider>
);

beforeEach(() => {
  global.__resetStorage();
  jest.clearAllMocks();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('API console', () => {
  it('renders the live catalogue with status, counts and endpoints', async () => {
    global.fetch = jest.fn(async () => apiResponse(catalog));

    const { findByText, getByText } = mount();

    expect(await findByText('API reachable')).toBeTruthy();
    expect(getByText('4 endpoints')).toBeTruthy();
    expect(getByText('3 groups')).toBeTruthy();
    expect(getByText('2 testable')).toBeTruthy();
    expect(getByText('Liveness probe.')).toBeTruthy();
    expect(getByText('Bookmarks')).toBeTruthy();
    expect(getByText('/health')).toBeTruthy();

    // The catalogue lives on the server; nothing is hard-coded into the app.
    expect(global.fetch).toHaveBeenCalledWith(
      `${apiUrl}/`,
      expect.objectContaining({ method: 'GET' })
    );

    const cached = await AsyncStorage.getItem(API_CATALOG_CACHE_KEY);
    expect(JSON.parse(cached).catalog.counts.endpoints).toBe(4);
  });

  it('filters groups and endpoints as the search changes', async () => {
    global.fetch = jest.fn(async () => apiResponse(catalog));

    const { findByText, getByLabelText, getByText, getAllByText, queryByText } = mount();
    await findByText('API reachable');

    const search = getByLabelText('Search API endpoints');
    fireEvent.changeText(search, 'bookmark');

    expect(getByText('Bookmarks')).toBeTruthy();
    // GET and POST both live at /bookmarks; the group shows both.
    expect(getAllByText('/bookmarks')).toHaveLength(2);
    expect(queryByText('System')).toBeNull();
    expect(queryByText('/health')).toBeNull();

    fireEvent.changeText(search, 'health');
    expect(getByText('System')).toBeTruthy();
    expect(getByText('/health')).toBeTruthy();
    expect(queryByText('Bookmarks')).toBeNull();
  });

  it('calls a safe public endpoint and shows the response', async () => {
    global.fetch = jest.fn(async url => (
      String(url).endsWith('/api/')
        ? apiResponse(catalog)
        : apiResponse({ status: 'ok', service: 'qitabe-noor-api' }, { requestId: 'req-health' })
    ));

    const { findByText, getByLabelText } = mount();
    await findByText('API reachable');

    fireEvent.press(getByLabelText('Test GET /health'));

    expect(await findByText('HTTP 200')).toBeTruthy();
    expect(await findByText(/"status": "ok"/)).toBeTruthy();
    expect(global.fetch).toHaveBeenCalledWith(
      `${apiUrl}/health`,
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('opens an endpoint address in the browser when its row is pressed', async () => {
    global.fetch = jest.fn(async () => apiResponse(catalog));
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);

    const { findByText, getByLabelText } = mount();
    await findByText('API reachable');

    fireEvent.press(getByLabelText('Open GET /health in your browser'));

    expect(openURL).toHaveBeenCalledWith(`${apiUrl}/health`);
  });

  it('shows the address when no browser can be opened', async () => {
    global.fetch = jest.fn(async () => apiResponse(catalog));
    jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('no browser'));

    const { findByText, getByLabelText } = mount();
    await findByText('API reachable');

    fireEvent.press(getByLabelText('Open GET /health in your browser'));

    expect(await findByText(
      `Could not open a browser for ${apiUrl}/health. Copy the address into one instead.`
    )).toBeTruthy();
  });

  it('falls back to the last saved catalogue when the API is down', async () => {
    await AsyncStorage.setItem(API_CATALOG_CACHE_KEY, JSON.stringify({
      catalog,
      latencyMs: 42,
      requestId: 'req-cached',
      fetchedAt: Date.now() - 60_000,
    }));
    global.fetch = jest.fn(async () => { throw new TypeError('Network request failed'); });

    const { findByText, getByText } = mount();

    expect(await findByText('Showing saved catalogue')).toBeTruthy();
    expect(getByText(/Could not reach the API/)).toBeTruthy();
    expect(getByText('/health')).toBeTruthy();
    expect(getByText('42 ms')).toBeTruthy();
  });

  it('shows a retryable error when there is neither an API nor a cache', async () => {
    global.fetch = jest.fn(async () => { throw new TypeError('Network request failed'); });

    const { findByText, getByLabelText } = mount();

    expect(await findByText('API unreachable')).toBeTruthy();
    expect(getByLabelText('Try API again')).toBeTruthy();
  });
});
