module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'prettier'],
  extends: ['eslint:recommended', 'prettier'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  env: {
    node: true,
    es6: true,
    jest: true,
  },
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',

    // General rules
    'no-console': 'off', // Allow console in CLI tools
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'warn',
    'no-unused-vars': 'off', // Let @typescript-eslint handle this
    'no-useless-escape': 'warn',
    'no-control-regex': 'warn',

    // Prettier integration
    'prettier/prettier': 'error',
  },
  ignorePatterns: ['lib/', 'dist/', 'node_modules/', '*.js.map', '*.d.ts.map'],
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        // TypeScript-specific overrides
        'no-unused-vars': 'off',
      },
    },
  ],
};
