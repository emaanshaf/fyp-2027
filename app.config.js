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
    // Registered here rather than in app.json so the icon and colour ship with
    // standalone Android builds. Filtering it out of config.plugins below keeps
    // a second copy from app.json from being applied.
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#d4af37',
      },
    ],
    ...(config.plugins || []).filter(p => {
      const name = Array.isArray(p) ? p[0] : p;
      return ![
        'expo-notifications',
        'expo-build-properties',
        // Added below with the options this app needs; filtering prevents a
        // duplicate if app.json ever gains them too.
        'expo-secure-store',
        'expo-local-authentication',
      ].includes(name);
    }),
    [
      'expo-secure-store',
      {
        // Also covers the Face ID prompt raised by the keystore itself.
        faceIDPermission:
          'Allow Qitab-e-Noor to use Face ID to unlock the app and protect your saved session.',
        // Keeps SecureStore entries out of Android cloud backups.
        configureAndroidBackup: true,
      },
    ],
    [
      'expo-local-authentication',
      {
        faceIDPermission: 'Allow Qitab-e-Noor to use Face ID to unlock the app.',
      },
    ],
    // Declared so expo install can manage it. The plugin is a no-op unless its
    // share-extension options are enabled; Share.share itself needs no config.
    'expo-sharing',
    [
      'expo-build-properties',
      {
        // The Android SDK levels and the iOS deployment target are deliberately
        // not pinned here. They were fixed at 35/35 and 15.1 for SDK 52, and
        // both had become wrong: Google Play requires targetSdk 36 for any
        // submission from 31 August 2026, and Expo SDK 57 rejects an iOS
        // deployment target below 16.4 outright. Leaving them unset means the
        // SDK's own defaults apply and stay correct through the next upgrade.
        android: {
          usesCleartextTraffic: !isProduction,
        },
      },
    ],
  ],
});
