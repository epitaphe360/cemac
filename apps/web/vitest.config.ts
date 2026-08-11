import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/__tests__/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'tests/**', 'playwright.config.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'src/test-setup.ts',
        '**/*.d.ts',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/types/**',
        'vite.config.ts',
        'vitest.config.ts',
        'playwright.config.ts',
        'src/i18n/**',
        'src/assets/**',
      ],
      thresholds: {
        // Ratchet from the measured project baseline; raise these values as
        // page-level integration coverage is added.
        branches: 55,
        functions: 25,
        lines: 35,
        statements: 35,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
