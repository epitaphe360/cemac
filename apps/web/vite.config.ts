import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import path from 'node:path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const sentryUploadConfigured = mode === 'production' &&
    Boolean(env.SENTRY_AUTH_TOKEN && env.SENTRY_ORG && env.SENTRY_PROJECT)

  return {
    plugins: [
      react(),
      ...(sentryUploadConfigured ? [
        sentryVitePlugin({
          authToken: env.SENTRY_AUTH_TOKEN,
          org: env.SENTRY_ORG,
          project: env.SENTRY_PROJECT,
          release: env.VITE_SENTRY_RELEASE ? { name: env.VITE_SENTRY_RELEASE } : undefined,
          sourcemaps: { filesToDeleteAfterUpload: ['**/*.map'] },
          telemetry: false,
        }),
      ] : []),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      open: true,
    },
    build: {
      sourcemap: sentryUploadConfigured ? 'hidden' : false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor:   ['react', 'react-dom', 'react-router-dom'],
            supabase: ['@supabase/supabase-js'],
            ui:       ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
            charts:   ['recharts'],
            pdf:      ['jspdf', 'html2canvas'],
          },
        },
      },
    },
  }
})
