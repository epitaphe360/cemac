import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SecurityHealthPanel } from '@/pages/admin/components/SecurityHealthPanel'

const invoke = vi.hoisted(() => vi.fn())
const healthyResponse = {
  error: null,
  data: {
    database: {
      legacy_accounts_total: 3,
      legacy_accounts_unflagged: 0,
      invalid_notification_preferences: 0,
      contact_direct_insert_revoked: true,
      rate_limit_rpc_ready: true,
    },
    configuration: {
      allowed_origins_configured: true,
      rate_limit_salt_configured: true,
      email_delivery_configured: true,
    },
  },
}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    functions: { invoke },
  },
}))

describe('SecurityHealthPanel', () => {
  beforeEach(() => {
    invoke.mockReset()
    invoke.mockResolvedValue(healthyResponse)
  })

  it('renders aggregate health without identifiers or secret values', async () => {
    render(<SecurityHealthPanel />)
    expect(await screen.findByText('Comptes legacy protégés')).toBeInTheDocument()
    expect(screen.getByText(/Comptes legacy détectés : 3\. Non protégés : 0/)).toBeInTheDocument()
    expect(screen.queryByText(/service_role|api[_-]?key|@example/i)).not.toBeInTheDocument()
  })

  it('handles a rejected invocation without an unhandled rejection', async () => {
    invoke.mockRejectedValue(new Error('network unavailable'))
    render(<SecurityHealthPanel />)
    expect(await screen.findByRole('alert')).toHaveTextContent(/indisponible/i)
    expect(screen.queryByText('Comptes legacy protégés')).not.toBeInTheDocument()
  })

  it('rejects malformed health responses safely', async () => {
    invoke.mockResolvedValue({ data: { database: {} }, error: null })
    render(<SecurityHealthPanel />)
    expect(await screen.findByRole('alert')).toHaveTextContent(/indisponible/i)
  })
})
