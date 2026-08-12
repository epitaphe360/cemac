import { useState } from 'react'
import {
  createCheckoutUrl,
  createCustomerPortalUrl,
  paymentsEnabled,
  redirectToPayment,
  type PaidPlan,
} from '@/lib/payments'
import type { BillingPeriod } from '@/lib/pricing'

export function usePayments(entrepriseId: string | undefined) {
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const checkout = async (plan: PaidPlan, period: BillingPeriod) => {
    if (!entrepriseId) return
    setPendingAction(`checkout:${plan}:${period}`)
    setError(null)
    try {
      redirectToPayment(await createCheckoutUrl(plan, period, entrepriseId))
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error('Paiement indisponible.'))
      setPendingAction(null)
    }
  }

  const openPortal = async () => {
    if (!entrepriseId) return
    setPendingAction('portal')
    setError(null)
    try {
      redirectToPayment(await createCustomerPortalUrl(entrepriseId))
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error('Portail indisponible.'))
      setPendingAction(null)
    }
  }

  return {
    paymentsEnabled,
    pendingAction,
    error,
    checkout,
    openPortal,
  }
}
