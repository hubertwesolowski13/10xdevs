// @ts-check
import eslint from '@eslint/js'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import globals from 'globals'
import tseslint from 'typescript-eslint'
// Expo/React flat config for the mobile app
import expoConfig from 'eslint-config-expo/flat/default.js'

// Shared flat config for the whole monorepo
// This config is designed to be consumed from root or any subfolder.
// It applies Node+Jest settings to the API and React/Expo settings to the app.

export default tseslint.config(
  // Base JavaScript recommended rules
  eslint.configs.recommended,

  // TypeScript recommended with type-aware rules
  ...tseslint.configs.recommendedTypeChecked.map((cfg) => ({
    files: ['**/*.ts', '**/*.tsx'],
    ...cfg,
  })),

  // Prettier integration (formatting issues as ESLint errors)
  eslintPluginPrettierRecommended,

  // API (NestJS) — Node + Jest environment
  {
    files: ['wardrobe-assistant-api/**/*.{ts,js}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  },

  // App (Expo/React Native) — use Expo flat config and browser/react-native globals
  // We narrow the scope to the app folder so these rules only apply there.
  ...expoConfig.map((cfg) => ({
    files: ['wardrobe-assistant/**/*.{ts,tsx,js,jsx}'],
    ...cfg,
    languageOptions: {
      ...(cfg.languageOptions ?? {}),
      globals: {
        ...(cfg.languageOptions?.globals ?? {}),
        ...globals.browser,
      },
      parserOptions: {
        ...(cfg.languageOptions?.parserOptions ?? {}),
        projectService: true,
      },
    },

    rules: {
      ...(cfg.rules ?? {}),
    },
  })),

  // Global ignores for the whole repo
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.expo/**',
      '**/.next/**',
      '**/build/**',
      '**/.turbo/**',
      // keep local config files out of lint scope
      '**/eslint.config.*',
      '**/scripts/**',
      '**/*.d.ts',
      './eslint.config.mjs',
    ],
    rules: {
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-misused-promises': 'warn',
    },
  },
)
