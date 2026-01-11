import js from '@eslint/js';
import globals from 'globals';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  // Ignore generated files
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'out/**',
    ],
  },

  // Main + Renderer
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      semi: ['error', 'always'],
      quotes: ['error', 'single'],
      indent: ['error', 2],
      'comma-style': ['error', 'last'],
      'comma-dangle': ['error', 'always-multiline'],
      'no-trailing-spaces': 'error',
    },
  },

  // Electron main process (CommonJS)
  {
    files: ['main/**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
    },
  },
]);
