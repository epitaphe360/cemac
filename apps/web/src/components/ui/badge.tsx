import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:     'border-transparent bg-cemac-700 text-white shadow-sm hover:bg-cemac-700/80',
        secondary:   'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-transparent bg-red-600 text-white shadow-sm hover:bg-red-600/80',
        outline:     'border-cemac-200 text-cemac-800',
        success:     'border-transparent bg-cemac-100 text-cemac-800',
        warning:     'border-transparent bg-gold-100 text-gold-800',
        info:        'border-transparent bg-cemac-50 text-cemac-700',
        gold:        'border-transparent bg-gold-100 text-gold-800',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
