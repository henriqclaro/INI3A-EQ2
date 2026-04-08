// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    ignores: ['dist/*'],
  },
  {
    rules: {
      'no-unused-vars': 'warn',
      'react-native/no-inline-styles': 'warn',
      'react-native/no-unused-styles': 'error',
      'react-native/no-color-literals': 'warn',
      'eqeqeq': 'warn',
      'prefer-const': 'warn',
      'no-var': 'error',
    }
  }
]);
