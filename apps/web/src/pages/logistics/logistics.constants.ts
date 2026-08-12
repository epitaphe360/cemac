import type { Convoy, Expedition } from '@/types'

export const CEMAC_COUNTRIES = ['CM', 'CF', 'CG', 'GA', 'GQ', 'TD'] as const

export const CONVOY_STATUSES: Convoy['status'][] = [
  'draft', 'planned', 'operational', 'completed', 'cancelled',
]

export const CONVOY_STATUS_LABELS: Record<Convoy['status'], { fr: string; en: string }> = {
  draft: { fr: 'Brouillon', en: 'Draft' },
  planned: { fr: 'Planifié', en: 'Planned' },
  operational: { fr: 'Opérationnel', en: 'Operational' },
  completed: { fr: 'Terminé', en: 'Completed' },
  cancelled: { fr: 'Annulé', en: 'Cancelled' },
}

export const NEXT_CONVOY_STATUSES: Record<Convoy['status'], Convoy['status'][]> = {
  draft: ['planned', 'cancelled'],
  planned: ['operational', 'cancelled'],
  operational: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}
export const EXPEDITION_STATUSES: Expedition['status'][] = [
  'draft', 'ready', 'in_transit', 'checkpoint_hold', 'delivered', 'cancelled',
]

export const STATUS_LABELS: Record<Expedition['status'], { fr: string; en: string }> = {
  draft: { fr: 'Brouillon', en: 'Draft' },
  ready: { fr: 'Prête', en: 'Ready' },
  in_transit: { fr: 'En transit', en: 'In transit' },
  checkpoint_hold: { fr: 'Retenue au contrôle', en: 'Checkpoint hold' },
  delivered: { fr: 'Livrée', en: 'Delivered' },
  cancelled: { fr: 'Annulée', en: 'Cancelled' },
}

export const NEXT_STATUSES: Record<Expedition['status'], Expedition['status'][]> = {
  draft: ['ready', 'cancelled'],
  ready: ['in_transit', 'cancelled'],
  in_transit: ['checkpoint_hold', 'delivered', 'cancelled'],
  checkpoint_hold: ['in_transit', 'cancelled'],
  delivered: [],
  cancelled: [],
}

export const DOCUMENT_MIME_TYPES = [
  'application/pdf', 'image/jpeg', 'image/png', 'image/webp',
] as const
export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024
