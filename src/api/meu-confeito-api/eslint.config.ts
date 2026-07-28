import * as safeQLEslintPlugin from '@ts-safeql/eslint-plugin';
import tsEslintPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import checkFilePlugin from 'eslint-plugin-check-file';
// import unusedImports from 'eslint-plugin-unused-imports';
import { node } from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default [
  {
    ignores: ['node_modules/', 'dist/', 'build/', 'src/generated/', 'eslint.config.ts'],
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
        ...node,
      },
    },
    plugins: {
      'check-file': checkFilePlugin,
      '@typescript-eslint': tsEslintPlugin,
      '@ts-safeql': safeQLEslintPlugin,
      //'unused-imports': unusedImports,
    },
    rules: {
      'check-file/filename-naming-convention': [
        'error',
        {
          '**/*.{js,ts}': 'KEBAB_CASE',
        },
        {
          ignoreMiddleExtensions: true,
        },
      ],
      'check-file/folder-naming-convention': [
        'error',
        {
          'src/**/': 'KEBAB_CASE',
        },
      ],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'default',
          format: ['camelCase'],
          leadingUnderscore: 'allowSingleOrDouble',
          trailingUnderscore: 'allow',
        },
        { selector: 'import', format: ['camelCase', 'UPPER_CASE'] },
        { selector: 'property', format: null },
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE'],
          leadingUnderscore: 'allowSingleOrDouble',
          trailingUnderscore: 'allow',
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
          leadingUnderscore: 'allow',
          trailingUnderscore: 'allow',
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: false,
        },
      ],
      '@ts-safeql/check-sql': [
        'error',
        {
          connections: [
            {
              migrationsDir: './prisma/migrations',
              targets: [{ tag: 'prisma.+($queryRaw|$executeRaw)', transform: '{type}[]' }],
            },
          ],
        },
      ],

      eqeqeq: 'error',
      'prefer-const': 'error',
    },
  },
];
