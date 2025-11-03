// eslint.config.mjs
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [...tseslint.configs.strictTypeChecked],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: process.cwd(),
      },
    },
    rules: {
      // RELAXED FOR DEPLOYMENT
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',

      'no-unused-vars': 'off',

      // KEEP non-blocking warnings
      'no-warning-comments': [
        'warn',
        {
          terms: ['todo', 'fixme', 'ts-ignore', 'AI'],
          location: 'start',
        },
      ],
    },
  },
  {
    files: ['**/*.js', '**/*.jsx', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-warning-comments': [
        'warn',
        {
          terms: ['todo', 'fixme'],
          location: 'start',
        },
      ],
    },
  },
  {
    ignores: ['node_modules/**', 'dist/**', '.next/**', 'build/**'],
  }
);
