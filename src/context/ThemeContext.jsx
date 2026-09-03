// Theme Context for runtime theme switching
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themes, defaultTheme } from '../config/themes';

const THEME_STORAGE_KEY = 'qitab_theme_preference';
const ThemeContext = createContext(null);

const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <Ionicons name="moon" size={48} color={defaultTheme.colors.gold} />
    <ActivityIndicator color={defaultTheme.colors.gold} size="large" style={{ marginTop: 20 }} />
  </View>
);

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: defaultTheme.colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export function ThemeProvider({ children }) {
  const [currentThemeName, setCurrentThemeName] = useState('default');
  const [resolvedTheme, setResolvedTheme] = useState(defaultTheme);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then(saved => {
      const name = saved && themes[saved] ? saved : 'default';
      setCurrentThemeName(name);
      setResolvedTheme(themes[name] || defaultTheme);
      setHydrated(true);
    });
  }, []);

  const setTheme = async (name) => {
    if (!themes[name]) return;
    await AsyncStorage.setItem(THEME_STORAGE_KEY, name);
    setCurrentThemeName(name);
    setResolvedTheme(themes[name]);
  };

  const value = useMemo(() => ({
    theme: resolvedTheme,
    themeName: currentThemeName,
    setTheme,
    availableThemes: Object.keys(themes),
    hydrated,
  }), [resolvedTheme, currentThemeName, hydrated]);

  if (!hydrated) {
    return (
      <ThemeContext.Provider value={value}>
        <LoadingScreen />
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}

export default ThemeContext;