import '@testing-library/jest-dom'
import { vi, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import fr from './i18n/fr.json'
import en from './i18n/en.json'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock matchMedia (not available in jsdom)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn()

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
})

// Mock react-i18next
const i18nState = vi.hoisted(() => ({ language: 'fr', resolvedLanguage: 'fr' }))

function lookupKey(messages: Record<string, unknown>, key: string): string | undefined {
  const value = key.split('.').reduce<unknown>((current, segment) => {
    if (!current || typeof current !== 'object') return undefined
    return (current as Record<string, unknown>)[segment]
  }, messages)
  return typeof value === 'string' ? value : undefined
}

function translate(messages: Record<string, unknown>, key: string, options?: Record<string, string | number>) {
  // Handle i18next pluralization (count_zero / count_one / count_other)
  let resolved: string | undefined
  if (options?.count !== undefined) {
    const n = Number(options.count)
    const suffix = n === 0 ? 'zero' : n === 1 ? 'one' : 'other'
    resolved = lookupKey(messages, `${key}_${suffix}`) ?? lookupKey(messages, `${key}_other`) ?? lookupKey(messages, key)
  } else {
    resolved = lookupKey(messages, key)
  }

  if (resolved === undefined) return key
  return resolved.replace(/\{\{(\w+)\}\}/g, (_, token) => String(options?.[token] ?? `{{${token}}}`))
}

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, string | number>) =>
      translate(i18nState.language === 'en' ? en : fr, key, options),
    i18n: {
      changeLanguage: vi.fn(async (language: string) => {
        i18nState.language = language
        i18nState.resolvedLanguage = language
      }),
      get language() {
        return i18nState.language
      },
      get resolvedLanguage() {
        return i18nState.resolvedLanguage
      },
    },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}))
