import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import vueDevTools from 'vite-plugin-vue-devtools'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    vue(),
    vueDevTools(),
  ],
  resolve: {
    // Read path aliases from tsconfig.json (TypeScript 6.0+ recommended)
    tsconfigPaths: true,
    // Explicit alias as fallback for Vite 8 / Rolldown resolution
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://192.168.5.178:8004/ctt-server',
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
