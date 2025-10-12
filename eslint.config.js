import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import prettier from 'eslint-config-prettier';
import jest from 'eslint-plugin-jest';
import n from 'eslint-plugin-n';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import security from 'eslint-plugin-security';

export default tseslint.config(
  // Ignore patterns
  { ignores: ['node_modules/', 'dist/', 'lib/', 'coverage/'] },

  // Base JS rules
  js.configs.recommended,

  // TypeScript with type-aware rules and project service
  {
    files: ['src/**/*.{ts,tsx}'], // Only src files for type-aware rules
    extends: [
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.strict,
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { 
        ecmaVersion: 'latest', 
        sourceType: 'module',
        projectService: true, // Enable project service for type-aware rules
        allowDefaultProject: ['*.js'], // Allow default project for JS files
      },
      globals: { ...globals.node, ...globals.jest, ...globals.es2022 }
    },
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      // Import sorting
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      // Relax some overly strict type-aware rules
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
    }
  },

  // TypeScript files without type-aware rules (for test files)
  {
    files: ['test/**/*.{ts,tsx}', '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    extends: [
      ...tseslint.configs.recommended,
      ...tseslint.configs.strict,
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { 
        ecmaVersion: 'latest', 
        sourceType: 'module',
      },
      globals: { ...globals.node, ...globals.jest, ...globals.es2022 }
    },
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      // Import sorting
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    }
  },

  // Node.js specific rules with modern eslint-plugin-n
  {
    files: ['**/*.{ts,js}'],
    extends: [n.configs['flat/recommended']],
    rules: {
      // Adjust Node.js rules as needed
      'n/no-missing-import': 'off', // TypeScript handles this
      'n/no-unpublished-import': 'off', // Allow dev dependencies in tests
      'n/no-extraneous-import': 'off', // TypeScript handles this better
      // Update for modern Node.js features (adjust based on actual deployment target)
      'n/no-unsupported-features/es-syntax': ['error', { version: '>=14.0.0' }],
      'n/no-unsupported-features/es-builtins': ['error', { version: '>=14.0.0' }],
    }
  },

  // Jest configuration using flat config export
  {
    files: ['**/*.{test,spec}.{ts,js}', '**/test/**/*.{ts,js}', '**/tests/**/*.{ts,js}'],
    extends: [jest.configs['flat/recommended']],
    languageOptions: {
      globals: { ...globals.jest }
    },
    rules: {
      // Enhanced Jest rules
      'jest/prefer-expect-assertions': 'warn',
      'jest/no-disabled-tests': 'warn',
    }
  },

  // Security rules with warnings (not blockers)
  {
    files: ['**/*.{ts,js}'],
    plugins: {
      security,
    },
    rules: {
      // Use security as "hotspot" signals, not blockers
      ...Object.fromEntries(
        Object.entries(security.configs.recommended.rules).map(([rule, config]) => [
          rule,
          config === 'error' ? 'warn' : config
        ])
      ),
    }
  },

  // JavaScript files (legacy compatibility)
  {
    files: ['**/*.js'],
    languageOptions: {
      globals: { ...globals.node, ...globals.jest, ...globals.es2022 }
    }
  },

  // Keep Prettier last to disable conflicting stylistic rules
  prettier
);