// Dynamic Expo config. Expo passes the contents of app.json in as `config`;
// everything that has to vary by build profile is layered on here.
//
// Cleartext HTTP is the main one: the dev client talks to a local API over
// http://, but Play Store builds must not ship with it enabled.

const profile = process.env.EAS_BUILD_PROFILE || 'development';
const isProduction = profile === 'production';

module.exports = ({ config }) => ({
  ...config,

  description:
    'Quran, Hadith, Duas, prayer times, Qibla, Zakat and a guided Islamic ' +
    'learning path — a complete companion that works offline.',
  primaryColor: '#d4af37',
  backgroundColor: '#080c16',

  // Bare-workflow updates need a matching native runtime; the SDK policy
  // keeps OTA updates from landing on an incompatible binary.
  runtimeVersion: { policy: 'sdkVersion' },

  androidStatusBar: {
    barStyle: 'light-content',
    backgroundColor: '#080c16',
    translucent: false,
  },

  ios: {
    ...config.ios,
    infoPlist: {
      ...config.ios?.infoPlist,
      // Prayer times and Qibla both need a fix on the user's position.
      NSLocationWhenInUseUsageDescription:
        'Qitab-e-Noor uses your location to calculate accurate prayer times and Qibla direction.',
      UIBackgroundModes: ['audio'],
    },
  },

  android: {
    ...config.android,
    // Notification tap targets and Qibla need these on newer Android.
    permissions: [...(config.android?.permissions || []), 'android.permission.POST_NOTIFICATIONS'],
  },

  plugins: [
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#d4af37',
      },
    ],
    ...(config.plugins || []).filter(p => {
      const name = Array.isArray(p) ? p[0] : p;
      return name !== 'expo-notifications' && name !== 'expo-build-properties';
    }),
    [
      'expo-build-properties',
      {
        android: {
          usesCleartextTraffic: !isProduction,
          compileSdkVersion: 35,
          targetSdkVersion: 35,
        },
        ios: { deploymentTarget: '15.1' },
      },
    ],
  ],
});
