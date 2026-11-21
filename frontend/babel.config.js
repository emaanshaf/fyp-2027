module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Reanimated 4 moved its Babel plugin into react-native-worklets;
    // react-native-reanimated/plugin is now a shim that re-exports this one.
    // Pointing at the real package avoids depending on that shim surviving.
    plugins: ['react-native-worklets/plugin'],
  };
};
