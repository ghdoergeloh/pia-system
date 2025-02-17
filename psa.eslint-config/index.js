/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.json'],
  },
  env: {
    commonjs: true,
    es2020: true,
    node: true,
    mocha: true,
  },
  plugins: ['@typescript-eslint', 'security', 'no-only-tests'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:security/recommended',
    'prettier',
  ],
  rules: {
    'no-console': 'off',
    'no-var': 'error',
    'prefer-const': 'error',
    '@typescript-eslint/array-type': ['error', { default: 'array' }],
    '@typescript-eslint/consistent-indexed-object-style': ['error', 'record'],
    '@typescript-eslint/consistent-type-assertions': [
      'error',
      {
        assertionStyle: 'as',
        objectLiteralTypeAssertions: 'allow-as-parameter',
      },
    ],
    '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    '@typescript-eslint/explicit-function-return-type': [
      'error',
      { allowHigherOrderFunctions: false },
    ],
    '@typescript-eslint/explicit-member-accessibility': ['error'],
    '@typescript-eslint/member-ordering': ['error'],
    '@typescript-eslint/no-require-imports': ['error'],
    '@typescript-eslint/no-unnecessary-boolean-literal-compare': ['error'],
    '@typescript-eslint/no-unnecessary-condition': ['error'],
    '@typescript-eslint/non-nullable-type-assertion-style': ['error'],
    '@typescript-eslint/prefer-for-of': ['error'],
    '@typescript-eslint/prefer-enum-initializers': ['error'],
    '@typescript-eslint/prefer-includes': ['error'],
    '@typescript-eslint/prefer-nullish-coalescing': ['error'],
    '@typescript-eslint/prefer-optional-chain': ['error'],
    '@typescript-eslint/prefer-readonly': ['error'],
    '@typescript-eslint/prefer-reduce-type-parameter': ['error'],
    '@typescript-eslint/prefer-string-starts-ends-with': ['error'],
    '@typescript-eslint/promise-function-async': ['error'],
    '@typescript-eslint/typedef': ['error'],
    '@typescript-eslint/unified-signatures': ['error'],
    '@typescript-eslint/dot-notation': [
      'error',
      { allowIndexSignaturePropertyAccess: true },
    ],
    '@typescript-eslint/no-dupe-class-members': ['error'],
    '@typescript-eslint/no-duplicate-imports': ['error'],
    '@typescript-eslint/no-invalid-this': ['error'],
    '@typescript-eslint/no-loop-func': ['error'],
    '@typescript-eslint/no-magic-numbers': [
      'error',
      {
        ignore: [-1, 0, 1],
        ignoreDefaultValues: true,
        ignoreEnums: true,
        ignoreNumericLiteralTypes: true,
        ignoreReadonlyClassProperties: true,
      },
    ],
    '@typescript-eslint/no-redeclare': ['error'],
    '@typescript-eslint/no-shadow': ['error'],
    '@typescript-eslint/no-throw-literal': ['error'],
    '@typescript-eslint/no-use-before-define': ['error', { functions: false }],
    '@typescript-eslint/no-useless-constructor': ['error'],
    'no-only-tests/no-only-tests': 'error',
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['*psa.*'],
            message: 'Never import files from psa.* packages directly.',
          },
        ],
      },
    ],
  },
  ignorePatterns: ['dist'],
};
