import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  LANGUAGE_STORAGE_KEY, LANGUAGES, moduleTitle, translate,
} from '../i18n/translations';

// A context with a real default value rather than `null` + a throwing hook:
// screens are mounted in isolated tests and in the landing flow before the
// provider exists, and a language preference should never be able to crash
// the app that reads it.
const LanguageContext = createContext({
  language: 'en',
  isUrdu: false,
  setLanguage: async () => {},
  toggleLanguage: async () => {},
  t: (key, fallback) => translate('en', key, fallback),
  moduleTitle: (name, fallback) => fallback || name,
});

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('en');

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
      .then(saved => {
        if (active && LANGUAGES.some(l => l.code === saved)) setLanguageState(saved);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const setLanguage = useCallback(async code => {
    const next = LANGUAGES.some(l => l.code === code) ? code : 'en';
    setLanguageState(next);
    try { await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, next); } catch { /* local only */ }
  }, []);

  const toggleLanguage = useCallback(async () => {
    await setLanguage(language === 'ur' ? 'en' : 'ur');
  }, [language, setLanguage]);

  const value = useMemo(() => ({
    language,
    isUrdu: language === 'ur',
    setLanguage,
    toggleLanguage,
    t: (key, fallback) => translate(language, key, fallback),
    moduleTitle: (name, fallback) => moduleTitle(language, name, fallback),
  }), [language, setLanguage, toggleLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);

export default LanguageContext;
