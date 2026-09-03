import { buildLinkingConfig } from '../routes';

// The exact validator NavigationContainer runs at mount. When it rejects the
// config it throws and the whole app renders nothing, so this is checked
// against the real implementation rather than a reimplementation of its rules.
const validatePathConfig = require('@react-navigation/core/lib/commonjs/validatePathConfig').default;

describe('linking config', () => {
  it('passes React Navigation\'s own validatePathConfig', () => {
    expect(() => validatePathConfig(buildLinkingConfig().config)).not.toThrow();
  });

  it('would reject an unsupported property, so the check is not vacuous', () => {
    // `alias` is an Expo Router concept. Emitting it here produced
    // "Found invalid properties in the configuration: alias" and a blank app.
    const broken = buildLinkingConfig().config;
    broken.screens.Main.screens.Tafsir = {
      path: 'tafsir',
      alias: ['tafsir/:surah/:ayah'],
    };
    expect(() => validatePathConfig(broken)).toThrow(/alias/);
  });
});
