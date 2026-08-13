import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import path from 'node:path'

const DEFAULT_SUPABASE_URL = 'https://jqplpnjppyyxlmessjaw.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxcGxwbmpwcHl5eGxtZXNzamF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3MjY0MTIsImV4cCI6MjA5ODMwMjQxMn0.YRVKEageJRtGdqjssR5SrOZjeFOVZXjXFvA1bDguTVQ'

export default defineConfig(({ mode }) => {
  // Resolve env from the web app directory (not Vercel cwd quirks).
  const env = loadEnv(mode, path.resolve(__dirname), '')
  const supabaseUrl = env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY
  const sentryUploadConfigured = mode === 'production' &&
    Boolean(env.SENTRY_AUTH_TOKEN && env.SENTRY_ORG && env.SENTRY_PROJECT)

  return {
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
      'import.meta.env.VITE_APP_ENV': JSON.stringify(env.VITE_APP_ENV || mode),
      'import.meta.env.VITE_PAYMENTS_ENABLED': JSON.stringify(env.VITE_PAYMENTS_ENABLED || 'false'),
    },
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
