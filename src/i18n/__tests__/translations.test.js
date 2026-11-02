import { moduleTitle, translate } from '../translations';

describe('brand and feature titles', () => {
  test('the brand, tagline and navigation chrome stay English', () => {
    expect(translate('en', 'app.brand')).toBe('Qitab-e-Noor');
    expect(translate('ur', 'app.brand')).toBe('Qitab-e-Noor');
    expect(translate('ur', 'app.tagline')).toBe('Your Spiritual Companion');
    expect(translate('ur', 'home.explore')).toBe('Explore Modules');
  });

  test('feature names stay in English in Urdu mode', () => {
    expect(moduleTitle('ur', 'Hajj', 'Hajj & Umrah')).toBe('Hajj & Umrah');
    expect(moduleTitle('ur', 'Communities', 'Islamic Communities')).toBe('Islamic Communities');
    expect(moduleTitle('ur', 'Pillars', 'Pillars of Islam')).toBe('Pillars of Islam');
  });

  test('the Islamic News feature stays English-only', () => {
    expect(translate('ur', 'news.title')).toBe('Islamic News');
    expect(translate('ur', 'news.latest')).toBe('Latest');
    expect(translate('ur', 'news.saved')).toBe('Saved');
  });

  test('a missing English title falls back to the route name', () => {
    expect(moduleTitle('ur', 'Unknown')).toBe('Unknown');
  });
});
