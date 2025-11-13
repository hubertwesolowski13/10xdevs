// @ts-check
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import globals from 'globals'
import expoConfigs from 'eslint-config-expo/flat/default.js'

// Monorepo root ESLint flat config
// - Shared base rules for all workspaces
// - API-specific rules limited to wardrobe-assistant-api
// - App-specific rules limited to wardrobe-assistant-app

export default [
  // 0) Global ignores for the repo
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.expo/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/.bundle/**',
      '**/coverage/**',
      '**/.gradle/**',
      '**/android/app/build/**',
      '**/ios/build/**',
      '**/*.min.*',
      '**/*.d.ts',
      '**/eslint.config.*',
      '**/supabase/**',
      'shared/src/types/database.ts',
    ],
  },

  // 1) Base recommended for JS/TS across the monorepo
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,

  // 3) Base language options for TypeScript across repo
  {
    files: ['**/*.{ts,tsx,cts,mts}'],
    languageOptions: {
      parserOptions: {
        // Let typescript-eslint discover tsconfigs automatically in workspaces
        projectService: true,
        allowDefaultProject: true,
        tsconfigRootDir: import.meta.dirname,
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    rules: {
      // Prefer explicitness, but be pragmatic for early phase
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      // Prettier as an ESLint rule for unified formatting feedback
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },

  // 3) Shared code (isomorphic) overrides
  {
    files: ['shared/**/*.{ts,tsx}', 'types/**/*.{ts,tsx}', 'db/**/*.{ts,tsx}'],
    languageOptions: {
      // Keep globals as minimal/neutral for shared code
      globals: {
        ...globals.es2021,
      },
    },
    rules: {
      // Shared layer should avoid Node/DOM specifics
    },
  },

  // 4) Ensure JS/JSX files are not type-checked by typescript-eslint
  {
    files: ['**/*.{js,jsx}'],
    rules: {
      // Disable TS-only rules for JS files to avoid project service noise
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-duplicate-type-constituents': 'off',
    },
  },

  // 5) API (Node/NestJS) specific rules
  {
    files: ['wardrobe-assistant-api/**/*.{ts,js}'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
    },
    rules: {
      // Node/Nest-friendly pragmatism
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
    },
  },

  // 6) App (Expo/React Native) rules — import and scope Expo flat config to the app workspace
  ...expoConfigs.map((cfg) => ({
    ...cfg,
    files: ['wardrobe-assistant-app/**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      ...(cfg.languageOptions ?? {}),
      globals: { ...(cfg.languageOptions?.globals ?? {}), ...globals.browser },
      parserOptions: {
        ...(cfg.languageOptions?.parserOptions ?? {}),
        projectService: true,
        allowDefaultProject: true,
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: { ...(cfg.languageOptions?.parserOptions?.ecmaFeatures ?? {}), jsx: true },
      },
    },
    settings: {
      ...(cfg.settings ?? {}),
      'import/resolver': {
        ...((cfg.settings && cfg.settings['import/resolver']) || {}),
        typescript: {
          project: ['./wardrobe-assistant-app/tsconfig.json'],
        },
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
  })),
]
