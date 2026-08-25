// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

/**
 * Real linting for the Expo app. This replaced a `lint` script that only
 * echoed success, which made the root `npm run lint` report a pass for code
 * nothing had checked.
 */
export default tseslint.config(
  { ignores: ['node_modules/**', '.expo/**', 'dist/**', 'babel.config.js'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { console: 'readonly', process: 'readonly', fetch: 'readonly' },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      eqeqeq: ['error', 'smart'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
);
