import type { CmsJsonObject, CmsLocale } from './cms-types'

export function isCmsLocale(value: unknown): value is CmsLocale {
  return value === 'fr' || value === 'en'
}

export function isJsonObject(value: unknown): value is CmsJsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function asJsonObject(value: unknown): CmsJsonObject | null {
  return isJsonObject(value) ? value : null
}

export function readLocalizedValue<T>(
  value: unknown,
  locale: CmsLocale,
  isValue: (candidate: unknown) => candidate is T,
  fallbackLocale?: CmsLocale,
): T | null {
  if (!isJsonObject(value)) return null

  const localized = value[locale]
  if (isValue(localized)) return localized

  if (fallbackLocale && fallbackLocale !== locale) {
    const fallback = value[fallbackLocale]
    if (isValue(fallback)) return fallback
  }

  return null
}

export function readLocalizedString(
  value: unknown,
  locale: CmsLocale,
  fallbackLocale?: CmsLocale,
): string | null {
  return readLocalizedValue(
    value,
    locale,
    (candidate): candidate is string => typeof candidate === 'string',
    fallbackLocale,
  )
}

export function readString(
  object: unknown,
  key: string,
): string | null {
  if (!isJsonObject(object)) return null
  const value = object[key]
  return typeof value === 'string' ? value : null
}

export function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}
