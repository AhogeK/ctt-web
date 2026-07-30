import { defineConfig } from 'vite-plus'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import vueDevTools from 'vite-plugin-vue-devtools'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

// https://vite.dev/config/
export default defineConfig({
  staged: {
    '*': 'vp check --fix',
  },
  fmt: {
    printWidth: 120,
    semi: false,
    singleQuote: true,
    ignorePatterns: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**', '.agents/**', '.claude/**', '.cursor/**'],
  },
  lint: {
    plugins: ['eslint', 'typescript', 'unicorn', 'oxc', 'vue', 'vitest'],
    categories: {
      correctness: 'error',
    },
    env: {
      browser: true,
      builtin: true,
    },
    ignorePatterns: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**', '.agents/**', '.claude/**', '.cursor/**'],
    rules: {
      'no-array-constructor': 'error',
      'typescript/ban-ts-comment': 'error',
      'typescript/no-empty-object-type': 'error',
      'typescript/no-explicit-any': 'error',
      'typescript/no-namespace': 'error',
      'typescript/no-require-imports': 'error',
      'typescript/no-unnecessary-type-constraint': 'error',
      'typescript/no-unsafe-function-type': 'error',
    },
    overrides: [
      {
        files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts', '**/*.vue'],
        rules: {
          'constructor-super': 'off',
          'getter-return': 'off',
          'no-class-assign': 'off',
          'no-const-assign': 'off',
          'no-dupe-class-members': 'off',
          'no-dupe-keys': 'off',
          'no-func-assign': 'off',
          'no-import-assign': 'off',
          'no-new-native-nonconstructor': 'off',
          'no-obj-calls': 'off',
          'no-redeclare': 'off',
          'no-setter-return': 'off',
          'no-this-before-super': 'off',
          'no-undef': 'off',
          'no-unreachable': 'off',
          'no-unsafe-negation': 'off',
          'no-var': 'error',
          'no-with': 'off',
          'prefer-const': 'error',
          'prefer-rest-params': 'error',
          'prefer-spread': 'error',
        },
      },
      {
        files: ['e2e/**/*.{test,spec}.{js,ts,jsx,tsx}'],
        rules: {
          'no-empty-pattern': 'off',
          'playwright/consistent-spacing-between-blocks': 'warn',
          'playwright/expect-expect': 'warn',
          'playwright/max-nested-describe': 'warn',
          'playwright/missing-playwright-await': 'error',
          'playwright/no-conditional-expect': 'warn',
          'playwright/no-conditional-in-test': 'warn',
          'playwright/no-duplicate-hooks': 'warn',
          'playwright/no-duplicate-slow': 'warn',
          'playwright/no-element-handle': 'error',
          'playwright/no-eval': 'warn',
          'playwright/no-focused-test': 'error',
          'playwright/no-force-option': 'warn',
          'playwright/no-nested-step': 'warn',
          'playwright/no-networkidle': 'error',
          'playwright/no-page-pause': 'warn',
          'playwright/no-skipped-test': 'warn',
          'playwright/no-standalone-expect': 'error',
          'playwright/no-unsafe-references': 'error',
          'playwright/no-unused-locators': 'error',
          'playwright/no-useless-await': 'warn',
          'playwright/no-useless-not': 'warn',
          'playwright/no-wait-for-navigation': 'error',
          'playwright/no-wait-for-selector': 'warn',
          'playwright/no-wait-for-timeout': 'error',
          'playwright/prefer-hooks-in-order': 'warn',
          'playwright/prefer-hooks-on-top': 'warn',
          'playwright/prefer-locator': 'warn',
          'playwright/prefer-to-have-count': 'warn',
          'playwright/prefer-to-have-length': 'warn',
          'playwright/prefer-web-first-assertions': 'error',
          'playwright/valid-describe-callback': 'error',
          'playwright/valid-expect': 'error',
          'playwright/valid-expect-in-promise': 'error',
          'playwright/valid-test-tags': 'error',
          'playwright/valid-title': 'error',
        },
        jsPlugins: ['eslint-plugin-playwright'],
      },
      {
        files: ['src/**/__tests__/*.[jt]s?(x)', 'src/**/*.spec.[jt]s?(x)'],
        rules: {
          'vitest/expect-expect': 'error',
          'vitest/no-commented-out-tests': 'error',
          'vitest/no-conditional-expect': 'error',
          'vitest/no-disabled-tests': 'warn',
          'vitest/no-focused-tests': 'error',
          'vitest/no-identical-title': 'error',
          'vitest/no-import-node-test': 'error',
          'vitest/no-interpolation-in-snapshots': 'error',
          'vitest/no-mocks-import': 'error',
          'vitest/no-standalone-expect': 'error',
          'vitest/no-unneeded-async-expect-function': 'error',
          'vitest/prefer-called-exactly-once-with': 'error',
          'vitest/require-local-test-context-for-concurrent-snapshots': 'error',
          'vitest/valid-describe-callback': 'error',
          'vitest/valid-expect': 'error',
          'vitest/valid-expect-in-promise': 'error',
          'vitest/valid-title': 'error',
          'vitest/consistent-test-it': [
            'error',
            {
              fn: 'it',
            },
          ],
          'vitest/prefer-strict-equal': 'warn',
        },
      },
    ],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  plugins: [tailwindcss(), vue({
    script: {
      fs: {
        fileExists: fs.existsSync,
        readFile: (id: string) => {
          try {
            if (!fs.existsSync(id) || fs.statSync(id).isDirectory()) return ''
            return fs.readFileSync(id, 'utf-8')
          } catch {
            return ''
          }
        },
      },
    },
  }), vueDevTools()],
  resolve: {
    // Read path aliases from tsconfig.json (TypeScript 6.0+ recommended)
    tsconfigPaths: true,
    // Explicit alias as fallback for Vite 8 / Rolldown resolution
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080/ctt-server',
        changeOrigin: true,
      },
    },
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              test: /node_modules/,
              name: 'vendor',
            },
            {
              test: /src\/features\/auth/,
              name: 'feature-auth',
            },
            {
              test: /src\/features\/dashboard/,
              name: 'feature-dashboard',
            },
            {
              test: /src\/features\/settings/,
              name: 'feature-settings',
            },
          ],
        },
      },
    },
  },
})
