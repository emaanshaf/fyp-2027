import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { LanguageProvider, useLanguage } from '../LanguageContext';
import preferences from '../../services/preferences';
import { LANGUAGES } from '../../i18n/translations';

let context;
let tree;

function Probe() {
  context = useLanguage();
  return null;
}

async function mountProvider() {
  context = null;
  await act(async () => {
    tree = TestRenderer.create(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>
    );
  });
  return tree;
}

beforeEach(async () => {
  global.__resetStorage();
  preferences._clearCache();
  await preferences.set({ translationLanguage: 'en' });
});

afterEach(() => {
  if (tree) act(() => tree.unmount());
  tree = null;
});

describe('app language and Quran translation', () => {
  it('offers a reading translation for every app language', () => {
    for (const option of LANGUAGES) {
      expect(option.translation).toBeTruthy();
    }
  });

  it('switches the tarjuma to Urdu when the app language becomes Urdu', async () => {
    await mountProvider();
    expect(context.language).toBe('en');

    await act(async () => { await context.setLanguage('ur'); });

    expect(context.language).toBe('ur');
    await expect(preferences.get('translationLanguage')).resolves.toBe('ur');
  });

  it('switches the tarjuma back to English with the app language', async () => {
    await mountProvider();

    await act(async () => { await context.setLanguage('ur'); });
    await act(async () => { await context.setLanguage('en'); });

    await expect(preferences.get('translationLanguage')).resolves.toBe('en');
  });
});
