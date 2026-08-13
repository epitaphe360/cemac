import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        cemac: {
          50:  '#f4fafa',
          100: '#e0ece9',
          200: '#bedcd6',
          300: '#90c4ba',
          400: '#5ea297',
          500: '#3f867b',
          600: '#2e6b63',
          700: '#26544f',
          800: '#204542',
          900: '#1d3937',
          950: '#0c1b1a',
        },
        gold: {
          50:  '#fdfdf9',
          100: '#fbf8eb',
          200: '#f5edd1',
          300: '#ebdcae',
          400: '#dfc583',
          500: '#d1ab5a',
          600: '#c29245',
          700: '#a37136',
          800: '#865b30',
          900: '#6c4a28',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 8px)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        institutional: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'soft-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.4s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'soft-pulse': 'soft-pulse 2.4s ease-in-out infinite',
      },
      boxShadow: {
        subtle: '0 1px 2px rgba(9, 46, 39, 0.04), 0 2px 8px rgba(9, 46, 39, 0.04)',
        elevated: '0 4px 12px rgba(9, 46, 39, 0.06), 0 16px 32px rgba(9, 46, 39, 0.08)',
        glass: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.12)',
        brand: '0 18px 50px rgba(16, 105, 91, 0.28)',
      },
      letterSpacing: {
        brand: '0.22em',
      },
    },
  },
  plugins: [],
}

export default config
