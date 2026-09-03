import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ThemeProvider } from '../../theme';
import QuranScreen from '../QuranScreen';
import { TRANSLATIONS } from '../../services/quranApi';

/**
 * The reader must offer all five reading languages, each labelled in its own
 * script. The list is data-driven from TRANSLATIONS, so this asserts the data
 * and the UI agree rather than restating a hardcoded list of five names.
 */

const Stack = createNativeStackNavigator();

function mount() {
  return render(
    <ThemeProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Quran" component={QuranScreen} initialParams={{}} />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}

beforeEach(() => {
  global.__resetStorage();
  global.fetch = jest.fn(() => Promise.reject(new Error('offline in tests')));
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe('Quran translation languages', () => {
  it('defines exactly the five supported reading languages', () => {
    expect(Object.keys(TRANSLATIONS).sort()).toEqual(['en', 'fr', 'id', 'ms', 'ur']);
  });

  it('gives every language a distinct quran.com translation id', () => {
    const ids = Object.values(TRANSLATIONS).map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(Number.isInteger(id)).toBe(true);
  });

  it('lists every language, in its own script, in the reader settings', async () => {
    const { getByLabelText, getByText, getAllByText } = mount();

    const opener = await waitFor(() => getByLabelText('Translation language and reciter'));
    fireEvent.press(opener);

    await waitFor(() => getByText('TRANSLATION LANGUAGE'));

    for (const t of Object.values(TRANSLATIONS)) {
      // getAllByText, not getByText: the active language also appears in the
      // header indicator chip, so "English" legitimately matches twice.
      expect(getAllByText(new RegExp(t.native)).length).toBeGreaterThan(0);
      expect(getByText(t.author)).toBeTruthy();
    }
  });
});
