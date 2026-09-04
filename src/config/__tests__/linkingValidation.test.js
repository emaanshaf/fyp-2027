import { buildLinkingConfig } from '../routes';

// The exact validator NavigationContainer runs at mount. When it rejects the
// config it throws and the whole app renders nothing, so this is checked
// against the real implementation rather than a reimplementation of its rules.
// React Navigation 7 dropped the CommonJS build and added an `exports` map, so
// the old deep require into lib/commonjs no longer resolves. validatePathConfig
// is a public named export now.
const { validatePathConfig } = require('@react-navigation/core');

describe('linking config', () => {
  it('passes React Navigation\'s own validatePathConfig', () => {
    expect(() => validatePathConfig(buildLinkingConfig().config)).not.toThrow();
  });

  it('would reject an unsupported property, so the check is not vacuous', () => {
    // This guard used `alias` as its example of an invalid key, because
    // emitting one produced "Found invalid properties in the configuration:
    // alias" and a blank app. React Navigation 7 made `alias` a supported
    // property, so the guard quietly stopped guarding: it asserted that a
    // now-legal key was rejected. Uses a key that cannot become valid.
    const broken = buildLinkingConfig().config;
    broken.screens.Main.screens.Tafsir = {
      path: 'tafsir',
      definitelyNotARealPathConfigKey: true,
    };
    expect(() => validatePathConfig(broken)).toThrow(/definitelyNotARealPathConfigKey/);
  });
});
