export function getPrimaryLanguage(language?: string | null): 'fr' | 'en' {
  const normalized = (language ?? 'fr').toLowerCase()
  return normalized.startsWith('en') ? 'en' : 'fr'
}