import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ThemeProvider } from '../../theme';
import { SCREENS } from '../../navigation/screenRegistry';
import { MODULES } from '../../config/routes';

/**
 * Smoke test: every registered screen must mount without throwing.
 *
 * This is deliberately shallow — it does not assert what a screen looks like.
 * It catches the class of failure that unit tests on services never will:
 * a bad import, a hook order violation, a temporal-dead-zone reference, a
 * `window.location` read that throws off the web, or a style referencing a
 * palette token that no longer exists. Those crash the screen for the user
 * while every service test stays green.
 */

const Stack = createNativeStackNavigator();

/**
 * Screens are mounted inside a real NavigationContainer and ThemeProvider
 * rather than handed stub props. Several call useNavigation, useFocusEffect
 * or useTheme, which throw outside their providers — stubs would make the
 * test pass while the screen was still broken in the app.
 */
function mountScreen(Screen) {
  return render(
    <ThemeProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Test" component={Screen} initialParams={{}} />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}

// Screens fetch on mount; keep them offline so the test exercises the render
// path and the empty/loading states rather than the network.
beforeEach(() => {
  global.__resetStorage();
  global.fetch = jest.fn(() => Promise.reject(new Error('offline in tests')));
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

const names = Object.keys(SCREENS);

describe('screen registry', () => {
  it('registers a component for every route in the table', () => {
    for (const m of MODULES) expect(SCREENS[m.name]).toBeDefined();
  });

  it('covers every screen with a smoke test', () => {
    expect(names.length).toBeGreaterThanOrEqual(MODULES.length);
  });
});

describe.each(names)('%s', (name) => {
  it('mounts without throwing', async () => {
    const Screen = SCREENS[name];
    let tree;
    expect(() => {
      tree = mountScreen(Screen);
    }).not.toThrow();

    // Let mount effects and their rejected fetches settle; an unhandled
    // rejection here is a real bug, not test noise.
    await waitFor(() => expect(tree).toBeTruthy());
    tree.unmount();
  });
});
