const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const unicornPlugin = require('eslint-plugin-unicorn');
const tsElintPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const reactNativePlugin = require('eslint-plugin-react-native');

module.exports = defineConfig([
  {
    ignores: [
      'node_modules/',
      '.expo/',
      'dist/',
      'eslint.config.js',
      'metro.config.js',
      'babel.config.js',
    ],
  },

  ...expoConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: true,
      },
    },
    plugins: {
      'unicorn': unicornPlugin.default || unicornPlugin,
      '@typescript-eslint': tsElintPlugin,
      'react-native': reactNativePlugin,
    },
    rules: {
      'unicorn/filename-case': [
        'error',
        {
          cases: {
            pascalCase: true,
            kebabCase: true,
          },
          ignore: ['eslint.config.js'],
        },
      ],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'default',
          format: ['camelCase'],
        },
        {
          selector: 'import',
          format: ['camelCase', 'PascalCase'],
        },
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
        },
        {
          selector: 'variable',
          types: ['boolean'],
          format: ['PascalCase'],
          prefix: ['is', 'should', 'has', 'can', 'did', 'will'],
        },
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
        {
          selector: 'function',
          format: ['camelCase', 'PascalCase'],
        },
      ],

      'no-unused-vars': 'warn',
      'react-native/no-inline-styles': 'warn',
      'react-native/no-color-literals': 'warn',
      'eqeqeq': 'warn',
      'prefer-const': 'warn',
      'no-var': 'error',
    },
  },
]);
