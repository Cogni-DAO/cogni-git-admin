import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default [
  { ignores: ['node_modules/', 'dist/', 'lib/', 'coverage/'] },

  // Base JS rules
  js.configs.recommended,

  // TypeScript recommended (flat) configs
  ...tseslint.configs.recommended,

  // Language options per file type
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
      globals: { ...globals.node, ...globals.jest, ...globals.es2022 }
    }
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      globals: { ...globals.node, ...globals.jest, ...globals.es2022 }
    }
  },

  // Keep Prettier last to disable conflicting stylistic rules
  prettier
];