/**
 * Public client configuration for CEMAC INTEGRA.
 * Anon key is designed for browser use (RLS protects data).
 */
export const DEFAULT_SUPABASE_URL = 'https://jqplpnjppyyxlmessjaw.supabase.co'
export const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxcGxwbmpwcHl5eGxtZXNzamF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3MjY0MTIsImV4cCI6MjA5ODMwMjQxMn0.YRVKEageJRtGdqjssR5SrOZjeFOVZXjXFvA1bDguTVQ'

export function getSupabaseUrl(): string {
  const value = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
  return value || DEFAULT_SUPABASE_URL
}

export function getSupabaseAnonKey(): string {
  const value = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim()
  return value || DEFAULT_SUPABASE_ANON_KEY
}
