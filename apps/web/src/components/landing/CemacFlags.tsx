/**
 * Official-style SVG flags for the six CEMAC member states.
 * Pure SVG — no external assets, sharp at any size.
 */

type FlagProps = {
  className?: string
  title?: string
}

export function FlagCameroon({ className, title = 'Drapeau du Cameroun' }: FlagProps) {
  return (
    <svg viewBox="0 0 9 6" className={className} role="img" aria-label={title}>
      <title>{title}</title>
      <rect width="3" height="6" fill="#007A5E" />
      <rect x="3" width="3" height="6" fill="#CE1126" />
      <rect x="6" width="3" height="6" fill="#FCD116" />
      <polygon points="4.5,1.85 4.72,2.55 5.45,2.55 4.86,2.98 5.08,3.68 4.5,3.25 3.92,3.68 4.14,2.98 3.55,2.55 4.28,2.55" fill="#FCD116" />
    </svg>
  )
}

export function FlagCongo({ className, title = 'Drapeau du Congo' }: FlagProps) {
  return (
    <svg viewBox="0 0 9 6" className={className} role="img" aria-label={title}>
      <title>{title}</title>
      <rect width="9" height="6" fill="#009543" />
      <polygon points="9,0 9,6 0,6" fill="#DC241F" />
      <polygon points="9,0 2.2,0 9,4.55" fill="#FBDE4A" />
    </svg>
  )
}

export function FlagGabon({ className, title = 'Drapeau du Gabon' }: FlagProps) {
  return (
    <svg viewBox="0 0 9 6" className={className} role="img" aria-label={title}>
      <title>{title}</title>
      <rect width="9" height="2" fill="#009E60" />
      <rect y="2" width="9" height="2" fill="#FCD116" />
      <rect y="4" width="9" height="2" fill="#3A75C4" />
    </svg>
  )
}

export function FlagEquatorialGuinea({ className, title = 'Drapeau de la Guinée équatoriale' }: FlagProps) {
  return (
    <svg viewBox="0 0 9 6" className={className} role="img" aria-label={title}>
      <title>{title}</title>
      <rect width="9" height="2" fill="#3E9A00" />
      <rect y="2" width="9" height="2" fill="#FFFFFF" />
      <rect y="4" width="9" height="2" fill="#E32118" />
      <polygon points="0,0 3.2,3 0,6" fill="#0073CE" />
      {/* simplified silk-cotton tree emblem */}
      <circle cx="5.4" cy="3" r="0.85" fill="#6B4423" />
      <rect x="5.25" y="2.9" width="0.3" height="1.1" fill="#4A2F18" />
      <ellipse cx="5.4" cy="2.55" rx="0.7" ry="0.55" fill="#2E7D32" />
    </svg>
  )
}

export function FlagCentralAfricanRepublic({ className, title = 'Drapeau de la République centrafricaine' }: FlagProps) {
  return (
    <svg viewBox="0 0 9 6" className={className} role="img" aria-label={title}>
      <title>{title}</title>
      <rect width="9" height="1.5" fill="#003082" />
      <rect y="1.5" width="9" height="1.5" fill="#FFFFFF" />
      <rect y="3" width="9" height="1.5" fill="#289728" />
      <rect y="4.5" width="9" height="1.5" fill="#FFCE00" />
      <rect x="3.75" width="1.5" height="6" fill="#D21034" />
      <polygon points="1.35,0.35 1.48,0.75 1.9,0.75 1.56,1 1.69,1.4 1.35,1.15 1.01,1.4 1.14,1 0.8,0.75 1.22,0.75" fill="#FFCE00" />
    </svg>
  )
}

export function FlagChad({ className, title = 'Drapeau du Tchad' }: FlagProps) {
  return (
    <svg viewBox="0 0 9 6" className={className} role="img" aria-label={title}>
      <title>{title}</title>
      <rect width="3" height="6" fill="#002664" />
      <rect x="3" width="3" height="6" fill="#FECB00" />
      <rect x="6" width="3" height="6" fill="#C60C30" />
    </svg>
  )
}

export const CEMAC_FLAG_COMPONENTS = {
  CM: FlagCameroon,
  CG: FlagCongo,
  GA: FlagGabon,
  GQ: FlagEquatorialGuinea,
  CF: FlagCentralAfricanRepublic,
  TD: FlagChad,
} as const

export type CemacFlagCode = keyof typeof CEMAC_FLAG_COMPONENTS
