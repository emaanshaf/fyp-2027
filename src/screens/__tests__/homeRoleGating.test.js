import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ThemeProvider } from '../../theme';
import { RoleProvider } from '../../context/RoleContext';
import HomeScreen from '../HomeScreen';
import { MODULES } from '../../config/routes';

/**
 * The dashboard grid must obey the same role rule as the drawer and the tab
 * bar. It previously built its tile list once at module scope with no role
 * check, so a plain user saw the moderator-only Content Creator tile and
 * tapping it did nothing — the route is never registered for that role.
 */

const Stack = createNativeStackNavigator();

function mountAs(role) {
  return render(
    <ThemeProvider>
      <RoleProvider role={role}>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Home" component={HomeScreen} initialParams={{}} />
          </Stack.Navigator>
        </NavigationContainer>
      </RoleProvider>
    </ThemeProvider>
  );
}

// The restricted modules the dashboard grid offers, derived from the route
// table so this test follows the table rather than a second hardcoded list.
// Admin Panel is restricted but deliberately lives in Settings, not the grid.
const restricted = MODULES.filter(
  m => !m.roles.includes('user') && m.name !== 'AdminPanel'
);

beforeEach(() => {
  global.__resetStorage();
  global.fetch = jest.fn(() => Promise.reject(new Error('offline in tests')));
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe('HomeScreen module grid', () => {
  it('has at least one restricted module to test against', () => {
    expect(restricted.length).toBeGreaterThan(0);
  });

  it('hides restricted tiles from a plain user', async () => {
    const { queryByLabelText } = mountAs('user');
    await waitFor(() => expect(queryByLabelText(/Quran\./)).toBeTruthy());
    for (const m of restricted) {
      expect(queryByLabelText(new RegExp(`^${m.title}\.`))).toBeNull();
    }
  });

  it('shows restricted tiles to an admin', async () => {
    const { queryByLabelText } = mountAs('admin');
    await waitFor(() => expect(queryByLabelText(/Quran\./)).toBeTruthy());
    for (const m of restricted) {
      expect(queryByLabelText(new RegExp(`^${m.title}\.`))).toBeTruthy();
    }
  });
});
