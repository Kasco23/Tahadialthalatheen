const js = require('@eslint/js');
const globals = require('globals');
const reactHooks = require('eslint-plugin-react-hooks');
const reactRefresh = require('eslint-plugin-react-refresh');
const tseslint = require('typescript-eslint');

module.exports = tseslint.config([
  // Ignore build output and archived code directories
  {
    ignores: ['dist', 'coverage', 'legacy/**', 'ignored/**', 'node_modules/**'],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Handle unused variables more gracefully
      'no-unused-vars': 'off', // Disable base rule
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          varsIgnorePattern: '^React$|^_',
          argsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      // Allow console.log in development
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      // Allow any for now (reduce strictness)
      '@typescript-eslint/no-explicit-any': 'warn',
      // Allow empty interfaces
      '@typescript-eslint/no-empty-interface': 'off',
      // Allow non-null assertions with warning
      '@typescript-eslint/no-non-null-assertion': 'warn',
    },
  },
  // Configuration for test files
  {
    files: ['**/*.test.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'no-console': 'off',
    },
  },
  // Configuration for config files
  {
    files: ['*.config.{js,ts,cjs,mjs}', 'scripts/**/*.{js,ts}'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'no-console': 'off',
    },
  },
]);
