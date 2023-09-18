module.exports = {
  env: {
    // jest: true,
    es6: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'plugin:@typescript-eslint/eslint-recommended',
    'prettier',
  ],
  // Ignore patterns are set in .eslintignore
  // ignorePatterns: [ ],
  plugins: ['@typescript-eslint/eslint-plugin'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  rules: {
    // Typescript checks this.
    'import/named': 'off',
    // Triggers when using imported types
    'no-unused-vars': 'off',
    'import/order': [
      'warn',
      {
        alphabetize: {
          order:
            'asc' /* sort in ascending order. Options: ['ignore', 'asc', 'desc'] */,
          caseInsensitive: true /* ignore case. Options: [true, false] */,
        },
        'newlines-between': 'always',

        groups: [
          ['builtin', 'external'],
          ['sibling', 'parent'], // Then sibling and parent types. They can be mingled together
          'index', // Then the index file
          // Then the rest: internal and external type
        ],
      },
    ],
    // Typescript rules
    '@typescript-eslint/no-unused-vars': 'warn',
    'prefer-const': 'warn',
    'no-empty': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/member-delimiter-style': 'off',
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/camelcase': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/require-array-sort-compare': 'off',
    '@typescript-eslint/explicit-member-accessibility': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-object-literal-type-assertion': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        args: 'none',
      },
    ],
    '@typescript-eslint/indent': 'off',
    '@typescript-eslint/array-type': 'off',
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
}
