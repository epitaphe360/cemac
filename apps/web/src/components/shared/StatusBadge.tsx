import { cn } from '@/lib/utils'
import { CERTIFICATION_STATUS_LABELS, CERTIFICATION_STATUS_COLORS } from '@/lib/constants'

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const label = CERTIFICATION_STATUS_LABELS[status] ?? status
  const colors = CERTIFICATION_STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700'

  return (
    <span className={cn(
      'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold',
      colors,
      className
    )}>
      {label}
    </span>
  )
}
