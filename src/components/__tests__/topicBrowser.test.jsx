import { render, fireEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../../theme';
import TopicBrowserModal from '../TopicBrowserModal';
import { BROWSE_CATEGORIES, TOTAL_TOPICS } from '../../ai/islamicKnowledge';

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

const element = (props = {}) => (
  <ThemeProvider>
    <SafeAreaProvider initialMetrics={metrics}>
      <TopicBrowserModal
        visible
        onClose={jest.fn()}
        onSelectTopic={jest.fn()}
        {...props}
      />
    </SafeAreaProvider>
  </ThemeProvider>
);

const mount = (props = {}) => render(element(props));

describe('TopicBrowserModal', () => {
  it('opens on the whole library with every area available', async () => {
    const screen = mount();
    await screen.findByText('Browse Topics');

    expect(screen.getByText(`${TOTAL_TOPICS} answers in ${BROWSE_CATEGORIES.length} areas`)).toBeTruthy();
    expect(screen.getByText(`All ${TOTAL_TOPICS}`)).toBeTruthy();

    for (const category of BROWSE_CATEGORIES) {
      expect(screen.getByLabelText(`Show ${category.title}`)).toBeTruthy();
    }
  });

  it('narrows by topic name and asks the selected topic', async () => {
    const onSelectTopic = jest.fn();
    const screen = mount({ onSelectTopic });
    await screen.findByText('Browse Topics');

    fireEvent.changeText(screen.getByLabelText('Search topics'), 'witr');

    expect(screen.getByText('Witr Prayer')).toBeTruthy();
    expect(screen.getByText('Voluntary Prayers')).toBeTruthy();
    expect(screen.getByText(/2 topics for "witr"/)).toBeTruthy();
    expect(screen.queryByText('Zakat')).toBeNull();

    fireEvent.press(screen.getByLabelText('Ask about Witr Prayer'));
    expect(onSelectTopic).toHaveBeenCalledWith('Witr Prayer');
  });

  it('finds topics by transliteration as well as keyword', async () => {
    const screen = mount();
    await screen.findByText('Browse Topics');

    fireEvent.changeText(screen.getByLabelText('Search topics'), 'roza');

    expect(screen.getByText('Ramadan & Fasting')).toBeTruthy();
    expect(screen.getByText('Fasting Exemptions & Make-Up')).toBeTruthy();
  });

  it('does not match letters buried inside an unrelated word', async () => {
    const screen = mount();
    await screen.findByText('Browse Topics');

    fireEvent.changeText(screen.getByLabelText('Search topics'), 'riba');

    expect(screen.getByText('Riba (Interest)')).toBeTruthy();
    expect(screen.queryByText('Racism & Equality')).toBeNull();
  });

  it('keeps a category filter while searching', async () => {
    const screen = mount();
    await screen.findByText('Browse Topics');

    fireEvent.press(screen.getByLabelText('Show Money & Work'));
    fireEvent.changeText(screen.getByLabelText('Search topics'), 'riba');

    expect(screen.getByText('Riba (Interest)')).toBeTruthy();
    expect(screen.getByText('Islamic Finance in Practice')).toBeTruthy();
    expect(screen.queryByText('Zakat')).toBeNull();
    expect(screen.getByLabelText('Show Money & Work').props.accessibilityState).toEqual({ selected: true });
  });

  it('offers a way back from an empty search', async () => {
    const screen = mount();
    await screen.findByText('Browse Topics');

    fireEvent.changeText(screen.getByLabelText('Search topics'), 'zzzzqqq');
    expect(screen.getByText('No topics found')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Clear topic search'));

    expect(screen.queryByText('No topics found')).toBeNull();
    expect(screen.getByLabelText('Search topics').props.value).toBe('');
  });

  it('closes from the header', async () => {
    const onClose = jest.fn();
    const screen = mount({ onClose });
    await screen.findByText('Browse Topics');

    fireEvent.press(screen.getByLabelText('Close topics'));
    expect(onClose).toHaveBeenCalled();
  });

  it('starts fresh when reopened instead of restoring the last search', async () => {
    const screen = mount();
    await screen.findByText('Browse Topics');

    fireEvent.changeText(screen.getByLabelText('Search topics'), 'witr');
    expect(screen.getByLabelText('Search topics').props.value).toBe('witr');

    screen.rerender(element({ visible: false }));
    screen.rerender(element({ visible: true }));

    expect(await screen.findByLabelText('Search topics')).toHaveProp('value', '');
  });
});
