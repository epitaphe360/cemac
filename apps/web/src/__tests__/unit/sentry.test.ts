import { describe, expect, it } from 'vitest'
import { scrubSentryValue } from '@/lib/sentry'

describe('Sentry privacy scrubbing', () => {
  it('removes PII, credentials, JWTs and sensitive query values recursively', () => {
    const scrubbed = scrubSentryValue({
      user: { email: 'person@example.com', phone: '+237600000000' },
      request: {
        headers: { Authorization: 'Bearer secret-token' },
        url: 'https://app.example/path?token=abc123&safe=yes',
      },
      message: 'bad token eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.signature123',
    })

    expect(scrubbed).toEqual({
      user: { email: '[Filtered]', phone: '[Filtered]' },
      request: {
        headers: { Authorization: '[Filtered]' },
        url: 'https://app.example/path?token=[Filtered]&safe=yes',
      },
      message: 'bad token [Filtered JWT]',
    })
  })
})
