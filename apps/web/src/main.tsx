import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './i18n/index'
import './index.css'
import App from './App.tsx'
import { GlobalErrorBoundary } from './components/error/GlobalErrorBoundary'

// Initialize Sentry for APM and Error Tracking
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || "",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0, 
  tracePropagationTargets: ["localhost", /^https:\/\/.*\.cemac-integra\.cm/],
  replaysSessionSampleRate: 0.1, 
  replaysOnErrorSampleRate: 1.0, 
  enabled: import.meta.env.PROD,
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </StrictMode>,
)
