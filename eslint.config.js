// Flat ESLint config, self-contained.
//
// eslint-config-expo@8 is still eslintrc-format, so rather than bridge it we
// declare what this project actually needs. The rule that earns its keep is
// `no-undef`: the tafsir translation fetch referenced an undeclared
// `QURAN_API` for months, and because the call sat inside a try/catch it
// silently returned an empty string instead of failing loudly.
const globals = require('globals');
const react = require('eslint-plugin-react');

const RN_GLOBALS = {
  ...globals.browser,
  ...globals.es2021,
  __DEV__: 'readonly',
  requestAnimationFrame: 'readonly',
  cancelAnimationFrame: 'readonly',
  ErrorUtils: 'readonly',
  process: 'readonly',
  global: 'readonly',
};

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'frontend/node_modules/**',
      'backend/node_modules/**',
      '**/.expo/**',
      '**/dist/**',
      '**/web-build/**',
      '**/coverage/**',
    ],
  },

  // React Native / Expo application code (frontend/).
  {
    files: ['frontend/src/**/*.{js,jsx}', 'frontend/App.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: RN_GLOBALS,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { react },
    settings: { react: { version: 'detect' } },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'no-dupe-keys': 'error',
      'no-unreachable': 'error',
      'no-constant-condition': 'warn',
      // React Native has no DOM: these props are silently inert on native.
      'react/no-danger': 'error',
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'off',
      'react/jsx-no-undef': 'error',
      'react/jsx-key': 'warn',
    },
  },

  // API server (backend/) and Node build scripts: CommonJS on Node.
  {
    files: [
      'backend/**/*.js',
      'frontend/scripts/**/*.js',
      'frontend/*.config.js',
      'frontend/jest.setup.js',
      'eslint.config.js',
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node, ...globals.jest },
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-empty': ['warn', { allowEmptyCatch: true }],
    },
  },

  // Tests.
  {
    files: ['**/*.test.{js,jsx}', '__tests__/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...RN_GLOBALS, ...globals.jest, ...globals.node },
    },
    rules: { 'no-undef': 'error' },
  },
];
