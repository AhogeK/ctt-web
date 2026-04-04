import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    vue(),
    vueDevTools(),
  ],
  resolve: {
    // Read path aliases from tsconfig.json (TypeScript 6.0+ recommended)
    tsconfigPaths: true
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
