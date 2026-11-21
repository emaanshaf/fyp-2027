import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '../../theme';
import { AppLockProvider } from '../../context/AppLockContext';
import IslamicNewsScreen from '../IslamicNewsScreen';

const payload = {
  items: [
    {
      id: 'https://example.com/story',
      title: 'A story from the Middle East',
      summary: 'A short, readable summary.',
      url: 'https://example.com/story',
      image: null,
      publishedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      categories: ['Islam'],
      keywords: ['Ceasefire', 'Talks'],
      topics: ['Gaza'],
      source: {
        id: 'middle-east-eye',
        name: 'Middle East Eye',
        homepage: 'https://www.middleeasteye.net',
      },
    },
  ],
  trending: [
    { id: 'topic:gaza', label: 'Gaza', kind: 'topic', count: 3 },
    { id: 'term:ceasefire', label: 'Ceasefire', kind: 'keyword', count: 2 },
  ],
  sources: [
    {
      id: 'middle-east-eye',
      name: 'Middle East Eye',
      homepage: 'https://www.middleeasteye.net',
      ok: true,
      stale: false,
      count: 1,
    },
  ],
  fetchedAt: new Date().toISOString(),
  partial: false,
  stale: false,
};

function mount() {
  return render(
    <ThemeProvider>
      <AppLockProvider>
        <IslamicNewsScreen />
      </AppLockProvider>
    </ThemeProvider>
  );
}

beforeEach(() => {
  global.__resetStorage();
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, status: 200, json: async () => payload })
  );
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('IslamicNewsScreen', () => {
  it('renders live headlines and source attribution', async () => {
    const screen = mount();

    await waitFor(() => {
      expect(screen.getByText('A story from the Middle East')).toBeTruthy();
    }, { timeout: 5000 });

    expect(screen.getByText('Islamic News')).toBeTruthy();
    expect(screen.getAllByText('Middle East Eye').length).toBeGreaterThan(0);
    expect(screen.getByText('Read full story')).toBeTruthy();
    expect(screen.getByText('Updated Just now')).toBeTruthy();
    expect(screen.getByText('30m ago')).toBeTruthy();
    expect(screen.getByText('TRENDING IN THE HEADLINES')).toBeTruthy();
    expect(screen.getByLabelText('Trending topic: Gaza, 3 stories')).toBeTruthy();
    expect(screen.getAllByText('Ceasefire').length).toBeGreaterThan(0);
  });

  it('filters the feed by a mined trend and clears it again', async () => {
    const screen = mount();
    await waitFor(() => {
      expect(screen.getByText('A story from the Middle East')).toBeTruthy();
    }, { timeout: 5000 });

    fireEvent.press(screen.getByLabelText('Trending topic: Gaza, 3 stories'));
    expect(screen.getByLabelText('Clear trending filter')).toBeTruthy();
    expect(screen.getByText('A story from the Middle East')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Clear trending filter'));
    expect(screen.queryByLabelText('Clear trending filter')).toBeNull();
  });

  it('bookmarks a story locally', async () => {
    const screen = mount();
    await waitFor(() => {
      expect(screen.getByText('A story from the Middle East')).toBeTruthy();
    }, { timeout: 5000 });

    fireEvent.press(screen.getByLabelText('Save story: A story from the Middle East'));

    await waitFor(() => {
      expect(screen.getByLabelText('Remove saved story: A story from the Middle East')).toBeTruthy();
    }, { timeout: 5000 });
  });
});
