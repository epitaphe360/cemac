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
        // Palette Institutionnelle Premium
        cemac: {
          50:  '#f4fafa', // Blanc cassé légèrement bleuté/vert (Light Mode bg)
          100: '#e0ece9',
          200: '#bedcd6',
          300: '#90c4ba',
          400: '#5ea297',
          500: '#3f867b', // Primary CTA
          600: '#2e6b63',
          700: '#26544f',
          800: '#204542',
          900: '#1d3937', // Cockpit bg (Dark Mode)
          950: '#0c1b1a', // Très sombre
        },
        gold: {
          50:  '#fdfdf9',
          100: '#fbf8eb',
          200: '#f5edd1',
          300: '#ebdcae',
          400: '#dfc583', // Accentuation luxueuse
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
        lg: '0.5rem',     // Plus carré, plus corporate
        md: '0.375rem',
        sm: '0.25rem',
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'serif'], // Pour les titres de niveau institutionnel
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
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.4s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      boxShadow: {
        // Ombres ultra diffuses et fines (Apple/Stripe style)
        'subtle': '0 1px 2px rgba(0, 0, 0, 0.04), 0 2px 8px rgba(0, 0, 0, 0.04)',
        'elevated': '0 4px 12px rgba(0, 0, 0, 0.05), 0 12px 24px rgba(0, 0, 0, 0.05)',
        'glass': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
      }
    },
  },
  plugins: [],
}

export default config
