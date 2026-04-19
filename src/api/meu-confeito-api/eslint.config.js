const unicornPlugin = require('eslint-plugin-unicorn');
const tsEslintPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const globals = require('globals');

module.exports = [
  {
    ignores: ['node_modules/', 'dist/', 'build/', 'eslint.config.js'],
  },

  {
    files: ['**/*.ts', '**/*.js'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },

      globals: {
        ...globals.node,
      },
    },
    plugins: {
      unicorn: unicornPlugin.default || unicornPlugin,
      '@typescript-eslint': tsEslintPlugin,
    },
    rules: {
      'unicorn/filename-case': [
        'error',
        {
          cases: {
            kebabCase: true,
          },
          ignore: ['eslint.config.js'],
        },
      ],

      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'default', format: ['camelCase'] },
        { selector: 'variable', format: ['camelCase', 'UPPER_CASE'] },
        {
          selector: 'variable',
          types: ['boolean'],
          format: ['PascalCase'],
          prefix: ['is', 'should', 'has', 'can', 'did', 'will'],
        },
        { selector: 'typeLike', format: ['PascalCase'] },
      ],

      'no-console': 'warn',
      'eqeqeq': 'error',
      'prefer-const': 'error',
    },
  },
];
