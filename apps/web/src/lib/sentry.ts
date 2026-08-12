import * as Sentry from '@sentry/react'

const TOKEN_KEY = /(authorization|cookie|token|secret|password|api[-_]?key|email|phone|name)/i
const JWT = /\beyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\b/g

function boundedRate(value: string | undefined, fallback: number, maximum: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? Math.min(parsed, maximum) : fallback
}

export function scrubSentryValue(
  value: unknown,
  key = '',
  seen = new WeakSet<object>(),
): unknown {
  if (TOKEN_KEY.test(key)) return '[Filtered]'
  if (typeof value === 'string') {
    return value
      .replace(JWT, '[Filtered JWT]')
      .replace(/([?&](?:token|key|secret|email)=)[^&#]*/gi, '$1[Filtered]')
  }
  if (!value || typeof value !== 'object') return value
  if (seen.has(value)) return '[Circular]'
  seen.add(value)
  if (Array.isArray(value)) return value.map((item) => scrubSentryValue(item, key, seen))
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .map(([childKey, child]) => [childKey, scrubSentryValue(child, childKey, seen)]),
  )
}

export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN?.trim()
  const enabled = import.meta.env.PROD && Boolean(dsn) &&
    import.meta.env.VITE_SENTRY_ENABLED !== 'false'
  if (!enabled) return

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_APP_ENV || 'production',
    release: import.meta.env.VITE_SENTRY_RELEASE || undefined,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Cap traces well below 1.0 to limit cost and incidental PII exposure.
    tracesSampleRate: boundedRate(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE, 0.1, 0.2),
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: boundedRate(
      import.meta.env.VITE_SENTRY_REPLAY_ERROR_SAMPLE_RATE,
      0.25,
      0.25,
    ),
    tracePropagationTargets: [
      'localhost',
      /^https:\/\/([a-z0-9-]+\.)?cemac-integra\.cm(?:\/|$)/,
    ],
    sendDefaultPii: false,
    beforeSend(event) {
      return scrubSentryValue(event) as typeof event
    },
  })
}
