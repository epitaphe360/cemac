import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:     'bg-cemac-700 text-white shadow-[0_10px_25px_rgba(16,105,91,0.25)] hover:-translate-y-0.5 hover:bg-cemac-800 hover:shadow-[0_14px_28px_rgba(16,105,91,0.3)]',
        destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
        outline:     'border border-input bg-background/80 hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground shadow-sm backdrop-blur-sm',
        secondary:   'bg-secondary text-secondary-foreground hover:-translate-y-0.5 hover:bg-secondary/80 shadow-sm',
        ghost:       'hover:bg-accent hover:text-accent-foreground',
        link:        'text-cemac-700 underline-offset-4 hover:underline',
        gold:        'bg-gold-800 text-white shadow-[0_10px_25px_rgba(134,91,48,0.28)] hover:-translate-y-0.5 hover:bg-gold-900 hover:shadow-[0_14px_28px_rgba(134,91,48,0.34)]',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm:      'h-8 rounded-md px-3 text-xs',
        lg:      'h-10 rounded-md px-8',
        icon:    'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-white border-opacity-75" />
            {children}
          </>
        ) : children}
      </Comp>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
